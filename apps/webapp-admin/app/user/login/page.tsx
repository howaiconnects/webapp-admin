"use client";

import { useState } from "react";

export default function DevLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Signing in...");

    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Error: ${data?.message || data?.error || res.statusText}`);
        return;
      }

      setStatus("Signed in — cookies should be set. Call /api/test-refresh to verify refresh.");
    } catch (err: any) {
      setStatus(`Request failed: ${String(err)}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-semibold mb-4">Dev Login</h1>
        <p className="text-sm text-gray-600 mb-4">
          This is a temporary development-only login page. Use valid test credentials.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full p-2 border rounded"
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full p-2 border rounded"
              placeholder="password"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-700">
          <p>{status}</p>
          <p className="mt-2">
            After signing in, open <code>/api/test-refresh</code> to verify refresh behavior.
          </p>
        </div>
      </div>
    </div>
  );
}