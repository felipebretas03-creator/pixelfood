import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Conecta ao Postgres usando o Prisma atual
const prisma = new PrismaClient();

// Conecta ao SQLite antigo
const sqliteDbPath = path.resolve(__dirname, '../prisma/dev.db');
const db = new Database(sqliteDbPath, { fileMustExist: true });

async function migrateData() {
  console.log('🔄 Iniciando migração do SQLite para Supabase...');

  try {
    // 1. Criar o Restaurante Principal
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'PixelFood',
        slug: 'pixelfood',
        email: 'admin@pixelfood.com',
      }
    });
    console.log(`✅ Restaurante criado: ${restaurant.name} (ID: ${restaurant.id})`);
    
    const restId = restaurant.id;

    // 2. Migrar Categorias
    const categories: any[] = db.prepare('SELECT * FROM Category').all();
    if (categories.length > 0) {
      for (const cat of categories) {
        await prisma.category.create({
          data: {
            id: cat.id,
            restaurantId: restId,
            name: cat.name,
            icon: cat.icon,
            order: cat.order,
            active: cat.active === 1,
            createdAt: new Date(cat.createdAt),
            updatedAt: new Date(cat.updatedAt),
          }
        });
      }
      console.log(`✅ ${categories.length} Categorias migradas.`);
    }

    // 3. Migrar Produtos
    const products: any[] = db.prepare('SELECT * FROM Product').all();
    if (products.length > 0) {
      for (const prod of products) {
        await prisma.product.create({
          data: {
            id: prod.id,
            restaurantId: restId,
            name: prod.name,
            description: prod.description,
            price: prod.price,
            image: prod.image,
            category: prod.category,
            active: prod.active === 1,
            createdAt: new Date(prod.createdAt),
            updatedAt: new Date(prod.updatedAt),
          }
        });
      }
      console.log(`✅ ${products.length} Produtos migrados.`);
    }

    // 4. Migrar Grupos Modificadores
    const modGroups: any[] = db.prepare('SELECT * FROM ProductModifierGroup').all();
    if (modGroups.length > 0) {
      for (const grp of modGroups) {
        await prisma.productModifierGroup.create({
          data: {
            id: grp.id,
            productId: grp.productId,
            name: grp.name,
            min: grp.min,
            max: grp.max,
          }
        });
      }
      console.log(`✅ ${modGroups.length} Grupos de Modificadores migrados.`);
    }

    // 5. Migrar Opções Modificadoras
    const modOptions: any[] = db.prepare('SELECT * FROM ProductModifierOption').all();
    if (modOptions.length > 0) {
      for (const opt of modOptions) {
        await prisma.productModifierOption.create({
          data: {
            id: opt.id,
            groupId: opt.groupId,
            name: opt.name,
            price: opt.price,
          }
        });
      }
      console.log(`✅ ${modOptions.length} Opções de Modificadores migradas.`);
    }

    // 6. Migrar Clientes
    const customers: any[] = db.prepare('SELECT * FROM Customer').all();
    if (customers.length > 0) {
      for (const cus of customers) {
        await prisma.customer.create({
          data: {
            id: cus.id,
            restaurantId: restId,
            name: cus.name,
            phone: cus.phone,
            totalSpent: cus.totalSpent,
            ordersCount: cus.ordersCount,
            loyaltyPts: cus.loyaltyPts,
            lastOrderId: cus.lastOrderId,
            createdAt: new Date(cus.createdAt),
            updatedAt: new Date(cus.updatedAt),
          }
        });
      }
      console.log(`✅ ${customers.length} Clientes migrados.`);
    }

    // 7. Migrar Cupons
    const coupons: any[] = db.prepare('SELECT * FROM Coupon').all();
    if (coupons.length > 0) {
      for (const cup of coupons) {
        await prisma.coupon.create({
          data: {
            id: cup.id,
            restaurantId: restId,
            code: cup.code,
            type: cup.type,
            value: cup.value,
            active: cup.active === 1,
            usageLimit: cup.usageLimit,
            used: cup.used,
            ruleType: cup.ruleType,
            ruleCategory: cup.ruleCategory,
            oncePerCustomer: cup.oncePerCustomer === 1,
            createdAt: new Date(cup.createdAt),
            updatedAt: new Date(cup.updatedAt),
          }
        });
      }
      console.log(`✅ ${coupons.length} Cupons migrados.`);
    }

    // 8. Migrar Pedidos
    const orders: any[] = db.prepare('SELECT * FROM "Order"').all();
    if (orders.length > 0) {
      for (const ord of orders) {
        await prisma.order.create({
          data: {
            id: ord.id,
            restaurantId: restId,
            orderNumber: ord.orderNumber,
            customerName: ord.customerName,
            status: ord.status,
            total: ord.total,
            paymentMethod: ord.paymentMethod,
            needsChange: ord.needsChange === 1,
            changeAmount: ord.changeAmount,
            addressStreet: ord.addressStreet,
            addressNumber: ord.addressNumber,
            addressCity: ord.addressCity,
            observation: ord.observation,
            couponCode: ord.couponCode,
            discountAmount: ord.discountAmount,
            customerId: ord.customerId,
            createdAt: new Date(ord.createdAt),
            updatedAt: new Date(ord.updatedAt),
          }
        });
      }
      console.log(`✅ ${orders.length} Pedidos migrados.`);
    }

    // 9. Migrar Itens do Pedido
    const orderItems: any[] = db.prepare('SELECT * FROM OrderItem').all();
    if (orderItems.length > 0) {
      for (const item of orderItems) {
        await prisma.orderItem.create({
          data: {
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            observation: item.observation,
            optionsData: item.optionsData,
          }
        });
      }
      console.log(`✅ ${orderItems.length} Itens de Pedido migrados.`);
    }

    // 10. Configurações
    const settings: any[] = db.prepare('SELECT * FROM Settings LIMIT 1').all();
    if (settings.length > 0) {
      const set = settings[0];
      await prisma.settings.create({
        data: {
          restaurantId: restId,
          storeName: set.storeName,
          primaryColor: set.primaryColor,
          deliveryType: set.deliveryType,
          deliveryFee: set.deliveryFee,
          isOpen: set.isOpen === 1,
        }
      });
      console.log(`✅ Configurações gerais migradas.`);
    } else {
      await prisma.settings.create({
        data: {
          restaurantId: restId,
        }
      });
    }

    // 11. Configurações de Fidelidade
    const loyaltySettings: any[] = db.prepare('SELECT * FROM LoyaltySettings LIMIT 1').all();
    if (loyaltySettings.length > 0) {
      const loy = loyaltySettings[0];
      await prisma.loyaltySettings.create({
        data: {
          restaurantId: restId,
          active: loy.active === 1,
          pointsPerReal: loy.pointsPerReal,
          pointsToReward: loy.pointsToReward,
          rewardValue: loy.rewardValue,
        }
      });
      console.log(`✅ Configurações de Fidelidade migradas.`);
    } else {
      await prisma.loyaltySettings.create({
        data: {
          restaurantId: restId,
        }
      });
    }

    console.log('🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    db.close();
    await prisma.$disconnect();
  }
}

migrateData();
