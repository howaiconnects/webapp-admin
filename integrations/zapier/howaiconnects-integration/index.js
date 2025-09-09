// NOTE: Added by automation — wire created actions/triggers into the Zapier app.
// Import actions/triggers created in this integration
const createUser = require('./creates/create_user');
const createPrompt = require('./creates/create_prompt');
const newPromptLog = require('./triggers/new_prompt_log');

// Export or merge into existing app definition. If your existing file already
// exports an object named `module.exports`, merge these under its `creates` / `triggers` keys.
// The following will add a safe merge if `module.exports` already exists.
if (!module.exports) {
  module.exports = {};
}

module.exports.creates = Object.assign(module.exports.creates || {}, {
  create_user: createUser,
  create_prompt: createPrompt,
});

module.exports.triggers = Object.assign(module.exports.triggers || {}, {
  new_prompt_log: newPromptLog,
});

// Ensure README notes
// See: [`integrations/zapier/howaiconnects-integration/creates/create_user.js`](integrations/zapier/howaiconnects-integration/creates/create_user.js:1)
// and: [`integrations/zapier/howaiconnects-integration/creates/create_prompt.js`](integrations/zapier/howaiconnects-integration/creates/create_prompt.js:1)
// and: [`integrations/zapier/howaiconnects-integration/triggers/new_prompt_log.js`](integrations/zapier/howaiconnects-integration/triggers/new_prompt_log.js:1)