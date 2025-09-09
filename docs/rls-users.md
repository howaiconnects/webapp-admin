# Users table and RLS for HowAIConnects

This document explains the schema and Row-Level Security (RLS) policies added in the migration [`supabase/migrations/002_create_users_and_rls.sql`:1]. It also includes integration notes for Next.js and Supabase auth.

## Files changed / created
- [`supabase/migrations/002_create_users_and_rls.sql`:1] - SQL migration that:
  - creates the `public.user_role` enum with values `admin`, `moderator`, `user`
  - creates `public.users` table linked to `auth.users`
  - creates trigger and function to auto-update `updated_at`
  - enables RLS and adds policies for SELECT/INSERT/UPDATE/DELETE

## Schema: public.users
Columns:
- `id uuid PRIMARY KEY` — references `auth.users(id)` (ON DELETE CASCADE). This links profile rows to Supabase auth accounts.
- `full_name text` — user's display name.
- `email text UNIQUE NOT NULL` — duplicate of auth email for easier queries; keep in sync during signup.
- `role public.user_role NOT NULL DEFAULT 'user'` — role assigned to the user. Values: `admin`, `moderator`, `user`.
- `created_at timestamptz NOT NULL DEFAULT now()` — creation timestamp.
- `updated_at timestamptz NOT NULL DEFAULT now()` — last-updated timestamp (kept current by trigger).

Design notes:
- `id` is intentionally the same UUID as the `auth.users` row so server-side lookups and RLS checks can compare `auth.uid()` to `users.id`.
- `email` is stored for convenience; the authoritative value remains `auth.users.email`. The app should keep them consistent on signup/profile update.

## Trigger
- `public.set_updated_at()` and trigger `trg_set_updated_at` update `updated_at` on every UPDATE.

## RLS and policies
RLS is enabled on `public.users`. Policy behavior:

SELECT:
- Admins and moderators may SELECT all rows.
- Regular users may SELECT only their own row.

UPDATE:
- Admins can UPDATE any row, including changing `role`.
- Moderators can UPDATE any row but are blocked from changing `role`.
- Users can UPDATE only their own row and cannot change `role`.

INSERT:
- Only admins (and service processes using service credentials) may INSERT new `users` rows via the API. Regular users should not be able to create arbitrary users rows; signup flow (server-side) should be responsible for creating the profile row or the admin can create profiles.

DELETE:
- Only admins can DELETE user rows.

Implementation details:
- Policies use `current_setting('jwt.claims.role', true)` to read the role claim from the JWT. They also use `auth.uid()` to check the requester id.
- Ensure your authentication JWT includes a custom claim `role` when appropriate. Supabase does not automatically include any custom backend role; you have two common options:
  1. Set the `role` claim when minting a custom token (backend/service flow).
  2. Use a server-side process (service role key) to set role values in `public.users` after signup, and rely on RLS to block client-side role changes.

Edge cases and security considerations:
- The migration grants minimal privileges to `authenticated` and `anon`. Policies are the primary enforcement mechanism.
- If you use third-party OAuth providers, ensure the role claim is mapped correctly or that your backend sets the initial `role` field in `public.users`.
- Avoid trusting client-supplied role claims unless they are signed by your backend/service.

## Integration notes for Next.js
1. Signup flow
   - On successful Supabase signup (auth), create a matching `public.users` row (server-side) that sets `id` to `auth.user.id`, `email` to `auth.user.email`, `full_name` if provided, and `role` defaulting to `user`.
   - Prefer creating the `public.users` row via a backend API (Supabase Edge Function or server) that uses the Supabase service role key, so that RLS does not block the insert.

   Example (server-side pseudocode):
   - Call Supabase Auth to create user (or handle auth callback)
   - Using service key or server context, INSERT INTO public.users (id, email, full_name, role) VALUES (...)

2. Sign-in and client operations
   - After sign-in, client obtains a JWT. That JWT should include a `role` claim for the RLS checks to permit admin/moderator actions. If you do not include role in JWT, RLS will only allow user-scoped operations (auth.uid()).
   - Safer approach: Do not rely on role claim in JWT. Instead:
     - Keep role in `public.users`.
     - Query `public.users` for the current user to obtain role on sign-in.
     - For actions that modify other users (admin tasks), use a server-side API authenticated with the service role key or require a token containing the role claim.

3. Example: user updates their profile (client)
   - Patch request to update fields (full_name, email)
   - The database policy `users_update_own_no_role` allows the update only when `auth.uid() = id` and ensures `role` is unchanged.
   - The Next.js admin account settings page will automatically be blocked from updating `role` for non-admin clients because the policy enforces it.

4. Example: admin listing users
   - Admin clients with `role` claim = `admin` can run SELECT * FROM public.users; client-side Supabase queries will succeed because policies permit admins to select all rows.
   - Alternately, run the list users request from a server-side endpoint using service key.

## Example SQL snippets
- Create the profile row on signup (server-side with service key):
  INSERT INTO public.users (id, full_name, email, role) VALUES ('<auth-uuid>', 'Name', 'email@example.com', 'user');

- Client-side update (user updates their own name):
  UPDATE public.users SET full_name = 'New Name' WHERE id = auth.uid();

- Admin changes role (server or admin client with role claim = admin):
  UPDATE public.users SET role = 'moderator' WHERE id = '<uuid>';

## How to ensure JWT role claim exists
- Supabase does not automatically populate a custom role claim in the JWT on standard signups.
- Options:
  1. Use a backend service to mint custom tokens with the role claim for admin/moderator users (advanced).
  2. After sign up, server-side set role in `public.users` table and on sign-in, the app queries `public.users` to determine role and enable admin UI. For actions requiring database-level role-based SELECT/UPDATE on other users, prefer server-side APIs executed with service key.

## Migration reference
See the migration file at [`supabase/migrations/002_create_users_and_rls.sql`:1] for the exact SQL including policies and trigger.

## Next steps for the repo
1. Add the migration to your Supabase migrations directory (done).
2. Apply the migration against your Supabase dev project.
3. Update signup server flow to create `public.users` row using service key.
4. Add server-side admin endpoints (service key) for sensitive operations (mass role changes, onboarding imports, deletes).
5. Optionally implement an RPC to promote/demote users that is callable only by admins or service role.
