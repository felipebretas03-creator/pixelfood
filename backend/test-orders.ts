import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = '16c6598b-e7f5-4b9e-a3ef-0089466bbc38';
  
  const orders = await prisma.order.findMany({
    where: { tenantId: tenantId }
  });
  
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as any);
  
  console.log('Total orders:', orders.length);
  console.log('Status counts:', statusCounts);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
