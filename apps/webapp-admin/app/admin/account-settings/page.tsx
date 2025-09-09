import React from 'react';
import { createClient } from '@howaiconnects/auth/lib/supabase';
import type { Database } from 'prisma/type-placeholder'; // no-op; kept for clarity
import AccountSettingsForm from './AccountSettingsForm';

// Server component: fetch current admin profile and render form
export default async function AccountSettingsPage() {
  // Create server Supabase client which will read cookies for session
  const supabase = await createClient();

  // Try to refresh session if needed (helper inside package will do best-effort)
  // @ts-ignore
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession?.() ?? { data: null, error: null };

  if (!sessionData?.session?.user) {
    // If no user we show a message — authentication middleware is preferred in routing,
    // but keep a friendly message here in case it's reached directly.
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <p className="mt-4 text-sm text-gray-600">You must be signed in to view and edit your account settings.</p>
      </div>
    );
  }

  const userId = sessionData.session.user.id;

  // Fetch profile from 'users' table (common Supabase convention)
  const { data: profileData, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('[admin/account-settings] failed to load profile', profileError);
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <p className="mt-4 text-sm text-red-600">Failed to load profile. Check logs for details.</p>
      </div>
    );
  }

  const profile = profileData ?? { id: userId, email: sessionData.session.user.email, full_name: '', role: '' };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Account settings</h1>
      <p className="text-sm text-gray-600 mb-6">View and update your profile information.</p>

      {/* Render client form. Pass initial data as props. */}
      {/* AccountSettingsForm is a client component that handles submission to the route handler */}
      {/* @ts-ignore */}
      <AccountSettingsForm initialProfile={profile} />
    </div>
  );
}