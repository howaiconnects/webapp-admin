# Supabase SQL migrations — Paste to SQL editor

This file contains the combined migration SQL from the repository, split into two fenced SQL blocks you can paste into the Supabase SQL editor in order.

References:
- [`supabase/migrations/001_create_prompt_logs.sql`](supabase/migrations/001_create_prompt_logs.sql:1)
- [`supabase/migrations/002_create_users_and_rls.sql`](supabase/migrations/002_create_users_and_rls.sql:1)

Important: These SQL blocks are PostgreSQL dialect for Supabase. If your editor or VS Code shows a large number of syntax errors, that is likely because a T-SQL/SQL Server language service is being used by the editor — ignore those lint warnings and run the SQL in Supabase's SQL editor (which is Postgres). Also see the "Troubleshooting" section below.

Usage:
1. Open Supabase → SQL Editor.
2. Create a new query and paste the contents of the first SQL block, run it.
3. Paste the second SQL block and run it.
4. Verify the objects (tables, enum, trigger, policies, indexes) as described below.

Notes:
- The scripts use IF NOT EXISTS guards where appropriate so they are safe to run once.
- I replaced policy expressions that referenced NEW/OLD (which caused "missing FROM-clause entry for table 'NEW'" when used in policies) with a small BEFORE UPDATE trigger that enforces immutability of the `role` column for non-admins. Policies themselves no longer reference NEW/OLD.
- If you prefer not to use the trigger, you can allow role changes only via an admin RPC or service key instead — let me know and I will provide that variation.

Verification (after running):
- Confirm public.prompt_logs exists and indexes are created.
- Confirm public.user_role enum exists: SELECT unnest(enum_range(NULL::public.user_role));
- Confirm RLS is enabled on public.users and policies are in place (Supabase UI shows policies).
- Test updating a user role as a non-admin — it should raise an error from the trigger.

Troubleshooting:
- Error "missing FROM-clause entry for table 'NEW'": This occurs when NEW/OLD are used in a policy expression (they are only available inside trigger functions). Fix: use triggers for row-level change enforcement (this repo's migrations now use a trigger).
- If your editor flags syntax errors but Supabase SQL editor runs fine, it's a false-positive linter mismatch (editor using SQL Server or other dialect). Run the SQL in Supabase.

[`sql.declaration()`](supabase/migrations/001_create_prompt_logs.sql:1)
```sql
-- Migration: create prompt_logs table
CREATE TABLE IF NOT EXISTS public.prompt_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Request metadata
  user_id text,            -- Supabase user id if available
  prompt_id text NOT NULL, -- identifier of the prompt invoked
  request_payload jsonb,   -- original request body (prompt params)
  request_headers jsonb,   -- trimmed headers (do NOT store full auth secrets)

  -- Response / result
  response_body jsonb,     -- AI result payload (may be large)
  status_code integer,     -- HTTP-style status code for the result
  latency_ms integer,      -- measured latency in milliseconds

  -- Error info if any
  error_message text,
  error_details jsonb,

  -- Optional routing/tracing fields
  adapter text,            -- e.g., "latitude"
  run_id text,             -- optional id returned by adapter for tracing
  env text                 -- deployment environment (dev/staging/prod)
);

CREATE INDEX IF NOT EXISTS idx_prompt_logs_user_id ON public.prompt_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_prompt_id ON public.prompt_logs (prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_logs_created_at ON public.prompt_logs (created_at);
```

[`sql.declaration()`](supabase/migrations/002_create_users_and_rls.sql:1)
```sql
-- Creates users table, role enum, trigger, and RLS policies (Postgres / Supabase)

-- 1) Create enum type for roles (idempotent)
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

-- 5) Helper: function to read role from jwt claims or fallback
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
CREATE POLICY users_select_role_based ON public.users
FOR SELECT
USING (
  (current_setting('jwt.claims.role', true) IN ('admin', 'moderator'))
  OR
  (auth.uid() IS NOT NULL AND auth.uid() = id)
);

-- 6.2 UPDATE policies:
--   - Admins can UPDATE any row (including role)
CREATE POLICY users_update_admins_full ON public.users
FOR UPDATE
USING ( current_setting('jwt.claims.role', true) = 'admin' )
WITH CHECK ( current_setting('jwt.claims.role', true) = 'admin' );

--   - Moderators may update rows (role changes are blocked by trigger)
CREATE POLICY users_update_moderators_no_role ON public.users
FOR UPDATE
USING ( current_setting('jwt.claims.role', true) = 'moderator' )
WITH CHECK ( current_setting('jwt.claims.role', true) = 'moderator' );

--   - Users may update their own profile (role changes are blocked by trigger)
CREATE POLICY users_update_own_no_role ON public.users
FOR UPDATE
USING ( auth.uid() IS NOT NULL AND auth.uid() = id )
WITH CHECK ( auth.uid() IS NOT NULL AND auth.uid() = id );

-- 6.3 INSERT policy:
--   - Allow INSERT by admin (service-role inserts can use supabase service key)
CREATE POLICY users_insert_admin_or_service ON public.users
FOR INSERT
USING ( current_setting('jwt.claims.role', true) = 'admin' )
WITH CHECK ( current_setting('jwt.claims.role', true) = 'admin' );

-- 6.4 DELETE policy:
CREATE POLICY users_delete_admin_only ON public.users
FOR DELETE
USING ( current_setting('jwt.claims.role', true) = 'admin' );

-- 7) Trigger to prevent non-admins from changing the role column.
-- This enforces immutability of the 'role' field unless the requester is an admin.
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    IF NOT (current_setting('jwt.claims.role', true) = 'admin') THEN
      RAISE EXCEPTION 'Only admins may change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_change ON public.users;
CREATE TRIGGER trg_prevent_role_change
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- 8) Optional grants so policies can be evaluated by role-typed connections
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
```

If you want, I can:
- Produce a single downloadable .sql file you can import, or
- Create a separate "admin-only" variation that doesn't use a trigger and instead expects role changes to happen via a privileged RPC, or
- Add a GitHub Actions workflow that runs these migrations in CI using the SUPABASE_ADMIN_KEY secret.

I updated [`docs/SUPABASE_MIGRATIONS.md`](docs/SUPABASE_MIGRATIONS.md:1) with the corrected SQL and troubleshooting notes. The migration file itself is at [`supabase/migrations/002_create_users_and_rls.sql`](supabase/migrations/002_create_users_and_rls.sql:1) and already contains the trigger-based fix; if you still see the "missing FROM-clause entry for table 'NEW'" error when running inside Supabase, paste the corrected second SQL block above (the trigger version) into the SQL editor and run it — it will remove the problematic policy expressions that referenced NEW/OLD.