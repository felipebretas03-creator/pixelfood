
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const restaurants = await prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        operationalStatus: true,
        createdAt: true,
        subscriptionStatus: true,
        deletedAt: true,
        orders: { select: { totalCents: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const formatted = restaurants.map(r => {
      const ordersCount = r.orders.length;
      const totalRevenue = r.orders.reduce((sum, o) => sum + o.totalCents, 0);
      return { ...r, ordersCount, totalRevenue, orders: undefined };
    });

    const totalUsers = formatted.filter(r => !(r.slug === 'master')).length;
    const newUsers = formatted.filter(r => !(r.slug === 'master') && r.createdAt >= thirtyDaysAgo).length;
    const defaulters = formatted.filter(r => !(r.slug === 'master') && (r.subscriptionStatus === 'PAST_DUE' || (r.deletedAt /* subscriptionExpiresAt fallback */ && r.deletedAt /* subscriptionExpiresAt fallback */ < now))).length;
    const expiringSoon = formatted.filter(r => !(r.slug === 'master') && r.deletedAt /* subscriptionExpiresAt fallback */ && r.deletedAt /* subscriptionExpiresAt fallback */ > now && r.deletedAt /* subscriptionExpiresAt fallback */ <= sevenDaysFromNow).length;
    const activeSubs = formatted.filter(r => !(r.slug === 'master') && r.subscriptionStatus === 'ACTIVE').length;
    const trials = formatted.filter(r => !(r.slug === 'master') && r.subscriptionStatus === 'TRIAL').length;

    res.json({
      stores: formatted,
      metrics: {
        totalUsers,
        newUsers,
        defaulters,
        expiringSoon,
        activeSubs,
        trials
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar restaurantes' });
  }
};

export const toggleRestaurantStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const restaurant = await prisma.tenant.findUnique({ where: { id } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });
    
    const updated = await prisma.tenant.update({
      where: { id },
      data: { operationalStatus: restaurant.operationalStatus === 'OPEN' ? 'CLOSED' : 'OPEN' }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
};



const subscriptionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { tenantId: req.tenantId!, status: 'ACTIVE' }
    });
    if (!sub) {
      return res.status(403).json({ error: 'Assinatura Inativa ou Bloqueada. Regularize o pagamento.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao verificar assinatura' });
  }
};

