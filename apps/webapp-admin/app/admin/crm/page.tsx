import { AirtableAdapter } from '../../../../../packages/adapters/airtable-adapter';

interface AirtableRecord {
  id: string;
  fields: {
    Name?: string;
    Email?: string;
    Status?: string;
    [key: string]: any;
  };
}

'use client';
function SyncButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      aria-label="Sync data now"
    >
      Sync Now
    </button>
  );
}

export default async function CRMPage() {
  let records: AirtableRecord[] = [];
  let error: string | null = null;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  const missingEnv: string[] = [];
  if (!apiKey) missingEnv.push('AIRTABLE_API_KEY');
  if (!baseId) missingEnv.push('AIRTABLE_BASE_ID');
  if (!tableName) missingEnv.push('AIRTABLE_TABLE_NAME');

  if (missingEnv.length > 0) {
    error = `Missing environment variables: ${missingEnv.join(', ')}. Please set them to use the CRM integration.`;
  } else {
    try {
      const adapter = new AirtableAdapter();
      await adapter.init({ apiKey });
      records = await adapter.listRecords(baseId!, tableName!);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      error = `Failed to fetch records from Airtable: ${errorMessage}`;
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">CRM Records</h1>
      <div className="mb-4">
        <SyncButton />
      </div>
      {error ? (
        <section className="p-4 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
          {error}
        </section>
      ) : records.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No records found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">ID</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Email</th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record: AirtableRecord, index: number) => (
                <tr key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-2">{record.id}</td>
                  <td className="border border-gray-300 px-4 py-2">{record.fields?.Name || 'N/A'}</td>
                  <td className="border border-gray-300 px-4 py-2">{record.fields?.Email || 'N/A'}</td>
                  <td className="border border-gray-300 px-4 py-2">{record.fields?.Status || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
