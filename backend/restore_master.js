const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const email = 'felipebretas03@gmail.com';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('Usuário Master não encontrado no banco!');
      return;
    }

    // Cria a loja/tenant Master
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Master',
        slug: 'master',
        email: email,
        operationalStatus: 'CLOSED',
        subscriptionStatus: 'ACTIVE',
        settings: {
          create: {
            storeName: 'Master'
          }
        }
      }
    });

    // Cria a relação (Membership)
    await prisma.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'OWNER'
      }
    });

    console.log('Acesso Master (Tenant e Membership) restaurados com sucesso!');
  } catch(e) {
    console.error('Erro ao restaurar master:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
