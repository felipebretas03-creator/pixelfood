import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logAudit } from '../services/auditService';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

const asaasApi = axios.create({
  baseURL: process.env.ASAAS_API_URL || 'https://api.asaas.com/v3',
  headers: {
    'access_token': process.env.ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Middleware de Autenticação Master
const masterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if ((decoded.role !== 'owner' && decoded.role !== 'OWNER') || !decoded.isMaster) {
      return res.status(403).json({ error: 'Proibido' });
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

router.use(masterMiddleware);

// 1. DASHBOARD
router.get('/dashboard', async (req, res) => {
  try {
    const totalTenants = await prisma.tenant.count();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newTenants = await prisma.tenant.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
    const inTrial = await prisma.tenant.count({ where: { subscriptionStatus: 'TRIALING' } });
    const active = await prisma.tenant.count({ where: { subscriptionStatus: 'ACTIVE' } });
    const pastDue = await prisma.tenant.count({ where: { subscriptionStatus: 'PAST_DUE' } });
    
    // MRR (Mensalidade Recorrente Mensal)
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true }
    });
    const mrr = subscriptions.reduce((acc, sub) => acc + (sub.plan?.priceCents || 0), 0) / 100;

    res.json({
      totalTenants,
      newTenants,
      inTrial,
      active,
      pastDue,
      mrr
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dashboard master' });
  }
});

// 2. LISTAR LOJAS (COM FILTROS E PAGINAÇÃO)
router.get('/tenants', async (req, res) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (status && status !== 'ALL') {
      where.subscriptionStatus = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { cpfCnpj: { contains: String(search) } }
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    const total = await prisma.tenant.count({ where });

    res.json({
      data: tenants,
      meta: { total, page: Number(page), limit: Number(limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar lojas' });
  }
});

// 3. DETALHES DA LOJA
router.get('/tenants/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        memberships: { include: { user: true } },
        subscriptions: { include: { plan: true, payments: true } },
        settings: true
      }
    });
    if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes da loja' });
  }
});

// 4. SUSPENDER LOJA
router.post('/tenants/:id/suspend', async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { subscriptionStatus: 'SUSPENDED', operationalStatus: 'CLOSED' }
    });
    const user = (req as any).user;
    await logAudit('STORE_SUSPENDED', user.id, tenant.id, { reason: req.body.reason });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao suspender loja' });
  }
});

// 4.5 CANCELAR ASSINATURA LOJA
router.post('/tenants/:id/cancel', async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { subscriptionStatus: 'CANCELED' }
    });
    const user = (req as any).user;
    await logAudit('STORE_CANCELED', user.id, tenant.id, { reason: req.body.reason });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar loja' });
  }
});

// 5. REATIVAR LOJA
router.post('/tenants/:id/reactivate', async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { subscriptionStatus: 'ACTIVE' }
    });
    const user = (req as any).user;
    await logAudit('STORE_REACTIVATED', user.id, tenant.id, { reason: req.body.reason });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao reativar loja' });
  }
});

// 6. IMPERSONAR LOJA
router.post('/tenants/:id/impersonate', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });

    const user = (req as any).user;
    
    // Create impersonation token
    const impersonateToken = jwt.sign(
      { id: user.id, role: 'OWNER', tenantId: tenant.id, isMaster: true, impersonated: true }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '1h' }
    );

    await logAudit('IMPERSONATION_STARTED', user.id, tenant.id, { ip: req.ip });

    res.json({ token: impersonateToken, tenant });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao impersonar loja' });
  }
});

// 7. AUDITORIA
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    const userIds = [...new Set(logs.map(l => l.actorUserId).filter(Boolean))] as string[];
    const tenantIds = [...new Set(logs.map(l => l.tenantId).filter(Boolean))] as string[];
    
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
    const tenants = await prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, name: true } });
    
    const enrichedLogs = logs.map(log => ({
      ...log,
      actorUser: users.find(u => u.id === log.actorUserId) || null,
      tenant: tenants.find(t => t.id === log.tenantId) || null,
    }));
    
    res.json(enrichedLogs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar auditoria' });
  }
});

