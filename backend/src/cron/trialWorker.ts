import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Período de trial em dias
const TRIAL_DIAS = 7;

/**
 * Verifica tenants em período de trial que já expiraram sem pagar.
 * Muda subscriptionStatus de TRIALING → PAST_DUE.
 * Roda uma vez por hora.
 */
export const startTrialWorker = () => {
  console.log('[TrialWorker] Iniciando Worker de Expiração de Trial...');

  const verificar = async () => {
    try {
      const limiteData = new Date();
      limiteData.setDate(limiteData.getDate() - TRIAL_DIAS);

      // Busca tenants ainda em TRIALING com mais de 7 dias de cadastro
      // que NÃO possuem assinatura ACTIVE ou LIFETIME
      const tenantsExpirados = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: 'TRIALING',
          createdAt: { lte: limiteData },
          deletedAt: null,
        },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
        },
      });

      let totalAlterados = 0;

      for (const tenant of tenantsExpirados) {
        // Pula se tiver lifetime válido
        if (tenant.lifetimeExpiresAt && new Date(tenant.lifetimeExpiresAt) > new Date()) {
          continue;
        }

        // Pula se já tem assinatura ativa
        if (tenant.subscriptions.length > 0) {
          continue;
        }

        // Muda para PAST_DUE (devedor)
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { subscriptionStatus: 'PAST_DUE' },
        });

        console.log(
          `[TrialWorker] Trial expirado → PAST_DUE: ${tenant.name} (${tenant.slug}) | Criado em: ${tenant.createdAt.toISOString()}`
        );

        totalAlterados++;
      }

      if (totalAlterados > 0) {
        console.log(`[TrialWorker] ${totalAlterados} tenant(s) movidos para PAST_DUE.`);
      }
    } catch (err) {
      console.error('[TrialWorker] Erro ao verificar trials expirados:', err);
    }
  };

  // Executa imediatamente ao iniciar
  verificar();

  // Roda a cada 1 hora (3.600.000 ms)
  setInterval(verificar, 60 * 60 * 1000);
};
