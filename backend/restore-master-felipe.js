const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const adminEmail = 'felipebretas03@gmail.com';
  
  // Find or create admin user
  let user = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Felipe Master',
        email: adminEmail,
        status: 'ACTIVE'
      }
    });
    console.log('User created:', user);
  }

  // Create a new master tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'PixelFood Master 2',
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
  console.log('Membership created for Felipe!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
