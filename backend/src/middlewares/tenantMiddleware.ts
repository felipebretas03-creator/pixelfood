import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const slug = req.headers['x-tenant-slug'] as string || req.headers['x-restaurant-slug'] as string;
  const id = req.headers['x-tenant-id'] as string || req.headers['x-restaurant-id'] as string;
  
  let tenant;
  if (id) {
    tenant = await prisma.tenant.findUnique({ where: { id } });
  } else if (slug) {
    tenant = await prisma.tenant.findUnique({ where: { slug } });
  } else {
    // Fallback: pega o último restaurante criado (útil para testes locais)
    tenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!tenant) {
    res.status(404).json({ error: 'Restaurante não encontrado' });
    return;
  }

  req.tenantId = tenant.id;
  next();
};
