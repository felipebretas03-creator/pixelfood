import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logAudit } from '../services/auditService';
import { asaasService } from '../services/asaasService';
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

// 3.5 ATIVIDADE DA LOJA
router.get('/tenants/:id/activity', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const orders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true }
    });
    
    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    res.json({ orders, logs });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar atividade da loja' });
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

// 10. REVOGAR VITALÍCIO
router.post('/tenants/:id/revoke-lifetime', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        subscriptionStatus: 'ACTIVE',
        lifetimeExpiresAt: null
      }
    });
    
    const user = (req as any).user;
    await logAudit('PLAN_CHANGED', user.id, tenantId, { 
      newPlan: 'ACTIVE',
      reason: 'Lifetime access revoked by master'
    });
    
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao revogar acesso vitalício' });
  }
});

// 11. LISTAR PLANOS
router.get('/plans', async (req, res) => {
  try {
    const { all } = req.query;
    const where = all === 'true' ? {} : { isActive: true };
    const plans = await prisma.plan.findMany({ where, orderBy: { priceCents: 'asc' } });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar planos' });
  }
});

// CRIAR PLANO
router.post('/plans', async (req, res) => {
  try {
    const { name, code, priceCents, billingCycle, features, isActive } = req.body;
    
    // Check if code exists
    const existing = await prisma.plan.findUnique({ where: { code } });
    if (existing) return res.status(400).json({ error: 'Código de plano já existe' });

    const plan = await prisma.plan.create({
      data: {
        name,
        code,
        priceCents,
        billingCycle: billingCycle || 'MONTHLY',
        features,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'PLAN_CREATED',
        actorUserId: (req as any).user?.id,
        metadata: JSON.stringify({ planCode: code, name })
      }
    });

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar plano' });
  }
});

// ATUALIZAR PLANO
router.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, priceCents, billingCycle, features, isActive } = req.body;

    if (code) {
      const existing = await prisma.plan.findFirst({ where: { code, id: { not: id } } });
      if (existing) return res.status(400).json({ error: 'Código de plano já existe' });
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(priceCents !== undefined && { priceCents }),
        ...(billingCycle && { billingCycle }),
        ...(features !== undefined && { features }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'PLAN_UPDATED',
        actorUserId: (req as any).user?.id,
        metadata: JSON.stringify({ planCode: plan.code, name: plan.name })
      }
    });

    res.json(plan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

// DELETAR PLANO
router.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const count = await prisma.subscription.count({ where: { planId: id } });
    if (count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir o plano pois existem assinaturas vinculadas a ele.' });
    }

    const plan = await prisma.plan.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'PLAN_DELETED',
        actorUserId: (req as any).user?.id,
        metadata: JSON.stringify({ planCode: plan.code, name: plan.name })
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir plano' });
  }
});

// 12. CRIAR ASSINATURA NO ASAAS
router.post('/tenants/:id/manual-subscription', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'O ID do plano é obrigatório.' });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado.' });

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

    // Verificar se tem customer no Asaas, se não, cria.
    let customerId = '';
    const existingSub = await prisma.subscription.findFirst({ where: { tenantId } });
    
    if (existingSub && existingSub.providerCustomerId && !existingSub.providerCustomerId.startsWith('cus_simulated')) {
      customerId = existingSub.providerCustomerId;
    } else {
      if (!tenant.cpfCnpj || tenant.cpfCnpj.trim() === '') {
        return res.status(400).json({ error: 'Para criar uma fatura no Asaas, a loja precisa ter um CPF ou CNPJ cadastrado.' });
      }

      const asaasCustomer = await asaasService.createCustomer({
        name: tenant.name,
        email: tenant.email,
        cpfCnpj: tenant.cpfCnpj,
        phone: tenant.phone || undefined
      });
      customerId = asaasCustomer.id;
    }

    // Criar assinatura no Asaas
    const asaasSub = await asaasService.createSubscription(customerId, {
      value: plan.priceCents / 100, // asaas uses reais (float)
      cycle: plan.billingCycle,
      description: `Assinatura ${plan.name} - PixelFood`
    });

    // Remover assinaturas anteriores no nosso banco
    if (existingSub) {
      await prisma.subscription.deleteMany({ where: { tenantId } });
      if (existingSub.providerSubscriptionId && !existingSub.providerSubscriptionId.startsWith('sub_simulated')) {
        await asaasService.cancelSubscription(existingSub.providerSubscriptionId).catch(console.error);
      }
    }

    // Criar nova assinatura no banco apontando para o Asaas
    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        planId,
        provider: 'ASAAS',
        providerCustomerId: customerId,
        providerSubscriptionId: asaasSub.id,
        status: 'PENDING', // Ficará ativo quando o webhook receber o pagamento
      }
    });

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: 'PENDING', lifetimeExpiresAt: null }
    });

    const user = (req as any).user;
    await logAudit('PLAN_CHANGED', user.id, tenantId, { 
      newPlan: plan.name,
      planId,
      reason: 'Asaas subscription created by master'
    });
    
    res.json({ tenant: updatedTenant, subscription });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erro ao gerar assinatura' });
  }
});

// Excluir Loja (Hard Delete)
router.delete('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return res.status(404).json({ error: 'Loja não encontrada' });

    // Deleta o tenant (Prisma cascade delete irá remover assinaturas, membros, etc)
    await prisma.tenant.delete({
      where: { id }
    });

    // Registrar log
    await prisma.auditLog.create({
      data: {
        action: 'TENANT_DELETED',
        actorUserId: (req as any).user?.id,
        tenantId: id,
        metadata: JSON.stringify({ name: tenant.name })
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir loja:', error);
    res.status(500).json({ error: 'Erro interno ao excluir loja' });
  }
});

export default router;
