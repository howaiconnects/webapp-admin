ntegrations/zapier/howaiconnects-integration/creates/create_prompt.js</path>
<content">// creates/create_prompt.js
// Zapier create action to call POST /api/prompt
const perform = async (z, bundle) => {
  const base = process.env.HOWAI_BASE_URL || bundle.authData.base_url || 'https://example.com';
  const url = `${base.replace(/\\/$/, '')}/api/prompt${bundle.inputData.stream ? '?stream=true' : ''}`;

  const headers = {
    'Content-Type': 'application/json',
  };

  // Inject Supabase JWT from auth
  if (bundle.authData && bundle.authData.supabase_jwt) {
    headers['Authorization'] = `Bearer ${bundle.authData.supabase_jwt}`;
  }

  const body = {
    message: bundle.inputData.message,
    history: bundle.inputData.history || [],
  };

  const response = await z.request({
    url,
    method: 'POST',
    headers,
    body,
  });

  // If streaming was requested, Zapier may not handle streaming responses;
  // return the raw text or parsed JSON reply when available.
  if (response.status >= 400) {
    throw new z.errors.Error(`API Error: ${response.status}`, 'api_error', response.status);
  }

  // Attempt to parse JSON; fallback to raw text
  let data;
  try {
    data = response.json;
  } catch (e) {
    data = { reply: response.content };
  }

  // Normalize output
  return {
    id: bundle.inputData.id || String(Date.now()),
    reply: data.reply || data,
    raw: data,
  };
};

module.exports = {
  key: 'create_prompt',
  noun: 'Prompt',
  display: {
    label: 'Create Prompt',
    description: 'Send a prompt to HowAIConnects and receive a reply.',
  },
  operation: {
    inputFields: [
      { key: 'message', required: true, type: 'string', label: 'Message' },
      { key: 'history', required: false, type: 'string', label: 'History (JSON array)', helpText: 'JSON encoded array of previous messages. Optional.' },
      { key: 'stream', required: false, type: 'boolean', label: 'Stream response' },
    ],
    perform,
    sample: {
      id: '1',
      reply: 'Sample reply from AI',
    },
    outputFields: [
      { key: 'id', label: 'ID' },
      { key: 'reply', label: 'Reply' },
      { key: 'raw', label: 'Raw response' },
    ],
  },
};