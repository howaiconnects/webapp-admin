import React, { useState, useEffect } from 'react';

type Props = {
  onClose: () => void;
};

// Non-sensitive preview token for UI only — do not generate real tokens here.
function generateSampleJwtPreview() {
  return 'ey.sample.token-preview-xxxxxxxxxxxx';
}

function generateSampleZapJson(baseUrl: string, jwt: string) {
  return {
    name: 'HowAIConnects — Sample Zap',
    description: 'Example Zap that triggers on new AI events and posts to Slack (sample)',
    version: '1.0.0',
    meta: {
      baseUrl,
      auth: {
        howai_base_url: baseUrl,
        howai_supabase_jwt: jwt,
      },
    },
    triggers: [
      {
        key: 'new_prompt',
        verb: 'New Prompt',
        sample: { id: 'prompt_123', text: 'Hello world' },
      },
    ],
    actions: [
      {
        key: 'create_prompt',
        verb: 'Create Prompt',
        input: { text: 'Sample prompt text' },
      },
    ],
  };
}

export default function ZapierCreateModal({ onClose }: Props) {
  const [baseUrl, setBaseUrl] = useState('http://localhost:5173');
  const [jwt, setJwt] = useState(generateSampleJwtPreview());
  const [zapJson, setZapJson] = useState(() => generateSampleZapJson(baseUrl, jwt));
  const [copied, setCopied] = useState(false);
  const [jwtLoading, setJwtLoading] = useState(false);
  const [tokenPreview, setTokenPreview] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  function regenerate() {
    const preview = generateSampleJwtPreview();
    setJwt(preview);
    const newJson = generateSampleZapJson(baseUrl, preview);
    setZapJson(newJson);
    setCopied(false);
  }

  function updateBaseUrl(v: string) {
    setBaseUrl(v);
    setZapJson(generateSampleZapJson(v, jwt));
  }

  function updateJwt(v: string) {
    setJwt(v);
    setZapJson(generateSampleZapJson(baseUrl, v));
  }

  async function copyZapJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(zapJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  function openZapierImport() {
    // Zapier import via URL isn't universally supported; provide instructions + open Zapier homepage
    const url = 'https://zapier.com/app/editor';
    window.open(url, '_blank');
  }

  // Auto-fetch short-lived JWT from our server route when the modal is shown.
  // Keeps a manual override so the user can paste their own token.
  useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      try {
        setJwtLoading(true);
        const res = await fetch('/api/zapier/token', { credentials: 'include' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'unknown' }));
          console.warn('Failed to fetch zapier token', err);
          setJwtLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (data?.token) {
          setJwt(data.token);
          setZapJson(generateSampleZapJson(baseUrl, data.token));
          setTokenPreview(Boolean(data.preview));
          setExpiresAt(data.expires_at ?? null);
        }
      } catch (e) {
        // ignore network errors; keep manual entry fallback
        // eslint-disable-next-line no-console
        console.warn('Error fetching zapier token', e);
      } finally {
        if (!cancelled) setJwtLoading(false);
      }
    }

    // Fetch token once on mount
    fetchToken();

    return () => {
      cancelled = true;
    };
  // Intentionally only run on mount; baseUrl changes update zapJson through updateBaseUrl
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-[900px] max-w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-auto">
        <div className="flex items-center justify-between p-4 border-b dark:border-neutral-700">
          <h3 className="text-lg font-semibold">Create Sample Zap</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={regenerate}
              className="px-3 py-1 bg-gray-100 dark:bg-neutral-700 rounded text-sm"
            >
              Regenerate
            </button>
            <button onClick={onClose} className="px-3 py-1 rounded bg-red-500 text-white text-sm">
              Close
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">HOWAI_BASE_URL</label>
            <input
              value={baseUrl}
              onChange={(e) => updateBaseUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-neutral-900"
              placeholder="http://localhost:5173"
            />

            <label className="block text-sm font-medium mt-4 mb-1">HOWAI_SUPABASE_JWT (preview)</label>
            <div className="flex items-center space-x-2">
              <input
                value={jwt}
                onChange={(e) => updateJwt(e.target.value)}
                className="flex-1 px-3 py-2 border rounded bg-white dark:bg-neutral-900"
              />
              {/* loading / preview badge */}
              <div className="text-sm">
                {jwtLoading ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Loading…</span>
                ) : tokenPreview ? (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">Dev token</span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Fetched</span>
                )}
              </div>
            </div>
            {expiresAt && (
              <p className="text-xs text-gray-500 mt-2">Expires at: {expiresAt}</p>
            )}

            <div className="flex items-center space-x-2 mt-4">
              <button
                onClick={copyZapJson}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                {copied ? 'Copied' : 'Copy Zap JSON'}
              </button>
              <button
                onClick={openZapierImport}
                className="px-3 py-2 border rounded"
              >
                Open Zapier Editor
              </button>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Quick instructions</h4>
              <ol className="list-decimal ml-5 text-sm text-gray-700 dark:text-gray-200">
                <li>Start the local test server: see integration docs or run <code>npm run start-local-server</code> in the integration folder.</li>
                <li>Use the HOWAI_BASE_URL and HOWAI_SUPABASE_JWT values above when creating the connection in Zapier.</li>
                <li>Import the Zap JSON (copied) into Zapier or manually recreate using the editor.</li>
              </ol>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Sample Zap JSON</h4>
            <pre className="whitespace-pre-wrap max-h-[520px] overflow-auto bg-neutral-100 dark:bg-neutral-900 p-3 rounded text-xs">
              {JSON.stringify(zapJson, null, 2)}
            </pre>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Launch helpers</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                If you have a private Zapier app invite link, paste it here and open Zapier with the pre-filled credentials.
              </p>
              <input
                placeholder="Optional Zapier app invite URL"
                className="w-full px-3 py-2 border rounded bg-white dark:bg-neutral-900"
                // no-op for now; future: support generating pre-filled invite links
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-neutral-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded border">Done</button>
        </div>
      </div>
    </div>
  );
}