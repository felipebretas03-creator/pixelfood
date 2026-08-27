import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = '16c6598b-e7f5-4b9e-a3ef-0089466bbc38';
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  console.log('Slug for the logged in tenant:', tenant?.slug);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
