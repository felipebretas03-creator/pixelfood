import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const restaurants = await prisma.restaurant.findMany();
  console.log(JSON.stringify(restaurants, null, 2));
}
main().finally(() => prisma.$disconnect());
