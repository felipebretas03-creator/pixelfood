import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { sendWelcomeEmail } from '../services/emailService';

const prisma = new PrismaClient();
const router = Router();
const asaasApi = axios.create({
  baseURL: process.env.ASAAS_API_URL || 'https://api.asaas.com/v3',
  headers: {
    'access_token': process.env.ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// 1. Criar Intenção de Assinatura (A partir da Landing Page)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, restaurantName, planId } = req.body;

    if (!name || !email || !restaurantName) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, email, restaurantName' });
    }

    // Procura o plano
    let plan = null;
    if (planId) {
      plan = await prisma.plan.findUnique({ where: { id: planId } });
    } else {
      plan = await prisma.plan.findFirst(); // Default to first plan if none provided
    }

    if (!plan) {
      return res.status(400).json({ error: 'Plano não encontrado' });
    }

    // 1. Cria Asaas Customer
    const customerRes = await asaasApi.post('/customers', {
      name,
      email,
      phone: phone || '',
    });
    const asaasCustomerId = customerRes.data.id;

    // 2. Cria Intent no nosso BD para rastrear quando o webhook bater
    const signupIntent = await prisma.signupIntent.create({
      data: {
        name,
        email,
        phone,
        restaurantName,
        planId: plan.id,
      }
    });

    // 3. Cria Payment/Subscription no Asaas
    const today = new Date();
    today.setDate(today.getDate() + 1); // Vence amanhã
    
    // Aqui usamos uma cobrança avulsa ou assinatura. 
    // Vamos criar uma assinatura (Subscription) para garantir a cobrança recorrente.
    const subRes = await asaasApi.post('/subscriptions', {
      customer: asaasCustomerId,
      billingType: 'UNDEFINED', // Let customer choose (PIX, BOLETO, CREDIT_CARD)
      value: plan.priceCents / 100,
      nextDueDate: today.toISOString().split('T')[0],
      description: `Assinatura SaaS Pixeleats - ${plan.name}`,
      cycle: plan.billingCycle,
      externalReference: signupIntent.id // Muito importante para vincular no webhook!
    });

    // Atualiza intent com o link de pagamento da assinatura (Asaas não retorna link na /subscriptions diretamente se usar UNDEFINED,
    // mas gera uma cobrança filha imediata, ou podemos criar uma Payment Link avulso primeiro.
    // Para simplificar, vamos criar um Payment Link ou gerar uma fatura (charge) direta.
    
    // Asaas cria uma cobrança inicial para a assinatura, vamos buscar ela para pegar o link de pagamento
    const chargeRes = await asaasApi.get(`/payments?subscription=${subRes.data.id}`);
    const invoiceUrl = chargeRes.data.data[0]?.invoiceUrl || subRes.data.invoiceUrl;

    await prisma.signupIntent.update({
      where: { id: signupIntent.id },
      data: { asaasCheckoutId: subRes.data.id }
    });

    res.json({
      success: true,
      checkoutUrl: invoiceUrl
    });

  } catch (error: any) {
    console.error('Asaas Signup Error:', error.response?.data || error);
    res.status(500).json({ error: 'Erro ao gerar assinatura no Asaas' });
  }
});

