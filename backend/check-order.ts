import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const order = await prisma.order.findUnique({ where: { id: "ec7362a1-3652-4761-bb0a-3387c3ec7c20" } });
  console.log(order);
}
main();
