const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Iniciando limpeza do banco de dados...');
  try {
    await prisma.$transaction([
      prisma.setupToken.deleteMany(),
      prisma.membership.deleteMany(),
      
      prisma.orderItemOption.deleteMany(),
      prisma.orderItem.deleteMany(),
      prisma.orderPayment.deleteMany(),
      prisma.orderStatusHistory.deleteMany(),
      prisma.order.deleteMany(),
      
      prisma.option.deleteMany(),
      prisma.optionGroup.deleteMany(),
      prisma.product.deleteMany(),
      prisma.category.deleteMany(),
      
      prisma.customerAddress.deleteMany(),
      prisma.customer.deleteMany(),
      
      prisma.payment.deleteMany(),
      prisma.subscription.deleteMany(),
      
      prisma.coupon.deleteMany(),
      prisma.neighborhoodFee.deleteMany(),
      prisma.tenantPaymentIntegration.deleteMany(),
      prisma.settings.deleteMany(),
      prisma.loyaltySettings.deleteMany(),
      
      prisma.tenant.deleteMany(),
      
      prisma.user.deleteMany({
        where: {
          email: {
            notIn: ['felipebretas03@gmail.com', 'admin@admin.com']
          }
        }
      }),
      
      prisma.auditLog.deleteMany(),
      prisma.signupIntent.deleteMany(),
      prisma.webhookEvent.deleteMany(),
      prisma.emailOutbox.deleteMany(),
    ]);
    console.log('Limpeza concluída com sucesso! Apenas os usuários Master foram mantidos.');
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
