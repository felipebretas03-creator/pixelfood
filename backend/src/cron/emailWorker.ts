import { PrismaClient } from '@prisma/client';
import { sendEmailDirectly } from '../services/emailService';

const prisma = new PrismaClient();

export const startEmailWorker = () => {
  console.log('[Worker] Iniciando Background Worker de E-mails...');
  
  // Roda a cada 30 segundos
  setInterval(async () => {
    try {
      const pendingEmails = await prisma.emailOutbox.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: { lte: new Date() },
          attempts: { lt: 3 }
        },
        take: 10
      });

      for (const email of pendingEmails) {
        try {
          await sendEmailDirectly(email.to, email.subject, email.htmlBody);
          
          await prisma.emailOutbox.update({
            where: { id: email.id },
            data: { status: 'SENT' }
          });
          
          console.log(`[Worker] E-mail enviado para ${email.to}`);
        } catch (err: any) {
          console.error(`[Worker] Falha ao enviar para ${email.to}:`, err);
          
          await prisma.emailOutbox.update({
            where: { id: email.id },
            data: { 
              attempts: email.attempts + 1,
              lastError: err.message || 'Erro desconhecido',
              status: email.attempts + 1 >= 3 ? 'FAILED' : 'PENDING'
            }
          });
        }
      }
    } catch (err) {
      console.error('[Worker] Erro crítico na fila de e-mails', err);
    }
  }, 30000);
};
