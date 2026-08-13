import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from './middlewares/errorHandler';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { calculateOrderTotal } from './services/orderValidator';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import asaasRouter from './routes/asaas';
import mercadopagoRouter from './routes/mercadopago';
import { createPixPayment, createCardPreference } from './services/mercadopagoService';
import { startEmailWorker } from './cron/emailWorker';
import masterRoutes from './routes/master';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

const prisma = new PrismaClient();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. Request ID Middleware
app.use((req, res, next) => {
  const reqId = uuidv4();
  req.headers['x-request-id'] = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
});

// 2. Structured Logging
morgan.token('reqId', (req: Request) => req.headers['x-request-id'] as string);
app.use(morgan('[:date[iso]] [ReqID: :reqId] :method :url :status :res[content-length] - :response-time ms'));


// Extend Express Request
declare module 'express-serve-static-core' {
  interface Request {
    tenantId?: string;
    userId?: string;
    userRole?: string;
  }
}

// ==========================================
// SOCKET.IO REALTIME EVENTS
// ==========================================
io.on('connection', (socket) => {
  console.log('🔗 Novo cliente conectado:', socket.id);

  socket.on('join_restaurant', (tenantId) => {
    socket.join(tenantId);
    console.log(`Cliente ${socket.id} entrou na sala do restaurante ${tenantId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// ==========================================
// MIDDLEWARES E AUTH
// ==========================================

// Registro do Lojista (Criação de Tenant e User)
app.post('/api/auth/register', async (req, res) => {
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
});

// Login do Lojista
app.use('/api/master', masterRoutes);

app.post('/api/auth/login', async (req, res) => {
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

  // Se o usuário não tiver membership, erro
  if (user.memberships.length === 0) {
    return res.status(403).json({ error: 'Usuário sem restaurante vinculado' });
  }

  // Pega o primeiro tenant ou o tenant enviado no cabeçalho
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
});


const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const slug = req.headers['x-tenant-slug'] as string || req.headers['x-restaurant-slug'] as string;
  const id = req.headers['x-tenant-id'] as string || req.headers['x-restaurant-id'] as string;
  
  let tenant;
  if (id) {
    tenant = await prisma.tenant.findUnique({ where: { id } });
  } else if (slug) {
    tenant = await prisma.tenant.findUnique({ where: { slug } });
  } else {
    // Fallback: pega o último restaurante criado (útil para testes locais)
    tenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!tenant) {
    res.status(404).json({ error: 'Restaurante não encontrado' });
    return;
  }

  req.tenantId = tenant.id;
  next();
};

app.get('/', (req, res) => {
  res.send('PixelFood API is running');
});

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', message: 'Healthy' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database disconnected' });
  }
});

app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply tenant middleware to all /api routes
app.use('/api', tenantMiddleware);

// ==========================================
// ROUTES
// ==========================================

// --- Customer Auth ---
app.post('/api/auth/customer/register', async (req, res) => {
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
});

app.put('/api/customer/profile', async (req, res) => {
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
});

app.post('/api/auth/customer/login', async (req, res) => {
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
});




// ==========================================
// MASTER ADMIN ROUTES
// ==========================================

const masterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if ((decoded.role !== 'owner' && decoded.role !== 'OWNER') || !decoded.isMaster) {
      return res.status(403).json({ error: 'Proibido' });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

app.get('/api/master/restaurants', masterMiddleware, async (req, res) => {
  try {
    const restaurants = await prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        email: true,
        operationalStatus: true,
        createdAt: true,
        subscriptionStatus: true,
        deletedAt: true,
        orders: { select: { totalCents: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const formatted = restaurants.map(r => {
      const ordersCount = r.orders.length;
      const totalRevenue = r.orders.reduce((sum, o) => sum + o.totalCents, 0);
      return { ...r, ordersCount, totalRevenue, orders: undefined };
    });

    const totalUsers = formatted.filter(r => !(r.slug === 'master')).length;
    const newUsers = formatted.filter(r => !(r.slug === 'master') && r.createdAt >= thirtyDaysAgo).length;
    const defaulters = formatted.filter(r => !(r.slug === 'master') && (r.subscriptionStatus === 'PAST_DUE' || (r.deletedAt /* subscriptionExpiresAt fallback */ && r.deletedAt /* subscriptionExpiresAt fallback */ < now))).length;
    const expiringSoon = formatted.filter(r => !(r.slug === 'master') && r.deletedAt /* subscriptionExpiresAt fallback */ && r.deletedAt /* subscriptionExpiresAt fallback */ > now && r.deletedAt /* subscriptionExpiresAt fallback */ <= sevenDaysFromNow).length;
    const activeSubs = formatted.filter(r => !(r.slug === 'master') && r.subscriptionStatus === 'ACTIVE').length;
    const trials = formatted.filter(r => !(r.slug === 'master') && r.subscriptionStatus === 'TRIAL').length;

    res.json({
      stores: formatted,
      metrics: {
        totalUsers,
        newUsers,
        defaulters,
        expiringSoon,
        activeSubs,
        trials
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar restaurantes' });
  }
});

app.post('/api/master/restaurants/:id/toggle', masterMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const restaurant = await prisma.tenant.findUnique({ where: { id } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });
    
    const updated = await prisma.tenant.update({
      where: { id },
      data: { operationalStatus: restaurant.operationalStatus === 'OPEN' ? 'CLOSED' : 'OPEN' }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});



const subscriptionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { tenantId: req.tenantId!, status: 'ACTIVE' }
    });
    if (!sub) {
      return res.status(403).json({ error: 'Assinatura Inativa ou Bloqueada. Regularize o pagamento.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao verificar assinatura' });
  }
};

const ownerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    if ((decoded.role !== 'owner' && decoded.role !== 'OWNER') || decoded.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Proibido' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// --- Settings ---

app.get('/api/settings', async (req, res) => {
  let settings = await prisma.settings.findUnique({
    where: { tenantId: req.tenantId! }
  });
  if (!settings) {
    settings = await prisma.settings.create({ data: { tenantId: req.tenantId! } });
  }
  
  const { encryptPaymentCredential, maskPaymentCredential } = require('./services/cryptoService');
  const maskedSettings = {
    ...settings,
    mpAccessToken: settings.mpAccessToken ? maskPaymentCredential(settings.mpAccessToken) : '',
    mpPublicKey: settings.mpPublicKey ? maskPaymentCredential(settings.mpPublicKey) : '',
  };
  
  res.json(maskedSettings);
});

app.put('/api/settings', ownerMiddleware, async (req, res) => {
  try {
    const { 
      storeName, primaryColor, deliveryType, deliveryFee, isOpen, 
      mpAccessToken, mpPublicKey, 
      acceptPix, acceptCreditCardOnline, acceptCardMachine, acceptCash 
    } = req.body;
    
    let settings = await prisma.settings.findUnique({
      where: { tenantId: req.tenantId! }
    });
    
    if (!settings) {
      settings = await prisma.settings.create({ data: { tenantId: req.tenantId! } });
    }

    const updated = await prisma.settings.update({
      where: { tenantId: req.tenantId! },
      data: {
        storeName: storeName !== undefined ? storeName : settings.storeName,
        primaryColor: primaryColor !== undefined ? primaryColor : settings.primaryColor,
        deliveryType: deliveryType !== undefined ? deliveryType : settings.deliveryType,
        deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : settings.deliveryFee,
        isOpen: isOpen !== undefined ? isOpen : settings.isOpen,
        mpAccessToken: (mpAccessToken && !mpAccessToken.includes('••••')) ? mpAccessToken : settings.mpAccessToken,
        mpPublicKey: (mpPublicKey && !mpPublicKey.includes('••••')) ? mpPublicKey : settings.mpPublicKey,
        acceptPix: acceptPix !== undefined ? acceptPix : settings.acceptPix,
        acceptCreditCardOnline: acceptCreditCardOnline !== undefined ? acceptCreditCardOnline : settings.acceptCreditCardOnline,
        acceptCardMachine: acceptCardMachine !== undefined ? acceptCardMachine : settings.acceptCardMachine,
        acceptCash: acceptCash !== undefined ? acceptCash : settings.acceptCash,
      }
    });

    if (mpAccessToken && !mpAccessToken.includes('••••') && mpPublicKey && !mpPublicKey.includes('••••')) {
      const { encryptPaymentCredential } = require('./services/cryptoService');
      const encryptedAccess = encryptPaymentCredential(mpAccessToken);
      
      await prisma.tenantPaymentIntegration.upsert({
        where: { tenantId_provider: { tenantId: req.tenantId!, provider: 'MERCADO_PAGO' } },
        update: {
          publicKey: mpPublicKey,
          encryptedAccessToken: encryptedAccess,
          status: 'CONNECTED',
          connectionMethod: 'MANUAL_CREDENTIALS',
          connectedAt: new Date()
        },
        create: {
          tenantId: req.tenantId!,
          provider: 'MERCADO_PAGO',
          publicKey: mpPublicKey,
          encryptedAccessToken: encryptedAccess,
          status: 'CONNECTED',
          connectionMethod: 'MANUAL_CREDENTIALS',
          connectedAt: new Date()
        }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao atualizar configurações' });
  }
});

app.post('/api/settings/logo', ownerMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const file = req.file;
    // Clean original name (remove spaces and special chars)
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${req.tenantId}_${Date.now()}_${cleanName}`;

    const { data, error } = await supabase
      .storage
      .from('uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    const logoUrl = publicUrlData.publicUrl;

    const updated = await prisma.settings.update({
      where: { tenantId: req.tenantId! },
      data: { logoUrl }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor durante upload' });
  }
});
// --- Settings Banner Upload ---
app.post('/api/settings/banner', ownerMiddleware, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const file = req.file;
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${req.tenantId}_banner_${Date.now()}_${cleanName}`;

    const { data, error } = await supabase
      .storage
      .from('uploads')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage Error:', error);
      res.status(500).json({ error: 'Erro ao fazer upload do banner' });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    const bannerUrl = publicUrlData.publicUrl;

    const updated = await prisma.settings.update({
      where: { tenantId: req.tenantId! },
      data: { bannerUrl }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor durante upload' });
  }
});

// --- Neighborhood Fees ---
app.get('/api/neighborhoods', async (req, res) => {
  try {
    const neighborhoods = await prisma.neighborhoodFee.findMany({
      where: { tenantId: req.tenantId! },
      orderBy: [{ city: 'asc' }, { neighborhood: 'asc' }]
    });
    res.json(neighborhoods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar bairros' });
  }
});

app.post('/api/neighborhoods', ownerMiddleware, async (req, res) => {
  try {
    const { city, neighborhood, fee } = req.body;
    const created = await prisma.neighborhoodFee.create({
      data: {
        tenantId: req.tenantId!,
        city,
        neighborhood,
        fee: parseFloat(fee)
      }
    });
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar bairro. Talvez já exista.' });
  }
});

app.delete('/api/neighborhoods/:id', ownerMiddleware, async (req, res) => {
  try {
    const neighborhood = await prisma.neighborhoodFee.findUnique({ where: { id: req.params.id as string } });
    if (!neighborhood || neighborhood.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.neighborhoodFee.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao deletar bairro' });
  }
});

// --- Categories ---
app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { tenantId: req.tenantId! },
    orderBy: { sortOrder: 'asc' }
  });
  res.json(categories);
});

app.post('/api/categories', ownerMiddleware, async (req, res) => {
  try {
    const category = await prisma.category.create({ 
      data: { ...req.body, tenantId: req.tenantId! } 
    });
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar categoria' });
  }
});

app.delete('/api/categories/:id', ownerMiddleware, async (req, res) => {
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
});

// --- Products ---

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
      price: o.priceDeltaCents / 100
    }))
  }))
});

app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { tenantId: req.tenantId! },
    include: {
      category: true,
      optionGroups: { include: { options: true } }
    }
  });
  res.json(products.map(mapProduct));
});

app.get('/api/products/:id', async (req, res) => {
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
});

app.post('/api/products', ownerMiddleware, async (req, res) => {
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
});

app.put('/api/products/:id', ownerMiddleware, async (req, res) => {
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
});

app.delete('/api/products/:id', ownerMiddleware, async (req, res) => {
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
});

// --- Orders ---
app.get('/api/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { tenantId: req.tenantId! },
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

app.get('/api/customer/orders', async (req, res) => {
  // O ideal seria um middleware de auth para validar o token JWT e pegar o req.userId,
  // mas para simplificar vamos pegar do header (ou podemos decodificar o token aqui)
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'customer') return res.status(403).json({ error: 'Proibido' });
    
    const orders = await prisma.order.findMany({
      where: { tenantId: req.tenantId!, customerId: decoded.id },
      include: { items: true, restaurant: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

app.get('/api/customer/addresses', async (req, res) => {
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
});

app.post('/api/customer/addresses', async (req, res) => {
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
});

app.delete('/api/customer/addresses/:id', async (req, res) => {
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
});

app.get('/api/orders/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id as string },
    include: { items: true }
  });
  if (!order || order.tenantId !== req.tenantId) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(order);
});


app.post('/api/checkout/pix', async (req, res) => {
  try {
    const { items, total, customerName, customerPhone, document, addressStreet, addressNumber, addressCity, observation, couponCode, discountAmount, customerId } = req.body;
    
    // Get Tenant Settings to retrieve mpAccessToken
    const settings = await prisma.settings.findUnique({ where: { tenantId: req.tenantId! } });
    if (!settings || !settings.mpAccessToken) {
      return res.status(400).json({ error: 'Restaurante não configurou o Mercado Pago.' });
    }

    // Validação Segura do Carrinho
    const { subtotalCents, totalCents, snapshotItems } = await calculateOrderTotal(
      req.tenantId!, items, Math.round((discountAmount || 0) * 100), 0, couponCode
    );

    // Initialize MercadoPago
    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);

    // Create Order in DB as PAYMENT_PENDING
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const order = await prisma.order.create({
      data: {
        tenantId: req.tenantId!,
        orderNumber,
        customerNameSnapshot: customerName,
        customerPhoneSnapshot: customerPhone || '',
        status: 'PAYMENT_PENDING',
        subtotalCents,
        discountCents: Math.round((discountAmount || 0) * 100),
        totalCents,
        paymentMethod: 'PIX_APP',
        addressSnapshot: addressStreet ? `${addressStreet}, ${addressNumber} - ${addressCity}` : null,
        notes: observation || null,
        customerId,
        items: {
          create: snapshotItems
        }
      },
      include: { items: { include: { options: true } }, customer: true }
    });

    // Create Payment in Mercado Pago
    const mpResponse = await payment.create({
      body: {
        transaction_amount: totalCents / 100, // MercadoPago expects decimal
        description: `Pedido #${orderNumber} - ${settings.storeName}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@teste.com',
          first_name: customerName
        },
        external_reference: order.id,
        notification_url: `${process.env.PUBLIC_API_URL || 'https://sua-api.com'}/api/webhooks/mercadopago/${req.tenantId}`,
      }
    });

    const qrCode = mpResponse.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64;

    res.status(201).json({
      order,
      qrCode,
      qrCodeBase64
    });
  } catch (error: any) {
    console.error('Pix Checkout Error:', error);
    res.status(400).json({ error: error.message || 'Erro ao gerar PIX' });
  }
});



