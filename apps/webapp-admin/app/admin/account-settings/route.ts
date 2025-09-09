import { NextResponse } from 'next/server';
import { createClient } from '@howaiconnects/auth/lib/supabase';

/**
 * PATCH /admin/account-settings
 * - Enforces authentication via server Supabase client (reads cookies)
 * - Updates allowed profile fields (full_name, email)
 * - Role updates are accepted from the payload but treated as advisory;
 *   if the backend enforces role management via policies, the update may be rejected.
 */

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { full_name, email, role } = body ?? {};

    const supabase = await createClient();

    // Ensure session exists and user is authenticated
    // @ts-ignore - supabase server client exposes auth.getSession
    const sessionRes = await supabase.auth.getSession?.();
    const user = sessionRes?.data?.session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Build update payload. Only allow certain fields.
    const updatePayload: any = {};
    if (typeof full_name === 'string') updatePayload.full_name = full_name;
    if (typeof email === 'string') updatePayload.email = email;
    // Include role but mark as potentially restricted on the server
    if (typeof role === 'string') updatePayload.role = role;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Use service-role or session-backed client to update the users table.
    // This will respect RLS/policies configured in Supabase.
    const { data, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[admin/account-settings] update error', error);
      return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
    }

    // Return updated profile
    return NextResponse.json({ success: true, profile: data }, { status: 200 });
  } catch (err: any) {
    console.error('[admin/account-settings] unexpected error', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}