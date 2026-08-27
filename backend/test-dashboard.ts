import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = '16c6598b-e7f5-4b9e-a3ef-0089466bbc38';
  
  const orders = await prisma.order.findMany({
    where: { tenantId: tenantId, status: { not: 'CANCELLED' } },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Total orders non-cancelled:', orders.length);
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const ordersToday = await prisma.order.findMany({
    where: { 
        tenantId: tenantId, 
        status: { not: 'CANCELLED' },
        createdAt: { gte: startOfDay }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Total orders today:', ordersToday.length);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
