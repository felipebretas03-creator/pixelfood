import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@admin.com';
  const password = await bcrypt.hash('Wlademarcosgosotoso1234@', 10);

  const admin = await prisma.restaurant.upsert({
    where: { email },
    update: {
      password,
      isMaster: true,
      active: true,
    },
    create: {
      name: 'Admin Global',
      slug: 'admin-global',
      email,
      password,
      isMaster: true,
      active: true,
    },
  });

  console.log('Admin account created/updated:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
