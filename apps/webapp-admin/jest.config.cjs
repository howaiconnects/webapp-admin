/**
 * Jest configuration for @howaiconnects/webapp-admin
 *
 * Enables TypeScript support via ts-jest and configures Jest to handle modern JS/TS
 * used by Next.js app routes and tests. After adding this file, install dev deps:
 *
 *   npm install -D ts-jest @types/jest
 *
 * Then run tests with:
 *   npm test
 *
 * Notes:
 * - This configuration intentionally excludes the Vitest-based smoke tests under `tests/`
 *   so local `npm test` (Jest) only runs Jest-style tests. The CI still runs Vitest where
 *   appropriate.
 * - If you prefer Babel-based transforms, replace preset/transform accordingly.
 * - If tests still need ESM support, consider using "ts-jest" with isolatedModules or
 *   adding "transformIgnorePatterns" adjustments.
 */
module.exports = {
  // Use ts-jest preset that supports JS and TS files together
  preset: 'ts-jest/presets/js-with-ts',

  // Root where tests are executed from
  rootDir: __dirname,

  // Look for Jest-style test files only. Vitest smoke tests live under `tests/` and are
  // intentionally ignored here so Jest won't attempt to execute files that import vitest.
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],

  // Ignore Vitest smoke tests directory so Jest doesn't try to run them
  testPathIgnorePatterns: ['<rootDir>/tests/'],

  // Use Node environment for server-side tests (App Router handlers)
  testEnvironment: 'node',

  // Extensions to handle
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Map tsconfig path aliases (adjust these to match your monorepo layout).
  // Added mapping for `@howaiconnects/*` so Jest can resolve internal packages during tests.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@layouts/(.*)$': '<rootDir>/src/layouts/$1',
    // Explicit mapping for the adapters package root import used in tests.
    '^@howaiconnects/adapters$': '<rootDir>/../../packages/adapters/index.ts',
    // Generic fallback: map `@howaiconnects/<pkg>` to packages/<pkg>/src
    '^@howaiconnects/(.*)$': '<rootDir>/../../packages/$1/src',
  },

  // Transform: ts-jest handles both JS and TS here via the preset
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },

  // Ignore node_modules except packages that need transpilation (adjust if necessary)
  transformIgnorePatterns: ['/node_modules/'],

  // Verbose helps when running locally
  verbose: true,

  // Provide source maps support for stack traces
  setupFilesAfterEnv: [],

  // Increase timeout for slow CI environments if needed
  testTimeout: 30000,
}