app.post('/api/webhooks/mercadopago/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const paymentId = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);
    
    res.status(200).send('OK');

    if (!paymentId) return;

    const settings = await prisma.settings.findUnique({ where: { tenantId } });
    if (!settings || !settings.mpAccessToken) return;

    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);
    const paymentInfo = await payment.get({ id: paymentId });

    if (paymentInfo.status === 'approved') {
      const orderId = paymentInfo.external_reference;
      if (orderId) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order && order.status === 'PAYMENT_PENDING') {
           const updatedOrder = await prisma.order.update({
             where: { id: orderId },
             data: { status: 'PENDING' }, // Now it goes to the kitchen!
             include: { items: true, customer: true }
           });
           io.to(tenantId).emit('new_order', updatedOrder);
        }
      }
    }
  } catch (err) {
    console.error('MP Webhook Error:', err);
  }
});



app.post('/api/checkout/card', async (req, res) => {
  try {
    const { items, total, customerName, customerPhone, addressStreet, addressNumber, addressCity, observation, couponCode, discountAmount, customerId, paymentData } = req.body;
    
    const settings = await prisma.settings.findUnique({ where: { tenantId: req.tenantId! } });
    if (!settings || !settings.mpAccessToken) {
      return res.status(400).json({ error: 'Restaurante não configurou o Mercado Pago.' });
    }

    const { subtotalCents, totalCents, snapshotItems } = await calculateOrderTotal(
      req.tenantId!, items, Math.round((discountAmount || 0) * 100), 0, couponCode
    );

    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    
    const mpResponse = await payment.create({
      body: {
        transaction_amount: totalCents / 100,
        description: `Pedido #${orderNumber} - ${settings.storeName}`,
        installments: paymentData.installments || 1,
        payment_method_id: paymentData.payment_method_id,
        token: paymentData.token,
        payer: {
          email: paymentData.payer?.email || 'cliente@teste.com',
          identification: paymentData.payer?.identification
        }
      }
    });

    if (mpResponse.status === 'approved' || mpResponse.status === 'in_process') {
      const dbStatus = mpResponse.status === 'approved' ? 'PENDING' : 'PAYMENT_PENDING';
      
      const order = await prisma.order.create({
        data: {
          tenantId: req.tenantId!,
          orderNumber,
          customerNameSnapshot: customerName,
          customerPhoneSnapshot: customerPhone || '',
          status: dbStatus,
          subtotalCents,
          discountCents: Math.round((discountAmount || 0) * 100),
          totalCents,
          paymentMethod: 'CREDIT_CARD_ONLINE',
          addressSnapshot: addressStreet ? `${addressStreet}, ${addressNumber} - ${addressCity}` : null,
          notes: observation || null,
          customerId,
          items: {
            create: snapshotItems
          }
        },
        include: { items: { include: { options: true } }, customer: true }
      });

      if (dbStatus === 'PENDING') {
        // @ts-ignore
        io.to(req.tenantId!).emit('new_order', order);
      }

      res.status(201).json({ order, paymentStatus: mpResponse.status });
    } else {
      res.status(400).json({ error: 'Pagamento recusado pelo banco. Verifique seus dados.' });
    }
  } catch (error: any) {
    console.error('Erro ao processar cartão:', error);
    res.status(400).json({ error: error.message || 'Erro interno ao processar pagamento.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerPhone, couponCode, discountAmount, paymentMethod, customerName, total, needsChange, changeAmount, addressStreet, addressNumber, addressCity, observation } = req.body;
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const restId = req.tenantId!;
    
    const { subtotalCents, totalCents, snapshotItems } = await calculateOrderTotal(
      restId, items, Math.round((discountAmount || 0) * 100), 0, couponCode
    );

    let customerId = null;
    let customerObj: any = null;
    if (customerPhone) {
      let customer = await prisma.customer.findUnique({ 
        where: { 
          phone_tenantId: { phone: customerPhone, tenantId: restId } 
        } 
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId: restId,
            name: customerName,
            phone: customerPhone,
          }
        });
      }
      
      const loyalty = await prisma.loyaltySettings.findUnique({ where: { tenantId: restId } });
      const points = (loyalty?.active) ? Math.floor(totalCents * (loyalty.pointsPerReal || 1)) : 0;

      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: customer.totalSpent + totalCents,
          ordersCount: customer.ordersCount + 1,
          loyaltyPts: customer.loyaltyPts + points,
        }
      });
      customerId = customer.id;
      customerObj = customer;
    }

    if (couponCode) {
      await prisma.coupon.updateMany({
        where: { code: couponCode, tenantId: restId },
        data: { used: { increment: 1 } }
      });
    }

    const isOnlinePayment = paymentMethod === 'MERCADO_PAGO_PIX' || paymentMethod === 'MERCADO_PAGO_CARD';
    const initialStatus = isOnlinePayment ? 'AWAITING_PAYMENT' : 'NEW';

    const order = await prisma.order.create({
      data: {
        addressSnapshot: addressStreet ? `${addressStreet}, ${addressNumber} - ${addressCity}` : null,
        notes: observation || null,
        changeForCents: needsChange && changeAmount ? Math.round(changeAmount * 100) : 0,
        customerNameSnapshot: customerName,
        customerPhoneSnapshot: customerPhone || '',
        tenantId: restId,
        orderNumber,
        status: initialStatus,
        paymentMethod,
        paymentType: paymentMethod,
        paymentStatus: isOnlinePayment ? 'PENDING' : 'NOT_REQUIRED',
        discountCents: Math.round((discountAmount || 0) * 100),
        subtotalCents,
        totalCents,
        customerId,
        items: {
          create: snapshotItems
        }
      },
      include: { items: { include: { options: true } }, customer: true }
    });

    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { lastOrderId: order.id }
      });
    }

    let paymentData = null;

    if (isOnlinePayment) {
      try {
        if (paymentMethod === 'MERCADO_PAGO_PIX') {
          paymentData = await createPixPayment(restId, order, {
            email: 'customer@pixelfood.com.br',
            name: customerObj?.name || customerName
          });
        } else if (paymentMethod === 'MERCADO_PAGO_CARD') {
          paymentData = await createCardPreference(restId, order);
        }
      } catch (err: any) {
        console.error('Falha ao gerar pagamento online:', err);
        // O pedido foi criado, mas o pagamento falhou
        return res.status(400).json({ error: 'Falha na integração de pagamento', details: err.message, order });
      }
    }

    if (!isOnlinePayment) {
      // @ts-ignore
      io.to(restId).emit('new_order', order);
    }

    res.status(201).json({ ...order, paymentData });
  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar pedido' });
  }
});


