// Prisma JS seed fallback (idempotent)
// Usage:
// 1) Ensure dependencies installed: `pnpm install`
// 2) Generate Prisma client if not present: `pnpm prisma generate`
// 3) Run: `node prisma/seed.js`
//
// Notes:
// - This is a JS fallback in case TypeScript execution is not configured.
// - Prefer `prisma/seed.ts` if you use ts-node or a TypeScript-aware runner.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'example-org' },
    update: {},
    create: {
      name: 'Example Organization',
      slug: 'example-org',
      description: 'A placeholder organization created by prisma/seed.js',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      name: 'Example User',
    },
    create: {
      email: 'user@example.com',
      name: 'Example User',
    },
  });

  console.log('Seed completed:', { orgId: org.id, userId: user.id });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });