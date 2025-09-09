// Zapier authentication configuration for HowAIConnects integration
// This file defines API Key style authentication fields that Zapier's UI will render.
// It also provides a `connectionLabel` and `test` request so `zapier validate` and onboarding can verify credentials.
//
// Fields:
// - base_url: API base URL (string) — e.g., http://localhost:3003
// - api_key: Supabase JWT or API key (password)
// - organization_id: Optional org id
// - service_scope: Optional scope hint for service accounts
// - ai_model: Optional preferred model
// - ai_region: Optional region
// - webhook_token: Optional webhook security token (password)
//
// Note: Keep secrets out of source control. Use least-privilege tokens for Zapier integrations.

const authentication = {
  type: 'custom',
  test: {
    // safe test endpoint that should require auth but not mutate data
    url: '{{bundle.authData.base_url}}/api/health',
    method: 'GET',
    headers: {
      Authorization: 'Bearer {{bundle.authData.api_key}}',
    },
  },
  connectionLabel: function (z, bundle) {
    // Show the organization or base_url as the connection label
    const org = bundle.authData.organization_id || '';
    const base = bundle.authData.base_url || 'HowAIConnects';
    return org ? `${org} @ ${base}` : `${base}`;
  },
  fields: [
    {
      key: 'base_url',
      label: 'API Base URL',
      required: true,
      type: 'string',
      helpText: 'Base URL of your HowAIConnects instance (e.g. http://localhost:3003 or https://app.example.com).',
    },
    {
      key: 'api_key',
      label: 'HowAIConnects API Key / Supabase JWT',
      required: true,
      type: 'password',
      helpText: 'Short-lived Supabase JWT or API key used as Bearer token.',
    },
    {
      key: 'organization_id',
      label: 'Organization ID',
      required: false,
      type: 'string',
      helpText: 'Optional organization identifier (if your account is scoped to an org).',
    },
    {
      key: 'service_scope',
      label: 'Service Access Scope',
      required: false,
      type: 'string',
      helpText: 'Optional scope hint (e.g., "read:prompts write:users").',
    },
    {
      key: 'ai_model',
      label: 'Preferred AI Model',
      required: false,
      type: 'string',
      helpText: 'Optional default AI model to use for prompts (e.g., gpt-4).',
    },
    {
      key: 'ai_region',
      label: 'AI Service Region',
      required: false,
      type: 'string',
      helpText: 'Optional region identifier for model selection (e.g., us-east-1).',
    },
    {
      key: 'webhook_token',
      label: 'Webhook Security Token',
      required: false,
      type: 'password',
      helpText: 'Optional token sent with webhooks for verification.',
    },
  ],
  // Request template: Zapier will automatically include these headers for requests
  // and inject the common body fields so the Request Template in Zapier UI matches
  // what users pasted (this makes every action/trigger include these by default).
  //
  // - default_headers: default HTTP headers Zapier will attach to every request.
  // - requestTemplate: default body/query fields Zapier will include for auth/context.
  //
  // Use z.request normally in actions/triggers; Zapier will merge these templates;
  // you can still override headers or body per-request when needed.
  default_headers: {
    // Mirrors the Request Template defaults the user supplied in the Zapier UI.
    // Keep header names in canonical form (case-insensitive at HTTP level).
    'X-HowAI-Organization': '{{bundle.authData.organization_id}}',
    'X-HowAI-Service-Scope': '{{bundle.authData.service_scope}}',
    'X-HowAI-AI-Model': '{{bundle.authData.ai_model}}',
    'X-HowAI-AI-Region': '{{bundle.authData.ai_region}}',
    Authorization: 'Bearer {{bundle.authData.api_key}}',
  },
  requestTemplate: {
    // Provide a default body object Zapier will include for requests that use
    // form-encoded or JSON bodies. These keys mirror the Request Template body
    // fields copied from the Zapier UI to ensure consistent behavior.
    body: {
      organization_id: '{{bundle.authData.organization_id}}',
      service_scope: '{{bundle.authData.service_scope}}',
      ai_model: '{{bundle.authData.ai_model}}',
      ai_region: '{{bundle.authData.ai_region}}',
      webhook_token: '{{bundle.authData.webhook_token}}',
    },
    // If you want query params by default (uncomment and adapt):
    // params: {
    //   organization_id: '{{bundle.authData.organization_id}}'
    // }
  },
  connectionLabelStyle: 'friendly',
};

module.exports = authentication;