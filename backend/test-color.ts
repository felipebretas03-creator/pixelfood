import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = '16c6598b-e7f5-4b9e-a3ef-0089466bbc38';
  const settings = await prisma.settings.findUnique({ where: { tenantId } });
  console.log('Primary color:', settings?.primaryColor);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
