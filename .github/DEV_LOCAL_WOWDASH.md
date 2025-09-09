# Local Development — WowDash Admin (pnpm)

Follow these steps to run the admin dashboard locally using pnpm.

Prerequisites
- Ensure Node.js (recommended 18+) and pnpm are installed.
  - Check Node: [`node -v`](node:1)
  - Check pnpm: [`pnpm -v`](pnpm:1)

Install dependencies
1. Open a terminal at the repository root.
2. Change into the admin app folder:
   - `cd wowdash-admin-dashboard` — see [`wowdash-admin-dashboard/`](wowdash-admin-dashboard:1)
3. Install with pnpm:
   - `pnpm install`

Start the development server
- Run:
  - `pnpm start`
- If the project uses a different start script, check the package file at:
  - [`wowdash-admin-dashboard/package.json`](wowdash-admin-dashboard/package.json:1)
  - Common alternatives:
    - `pnpm run dev`
    - `pnpm run start:dev`

Open the app
- Visit http://localhost:3000 (or the port printed by the dev server).

Troubleshooting
- If `pnpm install` fails: remove node modules and retry:
  - `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- If port 3000 is in use:
  - Start with a different port: `PORT=4000 pnpm start`
- If the start script is missing, inspect [`wowdash-admin-dashboard/package.json`](wowdash-admin-dashboard/package.json:1) for available scripts.

References
- Project README: [`wowdash-admin-dashboard/README.md`](wowdash-admin-dashboard/README.md:1)
- Repo-wide secrets & credentials docs:
  - [`docs/GIT_CREDENTIALS_SETUP.md`](docs/GIT_CREDENTIALS_SETUP.md:1)
  - [`docs/SECRETS_WORKFLOW.md`](docs/SECRETS_WORKFLOW.md:1)