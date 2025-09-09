'use client';

import React, { useState } from 'react';

type Profile = {
  id: string;
  email: string | null;
  full_name?: string | null;
  role?: string | null;
};

export default function AccountSettingsForm({ initialProfile }: { initialProfile: Profile }) {
  const [fullName, setFullName] = useState(initialProfile.full_name ?? '');
  const [email, setEmail] = useState(initialProfile.email ?? '');
  const [role, setRole] = useState(initialProfile.role ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/admin/account-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          role,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: payload?.error || 'Failed to update profile' });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="max-w-2xl bg-white p-6 rounded-lg shadow" onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
        <input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          id="email"
          type="email"
          value={email ?? ''}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
        <input
          id="role"
          value={role ?? ''}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="role (e.g. admin)"
        />
        <p className="text-xs text-gray-500 mt-1">Role editing may be ignored if backend enforces role management.</p>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>

        {message && (
          <p className={message.type === 'success' ? 'text-green-600' : 'text-red-600'}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}