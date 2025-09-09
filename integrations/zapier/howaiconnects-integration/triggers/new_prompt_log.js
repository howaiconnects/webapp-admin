ntegrations/zapier/howaiconnects-integration/triggers/new_prompt_log.js</path>
<content">// triggers/new_prompt_log.js
// Polling trigger to fetch recent prompt logs from a simple API endpoint.
// This expects the app to expose GET /api/prompt_logs?since=ISO_TIMESTAMP
// that returns an array of logs sorted ascending by created_at.

const perform = async (z, bundle) => {
  const base = process.env.HOWAI_BASE_URL || bundle.authData.base_url || 'https://example.com';
  const since = bundle.meta && bundle.meta.last_poll ? bundle.meta.last_poll : bundle.inputData.since;
  const url = `${base.replace(/\\/$/, '')}/api/prompt_logs${since ? `?since=${encodeURIComponent(since)}` : ''}`;

  const headers = {};
  if (bundle.authData && bundle.authData.supabase_jwt) {
    headers['Authorization'] = `Bearer ${bundle.authData.supabase_jwt}`;
  }

  const response = await z.request({
    url,
    method: 'GET',
    headers,
  });

  if (response.status >= 400) {
    throw new z.errors.Error(`API Error: ${response.status}`, 'api_error', response.status);
  }

  let items;
  try {
    items = response.json;
  } catch (e) {
    items = [];
  }

  // Ensure the trigger returns an array
  return Array.isArray(items) ? items : [];
};

module.exports = {
  key: 'new_prompt_log',
  noun: 'PromptLog',
  display: {
    label: 'New Prompt Log',
    description: 'Trigger when a new prompt log appears.',
  },
  operation: {
    type: 'polling',
    inputFields: [
      { key: 'since', required: false, label: 'Since (ISO timestamp)', helpText: 'Optional starting point for polling' },
    ],
    perform,
    sample: {
      id: 'log_1',
      user_id: 'user_123',
      request_payload: { message: 'hello' },
      response_body: 'sample reply',
      created_at: new Date().toISOString(),
    },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'user_id', label: 'User ID' },
      { key: 'request_payload', label: 'Request payload' },
      { key: 'response_body', label: 'Response body' },
      { key: 'created_at', label: 'Created at' },
    ],
  },
};