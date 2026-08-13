import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@admin.com';
  const plainPassword = 'Wlademarcosgosotoso1234@';
  
  let user = await prisma.user.findUnique({ where: { email } });
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: 'Administrador'
      }
    });
    console.log('✅ Usuário admin criado.');
  } else {
    user = await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });
    console.log('✅ Senha do admin atualizada.');
  }

  const tenant = await prisma.tenant.findFirst({ where: { slug: 'restaurante-admin' }});
  let tenantId = tenant?.id;

  if (!tenant) {
    const newTenant = await prisma.tenant.create({
      data: {
        name: 'Restaurante Admin',
        slug: 'restaurante-admin',
        email: email,
      }
    });
    tenantId = newTenant.id;
    console.log('✅ Tenant admin criado.');
  }

  // Create membership
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, tenantId }
  });

  if (!membership) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        tenantId: tenantId as string,
        role: 'OWNER'
      }
    });
    console.log('✅ Membership owner criado.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
