const path = require('path')

/**
 * next.config.js
 *
 * Adds a webpack alias so the @howaiconnects/adapters path maps to the monorepo package source.
 * This enables Next.js and tsc in the app to resolve the alias at runtime and during typechecking.
 */
module.exports = {
  webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@howaiconnects/adapters': path.resolve(__dirname, '../../packages/adapters/src'),
    }
    return config
  },
}