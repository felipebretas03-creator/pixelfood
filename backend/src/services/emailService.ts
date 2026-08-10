import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getResend = () => {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
};

const getFromEmail = () => {
  return process.env.EMAIL_FROM || 'onboarding@resend.dev';
};

export const queueWelcomeEmail = async (to: string, name: string, setupUrl?: string) => {
  let htmlContent = `
    <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 20px;">
      <h2>Olá, ${name}!</h2>
      <p>Sua conta no <strong>PixelFood</strong> foi criada com sucesso.</p>
      <p>Estamos muito felizes em ter você conosco. Acesse seu painel agora mesmo e comece a configurar seu cardápio digital e receber pedidos.</p>
      <br/>
      ${setupUrl ? `<a href="${setupUrl}" style="background: #2563EB; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Definir minha senha</a>` : ''}
    </div>
  `;

  await prisma.emailOutbox.create({
    data: {
      to,
      subject: 'Boas-vindas ao PixelFood! Defina sua senha.',
      htmlBody: htmlContent,
      status: 'PENDING'
    }
  });
};

export const sendWelcomeEmail = queueWelcomeEmail;

// Genérico para ser usado pelo Worker
export const sendEmailDirectly = async (to: string, subject: string, htmlContent: string) => {
  const resend = getResend();
  if (!resend) throw new Error("RESEND_API_KEY is not configured");
  
  await resend.emails.send({
    from: getFromEmail(),
    to: [to],
    subject,
    html: htmlContent
  });
};
