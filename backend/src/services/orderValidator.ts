import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function calculateOrderTotal(
  tenantId: string,
  itemsPayload: any[],
  discountAmountCents: number = 0,
  deliveryFeeCents: number = 0,
  couponCode?: string
) {
  let subtotalCents = 0;
  const snapshotItems: any[] = [];

  for (const item of itemsPayload) {
    if (!item.productId) {
      throw new Error(`Item ${item.name} inválido: faltando productId.`);
    }

    // Busca o produto real no banco para este tenant
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        optionGroups: {
          include: { options: true }
        }
      }
    });

    if (!product || product.tenantId !== tenantId) {
      throw new Error(`Produto não encontrado ou inválido: ${item.name}`);
    }

    // Preço base do produto (verificando se há preço promocional)
    let itemUnitCents = product.promotionalPriceCents ? product.promotionalPriceCents : product.priceCents;
    const itemSnapshotOptions: any[] = [];

    // Validar e somar opções
    if (item.options && Array.isArray(item.options)) {
      // O frontend envia um array de strings com o nome das opções
      for (const optionName of item.options) {
        let foundOption = null;

        // Procura a opção nos grupos deste produto
        for (const group of product.optionGroups) {
          const opt = group.options.find(o => o.name === optionName);
          if (opt) {
            foundOption = opt;
            break;
          }
        }

        if (foundOption) {
          itemUnitCents += foundOption.priceDeltaCents;
          itemSnapshotOptions.push({
            optionId: foundOption.id,
            name: foundOption.name,
            quantity: 1, // Atualmente o frontend manda flat array, sem quantificadores na opção
            priceDeltaCents: foundOption.priceDeltaCents
          });
        }
      }
    }

    const itemTotalCents = itemUnitCents * item.quantity;
    subtotalCents += itemTotalCents;

    snapshotItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      priceCents: itemUnitCents, // Valor unitário final com opcionais
      totalCents: itemTotalCents, // Valor total do item (unit * quant)
      observation: item.observation || null,
      options: {
        create: itemSnapshotOptions
      }
    });
  }

  const totalCents = subtotalCents + deliveryFeeCents - discountAmountCents;

  return {
    subtotalCents,
    totalCents,
    snapshotItems
  };
}
