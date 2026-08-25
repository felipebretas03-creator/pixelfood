import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getCategories = async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { sortOrder: 'asc' }
  });
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.create({ 
      data: { ...req.body, tenantId: req.tenantId! } 
    });
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar categoria' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id as string } });
    if (!category || category.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.category.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2003') {
      res.status(400).json({ error: 'Não é possível excluir esta categoria pois existem produtos vinculados a ela. Exclua os produtos primeiro.' });
    } else {
      res.status(400).json({ error: 'Erro ao deletar categoria' });
    }
  }
};
