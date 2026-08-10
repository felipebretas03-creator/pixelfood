import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const emailsToDelete = ['pizza@nova.com', 'sushi@top.com', 'acai@gelado.com', 'burger@velho.com'];
  const result = await prisma.restaurant.deleteMany({
    where: {
      email: {
        in: emailsToDelete
      }
    }
  });
  console.log(`Deletados ${result.count} restaurantes falsos.`);
}
main().finally(() => prisma.$disconnect());
