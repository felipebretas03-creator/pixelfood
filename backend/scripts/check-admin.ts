import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.restaurant.findUnique({ where: { email: 'admin@admin.com' } });
  console.log(admin);
}

main().finally(() => prisma.$disconnect());
