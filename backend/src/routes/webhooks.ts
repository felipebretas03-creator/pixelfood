import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Rota POST /api/webhooks/asaas
router.post('/asaas', async (req, res) => {
  try {
    const { event, payment } = req.body;
    
    // O Asaas envia o webhook de forma assíncrona.
    // Retornamos 200 rapidamente para o Asaas saber que recebemos.
    res.status(200).send({ received: true });

    if (!payment || !payment.subscription) {
      return; // Ignora eventos soltos que não pertencem a uma assinatura SaaS nossa.
    }

    const subscriptionId = payment.subscription;
    
    // Buscar a assinatura no nosso banco
    const subscription = await prisma.subscription.findUnique({
      where: { providerSubscriptionId: subscriptionId }
    });

    if (!subscription) {
      console.log(`[WEBHOOK ASAAS] Assinatura ${subscriptionId} não encontrada no banco.`);
      return;
    }

    const tenantId = subscription.tenantId;

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      // Fatura Paga! Liberar sistema
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' }
        });
        
        await tx.tenant.update({
          where: { id: tenantId },
          data: { subscriptionStatus: 'ACTIVE' }
        });
      });
      console.log(`[WEBHOOK ASAAS] Pagamento recebido. Tenant ${tenantId} ATIVO.`);
    } 
    else if (event === 'PAYMENT_OVERDUE') {
      // Fatura Atrasada! Bloquear / Avisar sistema
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { status: 'PAST_DUE' }
        });
        
        await tx.tenant.update({
          where: { id: tenantId },
          data: { subscriptionStatus: 'PAST_DUE' }
        });
      });
      console.log(`[WEBHOOK ASAAS] Pagamento atrasado. Tenant ${tenantId} PAST_DUE.`);
    }
    else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
      // Cancelamento ou estorno
      await prisma.$transaction(async (tx) => {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { status: 'CANCELED', canceledAt: new Date() }
        });
        
        await tx.tenant.update({
          where: { id: tenantId },
          data: { subscriptionStatus: 'CANCELED' }
        });
      });
      console.log(`[WEBHOOK ASAAS] Pagamento cancelado/estornado. Tenant ${tenantId} CANCELED.`);
    }

  } catch (error) {
    console.error('[WEBHOOK ASAAS ERROR]:', error);
    // Não enviamos res.status(500) pois já retornamos 200 pro Asaas logo no topo.
  }
});

export default router;
