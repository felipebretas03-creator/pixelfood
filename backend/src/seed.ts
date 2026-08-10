import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Começando o Seed do Banco de Dados...');

  // Deletar tudo (cuidado em prod)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  const productsData = [
    {
      name: "Smash Burger Duplo",
      categoryId: "Hambúrguer",
      price: 32.90,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop",
      description: "Dois blends de carne bovina prensados na chapa, queijo cheddar derretido, bacon crocante e nosso molho especial no pão brioche artesanal.",
    },
    {
      name: "Pizza Mista",
      categoryId: "Pizza",
      price: 45.00,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop",
      description: "Deliciosa pizza com os melhores ingredientes locais, incluindo pepperoni, queijo duplo e manjericão fresco. Assada no forno a lenha.",
    },
    {
      name: "Macarrão Vegetariano",
      categoryId: "Massas",
      price: 22.00,
      image: "https://images.unsplash.com/photo-1512152272829-e3139592d56f?q=80&w=400&auto=format&fit=crop",
      description: "Massa fresca salteada com verduras orgânicas frescas, tomates cereja, manjericão e fio de azeite trufado.",
    },
    {
      name: "Picanha na Brasa",
      categoryId: "Carnes",
      price: 89.90,
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop",
      description: "Picanha premium assada na brasa, acompanhada de farofa de ovo, vinagrete e arroz branco soltinho.",
    },
    {
      name: "Salada Mista Especial",
      categoryId: "Vegano",
      price: 28.00,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop",
      description: "Mix de folhas verdes, abacate, grão de bico, sementes de abóbora tostadas e molho cítrico vegano.",
    },
    {
      name: "Brownie com Sorvete",
      categoryId: "Doces",
      price: 18.90,
      image: "https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?q=80&w=400&auto=format&fit=crop",
      description: "Nosso famoso brownie de chocolate belga, servido quentinho com uma bola de sorvete de creme.",
    },
    {
      name: "Suco Natural de Laranja",
      categoryId: "Bebidas",
      price: 12.00,
      image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=400&auto=format&fit=crop",
      description: "Suco 100% natural, espremido na hora. Sem adição de açúcar.",
    },
    {
      name: "Batata Frita Rústica",
      categoryId: "Porções",
      price: 24.90,
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=400&auto=format&fit=crop",
      description: "Porção generosa de batatas rústicas fritas com casca, temperadas com páprica e alecrim.",
    }
  ];

  const firstRestaurant = await prisma.tenant.findFirst();
  if (!firstRestaurant) {
    console.error('❌ Crie um restaurante primeiro.');
    return;
  }

  for (const p of productsData) {
    await prisma.product.create({ data: { ...p, tenantId: firstRestaurant.id } });
  }

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
