const mapProduct = (p: any) => ({
  ...p,
  price: p.priceCents / 100,
  promotionalPrice: p.promotionalPriceCents ? p.promotionalPriceCents / 100 : null,
  active: p.isActive,
  modifiers: p.optionGroups?.map((g: any) => ({
    id: g.id,
    name: g.name,
    min: g.minSelections,
    max: g.maxSelections,
    options: g.options.map((o: any) => ({
      id: o.id,
      name: o.name,
      price: o.priceCents / 100
    }))
  }))
});


import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getProducts = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { tenantId: req.tenantId! },
    include: {
      category: true,
      optionGroups: { include: { options: true } }
    }
  });
  res.json(products.map(mapProduct));
};

export const getProductById = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
    include: {
      category: true,
      optionGroups: { include: { options: true } }
    }
  });
  // Check tenant
  if (!product || product.tenantId !== req.tenantId) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(mapProduct(product));
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { modifiers, active, ...productData } = req.body;
    if (productData.price !== undefined) productData.priceCents = Math.round(productData.price * 100);
    if (productData.promotionalPrice !== undefined) productData.promotionalPriceCents = productData.promotionalPrice ? Math.round(productData.promotionalPrice * 100) : null;
    delete productData.price;
    delete productData.promotionalPrice;
    if (active !== undefined) productData.isActive = active;

    const product = await prisma.product.create({ 
      data: {
        ...productData,
        tenantId: req.tenantId!,
        optionGroups: modifiers ? {
          create: modifiers.map((mod: any) => ({
            tenantId: req.tenantId!,
            name: mod.name,
            minSelections: mod.min,
            maxSelections: mod.max,
            options: {
              create: mod.options.map((opt: any) => ({
                tenantId: req.tenantId!,
                name: opt.name,
                priceDeltaCents: Math.round(opt.price * 100)
              }))
            }
          }))
        } : undefined
      },
      include: {
        optionGroups: { include: { options: true } }
      }
    });
    res.status(201).json(mapProduct(product));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar produto' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { modifiers, active, ...productData } = req.body;
    if (productData.price !== undefined) productData.priceCents = Math.round(productData.price * 100);
    if (productData.promotionalPrice !== undefined) productData.promotionalPriceCents = productData.promotionalPrice ? Math.round(productData.promotionalPrice * 100) : null;
    delete productData.price;
    delete productData.promotionalPrice;
    if (active !== undefined) productData.isActive = active;
    
    const prod = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!prod || prod.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }

    await prisma.optionGroup.deleteMany({
      where: { productId: req.params.id as string }
    });

    const product = await prisma.product.update({
      where: { id: req.params.id as string },
      data: {
        ...productData,
        optionGroups: modifiers ? {
          create: modifiers.map((mod: any) => ({
            tenantId: req.tenantId!,
            name: mod.name,
            minSelections: mod.min,
            maxSelections: mod.max,
            options: {
              create: mod.options.map((opt: any) => ({
                tenantId: req.tenantId!,
                name: opt.name,
                priceDeltaCents: Math.round(opt.price * 100)
              }))
            }
          }))
        } : undefined
      },
      include: {
        optionGroups: { include: { options: true } }
      }
    });
    res.json(mapProduct(product));
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao atualizar produto' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const prod = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!prod || prod.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.product.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar produto' });
  }
};

// --- Orders ---
