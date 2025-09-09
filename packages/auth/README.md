# @howaiconnects/auth

A shared authentication package for Supabase-based auth helpers in Next.js apps.

## Installation

Add to your app's dependencies:

```bash
pnpm add @howaiconnects/auth
```

## Required Environment Variables

Add these to your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

## Usage

### Client-side Hooks

Import and use the hooks in your React components:

```tsx
import { useAuth, useUser } from '@howaiconnects/auth';

// For full auth functionality
const { user, session, loading, signUp, signIn, signInWithOtp, signOut } = useAuth();

// For user info only
const { user, session, loading } = useUser();
```

#### Example Sign Up

```tsx
const handleSignUp = async () => {
  try {
    const { data, error } = await signUp('user@example.com', 'password');
    if (error) console.error(error);
    else console.log('Signed up:', data);
  } catch (error) {
    console.error('Sign up error:', error);
  }
};
```

#### Example Sign In

```tsx
const handleSignIn = async () => {
  try {
    const { data, error } = await signIn('user@example.com', 'password');
    if (error) console.error(error);
    else console.log('Signed in:', data);
  } catch (error) {
    console.error('Sign in error:', error);
  }
};
```

#### Example Magic Link (OTP)

```tsx
const handleMagicLink = async () => {
  try {
    const { data, error } = await signInWithOtp('user@example.com');
    if (error) console.error(error);
    else console.log('Magic link sent:', data);
  } catch (error) {
    console.error('Magic link error:', error);
  }
};
```

#### Example Sign Out

```tsx
const handleSignOut = async () => {
  try {
    await signOut();
    console.log('Signed out');
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
```

### Server-side API Routes

Use the API handlers in your Next.js API routes:

#### Example Signup Route

```tsx
import { POST as signup } from '@howaiconnects/auth/src/api/signup';

export { signup as POST };
```

#### Example Signin Route

```tsx
import { POST as signin } from '@howaiconnects/auth/src/api/signin';

export { signin as POST };
```

#### Example Signout Route

```tsx
import { POST as signout } from '@howaiconnects/auth/src/api/signout';

export { signout as POST };
```

For user info, create a route using the server client from `@howaiconnects/auth/lib/supabase/server`.

## Exports

- Client hooks: `@howaiconnects/auth` (useAuth, useUser)
- API handlers: `@howaiconnects/auth/src/api/*`
- Supabase clients: `@howaiconnects/auth/lib/supabase` (client, server)

## Building the Package

Run `pnpm build` in `/packages/auth` to compile TypeScript.