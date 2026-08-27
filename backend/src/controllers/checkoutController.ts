
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { io } from '../index';
import { calculateOrderTotal } from '../services/orderValidator';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export const createPixCheckout = async (req: Request, res: Response) => {
  try {
    const { items, total, customerName, customerPhone, document, addressStreet, addressNumber, addressCity, observation, couponCode, discountAmount, customerId } = req.body;
    
    // Get Tenant Settings to retrieve mpAccessToken
    const settings = await prisma.settings.findUnique({ where: { tenantId: req.tenantId! } });
    if (!settings || !settings.mpAccessToken) {
      return res.status(400).json({ error: 'Restaurante não configurou o Mercado Pago.' });
    }
    
    const { checkStoreIsOpen } = require('../utils/storeStatus');
    if (!checkStoreIsOpen(settings)) {
      return res.status(400).json({ error: 'A loja está fechada no momento. Não é possível fazer pedidos.' });
    }

    // Validação Segura do Carrinho
    const { subtotalCents, totalCents, snapshotItems } = await calculateOrderTotal(
      req.tenantId!, items, Math.round((discountAmount || 0) * 100), 0, couponCode
    );

    // Initialize MercadoPago
    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);

    // Create Order in DB as PAYMENT_PENDING
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const order = await prisma.order.create({
      data: {
        tenantId: req.tenantId!,
        orderNumber,
        customerNameSnapshot: customerName,
        customerPhoneSnapshot: customerPhone || '',
        status: 'PAYMENT_PENDING',
        subtotalCents,
        discountCents: Math.round((discountAmount || 0) * 100),
        totalCents,
        paymentMethod: 'PIX_APP',
        addressSnapshot: addressStreet ? `${addressStreet}, ${addressNumber} - ${addressCity}` : null,
        notes: observation || null,
        customerId,
        items: {
          create: snapshotItems
        }
      },
      include: { items: { include: { options: true } }, customer: true }
    });

    // Create Payment in Mercado Pago
    const mpResponse = await payment.create({
      body: {
        transaction_amount: totalCents / 100, // MercadoPago expects decimal
        description: `Pedido #${orderNumber} - ${settings.storeName}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@teste.com',
          first_name: customerName
        },
        external_reference: order.id,
        notification_url: `${process.env.PUBLIC_API_URL || 'https://sua-api.com'}/api/webhooks/mercadopago/${req.tenantId}`,
      }
    });

    const qrCode = mpResponse.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64;

    res.status(201).json({
      order,
      qrCode,
      qrCodeBase64
    });
  } catch (error: any) {
    console.error('Pix Checkout Error:', error);
    res.status(400).json({ error: error.message || 'Erro ao gerar PIX' });
  }
};



export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const paymentId = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);
    
    res.status(200).send('OK');

    if (!paymentId) return;

    const settings = await prisma.settings.findUnique({ where: { tenantId: tenantId as string } });
    if (!settings || !settings.mpAccessToken) return;

    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId as string });

    if (paymentInfo.status === 'approved') {
      const orderId = paymentInfo.external_reference;
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.status === 'PAYMENT_PENDING') {
           const updatedOrder = await prisma.order.update({
             where: { id: orderId },
             data: { status: 'PENDING' }, // Now it goes to the kitchen!
             include: { items: true, customer: true }
           });
           io.to(tenantId as string).emit('new_order', updatedOrder);
        }
      }
    }
  } catch (err) {
    console.error('MP Webhook Error:', err);
  }
};



export const createCardCheckout = async (req: Request, res: Response) => {
  try {
    const { items, total, customerName, customerPhone, addressStreet, addressNumber, addressCity, observation, couponCode, discountAmount, customerId, paymentData } = req.body;
    
    const settings = await prisma.settings.findUnique({ where: { tenantId: req.tenantId! } });
    if (!settings || !settings.mpAccessToken) {
      return res.status(400).json({ error: 'Restaurante não configurou o Mercado Pago.' });
    }

    const { checkStoreIsOpen } = require('../utils/storeStatus');
    if (!checkStoreIsOpen(settings)) {
      return res.status(400).json({ error: 'A loja está fechada no momento. Não é possível fazer pedidos.' });
    }

    const { subtotalCents, totalCents, snapshotItems } = await calculateOrderTotal(
      req.tenantId!, items, Math.round((discountAmount || 0) * 100), 0, couponCode
    );

    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    
    const mpResponse = await payment.create({
      body: {
        transaction_amount: totalCents / 100,
        description: `Pedido #${orderNumber} - ${settings.storeName}`,
        installments: paymentData.installments || 1,
        payment_method_id: paymentData.payment_method_id,
        token: paymentData.token,
        payer: {
          email: paymentData.payer?.email || 'cliente@teste.com',
          identification: paymentData.payer?.identification
        }
      }
    });

    if (mpResponse.status === 'approved' || mpResponse.status === 'in_process') {
      const dbStatus = mpResponse.status === 'approved' ? 'PENDING' : 'PAYMENT_PENDING';
      
      const order = await prisma.order.create({
        data: {
          tenantId: req.tenantId!,
          orderNumber,
          customerNameSnapshot: customerName,
          customerPhoneSnapshot: customerPhone || '',
          status: dbStatus,
          subtotalCents,
          discountCents: Math.round((discountAmount || 0) * 100),
          totalCents,
          paymentMethod: 'CREDIT_CARD_ONLINE',
          addressSnapshot: addressStreet ? `${addressStreet}, ${addressNumber} - ${addressCity}` : null,
          notes: observation || null,
          customerId,
          items: {
            create: snapshotItems
          }
        },
        include: { items: { include: { options: true } }, customer: true }
      });

      if (dbStatus === 'PENDING') {
        // @ts-ignore
        io.to(req.tenantId!).emit('new_order', order);
      }

      res.status(201).json({ order, paymentStatus: mpResponse.status });
    } else {
      res.status(400).json({ error: 'Pagamento recusado pelo banco. Verifique seus dados.' });
    }
  } catch (error: any) {
    console.error('Erro ao processar cartão:', error);
    res.status(400).json({ error: error.message || 'Erro interno ao processar pagamento.' });
  }
};

export const caktoWebhook = async (req: Request, res: Response) => {
  try {
    const { event, data } = req.body;
    
    // Na Cakto, geralmente o evento de pagamento aprovado é algo como "transaction.approved" ou "order.approved"
    if (event === 'transaction.approved' || event === 'order.approved' || data?.status === 'approved') {
      const email = data.customer?.email || data.email;
      if (!email) {
        return res.status(400).json({ error: 'Email não fornecido no webhook' });
      }

      const tenant = await prisma.tenant.findFirst({ where: { email } });
      if (tenant) {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        await prisma.tenant.updateMany({
          where: { email },
          data: {
            operationalStatus: 'OPEN',
            subscriptionStatus: 'ACTIVE',
            deletedAt: nextMonth
          }
        });
        console.log(`[Cakto] Assinatura renovada para ${email}`);
      }
    }
    
    res.status(200).send('Webhook processado');
  } catch (error) {
    console.error('[Cakto] Erro no webhook:', error);
    res.status(500).send('Erro interno');
  }
};

const PORT = process.env.PORT || 4000;

// ==========================================
// Rota Mercado Pago Lojistas
// ==========================================
