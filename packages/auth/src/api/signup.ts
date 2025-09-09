/**
 * Signup API
 *
 * - Creates the Supabase auth user using the server client (which persists sessions
 *   via cookies and supports refresh token rotation).
 * - After successful auth sign-up, creates a corresponding row in `public.users`
 *   using a service-role authenticated Supabase client so the insert bypasses RLS.
 *
 * Required env:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { createServerClient as createClient } from '../lib/supabase';
import type { NextRequest } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
 
export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json();
 
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
    }
 
    // Create a server client that persists sessions (uses anon key + cookies)
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
 
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }
 
    // If signUp succeeded, ensure a profile row exists in public.users.
    // We must use the service role key to bypass RLS — create a short-lived
    // service client here for that purpose.
    try {
      const userId = data?.user?.id;
      if (userId) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          // Log server-side and continue; the app should surface an error in deployment if this is missing.
          // Do not block signup flow for missing service key in non-production/dev testing.
          // eslint-disable-next-line no-console
          console.warn('SUPABASE_SERVICE_ROLE_KEY is not set — unable to create profile row in public.users');
        } else {
          const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } },
          );
 
          // Insert profile. Role defaults to 'user'. Allow full_name to be null.
          const insertPayload = {
            id: userId,
            email,
            role: 'user',
            full_name: full_name ?? null,
          };
 
          const { error: insertError } = await serviceSupabase.from('users').insert(insertPayload).maybeSingle();
 
          if (insertError) {
            // Log error server-side but don't block the auth response.
            // eslint-disable-next-line no-console
            console.error('Error inserting user profile into public.users:', insertError);
          }
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('Signed up user but no user id returned from Supabase auth signUp response');
      }
    } catch (profileErr) {
      // Log but continue — signup must not be disrupted.
      // eslint-disable-next-line no-console
      console.error('Unexpected error creating profile row:', profileErr);
    }
 
    // Return the original signUp data so client retains session handling as before.
    return Response.json(data);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}