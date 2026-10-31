import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  let slug = (req.headers['x-tenant-slug'] as string) || (req.headers['x-restaurant-slug'] as string);
  let id = (req.headers['x-tenant-id'] as string) || (req.headers['x-restaurant-id'] as string);
  
  // Se não foi enviado via header direto, tenta obter o tenantId a partir do token JWT autenticado
  if (!id && !slug && req.headers.authorization) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        const decoded: any = jwt.decode(token);
        if (decoded?.tenantId) {
          id = decoded.tenantId;
        }
      }
    } catch {
      // Ignora erro de decodificação; authMiddleware fará a validação estrita da assinatura se necessário
    }
  }

  // Sem identificador não é permitido prosseguir em ambiente multitenant
  if (!id && !slug) {
    res.status(400).json({ error: 'Identificador do restaurante (slug ou ID) não fornecido' });
    return;
  }

  let tenant = null;
  if (id) {
    tenant = await prisma.tenant.findUnique({ where: { id } });
  } else if (slug) {
    tenant = await prisma.tenant.findUnique({ where: { slug } });
  }

  if (!tenant) {
    res.status(404).json({ error: 'Restaurante não encontrado' });
    return;
  }

  req.tenantId = tenant.id;
  next();
};
