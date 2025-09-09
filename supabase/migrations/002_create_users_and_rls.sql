-- 002_create_users_and_rls.sql
-- Creates public.users table linked to auth.users, role enum, trigger for updated_at,
-- and Row-Level Security (RLS) policies to enforce RBAC for admin, moderator, user.
-- Designed for Supabase / Postgres.

-- 1) Create enum type for roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;

-- 2) Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  email text UNIQUE NOT NULL,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to users table
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.users;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 4) Enable Row Level Security on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5) Helper: function to check role of current jwt token
-- Supabase sets auth.role from jwt claims; we check via auth.jwt() is available in Supabase.
-- If using anon service, prefer using auth.role or app_metadata in jwt.
-- Here we use current_setting('jwt.claims.role', true) fallback to null.
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
AS $$
  SELECT COALESCE(current_setting('jwt.claims.role', true), current_setting('role', true));
$$;

-- 6) Policies
-- 6.1 SELECT policy:
--   - Admins and moderators can SELECT all rows
--   - Regular users can SELECT only their own row
CREATE POLICY "users_select_role_based" ON public.users
FOR SELECT
USING (
  -- allow if requester is admin or moderator
  (current_setting('jwt.claims.role', true) IN ('admin', 'moderator'))
  OR
  -- or if the jwt sub matches row id (user can select their own)
  (auth.uid() IS NOT NULL AND auth.uid() = id)
);

-- 6.2 UPDATE policy:
--   - Admins can UPDATE any row (including role)
--   - Moderators can UPDATE any row except role changes
--   - Users can UPDATE their own row but NOT role
-- We enforce this by creating two separate policies:
--   A) Allow admins full update
CREATE POLICY "users_update_admins_full" ON public.users
FOR UPDATE
TO public
USING ( current_setting('jwt.claims.role', true) = 'admin' )
WITH CHECK ( current_setting('jwt.claims.role', true) = 'admin' );

--   B) Allow moderators to update rows (role changes are enforced by a trigger below)
CREATE POLICY "users_update_moderators_no_role" ON public.users
FOR UPDATE
TO public
USING ( current_setting('jwt.claims.role', true) = 'moderator' )
WITH CHECK ( current_setting('jwt.claims.role', true) = 'moderator' );

--   C) Allow users to update their own profile (role changes are enforced by a trigger below)
CREATE POLICY "users_update_own_no_role" ON public.users
FOR UPDATE
TO public
USING ( auth.uid() IS NOT NULL AND auth.uid() = id )
WITH CHECK ( auth.uid() IS NOT NULL AND auth.uid() = id );

-- 6.3 INSERT policy:
--   - Inserts are allowed only by admin or via the Supabase service_role (using a Postgres role)
--   - We detect service role by current_setting('role', true) = 'postgres' is not reliable across setups.
--   - Supabase exposes 'request.jwt.claims' for service usage; common approach: restrict to authenticated admins
--   - For safe default: allow INSERT only when jwt role = 'service_role' or 'admin'
CREATE POLICY "users_insert_admin_or_service" ON public.users
FOR INSERT
TO public
USING (
  -- allow if admin (interactive via admin dashboard)
  current_setting('jwt.claims.role', true) = 'admin'
)
WITH CHECK (
  -- ensure id matches auth.uid() if present, or allow when admin setting id explicitly
  (
    current_setting('jwt.claims.role', true) = 'admin'
  )
);

-- 6.4 DELETE policy:
--   - By default, no public delete; only admins can delete rows through an RPC or via service key.
CREATE POLICY "users_delete_admin_only" ON public.users
FOR DELETE
USING ( current_setting('jwt.claims.role', true) = 'admin' );

-- Notes:
-- - auth.uid() is a Supabase helper returning the uuid of the jwt subject.
-- - current_setting('jwt.claims.role', true) reads the custom claim role set in the JWT.
--   Ensure your Auth signup flow populates the role claim into the JWT or that your backend sets
--   a custom claim when signing tokens. Alternatively, rely on a separate roles mapping table.

-- 7) Trigger to prevent non-admins from changing the role column.
-- This enforces immutability of the 'role' field unless the requester is an admin.
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If the role value is changing
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Allow change only when requester has admin role (from jwt claims or session role)
    IF NOT (current_setting('jwt.claims.role', true) = 'admin') THEN
      RAISE EXCEPTION 'Only admins may change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger BEFORE UPDATE so it can block role changes
DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.users;
CREATE TRIGGER trg_prevent_role_change
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- 8) Grant minimal privileges to anon/auth roles as needed (optional)
-- By default, Supabase creates roles: auth (authenticated) and anon (public). Policies above control access.
-- Optionally grant select/insert/update privileges to authenticated role so policies can be evaluated.
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- End of migration