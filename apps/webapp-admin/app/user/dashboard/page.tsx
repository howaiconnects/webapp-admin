'use client';

import React, { useState } from 'react';
import DashboardWidget from '../../../src/components/DashboardWidget';
import MiroBoard from '../../../src/components/MiroBoard';
import AirtableTable from '../../../src/components/AirtableTable';
import { LatitudeAdapter } from '../../../../../packages/adapters/latitude-adapter';

export default function UserDashboard() {
  const [latitudeResponse, setLatitudeResponse] = useState('');
  const [latitudeLoading, setLatitudeLoading] = useState(false);
  const [latitudeError, setLatitudeError] = useState('');

  const handleLatitudePrompt = async () => {
    setLatitudeLoading(true);
    setLatitudeError('');
    try {
      const adapter = new LatitudeAdapter();
      await adapter.init({});
      // Using a sample prompt ID - in real usage this would be configurable
      const result = await adapter.runPrompt('sample-prompt-id', {});
      setLatitudeResponse(JSON.stringify(result, null, 2));
    } catch (err: any) {
      setLatitudeError(err.message || 'Failed to run prompt');
    } finally {
      setLatitudeLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary-light">
            Unified Dashboard
          </h1>
          <p className="text-lg text-secondary-light">
            All your AI tools in one place
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Miro Board - Top Left */}
          <DashboardWidget title="Miro Board" className="lg:col-span-1">
            <MiroBoard
              boardUrl="https://miro.com/app/board/sample-board-id/"
              height="400px"
            />
          </DashboardWidget>

          {/* Latitude Prompt Output - Top Right */}
          <DashboardWidget title="Latitude AI Output" className="lg:col-span-1">
            <div className="space-y-4">
              <button
                onClick={handleLatitudePrompt}
                disabled={latitudeLoading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {latitudeLoading ? 'Generating...' : 'Run Sample Prompt'}
              </button>

              {latitudeError && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                  <p className="text-error-700 text-sm">{latitudeError}</p>
                </div>
              )}

              {latitudeResponse && (
                <div className="bg-neutral-50 rounded-md p-4 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-primary-light whitespace-pre-wrap font-mono">
                    {latitudeResponse}
                  </pre>
                </div>
              )}

              {!latitudeResponse && !latitudeLoading && !latitudeError && (
                <div className="text-center text-secondary-light py-8">
                  <p>Click "Run Sample Prompt" to see Latitude AI output</p>
                </div>
              )}
            </div>
          </DashboardWidget>
        </div>

        {/* Airtable Table - Bottom Full Width */}
        <DashboardWidget title="Airtable Data" className="mb-6">
          <AirtableTable
            baseId="sample-base-id"
            table="sample-table"
          />
        </DashboardWidget>
      </div>
    </div>
  );
}
