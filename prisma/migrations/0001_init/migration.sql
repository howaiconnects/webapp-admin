-- Initial migration derived from prisma/schema.prisma
-- NOTE: This file is a best-effort SQL DDL translation of the Prisma schema.
-- Assumptions / uncertainties:
--  - SERIAL/sequence semantics implemented using SERIAL for Int @default(autoincrement()).
--  - No explicit foreign key constraints were present in the Prisma schema for Project.organizationId;
--    I have not added a FK because the schema did not declare a relation field. If a relation is intended,
--    maintainers should add the FK and rerun prisma migrate locally (recommended).
--  - No unique indexes beyond those declared in the schema are inferred.
--  - Timestamps are mapped to TIMESTAMP WITH TIME ZONE (Postgres timestamptz).
--  - Table names use the @@map values from the Prisma schema.
--  - If you prefer, run `pnpm prisma migrate dev --name init --schema=prisma/schema.prisma`
--    locally to generate an authoritative SQL migration instead of using this file.

BEGIN;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: organizations
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "organizationId" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: No foreign key constraint added for projects.organizationId because
-- the Prisma schema defines a plain Int field but no relation field. If the
-- intent is to link projects.organizationId -> organizations.id, add:
-- ALTER TABLE projects ADD CONSTRAINT fk_projects_organization FOREIGN KEY ("organizationId") REFERENCES organizations(id);
-- after confirming intended relations.

COMMIT;