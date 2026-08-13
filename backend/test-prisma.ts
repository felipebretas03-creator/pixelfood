import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log("No tenant found");
    return;
  }
  
  try {
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        icon: '🍔',
        tenantId: tenant.id
      }
    });
    console.log("Category created successfully:", category);

    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        categoryId: category.id,
        priceCents: 1500,
        tenantId: tenant.id,
        isActive: true
      }
    });
    console.log("Product created successfully:", product);
  } catch (error) {
    console.error("Prisma Error:", error);
  }
}

main().finally(() => prisma.$disconnect());
