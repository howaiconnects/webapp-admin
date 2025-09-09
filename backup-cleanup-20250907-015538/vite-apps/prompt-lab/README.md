# Prompt Lab (apps/prompt-lab)

This app is a minimal Vite + React + TypeScript scaffold intended to provide a real dev/build/test/lint workflow for the Prompt Lab application.

Why Vite+React?
- The repository did not contain an explicit Next.js app structure for `apps/prompt-lab` (no `pages/` or `next.config.js`), but the env example used `NEXT_PUBLIC_*` keys which are framework-agnostic. To keep bootstrapping fast and low-risk inside the monorepo, I chose Vite + React + TypeScript as a lightweight default that is easy to install, run, and extend. If maintainers prefer Next.js, the changes here are minimal to replace with Next later.

Available scripts (use from repo root with pnpm workspace filter)
- pnpm --filter @howaiconnects/prompt-lab dev
  - Starts the Vite dev server on the app port (default PORT=3002 from .env.local.example)
- pnpm --filter @howaiconnects/prompt-lab build
  - Produces a production build (dist/)
- pnpm --filter @howaiconnects/prompt-lab preview
  - Serves the built production bundle locally
- pnpm --filter @howaiconnects/prompt-lab test
  - Runs unit tests via Vitest
- pnpm --filter @howaiconnects/prompt-lab lint
  - Runs ESLint (uses repository root ESLint config)

Files added
- vite.config.ts — Vite config with basic React and Vitest settings
- index.html — Vite entry html
- src/main.tsx — App entry
- src/App.tsx — Minimal hello-world component
- src/App.test.tsx — Basic Vitest + React Testing Library test
- tsconfig.json — App-level TypeScript config
- README.md — this file

Required dev/runtime dependencies (NOT installed by this patch)
- vite
- react
- react-dom
- typescript
- @types/react
- @types/react-dom
- vitest
- @testing-library/react
- @testing-library/jest-dom
- jsdom
- eslint (already provided at repo root)
- @vitejs/plugin-react (optional but recommended)

Suggested install commands (run from repository root)
- For app-only dev dependencies:
  - pnpm --filter @howaiconnects/prompt-lab add -D vite typescript vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
- For runtime deps:
  - pnpm --filter @howaiconnects/prompt-lab add react react-dom
- Or to add packages at workspace root (dev tools shared across repo):
  - pnpm add -w -D vite typescript vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
  - pnpm add -w react react-dom

Notes and decisions
- Defaulted to Vite + React because the app had placeholder scripts and no clear framework-specific files. Vite is fast to bootstrap and safe inside a monorepo.
- This change does NOT install any dependencies; maintainer must run one of the suggested pnpm commands above before running dev/build/test.
- The app-level ESLint relies on the repo root `.eslintrc.js`. No root-level lint rules were changed.

Next steps recommended
- Install the dependencies listed above.
- If you prefer Next.js for `prompt-lab`, I can refactor this scaffold to Next conventions instead.
