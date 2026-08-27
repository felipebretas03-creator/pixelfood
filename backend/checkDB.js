const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const settings = await prisma.settings.findMany();
  console.log(JSON.stringify(settings, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