app.put('/api/orders/:id/status', ownerMiddleware, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const existingOrder = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!existingOrder || existingOrder.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { 
        status,
        statusHistories: {
          create: {
            tenantId: req.tenantId!,
            previousStatus: existingOrder.status,
            newStatus: status,
            userId: req.userId || null,
            reason: reason || null
          }
        }
      },
      include: { items: true }
    });
    
    // @ts-ignore
    io.to(req.tenantId!).emit('order_status_updated', order);
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao alterar status' });
  }
});

// --- Dashboard ---
app.get('/api/dashboard', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { tenantId: req.tenantId!, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.totalCents, 0);
    const totalOrders = orders.length;
    
    const chartData = [
      { name: 'Seg', vendas: 0 },
      { name: 'Ter', vendas: 0 },
      { name: 'Qua', vendas: 0 },
      { name: 'Qui', vendas: 0 },
      { name: 'Sex', vendas: 0 },
      { name: 'Sáb', vendas: 0 },
      { name: 'Dom', vendas: 0 },
    ];
    
    orders.forEach(order => {
      const dayIndex = new Date(order.createdAt).getDay();
      const mappedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      if(chartData[mappedIndex]) chartData[mappedIndex].vendas += order.totalCents;
    });

    res.json({
      totalRevenue,
      totalOrders,
      averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      chartData,
      recentOrders: orders.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

app.get('/api/dashboard/fechamento', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        tenantId: req.tenantId!,
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.totalCents, 0);
    const totalOrders = orders.length;

    let pix = 0;
    let cash = 0;
    let card = 0;

    orders.forEach(order => {
      if (order.paymentMethod === 'PIX') pix += order.totalCents;
      else if (order.paymentMethod === 'CASH') cash += order.totalCents;
      else card += order.totalCents;
    });

    res.json({
      date: new Date().toISOString(),
      totalRevenue,
      totalOrders,
      byMethod: { pix, cash, card }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar fechamento' });
  }
});

// --- Customers (CRM) ---
app.get('/api/customers', async (req, res) => {
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
});

app.get('/api/customers/:id', async (req, res) => {
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
});

// --- Coupons ---
app.get('/api/coupons', async (req, res) => {
  const coupons = await prisma.coupon.findMany({ 
    where: { tenantId: req.tenantId! },
    orderBy: { createdAt: 'desc' }
  });
  res.json(coupons);
});

app.post('/api/coupons', ownerMiddleware, async (req, res) => {
  try {
    const coupon = await prisma.coupon.create({ 
      data: { ...req.body, tenantId: req.tenantId! } 
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar cupom' });
  }
});

app.put('/api/coupons/:id/status', ownerMiddleware, async (req, res) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id as string } });
    if (!existing || existing.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id as string },
      data: { active: req.body.active }
    });
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar cupom' });
  }
});

