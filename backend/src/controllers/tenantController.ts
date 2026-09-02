
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { supabase } from '../config/supabase';

export const getSettings = async (req: Request, res: Response) => {
  let settings = await prisma.settings.findUnique({
    where: { tenantId: req.tenantId! }
  });
  if (!settings) {
    settings = await prisma.settings.create({ data: { tenantId: req.tenantId! } });
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenantId! },
    select: { subscriptionStatus: true, lifetimeExpiresAt: true }
  });
  const isBlocked = tenant?.subscriptionStatus === 'PAST_DUE' || tenant?.subscriptionStatus === 'SUSPENDED' || tenant?.subscriptionStatus === 'CANCELED';

  const { encryptPaymentCredential, maskPaymentCredential } = require('../services/cryptoService');
  const { checkStoreIsOpen } = require('../utils/storeStatus');

  const isCurrentlyOpen = checkStoreIsOpen(settings, isBlocked);

  const maskedSettings = {
    ...settings,
    isOpen: isBlocked ? false : settings.isOpen,
    isCurrentlyOpen,
    subscriptionStatus: tenant?.subscriptionStatus,
    lifetimeExpiresAt: tenant?.lifetimeExpiresAt,
    mpAccessToken: settings.mpAccessToken ? maskPaymentCredential(settings.mpAccessToken) : '',
    mpPublicKey: settings.mpPublicKey || '',
  };
  
  res.json(maskedSettings);
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { 
      storeName, primaryColor, deliveryType, deliveryFee, isOpen, 
      mpAccessToken, mpPublicKey, 
      acceptPix, acceptCreditCardOnline, acceptCardMachine, acceptCash,
      businessHours, manualOverrideStatus
    } = req.body;
    
    let settings = await prisma.settings.findUnique({
      where: { tenantId: req.tenantId! }
    });
    
    if (!settings) {
      settings = await prisma.settings.create({ data: { tenantId: req.tenantId! } });
    }

    let newBusinessHours = businessHours !== undefined ? businessHours : (settings.businessHours || {});
    if (typeof newBusinessHours === 'object' && newBusinessHours !== null) {
      if (manualOverrideStatus !== undefined) {
         newBusinessHours.manualOverride = {
           status: manualOverrideStatus ? 'OPEN' : 'CLOSED',
           timestamp: new Date().getTime()
         };
      }
      
      await prisma.settings.update({
        where: { tenantId: req.tenantId! },
        data: { businessHours: newBusinessHours }
      });
    }

    const updated = await prisma.settings.update({
      where: { tenantId: req.tenantId! },
      data: {
        storeName: storeName !== undefined ? storeName : settings.storeName,
        primaryColor: primaryColor !== undefined ? primaryColor : settings.primaryColor,
        deliveryType: deliveryType !== undefined ? deliveryType : settings.deliveryType,
        deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : settings.deliveryFee,
        isOpen: isOpen !== undefined ? isOpen : settings.isOpen,
        mpAccessToken: (mpAccessToken && !mpAccessToken.includes('••••')) ? mpAccessToken : settings.mpAccessToken,
        mpPublicKey: (mpPublicKey && !mpPublicKey.includes('••••')) ? mpPublicKey : settings.mpPublicKey,
        acceptPix: acceptPix !== undefined ? acceptPix : settings.acceptPix,
        acceptCreditCardOnline: acceptCreditCardOnline !== undefined ? acceptCreditCardOnline : settings.acceptCreditCardOnline,
        acceptCardMachine: acceptCardMachine !== undefined ? acceptCardMachine : settings.acceptCardMachine,
        acceptCash: acceptCash !== undefined ? acceptCash : settings.acceptCash,
      }
    });

    if (mpAccessToken && !mpAccessToken.includes('••••') && mpPublicKey && !mpAccessToken.includes('••••')) {
      const { encryptPaymentCredential } = require('../services/cryptoService');
      const encryptedAccess = encryptPaymentCredential(mpAccessToken);
      
      await prisma.tenantPaymentIntegration.upsert({
        where: { tenantId_provider: { tenantId: req.tenantId!, provider: 'MERCADO_PAGO' } },
        update: {
          publicKey: mpPublicKey,
          encryptedAccessToken: encryptedAccess,
          status: 'CONNECTED',
          connectionMethod: 'MANUAL_CREDENTIALS',
          connectedAt: new Date()
        },
        create: {
          tenantId: req.tenantId!,
          provider: 'MERCADO_PAGO',
          publicKey: mpPublicKey,
          encryptedAccessToken: encryptedAccess,
          status: 'CONNECTED',
          connectionMethod: 'MANUAL_CREDENTIALS',
          connectedAt: new Date()
        }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao atualizar configurações' });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const file = req.file;
    // Clean original name (remove spaces and special chars)
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${req.tenantId}_${Date.now()}_${cleanName}`;

    const { data, error } = await supabase
      .storage
      .from('uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    const logoUrl = publicUrlData.publicUrl;

    const updated = await prisma.settings.update({
      where: { tenantId: req.tenantId! },
      data: { logoUrl }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor durante upload' });
  }
};
// --- Settings Banner Upload ---
export const uploadBanner = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const file = req.file;
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${req.tenantId}_banner_${Date.now()}_${cleanName}`;

    const { data, error } = await supabase
      .storage
      .from('uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload do banner' });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    const bannerUrl = publicUrlData.publicUrl;

    const updated = await prisma.settings.update({
      where: { tenantId: req.tenantId! },
      data: { bannerUrl }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor durante upload' });
  }
};

// --- Neighborhood Fees ---
export const getNeighborhoods = async (req: Request, res: Response) => {
  try {
    const neighborhoods = await prisma.neighborhoodFee.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: [{ city: 'asc' }, { neighborhood: 'asc' }]
    });
    res.json(neighborhoods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar bairros' });
  }
};

export const createNeighborhood = async (req: Request, res: Response) => {
  try {
    const { city, neighborhood, fee } = req.body;
    const created = await prisma.neighborhoodFee.create({
      data: {
        tenantId: req.tenantId!,
        city,
        neighborhood,
        fee: parseFloat(fee)
      }
    });
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar bairro. Talvez já exista.' });
  }
};

export const deleteNeighborhood = async (req: Request, res: Response) => {
  try {
    const neighborhood = await prisma.neighborhoodFee.findUnique({ where: { id: req.params.id as string } });
    if (!neighborhood || neighborhood.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.neighborhoodFee.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao deletar bairro' });
  }
};

// --- Categories ---

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: req.tenantId!, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.totalCents, 0) / 100;
    const totalOrders = orders.length;
    
    const chartData = [
      { name: 'Seg', vendas: 0 },
      { name: 'Ter', vendas: 0 },
      { name: 'Qua', vendas: 0 },
      { name: 'Qui', vendas: 0 },
      { name: 'Sex', vendas: 0 },
      { name: 'Sáb', vendas: 0 },
      { name: 'Dom', vendas: 0 },
    ];
    
    orders.forEach(order => {
      const dayIndex = new Date(order.createdAt).getDay();
      const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      if(chartData[mappedIndex]) chartData[mappedIndex].vendas += (order.totalCents / 100);
    });

    res.json({
      totalRevenue,
      totalOrders,
      averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      chartData,
      recentOrders: orders.slice(0, 5).map(o => ({ ...o, total: o.totalCents / 100 }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

export const getDashboardFechamento = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        tenantId: req.tenantId!,
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.totalCents, 0) / 100;
    const totalOrders = orders.length;

    let pix = 0;
    let cash = 0;
    let card = 0;

    orders.forEach(order => {
      if (order.paymentMethod === 'PIX_APP' || order.paymentMethod === 'MERCADO_PAGO_PIX') pix += (order.totalCents / 100);
      else if (order.paymentMethod === 'CASH') cash += (order.totalCents / 100);
      else card += (order.totalCents / 100);
    });

    res.json({
      date: new Date().toISOString(),
      totalRevenue,
      totalOrders,
      byMethod: { pix, cash, card }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar fechamento' });
  }
};

// --- Customers (CRM) ---

export const getLoyalty = async (req: Request, res: Response) => {
  let settings = await prisma.loyaltySettings.findUnique({
    where: { tenantId: req.tenantId! }
  });
  if (!settings) {
    settings = await prisma.loyaltySettings.create({ data: { tenantId: req.tenantId! } });
  }
  res.json(settings);
};

export const updateLoyalty = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.loyaltySettings.findUnique({
      where: { tenantId: req.tenantId! }
    });
    if (!settings) {
      settings = await prisma.loyaltySettings.create({ data: { tenantId: req.tenantId! } });
    }
    const updated = await prisma.loyaltySettings.update({
      where: { tenantId: req.tenantId! },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar fidelidade' });
  }
};

// ==========================================
export const getPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { priceCents: 'asc' } });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar planos' });
  }
};

