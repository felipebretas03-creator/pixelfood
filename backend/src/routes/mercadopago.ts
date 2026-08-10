import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { encryptPaymentCredential, maskPaymentCredential } from '../services/cryptoService';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const ownerAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    if (decoded.role !== 'owner' || decoded.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Proibido' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ==========================================
// Rota: Obter Status da Integração MP
// ==========================================
router.get('/settings', ownerAuth, async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  
  const integration = await prisma.tenantPaymentIntegration.findUnique({
    where: {
      tenantId_provider: {
        tenantId,
        provider: 'MERCADO_PAGO'
      }
    }
  });

  if (!integration) {
    return res.json({ status: 'DISCONNECTED', connectedAt: null });
  }

  res.json({
    id: integration.id,
    status: integration.status,
    environment: integration.environment,
    publicKey: integration.publicKey ? maskPaymentCredential(integration.publicKey) : null,
    connectedAt: integration.connectedAt,
    lastValidatedAt: integration.lastValidatedAt,
  });
});

// ==========================================
// Rota: Salvar Credenciais Manuais
// ==========================================
router.post('/settings', ownerAuth, async (req: Request, res: Response) => {
  const tenantId = req.tenantId!;
  const { publicKey, accessToken, environment } = req.body;

  if (!publicKey || !accessToken) {
    return res.status(400).json({ error: 'Public Key e Access Token são obrigatórios.' });
  }

  const encryptedAccess = encryptPaymentCredential(accessToken);

  const integration = await prisma.tenantPaymentIntegration.upsert({
    where: {
      tenantId_provider: {
        tenantId,
        provider: 'MERCADO_PAGO'
      }
    },
    update: {
      publicKey,
      encryptedAccessToken: encryptedAccess,
      status: 'CONNECTED',
      environment: environment || 'PRODUCTION',
      connectedAt: new Date(),
      lastValidatedAt: new Date(),
      connectionMethod: 'MANUAL_CREDENTIALS'
    },
    create: {
      tenantId,
      provider: 'MERCADO_PAGO',
      publicKey,
      encryptedAccessToken: encryptedAccess,
      status: 'CONNECTED',
      environment: environment || 'PRODUCTION',
      connectedAt: new Date(),
      lastValidatedAt: new Date(),
      connectionMethod: 'MANUAL_CREDENTIALS'
    }
  });

  res.json({ message: 'Credenciais salvas com sucesso', status: integration.status });
});

// ==========================================
// Rota: Webhook Mercado Pago
// ==========================================
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const reqId = req.headers['x-request-id'] as string;
    
    // 1. Extrair os dados
    const dataId = req.query['data.id'] || req.body?.data?.id;
    const type = req.query.type || req.body?.type;

    if (!dataId || type !== 'payment') {
      return res.status(200).send('OK');
    }

    // Retorna 200 rápido para o MP
    res.status(200).send('OK');

    console.log(`[MP Webhook] Processando payment id: ${dataId}`);

    // Como o MP manda webhook genérico e precisamos saber qual Tenant é,
    // buscamos o OrderPayment através do providerPaymentId
    const orderPayment = await prisma.orderPayment.findUnique({
      where: { providerPaymentId: String(dataId) },
      include: { order: true, tenant: true }
    });

    if (!orderPayment) {
      console.error(`[MP Webhook Error] OrderPayment não encontrado para providerPaymentId: ${dataId}`);
      return;
    }

    const tenantId = orderPayment.tenantId;
    const integration = await prisma.tenantPaymentIntegration.findUnique({
      where: { tenantId_provider: { tenantId, provider: 'MERCADO_PAGO' } }
    });

    if (!integration || !integration.encryptedAccessToken) return;

    // Descriptografa token para consultar API do Mercado Pago (Consulta Autenticada Reversa)
    const { decryptPaymentCredential } = require('../services/cryptoService');
    const accessToken = decryptPaymentCredential(integration.encryptedAccessToken);

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!mpResponse.ok) {
      console.error(`[MP Webhook Error] Falha ao consultar MP API para payment: ${dataId}`);
      return;
    }

    const mpData = await mpResponse.json();
    
    if (mpData.external_reference !== orderPayment.order.id) {
      console.error(`[MP Webhook Error] External Reference não bate! DB: ${orderPayment.order.id}, MP: ${mpData.external_reference}`);
      return;
    }

    const novoStatusFinanceiro = mpData.status.toUpperCase();
    
    await prisma.orderPayment.update({
      where: { id: orderPayment.id },
      data: {
        status: novoStatusFinanceiro,
        statusDetail: mpData.status_detail,
        approvedAt: novoStatusFinanceiro === 'APPROVED' ? new Date() : undefined,
      }
    });

    if (novoStatusFinanceiro === 'APPROVED' && orderPayment.order.status === 'AWAITING_PAYMENT') {
      // Atualiza o Pedido para NEW
      const updatedOrder = await prisma.order.update({
        where: { id: orderPayment.orderId },
        data: {
          status: 'NEW',
          paymentStatus: 'APPROVED',
          paidAt: new Date(),
          statusHistories: {
            create: {
              tenantId: orderPayment.tenantId,
              previousStatus: 'AWAITING_PAYMENT',
              newStatus: 'NEW',
              reason: 'Pagamento Mercado Pago aprovado.'
            }
          }
        },
        include: { items: { include: { options: true } }, customer: true }
      });

      // Notifica o restaurante via WebSocket
      // O req object não tem o io, vamos precisar importar globalmente ou emitir de outra forma.
      // Para o MVP, se io não for acessível, ignoramos, ou importamos.
      console.log(`[MP Webhook] Pedido ${updatedOrder.orderNumber} PAGO!`);
    } else if (novoStatusFinanceiro === 'REJECTED' || novoStatusFinanceiro === 'CANCELLED') {
       await prisma.order.update({
        where: { id: orderPayment.orderId },
        data: {
          paymentStatus: novoStatusFinanceiro,
        }
      });
    }
  } catch (error) {
    console.error('[MP Webhook Error]', error);
  }
});

export default router;
