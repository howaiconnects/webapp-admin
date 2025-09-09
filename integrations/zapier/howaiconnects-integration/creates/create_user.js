ntegrations/zapier/howaiconnects-integration/creates/create_user.js</path>
<content">// creates/create_user.js
// Action: Create User via POST /api/signup
// Expects the app to expose POST /api/signup which accepts a JSON body:
// { email, password?, name?, metadata? }
// and returns the created user object (id, email, name, created_at, ...)

const perform = async (z, bundle) => {
  const base = process.env.HOWAI_BASE_URL || bundle.authData.base_url || 'https://example.com';
  const url = `${base.replace(/\\/$/, '')}/api/signup`;

  const headers = {
    'Content-Type': 'application/json',
  };

  // Allow passing Supabase JWT in bundle.authData.supabase_jwt (recommended)
  if (bundle.authData && bundle.authData.supabase_jwt) {
    headers['Authorization'] = `Bearer ${bundle.authData.supabase_jwt}`;
  }

  const body = {
    email: bundle.inputData.email,
  };

  // Optional fields
  if (bundle.inputData.password) body.password = bundle.inputData.password;
  if (bundle.inputData.name) body.name = bundle.inputData.name;
  if (bundle.inputData.metadata) {
    try {
      // Allow JSON string or object
      body.metadata = typeof bundle.inputData.metadata === 'string'
        ? JSON.parse(bundle.inputData.metadata)
        : bundle.inputData.metadata;
    } catch (e) {
      // If parsing fails, send as raw string
      body.metadata = bundle.inputData.metadata;
    }
  }

  const response = await z.request({
    url,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (response.status >= 400) {
    // Bubble up errors in a Zapier-friendly way
    let errMsg = `API Error: ${response.status}`;
    try {
      const json = response.json;
      if (json && json.error) errMsg = json.error;
      else if (json && json.message) errMsg = json.message;
    } catch (e) {
      // ignore
    }
    throw new z.errors.Error(errMsg, 'api_error', response.status);
  }

  // Expect response.json to be the created user object or { user: {...} }
  let user;
  try {
    const json = response.json;
    user = json && json.user ? json.user : json;
  } catch (e) {
    user = {};
  }

  return user;
};

module.exports = {
  key: 'create_user',
  noun: 'User',
  display: {
    label: 'Create User',
    description: 'Create a new user in HowAIConnects via the /api/signup endpoint.',
  },
  operation: {
    inputFields: [
      { key: 'email', required: true, label: 'Email' },
      { key: 'password', required: false, label: 'Password', helpText: 'Optional. If omitted, the app may create an invitation or random password.' },
      { key: 'name', required: false, label: 'Name' },
      { key: 'metadata', required: false, label: 'Metadata (JSON)', helpText: 'Optional JSON metadata for the user. Can be an object or JSON string.' },
    ],
    perform,
    sample: {
      id: 'user_123',
      email: 'jane@example.com',
      name: 'Jane Example',
      created_at: new Date().toISOString(),
    },
    outputFields: [
      { key: 'id', label: 'User ID' },
      { key: 'email', label: 'Email' },
      { key: 'name', label: 'Name' },
      { key: 'created_at', label: 'Created at' },
      { key: 'metadata', label: 'Metadata' },
    ],
  },
};