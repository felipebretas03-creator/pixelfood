import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PrismaClient } from '@prisma/client';
import { decryptPaymentCredential } from './cryptoService';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const getMercadoPagoClient = async (tenantId: string) => {
  const integration = await prisma.tenantPaymentIntegration.findUnique({
    where: { tenantId_provider: { tenantId, provider: 'MERCADO_PAGO' } }
  });
  
  if (!integration || !integration.encryptedAccessToken) {
    throw new Error('Mercado Pago integration not configured for this tenant');
  }

  const accessToken = decryptPaymentCredential(integration.encryptedAccessToken);
  
  return new MercadoPagoConfig({
    accessToken: accessToken,
    options: {
      timeout: 15000,
      idempotencyKey: uuidv4()
    }
  });
};

export const createPixPayment = async (tenantId: string, order: any, customerInfo: { email: string, name: string, document?: string }) => {
  const client = await getMercadoPagoClient(tenantId);
  const payment = new Payment(client);
  
  const idempotencyKey = uuidv4();
  
  const paymentData = {
    transaction_amount: order.totalCents / 100,
    description: `Pedido ${order.orderNumber} - PixelFood`,
    payment_method_id: 'pix',
    payer: {
      email: customerInfo.email || 'customer@pixelfood.com.br',
      first_name: customerInfo.name,
      identification: customerInfo.document ? {
        type: 'CPF',
        number: customerInfo.document
      } : undefined
    },
    external_reference: order.id,
  };
  
  const result = await payment.create({
    body: paymentData,
    requestOptions: { idempotencyKey }
  });

  // Salvar a tentativa
  await prisma.orderPayment.create({
    data: {
      tenantId,
      orderId: order.id,
      provider: 'MERCADO_PAGO',
      providerPaymentId: String(result.id),
      externalReference: order.id,
      idempotencyKey,
      status: result.status || 'PENDING',
      statusDetail: result.status_detail,
      paymentMethodType: 'PIX',
      amountCents: order.totalCents,
      currency: result.currency_id || 'BRL',
      pixExpirationAt: result.date_of_expiration ? new Date(result.date_of_expiration) : undefined
    }
  });

  return {
    qrCode: result.point_of_interaction?.transaction_data?.qr_code,
    qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
    paymentId: result.id,
    status: result.status
  };
};

export const createCardPreference = async (tenantId: string, order: any) => {
  const client = await getMercadoPagoClient(tenantId);
  const preference = new Preference(client);

  const idempotencyKey = uuidv4();

  const body = {
    items: [
      {
        id: order.id,
        title: `Pedido ${order.orderNumber} - PixelFood`,
        quantity: 1,
        unit_price: order.totalCents / 100
      }
    ],
    external_reference: order.id,
    auto_return: 'approved',
    back_urls: {
      success: `${process.env.FRONTEND_URL}/pedido/${order.id}/sucesso`,
      failure: `${process.env.FRONTEND_URL}/pedido/${order.id}/erro`,
      pending: `${process.env.FRONTEND_URL}/pedido/${order.id}/pendente`
    }
  };

  const result = await preference.create({ body });

  // A Preference ID will be stored in orderPayment
  await prisma.orderPayment.create({
    data: {
      tenantId,
      orderId: order.id,
      provider: 'MERCADO_PAGO',
      providerOrderId: result.id, 
      checkoutUrl: result.init_point,
      externalReference: order.id,
      idempotencyKey,
      status: 'PENDING',
      paymentMethodType: 'CARD',
      amountCents: order.totalCents,
      currency: 'BRL',
    }
  });

  return {
    initPoint: result.init_point,
    preferenceId: result.id
  };
};
