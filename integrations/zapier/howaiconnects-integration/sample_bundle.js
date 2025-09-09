ntegrations/zapier/howaiconnects-integration/sample_bundle.js</path>
<content">// sample_bundle.js
// Example snippets showing how to attach Supabase JWT to requests inside Zapier
// Platform CLI actions/triggers. This file is a reference; integrate patterns into
// each action file (e.g., creates/create_user.js, creates/create_prompt.js).
//
// Key idea:
// - Provide `supabase_jwt` as an auth field in Zapier's auth config (authentication.js).
// - In perform functions, read from `bundle.authData.supabase_jwt` first, then fallback
//   to environment variable HOWAI_SUPABASE_JWT for local testing.

// Helper to build headers for API requests
const buildAuthHeaders = (bundle = {}) => {
  const jwt = (bundle.authData && bundle.authData.supabase_jwt) || process.env.HOWAI_SUPABASE_JWT;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'howaiconnects-zapier-integration/1.0',
  };
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }
  return headers;
};

// Example usage inside a perform function
// const performCreateUser = async (z, bundle) => {
//   const base = (bundle.authData && bundle.authData.base_url) || process.env.HOWAI_BASE_URL;
//   const url = `${base.replace(/\\/$/, '')}/api/signup`;
//   const response = await z.request({
//     url,
//     method: 'POST',
//     headers: buildAuthHeaders(bundle),
//     body: JSON.stringify({ email: bundle.inputData.email, password: bundle.inputData.password }),
//   });
//   return response.json;
// };

// Example: how to configure Zapier auth fields (for reference)
// authentication.js should expose a single API key / token field named `supabase_jwt`
// and optionally a `base_url` field. Example auth spec excerpt:
//
// module.exports = {
//   type: 'custom',
//   test: {
//     url: '{{bundle.authData.base_url}}/api/me',
//   },
//   fields: [
//     { key: 'supabase_jwt', required: true, helpText: 'Supabase JWT to use as Bearer token' },
//     { key: 'base_url', required: false, helpText: 'Optional custom base URL for your deployment' },
//   ],
// };

module.exports = {
  buildAuthHeaders,
};