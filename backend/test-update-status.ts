import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const id = "ec7362a1-3652-4761-bb0a-3387c3ec7c20";
    const tenantId = "16c6598b-e7f5-4b9e-a3ef-0089466bbc38";
    const userId = "08a1d77b-3dcc-4d3b-9e4a-5c1cfeb4b8ab"; // random valid-looking id, but wait I should leave it null
    const status = "PREPARING";
    
    const existingOrder = await prisma.order.findUnique({ where: { id } });
    console.log("Existing order:", existingOrder?.id, "Tenant:", existingOrder?.tenantId);
    
    if (!existingOrder || existingOrder.tenantId !== tenantId) {
       console.log("Not found or tenant mismatch");
       return;
    }

    const order = await prisma.order.update({
      where: { id },
      data: { 
        status,
        statusHistories: {
          create: {
            tenantId: tenantId,
            previousStatus: existingOrder.status,
            newStatus: status,
            userId: null,
            reason: null
          }
        }
      },
      include: { items: true }
    });
    console.log("Updated order:", order.status);
  } catch(e) {
    console.error("Prisma error:", e);
  }
}
main();
