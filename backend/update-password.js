const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const passwordHash = await bcrypt.hash('Pixeloo2026', 10);
  
  await prisma.user.updateMany({
    where: {
      email: {
        in: ['felipebretas03@gmail.com', 'admin@admin.com']
      }
    },
    data: {
      passwordHash
    }
  });

  console.log('Password updated successfully for master users.');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
