const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adminEmail = 'admin@admin.com';
  
  // Find or create admin user
  let user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Master Admin',
        email: adminEmail,
        status: 'ACTIVE'
      }
    });
    console.log('User created:', user);
  }

  // Create a new master tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'PixelFood Master',
      slug: 'master-' + Date.now(),
      email: adminEmail,
      operationalStatus: 'OPEN',
      subscriptionStatus: 'ACTIVE'
    }
  });
  console.log('Tenant created:', tenant);

  // Link user to tenant
  await prisma.membership.create({
    data: {
      userId: user.id,
      tenantId: tenant.id,
      role: 'OWNER'
    }
  });
  console.log('Membership created!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
