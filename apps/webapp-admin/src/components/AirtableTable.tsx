'use client';

import React, { useState, useEffect } from 'react';

interface AirtableTableProps {
  baseId: string;
  table: string;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

export default function AirtableTable({ baseId, table }: AirtableTableProps) {
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch records via server-side Airtable proxy to avoid exposing secrets in the client.
        const query = new URLSearchParams({ baseId, table });
        const res = await fetch(`/api/airtable?${query.toString()}`, {
          method: 'GET',
          credentials: 'same-origin',
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const message = payload?.message || `Failed to fetch Airtable records: ${res.status}`;
          throw new Error(message);
        }

        const data = await res.json();
        // Expect sanitized list of records: { id, fields, createdTime }[]
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Airtable records');
      } finally {
        setLoading(false);
      }
    };

    if (baseId && table) {
      loadRecords();
    }
  }, [baseId, table]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Airtable records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-700 font-medium">Error loading Airtable records</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
        <p className="text-gray-600">No records found</p>
      </div>
    );
  }

  // Get all unique field names from records
  const fieldNames = Array.from(
    new Set(records.flatMap(record => Object.keys(record.fields)))
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {fieldNames.map(fieldName => (
              <th key={fieldName} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                {fieldName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map(record => (
            <tr key={record.id} className="hover:bg-gray-50">
              {fieldNames.map(fieldName => (
                <td key={fieldName} className="px-4 py-2 text-sm text-gray-900 border-b">
                  {record.fields[fieldName] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}