import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const reqId = req.headers['x-request-id'] || 'unknown';
  
  console.error(`[Error] [ReqID: ${reqId}]`, err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Conflito: Este registro já existe.', code: err.code });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado.', code: err.code });
  }

  // Send generic error to client
  res.status(err.status || 500).json({
    error: err.message || 'Erro Interno do Servidor',
    code: err.code || 'INTERNAL_ERROR'
  });
};
