// Prisma TypeScript seed script (idempotent)
// Run after: `pnpm install` and `pnpm prisma generate`
// Run with ts-node: `pnpm -w ts-node prisma/seed.ts`
// If you don't have a workspace-wide ts-node setup, use the JS fallback: `node prisma/seed.js`

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Upsert a single Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'example-org' },
    update: {},
    create: {
      name: 'Example Organization',
      slug: 'example-org',
      description: 'A placeholder organization created by prisma/seed.ts',
    },
  });

  // Upsert a single User (no real secrets)
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