app.delete('/api/customers/:id', ownerMiddleware, async (req, res) => {
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
});

app.delete('/api/coupons/:id', ownerMiddleware, async (req, res) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id as string } });
    if (!existing || existing.tenantId !== req.tenantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.coupon.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar cupom' });
  }
});

app.post('/api/orders/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await prisma.coupon.findUnique({ 
      where: { 
        code_tenantId: { code, tenantId: req.tenantId! } 
      } 
    });
    if (!coupon || !coupon.active) {
      res.status(400).json({ error: 'Cupom inválido ou inativo' });
      return;
    }
    if (coupon.usageLimit && coupon.used >= coupon.usageLimit) {
      res.status(400).json({ error: 'Cupom esgotado' });
      return;
    }
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao validar cupom' });
  }
});

// --- Loyalty Settings ---
app.get('/api/loyalty', async (req, res) => {
  let settings = await prisma.loyaltySettings.findUnique({
    where: { tenantId: req.tenantId! }
  });
  if (!settings) {
    settings = await prisma.loyaltySettings.create({ data: { tenantId: req.tenantId! } });
  }
  res.json(settings);
});

app.put('/api/loyalty', ownerMiddleware, async (req, res) => {
  try {
    let settings = await prisma.loyaltySettings.findUnique({
      where: { tenantId: req.tenantId! }
    });
    if (!settings) {
      settings = await prisma.loyaltySettings.create({ data: { tenantId: req.tenantId! } });
    }
    const updated = await prisma.loyaltySettings.update({
      where: { tenantId: req.tenantId! },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar fidelidade' });
  }
});

// ==========================================
// CAKTO WEBHOOK - Aprovação de Pagamentos
// ==========================================
app.post('/api/webhooks/cakto', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    // Na Cakto, geralmente o evento de pagamento aprovado é algo como "transaction.approved" ou "order.approved"
    if (event === 'transaction.approved' || event === 'order.approved' || data?.status === 'approved') {
      const email = data.customer?.email || data.email;
      if (!email) {
        return res.status(400).json({ error: 'Email não fornecido no webhook' });
      }

      const tenant = await prisma.tenant.findFirst({ where: { email } });
      if (tenant) {
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        await prisma.tenant.updateMany({
          where: { email },
          data: {
            operationalStatus: 'OPEN',
            subscriptionStatus: 'ACTIVE',
            deletedAt: nextMonth
          }
        });
        console.log(`[Cakto] Assinatura renovada para ${email}`);
      }
    }
    
    res.status(200).send('Webhook processado');
  } catch (error) {
    console.error('[Cakto] Erro no webhook:', error);
    res.status(500).send('Erro interno');
  }
});

const PORT = process.env.PORT || 4000;

// ==========================================
// Rota Mercado Pago Lojistas
// ==========================================
app.use('/api/mercadopago', mercadopagoRouter);

app.use(errorHandler);

// Start Background Jobs
startEmailWorker();

const httpServer = server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
const gracefulShutdown = async (signal: string) => {
  console.log(`\nRecebido ${signal}. Iniciando encerramento gracioso (Graceful Shutdown)...`);
  
  httpServer.close(async () => {
    console.log('Servidor HTTP encerrado.');
    try {
      await prisma.$disconnect();
      console.log('Conexão com banco de dados encerrada.');
      process.exit(0);
    } catch (err) {
      console.error('Erro ao encerrar banco de dados:', err);
      process.exit(1);
    }
  });

  // Forçar encerramento após 10 segundos se as conexões pendentes não finalizarem
  setTimeout(() => {
    console.error('Não foi possível fechar as conexões a tempo. Forçando encerramento.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
