import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const logAudit = async (
  action: string,
  actorUserId?: string,
  tenantId?: string,
  metadata?: any,
  requestId?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorUserId,
        tenantId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        requestId
      }
    });
  } catch (error) {
    console.error('Falha ao registrar auditoria:', error);
  }
};
