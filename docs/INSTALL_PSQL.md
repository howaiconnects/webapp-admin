# Installing psql (Postgres client) — quick guide

This file lists copy-paste commands to install the Postgres CLI (`psql`) on common developer platforms so you can run the migration script (`./scripts/apply-supabase-migration.sh`) locally.

Important: run commands appropriate for your OS / package manager.

Linux (Debian / Ubuntu)
- Update package lists and install the client:
  sudo apt update
  sudo apt install -y postgresql-client

Linux (Debian / Ubuntu) — specific Postgres version (e.g., 15)
- Add PostgreSQL APT repository and install client 15:
  sudo apt-get install -y wget ca-certificates
  wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
  echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
  sudo apt update
  sudo apt install -y postgresql-client-15

Linux (Fedora / CentOS / RHEL)
- Fedora:
  sudo dnf install -y postgresql
- CentOS/RHEL (with extras/epel available):
  sudo yum install -y postgresql

macOS (Homebrew)
- If you have Homebrew:
  brew update
  brew install libpq
  # Optionally make psql available on PATH:
  brew link --force libpq

macOS (Direct Postgres installer)
- Download the PostgreSQL installer from https://www.postgresql.org/download/macosx/ and follow the installer steps.

Windows (Chocolatey)
- Using Chocolatey (admin PowerShell):
  choco install postgresql --version=15.0
  # After install, add psql to PATH or use the provided psql in the installation folder.

Windows (WSL)
- If you use WSL (Ubuntu):
  sudo apt update
  sudo apt install -y postgresql-client

Verify installation
- Run:
  psql --version
  # Example output: psql (PostgreSQL) 15.2

Run migrations after installing psql
1. Ensure root env file is loaded into environment variables:
   - If you have `.env.root.local` at repo root:
     set -a && source .env.root.local && set +a
     # (or run the one-liner below)
2. From the repo root run:
   ./scripts/apply-supabase-migration.sh

One-liner (after installing psql)
- set -a && source .env.root.local && set +a && ./scripts/apply-supabase-migration.sh

If you prefer not to install psql
- I can:
  - Add a Docker-based command that runs psql in a temporary container (I can add the command or a script).
  - Create a single combined SQL file you can paste into the Supabase SQL editor.
  - Add a GitHub Actions workflow to run migrations in CI.

Security reminders
- Do NOT commit `.env.root.local` or any secrets to the repository.
- Use CI secrets for automated migrations in production/deployment workflows.

File created: [`docs/INSTALL_PSQL.md`](docs/INSTALL_PSQL.md:1)