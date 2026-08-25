import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const ownerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    if ((decoded.role !== 'owner' && decoded.role !== 'OWNER') || decoded.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Proibido' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const customerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    if (decoded.role !== 'customer') {
      return res.status(403).json({ error: 'Proibido' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const masterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    if (decoded.role !== 'MASTER' && !decoded.isMaster) {
      return res.status(403).json({ error: 'Proibido' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
