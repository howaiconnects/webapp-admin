#!/usr/bin/env bash
set -euo pipefail

# Applies SQL migrations in supabase/migrations to a Supabase Postgres instance.
#
# This script supports two modes:
# 1) SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (uses psql)
# 2) SUPABASE_DB_URL (full postgres connection string with user/password/host/dbname)
#
# Usage:
#   SUPABASE_DB_URL="postgres://user:pass@host:5432/dbname" ./scripts/apply-supabase-migration.sh
#   OR
#   SUPABASE_URL="https://your-project.supabase.co" SUPABASE_SERVICE_ROLE_KEY="service-role-key" ./scripts/apply-supabase-migration.sh
#
# Note: For production, prefer running migrations via your CI/CD pipeline or Supabase SQL editor.
# This script is intended for developer convenience.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

if [ -z "$MIGRATIONS_DIR" ] || [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# Determine connection method
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  PSQL_CONN="$SUPABASE_DB_URL"
elif [ -n "${DATABASE_URL:-}" ]; then
  # Some developer setups provide DATABASE_URL (postgres connection string) at the repo root.
  PSQL_CONN="$DATABASE_URL"
elif [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ] && [ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  # We can't safely derive a full psql connection string from only the service-role key and project URL.
  echo "SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL provided — but SUPABASE_DB_URL or DATABASE_URL is required for psql."
  echo "If you only have the service role key, apply the SQL via the Supabase SQL editor or set SUPABASE_DB_URL/DATABASE_URL in your environment."
  exit 1
else
  echo "Missing SUPABASE_DB_URL or DATABASE_URL (preferred) or SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL."
  echo "Set SUPABASE_DB_URL or DATABASE_URL (recommended) or use the Supabase SQL editor to apply migrations."
  exit 1
fi

echo "Applying SQL migrations from: $MIGRATIONS_DIR to $PSQL_CONN"

# Apply each .sql file in lexicographic order
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "-> Applying $(basename "$f")"
  psql "$PSQL_CONN" -v ON_ERROR_STOP=1 -f "$f"
done

echo "All migrations applied."