export const getSubscriptionCheckout = async (req: Request, res: Response) => {
  try {
    const planId = req.query.planId as string;
    const tenant = await prisma.tenant.findUnique({ 
      where: { id: req.tenantId! },
      include: { subscriptions: true }
    });
    
    if (!tenant) return res.status(404).json({ error: 'Tenant não encontrado' });
    
    const axios = require('axios');
    const asaasClient = axios.create({
      baseURL: process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3',
      headers: { 'access_token': process.env.ASAAS_API_KEY, 'Content-Type': 'application/json' }
    });
    
    // Se o lojista já tem uma assinatura no Asaas e não está trocando de plano, tenta pegar a fatura atual
    let currentSub = tenant.subscriptions[0];
    if (currentSub?.providerSubscriptionId && (!planId || currentSub.planId === planId)) {
      try {
        const payments = await asaasClient.get(`/payments?subscription=${currentSub.providerSubscriptionId}`);
        const pendingPayment = payments.data.data.find((p: any) => p.status === 'PENDING' || p.status === 'OVERDUE');
        if (pendingPayment) {
          return res.json({ checkoutUrl: pendingPayment.invoiceUrl });
        }
      } catch (e) {
        console.error('Erro ao buscar pagamentos no Asaas', e);
      }
    }
    
    // Se não encontrou fatura pendente, ou está trocando de plano, temos que criar uma nova assinatura.
    // Primeiro precisamos do customer (cliente no Asaas).
    let customerId = currentSub?.providerCustomerId;
    if (!customerId) {
      try {
        // Asaas aceita apenas dígitos no cpfCnpj
        const cpfCnpjLimpo = (tenant.cpfCnpj || '').replace(/\D/g, '');
        const custRes = await asaasClient.post('/customers', {
          name: tenant.name,
          email: tenant.email,
          cpfCnpj: cpfCnpjLimpo,
          notificationDisabled: true
        });
        customerId = custRes.data.id;
      } catch (e) {
         console.warn('Erro ao criar customer no asaas (pode já existir)', e);
      }
    }
    
    const plan = await prisma.plan.findUnique({ where: { id: planId || (currentSub ? currentSub.planId : '') } });
    if (!plan || !customerId) {
      return res.status(400).json({ error: 'Plano não encontrado ou erro ao identificar cliente no Asaas.' });
    }
    
    // Cria nova assinatura no Asaas
    const today = new Date();
    today.setDate(today.getDate() + 1);
    
    const subRes = await asaasClient.post('/subscriptions', {
      customer: customerId,
      billingType: 'UNDEFINED',
      value: plan.priceCents / 100,
      nextDueDate: today.toISOString().split('T')[0],
      cycle: plan.billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
      description: `Assinatura Pixeleats - ${plan.name}`
    });
    
    // Busca a cobrança recém criada
    const chargeRes = await asaasClient.get(`/payments?subscription=${subRes.data.id}`);
    const invoiceUrl = chargeRes.data.data[0]?.invoiceUrl || subRes.data.invoiceUrl;
    
    // Atualiza o banco com a nova assinatura
    if (currentSub) {
      await prisma.subscription.update({
        where: { id: currentSub.id },
        data: { planId: plan.id, providerSubscriptionId: subRes.data.id, providerCustomerId: customerId }
      });
    } else {
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          provider: 'ASAAS',
          providerSubscriptionId: subRes.data.id,
          providerCustomerId: customerId,
          status: 'PENDING'
        }
      });
    }
    
    return res.json({ checkoutUrl: invoiceUrl });

  } catch (error: any) {
    console.error('Erro getSubscriptionCheckout:', error.response?.data || error);
    res.status(500).json({ error: 'Erro ao gerar checkout' });
  }
};
