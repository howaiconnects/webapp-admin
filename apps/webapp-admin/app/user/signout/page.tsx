'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/signout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errMsg = payload?.error || payload?.message || `Sign out failed (${res.status})`;
        setError(errMsg);
        setLoading(false);
        return;
      }

      // Success: session cookies should be cleared by the API handler.
      setMessage('Signed out successfully. Redirecting...');
      // Give the browser a moment to clear cookies and show feedback, then navigate.
      setTimeout(() => {
        router.push('/');
      }, 600);
    } catch (err: any) {
      setError(err?.message || 'Unknown error during sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign out</h1>

      <p className="mb-6 text-secondary-light">
        Click the button below to sign out of the admin app. This will clear your session.
      </p>

      {message && (
        <div className="mb-4 p-3 bg-green-800 text-white rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-800 text-white rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleSignOut}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-white ${loading ? 'bg-neutral-600' : 'bg-primary-600 hover:bg-primary-700'}`}
      >
        {loading ? 'Signing out…' : 'Sign Out'}
      </button>
    </div>
  );
}