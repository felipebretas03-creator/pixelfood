import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.restaurant.findUnique({ where: { email: 'admin@admin.com' } });
  if (!admin) {
    console.log("Admin not found.");
    return;
  }

  const now = new Date();
  
  // Criar restaurantes fictícios para o dashboard Master
  await prisma.restaurant.createMany({
    data: [
      {
        slug: 'pizzaria-nova',
        name: 'Pizzaria Nova',
        email: 'pizza@nova.com',
        active: true,
        planName: 'PRO',
        subscriptionStatus: 'TRIAL',
        subscriptionExpiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // Vence em 14 dias
      },
      {
        slug: 'burger-velho',
        name: 'Burger Velho',
        email: 'burger@velho.com',
        active: false,
        planName: 'BÁSICO',
        subscriptionStatus: 'PAST_DUE',
        subscriptionExpiresAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Venceu há 10 dias
      },
      {
        slug: 'sushi-top',
        name: 'Sushi Top',
        email: 'sushi@top.com',
        active: true,
        planName: 'PRO',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Vence em 5 dias (Prestes a vencer)
      },
      {
        slug: 'acai-gelado',
        name: 'Açaí Gelado',
        email: 'acai@gelado.com',
        active: true,
        planName: 'PRO',
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Vence em 30 dias (Renovado recentemente)
      }
    ],
    skipDuplicates: true
  });
  console.log("Seed de assinaturas gerado com sucesso.");
}

main().finally(() => prisma.$disconnect());
