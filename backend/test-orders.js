const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.dir(orders, { depth: null });
}
main().finally(() => prisma.$disconnect());
