import { Request, Response } from 'express';
import { prisma } from '../config/database';
import jwt from 'jsonwebtoken';
import { io } from '../index';
import { calculateOrderTotal } from '../services/orderValidator';
import { createPixPayment, createCardPreference } from '../services/mercadopagoService';


export const getOrdersOwner = async (req: Request, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { tenantId: req.tenantId! },
    include: { items: { include: { options: true } }, customer: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
};

export const getOrdersCustomer = async (req: Request, res: Response) => {
  // O ideal seria um middleware de auth para validar o token JWT e pegar o req.userId,
  // mas para simplificar vamos pegar do header (ou podemos decodificar o token aqui)
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'customer') return res.status(403).json({ error: 'Proibido' });
    
    const orders = await prisma.order.findMany({
      where: { tenantId: req.tenantId!, customerId: decoded.id },
      include: { items: true, tenant: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id as string },
    include: { items: true }
  });
  if (!order || order.tenantId !== req.tenantId) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(order);
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { items, customerPhone, couponCode, discountAmount, paymentMethod, customerName, total, needsChange, changeAmount, addressStreet, addressNumber, addressCity, observation } = req.body;
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const restId = req.tenantId!;
    
    const { subtotalCents, totalCents, snapshotItems } = await calculateOrderTotal(
      restId, items, Math.round((discountAmount || 0) * 100), 0, couponCode
    );

    let customerId = null;
    let customerObj: any = null;
    if (customerPhone) {
      let customer = await prisma.customer.findUnique({ 
        where: { 
          phone_tenantId: { phone: customerPhone, tenantId: restId } 
        } 
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId: restId,
            name: customerName,
            phone: customerPhone,
          }
        });
      }
      
      const loyalty = await prisma.loyaltySettings.findUnique({ where: { tenantId: restId } });
      const points = (loyalty?.active) ? Math.floor(totalCents * (loyalty.pointsPerReal || 1)) : 0;

      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: customer.totalSpent + totalCents,
          ordersCount: customer.ordersCount + 1,
          loyaltyPts: customer.loyaltyPts + points,
        }
      });
      customerId = customer.id;
      customerObj = customer;
    }

    if (couponCode) {
      await prisma.coupon.updateMany({
        where: { code: couponCode, tenantId: restId },
        data: { used: { increment: 1 } }
      });
    }

    const isOnlinePayment = paymentMethod === 'MERCADO_PAGO_PIX' || paymentMethod === 'MERCADO_PAGO_CARD';
    const initialStatus = isOnlinePayment ? 'AWAITING_PAYMENT' : 'NEW';

    const order = await prisma.order.create({
      data: {
        addressSnapshot: addressStreet ? `${addressStreet}, ${addressNumber} - ${addressCity}` : null,
        notes: observation || null,
        changeForCents: needsChange && changeAmount ? Math.round(changeAmount * 100) : 0,
        customerNameSnapshot: customerName,
        customerPhoneSnapshot: customerPhone || '',
        tenantId: restId,
        orderNumber,
        status: initialStatus,
        paymentMethod,
        paymentType: paymentMethod,
        paymentStatus: isOnlinePayment ? 'PENDING' : 'NOT_REQUIRED',
        discountCents: Math.round((discountAmount || 0) * 100),
        subtotalCents,
        totalCents,
        customerId,
        items: {
          create: snapshotItems
        }
      },
      include: { items: { include: { options: true } }, customer: true }
    });

    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { lastOrderId: order.id }
      });
    }

    let paymentData = null;

    if (isOnlinePayment) {
      try {
        if (paymentMethod === 'MERCADO_PAGO_PIX') {
          paymentData = await createPixPayment(restId, order, {
            email: 'customer@pixelfood.com.br',
            name: customerObj?.name || customerName
          });
        } else if (paymentMethod === 'MERCADO_PAGO_CARD') {
          paymentData = await createCardPreference(restId, order);
        }
      } catch (err: any) {
        console.error('Falha ao gerar pagamento online:', err);
        // O pedido foi criado, mas o pagamento falhou
        return res.status(400).json({ error: 'Falha na integração de pagamento', details: err.message, order });
      }
    }

    if (!isOnlinePayment) {
      // @ts-ignore
      io.to(restId).emit('new_order', order);
    }

    res.status(201).json({ ...order, paymentData });
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar pedido' });
  }
};


export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body;
    const existingOrder = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!existingOrder || existingOrder.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { 
        status,
        statusHistories: {
          create: {
            tenantId: req.tenantId!,
            previousStatus: existingOrder.status,
            newStatus: status,
            userId: req.userId || null,
            reason: reason || null
          }
        }
      },
      include: { items: true }
    });
    
    // @ts-ignore
    io.to(req.tenantId!).emit('order_status_updated', order);
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao alterar status' });
  }
};


export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const coupon = await prisma.coupon.findUnique({ 
      where: { 
        code_tenantId: { code, tenantId: req.tenantId! } 
      } 
    });
    if (!coupon || !coupon.active) {
      res.status(400).json({ error: 'Cupom inválido ou inativo' });
      return;
    }
    if (coupon.usageLimit && coupon.used >= coupon.usageLimit) {
      res.status(400).json({ error: 'Cupom esgotado' });
      return;
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao validar cupom' });
  }
};
