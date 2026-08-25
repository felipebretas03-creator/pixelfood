import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export const registerOwner = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Garantir que o slug seja único
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.tenant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        email,
        slug: finalSlug,
        settings: { create: { storeName: name } }
      }
    });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        memberships: {
          create: {
            tenantId: tenant.id,
            role: 'OWNER'
          }
        }
      }
    });

    const token = jwt.sign(
      { id: user.id, role: 'OWNER', tenantId: tenant.id }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '7d' }
    );
    
    res.json({ token, tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, email: tenant.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar restaurante' });
  }
};

export const loginOwner = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { memberships: { include: { tenant: true } } }
  });

  if (!user || !user.passwordHash) {
    return res.status(404).json({ error: 'Credenciais inválidas' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'Conta bloqueada' });
  }

  if (user.memberships.length === 0) {
    return res.status(403).json({ error: 'Usuário sem restaurante vinculado' });
  }

  const membership = user.memberships[0];
  const tenant = membership.tenant;
  const isMaster = user.email === 'felipebretas03@gmail.com' || user.email === 'admin@admin.com';

  const token = jwt.sign(
    { id: user.id, role: membership.role, tenantId: tenant.id, isMaster }, 
    process.env.JWT_SECRET || 'secret', 
    { expiresIn: '7d' }
  );

  res.json({
    token,
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    email: user.email,
    isMaster
  });
};

export const registerCustomer = async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios faltando' });

  try {
    const existing = await prisma.customer.findUnique({ where: { email_tenantId: { email, tenantId: req.tenantId! } } });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado neste restaurante' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        tenantId: req.tenantId!
      }
    });

    const token = jwt.sign({ id: customer.id, role: 'customer', tenantId: req.tenantId! }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.json({ token, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar cliente' });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  const customer = await prisma.customer.findUnique({ where: { email_tenantId: { email, tenantId: req.tenantId! } } });
  if (!customer || !customer.password) {
    return res.status(404).json({ error: 'Credenciais inválidas' });
  }

  const isValid = await bcrypt.compare(password, customer.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: customer.id, role: 'customer', tenantId: req.tenantId! }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

  res.json({
    token,
    customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }
  });
};
