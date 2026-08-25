
import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getCoupons = async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ 
    where: { tenantId: req.tenantId! },
    orderBy: { createdAt: 'desc' }
  });
  res.json(coupons);
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const coupon = await prisma.coupon.create({ 
      data: { ...req.body, tenantId: req.tenantId! } 
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar cupom' });
  }
};

export const updateCouponStatus = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id as string } });
    if (!existing || existing.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id as string },
      data: { active: req.body.active }
    });
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar cupom' });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id as string } });
    if (!existing || existing.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.coupon.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar cupom' });
  }
};