// 8. CADASTRAR LOJA
router.post('/tenants', async (req, res) => {
  try {
    const { name, email, phone, document, planId } = req.body;
    
    // Create base tenant
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        email,
        phone,
        cpfCnpj: document,
        operationalStatus: 'CLOSED',
        subscriptionStatus: 'TRIALING'
      }
    });

    // Create user and membership
    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        normalizedEmail: email.toUpperCase(),
        passwordHash: '$2b$10$XXXXXXXXXXXXXXXXXXXXX', // Placeholder
      }
    });

    await prisma.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'OWNER'
      }
    });

    // Integrate with Asaas
    try {
      const customerRes = await asaasApi.post('/customers', {
        name,
        email,
        phone,
        cpfCnpj: document
      });

      const customerId = customerRes.data.id;
      
      const plan = await prisma.plan.findUnique({ where: { id: planId }});
      if (plan) {
        const subRes = await asaasApi.post('/subscriptions', {
          customer: customerId,
          billingType: 'CREDIT_CARD',
          value: plan.priceCents / 100,
          nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: `Assinatura PixelFood - ${plan.name}`
        });

        await prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: plan.id,
            providerCustomerId: customerId,
            providerSubscriptionId: subRes.data.id,
            status: 'ACTIVE'
          }
        });
      }
    } catch (asaasErr: any) {
      console.error('Asaas Error:', asaasErr.response?.data || asaasErr.message);
      // We don't fail the creation but log the issue. Or we could rollback.
    }

    const admin = (req as any).user;
    await logAudit('STORE_CREATED', admin.id, tenant.id, { planId });

    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar loja' });
  }
});

// 9. ALTERAR PLANO
router.post('/tenants/:id/change-plan', async (req, res) => {
  try {
    const { planId } = req.body;
    const tenantId = req.params.id;
    
    // In a real scenario, this would call Asaas to update the subscription.
    const sub = await prisma.subscription.findFirst({ where: { tenantId } });
    if (sub) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { planId }
      });
    }

    const admin = (req as any).user;
    await logAudit('PLAN_CHANGED', admin.id, tenantId, { newPlanId: planId });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar plano' });
  }
});

// 10. ENVIAR COMUNICADOS
router.post('/communications', async (req, res) => {
  try {
    const { title, message, targetAudience } = req.body;
    
    // We would select tenants based on targetAudience, e.g. ACTIVE
    const tenants = await prisma.tenant.findMany({
      where: targetAudience !== 'ALL' ? { subscriptionStatus: targetAudience } : {}
    });

    for (const t of tenants) {
      await prisma.emailOutbox.create({
        data: {
          to: t.email,
          subject: title,
          htmlBody: message
        }
      });
    }

    const comm = await prisma.communication.create({
      data: {
        title,
        message,
        targetAudience,
        recipientCount: tenants.length
      }
    });

    const admin = (req as any).user;
    await logAudit('COMMUNICATION_SENT', admin.id, undefined, { communicationId: comm.id });

    res.json(comm);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar comunicados' });
  }
});

// 9. TORNAR VITALÍCIO OU ACESSO LIBERADO POR DIAS
router.post('/tenants/:id/lifetime', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { days } = req.body || {};
    
    let lifetimeExpiresAt: Date | null = null;
    if (days && !isNaN(parseInt(days))) {
      lifetimeExpiresAt = new Date();
      lifetimeExpiresAt.setDate(lifetimeExpiresAt.getDate() + parseInt(days));
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        subscriptionStatus: 'LIFETIME',
        lifetimeExpiresAt
      }
    });
    
    const user = (req as any).user;
    await logAudit('PLAN_CHANGED', user.id, tenantId, { 
      newPlan: 'LIFETIME', 
      days: days || 'infinity',
      expiresAt: lifetimeExpiresAt 
    });
    
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao liberar acesso da loja' });
  }
});

export default router;