// 2. Webhook Idempotente
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body.event;
    const payment = req.body.payment;

    if (!payment || !payment.id) {
      return res.status(200).send('Ignorado');
    }

    const eventId = req.body.id || `evt_${payment.id}_${event}_${Date.now()}`;

    // Motor Idempotente: Verifica se já processou
    const existingEvent = await prisma.webhookEvent.findFirst({ where: { providerEventId: eventId } });
    if (existingEvent) {
      return res.status(200).send('Já processado');
    }

    // Registra evento
    await prisma.webhookEvent.create({
      data: {
        providerEventId: eventId,
        provider: 'ASAAS',
        eventType: event,
        payload: JSON.stringify(req.body),
        status: 'PROCESSING'
      }
    });
    
    // Pegar o ID gerado (já que providerEventId não é chave primária)
    const dbEvent = await prisma.webhookEvent.findFirst({ where: { providerEventId: eventId } });
    const internalEventId = dbEvent!.id;


    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      const externalRef = payment.externalReference;
      
      if (externalRef) {
        // Fluxo de Signup (Novo Cliente)
        const intent = await prisma.signupIntent.findUnique({ where: { id: externalRef } });
        if (intent && intent.status !== 'PROVISIONED') {
          
          // 1. Criar Tenant
          const tenantSlug = intent.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          
          let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
          if (!tenant) {
            tenant = await prisma.tenant.create({
              data: {
                name: intent.restaurantName,
                slug: tenantSlug,
                email: intent.email,
                active: true
              }
            });
          }

          // 2. Criar User (se não existir)
          let user = await prisma.user.findUnique({ where: { email: intent.email } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                name: intent.name,
                email: intent.email,
              }
            });
          }

          // 3. Criar Membership (Owner)
          const membership = await prisma.membership.findFirst({
            where: { userId: user.id, tenantId: tenant.id }
          });
          if (!membership) {
            await prisma.membership.create({
              data: {
                userId: user.id,
                tenantId: tenant.id,
                role: 'owner'
              }
            });
          }

          // 4. Criar Subscription
          if (intent.planId) {
             await prisma.subscription.create({
               data: {
                 tenantId: tenant.id,
                 planId: intent.planId,
                 provider: 'ASAAS',
                 providerCustomerId: payment.customer,
                 providerSubscriptionId: payment.subscription,
                 status: 'ACTIVE',
                 currentPeriodStart: new Date(),
                 currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
               }
             });
          }

          // 5. Atualizar Intent
          await prisma.signupIntent.update({
            where: { id: intent.id },
            data: { status: 'PROVISIONED' }
          });

          // 6. Criar Magic Link e enviar e-mail
          const rawToken = require('crypto').randomBytes(32).toString('hex');
          const setupToken = await prisma.setupToken.create({
            data: {
              userId: user.id,
              tokenHash: rawToken,
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 horas
            }
          });

          const setupUrl = `${process.env.PUBLIC_DASHBOARD_URL || 'http://localhost:3000'}/completar-cadastro?token=${rawToken}`;
          
          await sendWelcomeEmail(user.email, user.name, setupUrl);

          await prisma.webhookEvent.update({
            where: { id: internalEventId },
            data: { status: 'PROCESSED' }
          });

          return res.status(200).send('Provisioned Successfully');
        }
      }

      // Se não é Signup, é uma renovação de assinatura existente.
      if (payment.subscription) {
        const sub = await prisma.subscription.findUnique({ where: { providerSubscriptionId: payment.subscription } });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1))
            }
          });
        }
      }
    } else if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
      if (payment.subscription) {
        const sub = await prisma.subscription.findUnique({ where: { providerSubscriptionId: payment.subscription } });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'PAST_DUE'
            }
          });
        }
      }
    }

    await prisma.webhookEvent.update({
      where: { id: internalEventId },
      data: { status: 'PROCESSED' }
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    if (req.body.id) {
       await prisma.webhookEvent.update({
         where: { id: req.body.id },
         data: { status: 'FAILED' }
       }).catch(() => {});
    }
    res.status(500).send('Error');
  }
});

// 3. Completar Cadastro (Definir Senha)
router.post('/complete-signup', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Faltando token ou senha' });

    const setupToken = await prisma.setupToken.findFirst({
      where: { tokenHash: token },
      include: { user: true }
    });

    if (!setupToken || setupToken.usedAt || setupToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: setupToken.userId },
      data: { passwordHash: hash }
    });

    await prisma.setupToken.update({
      where: { id: setupToken.id },
      data: { usedAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao completar cadastro' });
  }
});

export default router;
