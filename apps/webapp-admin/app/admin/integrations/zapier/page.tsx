'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ZapierCreateModal from '../../../../src/components/ZapierCreateModal';

export default function ZapierIntegrationPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary-light">Zapier Integration</h1>
        <p className="text-lg text-secondary-light">
          Create a pre-filled Zap to connect HowAIConnects to Zapier. This flow generates a sample Zap JSON,
          a pre-filled invite/link, and example credentials you can copy into Zapier when building your Zap.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold mb-2">Create a Sample Zap</h2>
          <p className="text-sm text-gray-600 mb-4">
            This helper will generate:
          </p>
          <ul className="list-disc ml-6 mb-4 text-gray-600">
            <li>A pre-filled Zap JSON you can import into Zapier (example triggers/actions)</li>
            <li>A Zapier App invite link (if available) or instructions to open Zapier with sample credentials</li>
            <li>Copyable HOWAI_BASE_URL and HOWAI_SUPABASE_JWT examples for local testing</li>
          </ul>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
            >
              Create Zap
            </button>

            <Link href="/admin/ai" className="px-4 py-2 border rounded text-gray-700 bg-white hover:bg-gray-50">
              Back to AI Dashboard
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-neutral-700">
          <h3 className="text-lg font-medium mb-2">Quick tips</h3>
          <ol className="list-decimal ml-6 text-gray-600">
            <li>Start the local test server for quick credential testing: see integration docs.</li>
            <li>Use a short-lived JWT or service token for Zapier integrations.</li>
            <li>If you need a private invite for the Zapier app, generate it from the Zapier platform dashboard.</li>
          </ol>
        </div>
      </div>

      {open && <ZapierCreateModal onClose={() => setOpen(false)} />}
    </div>
  );
}