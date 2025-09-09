'use client';

import React, { useState } from 'react';
import { LatitudeAdapter } from '../../../../../packages/adapters/latitude-adapter';

export default function TextGeneratorPage() {
  const [promptId, setPromptId] = useState('');
  const [promptParams, setPromptParams] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptId.trim()) {
      setError('Please enter a prompt ID');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    // Build params object from textarea (if provided)
    let params: Record<string, any> = {};
    if (promptParams.trim()) {
      try {
        params = JSON.parse(promptParams);
      } catch (parseError) {
        setError('Invalid JSON in parameters');
        setLoading(false);
        return;
      }
    }

    try {
      // Call the server-side proxy API which uses LatitudeAdapter
      const resp = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // If your app uses an authorization cookie or header, ensure it's included by the browser.
          // Example for explicit bearer header (replace with real token flow if needed):
          // 'Authorization': `Bearer ${yourAuthToken}`
        },
        body: JSON.stringify({
          promptId: promptId.trim(),
          params,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errBody?.error || `Server returned ${resp.status}`);
      }

      const data = await resp.json();
      // The API returns { ok: true, result } on success
      if (data?.ok) {
        setResponse(JSON.stringify(data.result, null, 2));
      } else {
        setError(data?.error || 'AI service responded with an unexpected payload');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while calling AI service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary-light">
            Text Generator
          </h1>
          <p className="text-lg text-secondary-light">
            Generate text using Latitude prompts
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="promptId" className="block text-sm font-medium text-primary-light mb-2">
                Prompt ID
              </label>
              <input
                type="text"
                id="promptId"
                value={promptId}
                onChange={(e) => setPromptId(e.target.value)}
                placeholder="Enter the Latitude prompt ID"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="promptParams" className="block text-sm font-medium text-primary-light mb-2">
                Parameters (JSON)
              </label>
              <textarea
                id="promptParams"
                value={promptParams}
                onChange={(e) => setPromptParams(e.target.value)}
                placeholder='{"key": "value"} or leave empty for no parameters'
                rows={4}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Text'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-error-600 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error-800">Error</h3>
                <p className="text-sm text-error-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {response && (
          <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-primary-light mb-4">Response</h3>
            <div className="bg-neutral-50 rounded-md p-4">
              <pre className="text-sm text-primary-light whitespace-pre-wrap font-mono">
                {response}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
