
import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const updateProfile = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'customer') return res.status(403).json({ error: 'Proibido' });
    
    const { phone, name } = req.body;
    
    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (name !== undefined) updateData.name = name;
    
    const customer = await prisma.customer.update({
      where: { id: decoded.id },
      data: updateData
    });
    
    res.json(customer);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const getAddresses = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'customer') return res.status(403).json({ error: 'Proibido' });
    
    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: decoded.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(addresses);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'customer') return res.status(403).json({ error: 'Proibido' });
    
    const { street, number, neighborhood, city, state, lat, lon, isDefault, label } = req.body;
    if (!street || !number) return res.status(400).json({ error: 'Rua e número são obrigatórios' });

    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: decoded.id },
        data: { isDefault: false }
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId: decoded.id,
        street,
        number,
        neighborhood,
        city,
        state,
        lat,
        lon,
        label,
        isDefault: isDefault || false
      }
    });
    res.json(address);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'customer') return res.status(403).json({ error: 'Proibido' });
    
    const { id } = req.params;
    
    const address = await prisma.customerAddress.findUnique({ where: { id } });
    if (!address || address.customerId !== decoded.id) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    await prisma.customerAddress.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const getCustomersOwner = async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: { totalSpent: 'desc' },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar clientes' });
  }
};

export const getCustomerByIdOwner = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id as string }
    });
    if (!customer || customer.tenantId !== req.tenantId) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar cliente' });
  }
};

// --- Coupons ---
export const deleteCustomerOwner = async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id as string } });
    if (!customer || customer.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.customer.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao deletar cliente' });
  }
};

