import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Payment } from 'mercadopago';

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
app.use(express.json());

// Extend Express Request
declare module 'express-serve-static-core' {
  interface Request {
    restaurantId?: string;
  }
}

// ==========================================
// SOCKET.IO REALTIME EVENTS
// ==========================================
io.on('connection', (socket) => {
  console.log('🔗 Novo cliente conectado:', socket.id);

  socket.on('join_restaurant', (restaurantId) => {
    socket.join(restaurantId);
    console.log(`Cliente ${socket.id} entrou na sala do restaurante ${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado:', socket.id);
  });
});

// ==========================================
// MIDDLEWARES E AUTH
// ==========================================

// Registro do Lojista
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Todos os campos são obrigatórios' });

  try {
    const existing = await prisma.restaurant.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Garantir que o slug seja único
    let finalSlug = slug;
    let counter = 1;
    while (await prisma.restaurant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        slug: finalSlug,
        settings: { create: { storeName: name } }
      }
    });

    const token = jwt.sign({ id: restaurant.id, role: 'owner' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, email: restaurant.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar restaurante' });
  }
});

// Login do Lojista
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

  const restaurant = await prisma.restaurant.findUnique({ where: { email } });
  if (!restaurant || !restaurant.password) {
    return res.status(404).json({ error: 'Credenciais inválidas' });
  }

  const isValid = await bcrypt.compare(password, restaurant.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  if (!restaurant.active) {
    return res.status(403).json({ error: 'Conta bloqueada' });
  }

  const token = jwt.sign({ id: restaurant.id, role: 'owner', isMaster: restaurant.isMaster }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

  res.json({
    token,
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    email: restaurant.email,
    isMaster: restaurant.isMaster
  });
});


const tenantMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const slug = req.headers['x-restaurant-slug'] as string;
  const id = req.headers['x-restaurant-id'] as string;
  
  let restaurant;
  if (id) {
    restaurant = await prisma.restaurant.findUnique({ where: { id } });
  } else if (slug) {
    restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  } else {
    // Fallback: pega o último restaurante criado (útil para testes locais)
    restaurant = await prisma.restaurant.findFirst({
      orderBy: { createdAt: 'desc' }
    });
  }

  if (!restaurant) {
    res.status(404).json({ error: 'Restaurante não encontrado' });
    return;
  }

  req.restaurantId = restaurant.id;
  next();
};

app.get('/', (req, res) => {
  res.send('PixelFood SaaS API is running! 🚀');
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
    const existing = await prisma.customer.findUnique({ where: { email_restaurantId: { email, restaurantId: req.restaurantId! } } });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado neste restaurante' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        restaurantId: req.restaurantId!
      }
    });

    const token = jwt.sign({ id: customer.id, role: 'customer', restaurantId: req.restaurantId! }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
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

  const customer = await prisma.customer.findUnique({ where: { email_restaurantId: { email, restaurantId: req.restaurantId! } } });
  if (!customer || !customer.password) {
    return res.status(404).json({ error: 'Credenciais inválidas' });
  }

  const isValid = await bcrypt.compare(password, customer.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: customer.id, role: 'customer', restaurantId: req.restaurantId! }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

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
    if (decoded.role !== 'owner' || !decoded.isMaster) {
      return res.status(403).json({ error: 'Proibido' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

app.get('/api/master/restaurants', masterMiddleware, async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        settings: true,
        orders: { select: { id: true, total: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Transform data for the frontend
    const data = restaurants.map(r => {
      const ordersCount = r.orders.length;
      const totalRevenue = r.orders.reduce((acc, o) => acc + o.total, 0);
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        slug: r.slug,
        isMaster: r.isMaster,
        active: r.active,
        createdAt: r.createdAt,
        storeName: r.settings?.storeName || r.name,
        ordersCount,
        totalRevenue
      };
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar restaurantes' });
  }
});

app.post('/api/master/restaurants/:id/toggle', masterMiddleware, async (req, res) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurante não encontrado' });
    
    if (restaurant.isMaster) return res.status(400).json({ error: 'Não é possível bloquear o Master' });
    
    const updated = await prisma.restaurant.update({
      where: { id: req.params.id },
      data: { active: !restaurant.active }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status' });
  }
});


const ownerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Não autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'owner' || decoded.id !== req.restaurantId) {
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
    where: { restaurantId: req.restaurantId! }
  });
  if (!settings) {
    settings = await prisma.settings.create({ data: { restaurantId: req.restaurantId! } });
  }
  res.json(settings);
});

app.put('/api/settings', ownerMiddleware, async (req, res) => {
  try {
    const { 
      storeName, primaryColor, deliveryType, deliveryFee, isOpen, 
      mpAccessToken, mpPublicKey, 
      acceptPix, acceptCreditCardOnline, acceptCardMachine, acceptCash 
    } = req.body;
    
    let settings = await prisma.settings.findUnique({
      where: { restaurantId: req.restaurantId! }
    });
    
    if (!settings) {
      settings = await prisma.settings.create({ data: { restaurantId: req.restaurantId! } });
    }

    const updated = await prisma.settings.update({
      where: { restaurantId: req.restaurantId! },
      data: {
        storeName: storeName !== undefined ? storeName : settings.storeName,
        primaryColor: primaryColor !== undefined ? primaryColor : settings.primaryColor,
        deliveryType: deliveryType !== undefined ? deliveryType : settings.deliveryType,
        deliveryFee: deliveryFee !== undefined ? Number(deliveryFee) : settings.deliveryFee,
        isOpen: isOpen !== undefined ? isOpen : settings.isOpen,
        mpAccessToken: mpAccessToken !== undefined ? mpAccessToken : settings.mpAccessToken,
        mpPublicKey: mpPublicKey !== undefined ? mpPublicKey : settings.mpPublicKey,
        acceptPix: acceptPix !== undefined ? acceptPix : settings.acceptPix,
        acceptCreditCardOnline: acceptCreditCardOnline !== undefined ? acceptCreditCardOnline : settings.acceptCreditCardOnline,
        acceptCardMachine: acceptCardMachine !== undefined ? acceptCardMachine : settings.acceptCardMachine,
        acceptCash: acceptCash !== undefined ? acceptCash : settings.acceptCash,
      }
    });

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
    const fileName = `${req.restaurantId}_${Date.now()}_${cleanName}`;

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
      where: { restaurantId: req.restaurantId! },
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
    const fileName = `${req.restaurantId}_banner_${Date.now()}_${cleanName}`;

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
      where: { restaurantId: req.restaurantId! },
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
      where: { restaurantId: req.restaurantId! },
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
        restaurantId: req.restaurantId!,
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
    if (!neighborhood || neighborhood.restaurantId !== req.restaurantId) {
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
    where: { restaurantId: req.restaurantId! },
    orderBy: { order: 'asc' }
  });
  res.json(categories);
});

app.post('/api/categories', ownerMiddleware, async (req, res) => {
  try {
    const category = await prisma.category.create({ 
      data: { ...req.body, restaurantId: req.restaurantId! } 
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
    if (!category || category.restaurantId !== req.restaurantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }
    await prisma.category.delete({
      where: { id: req.params.id as string }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao deletar categoria' });
  }
});

// --- Products ---
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany({
    where: { restaurantId: req.restaurantId! },
    include: {
      modifiers: {
        include: { options: true }
      }
    }
  });
  res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
    include: {
      modifiers: {
        include: { options: true }
      }
    }
  });
  // Check tenant
  if (!product || product.restaurantId !== req.restaurantId) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(product);
});

app.post('/api/products', ownerMiddleware, async (req, res) => {
  try {
    const { modifiers, ...productData } = req.body;
    const product = await prisma.product.create({ 
      data: {
        ...productData,
        restaurantId: req.restaurantId!,
        modifiers: modifiers ? {
          create: modifiers.map((mod: any) => ({
            name: mod.name,
            min: mod.min,
            max: mod.max,
            options: {
              create: mod.options.map((opt: any) => ({
                name: opt.name,
                price: opt.price
              }))
            }
          }))
        } : undefined
      },
      include: {
        modifiers: { include: { options: true } }
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar produto' });
  }
});

app.put('/api/products/:id', ownerMiddleware, async (req, res) => {
  try {
    const { modifiers, ...productData } = req.body;
    
    const prod = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!prod || prod.restaurantId !== req.restaurantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }

    await prisma.productModifierGroup.deleteMany({
      where: { productId: req.params.id as string }
    });

    const product = await prisma.product.update({
      where: { id: req.params.id as string },
      data: {
        ...productData,
        modifiers: modifiers ? {
          create: modifiers.map((mod: any) => ({
            name: mod.name,
            min: mod.min,
            max: mod.max,
            options: {
              create: mod.options.map((opt: any) => ({
                name: opt.name,
                price: opt.price
              }))
            }
          }))
        } : undefined
      },
      include: {
        modifiers: { include: { options: true } }
      }
    });
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao atualizar produto' });
  }
});

app.delete('/api/products/:id', ownerMiddleware, async (req, res) => {
  try {
    const prod = await prisma.product.findUnique({ where: { id: req.params.id as string } });
    if (!prod || prod.restaurantId !== req.restaurantId) {
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
    where: { restaurantId: req.restaurantId! },
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
      where: { restaurantId: req.restaurantId!, customerId: decoded.id },
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
  if (!order || order.restaurantId !== req.restaurantId) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(order);
});


app.post('/api/checkout/pix', async (req, res) => {
  try {
    const { items, total, customerName, phone, document, addressStreet, addressNumber, addressCity, observation, couponCode, discountAmount, customerId } = req.body;
    
    // Get Restaurant Settings to retrieve mpAccessToken
    const settings = await prisma.settings.findUnique({ where: { restaurantId: req.restaurantId! } });
    if (!settings || !settings.mpAccessToken) {
      return res.status(400).json({ error: 'Restaurante não configurou o Mercado Pago.' });
    }

    // Initialize MercadoPago
    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);

    // Create Order in DB as PAYMENT_PENDING
    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    const order = await prisma.order.create({
      data: {
        restaurantId: req.restaurantId!,
        orderNumber,
        customerName,
        status: 'PAYMENT_PENDING',
        total,
        paymentMethod: 'PIX_APP', // Indicates automatic PIX
        addressStreet,
        addressNumber,
        addressCity,
        observation,
        couponCode,
        discountAmount: discountAmount || 0,
        customerId,
        items: {
          create: items.map((item: any) => ({
            productId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            observation: item.observation,
            optionsData: item.options ? JSON.stringify(item.options) : null
          }))
        }
      },
      include: { items: true, customer: true }
    });

    // Create Payment in Mercado Pago
    const mpResponse = await payment.create({
      body: {
        transaction_amount: total,
        description: `Pedido #${orderNumber} - ${settings.storeName}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@teste.com',
          first_name: customerName,
        },
        external_reference: order.id, // We link MP with our Order ID
        notification_url: `${process.env.PUBLIC_API_URL || 'https://sua-api.com'}/api/webhooks/mercadopago/${req.restaurantId}`,
      }
    });

    const qrCode = mpResponse.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64;

    res.status(201).json({
      order,
      pix: {
        qrCode,
        qrCodeBase64
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({ error: 'Erro ao gerar pagamento via PIX' });
  }
});



app.post('/api/webhooks/mercadopago/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const paymentId = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);
    
    res.status(200).send('OK');

    if (!paymentId) return;

    const settings = await prisma.settings.findUnique({ where: { restaurantId } });
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
           io.to(restaurantId).emit('new_order', updatedOrder);
        }
      }
    }
  } catch (err) {
    console.error('MP Webhook Error:', err);
  }
});



app.post('/api/checkout/card', async (req, res) => {
  try {
    const { items, total, customerName, phone, addressStreet, addressNumber, addressCity, observation, couponCode, discountAmount, customerId, paymentData } = req.body;
    
    // Get Restaurant Settings to retrieve mpAccessToken
    const settings = await prisma.settings.findUnique({ where: { restaurantId: req.restaurantId! } });
    if (!settings || !settings.mpAccessToken) {
      return res.status(400).json({ error: 'Restaurante não configurou o Mercado Pago.' });
    }

    // Initialize MercadoPago
    const client = new MercadoPagoConfig({ accessToken: settings.mpAccessToken });
    const payment = new Payment(client);

    const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create Payment in Mercado Pago
    const mpResponse = await payment.create({
      body: {
        transaction_amount: total,
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
          restaurantId: req.restaurantId!,
          orderNumber,
          customerName,
          status: dbStatus,
          total,
          paymentMethod: 'CREDIT_CARD_ONLINE',
          addressStreet,
          addressNumber,
          addressCity,
          observation,
          couponCode,
          discountAmount: discountAmount || 0,
          customerId,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              observation: item.observation,
              optionsData: item.options ? JSON.stringify(item.options) : null
            }))
          }
        },
        include: { items: true, customer: true }
      });

      if (dbStatus === 'PENDING') {
        io.to(req.restaurantId!).emit('new_order', order);
      }

      res.status(201).json({ order, paymentStatus: mpResponse.status });
    } else {
      res.status(400).json({ error: 'Pagamento recusado pelo banco. Verifique seus dados.' });
    }
  } catch (error) {
    console.error('Erro ao processar cartão:', error);
    res.status(500).json({ error: 'Erro interno ao processar pagamento.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customerPhone, couponCode, discountAmount, ...orderData } = req.body;
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const restId = req.restaurantId!;
    
    // Process items
    const cleanItems = items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      observation: item.observation,
      optionsData: item.options ? JSON.stringify(item.options) : null
    }));

    // CRM Logic: Find or Create Customer
    let customerId = null;
    if (customerPhone) {
      // Find unique by phone + restaurantId
      let customer = await prisma.customer.findUnique({ 
        where: { 
          phone_restaurantId: { phone: customerPhone, restaurantId: restId } 
        } 
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            restaurantId: restId,
            name: orderData.customerName,
            phone: customerPhone,
          }
        });
      }
      
      // Calculate loyalty points
      const loyalty = await prisma.loyaltySettings.findUnique({ where: { restaurantId: restId } });
      const points = (loyalty?.active) ? Math.floor(orderData.total * (loyalty.pointsPerReal || 1)) : 0;

      // Update Customer Stats
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: customer.totalSpent + orderData.total,
          ordersCount: customer.ordersCount + 1,
          loyaltyPts: customer.loyaltyPts + points,
        }
      });
      customerId = customer.id;
    }

    // Process Coupon Usage
    if (couponCode) {
      await prisma.coupon.updateMany({
        where: { code: couponCode, restaurantId: restId },
        data: { used: { increment: 1 } }
      });
    }

    // Create Order
    const order = await prisma.order.create({
      data: {
        ...orderData,
        restaurantId: restId,
        orderNumber,
        couponCode,
        discountAmount: discountAmount || 0,
        customerId,
        items: {
          create: cleanItems
        }
      },
      include: { items: true, customer: true }
    });

    // Update last order ID on customer
    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { lastOrderId: order.id }
      });
    }

    // Emit to specific restaurant room
    io.to(req.restaurantId!).emit('new_order', order);
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar pedido' });
  }
});

app.put('/api/orders/:id/status', ownerMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const existingOrder = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!existingOrder || existingOrder.restaurantId !== req.restaurantId) {
       res.status(404).json({ error: 'Not found' });
       return;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { status },
      include: { items: true }
    });
    
    io.to(req.restaurantId!).emit('order_status_updated', order);
    
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao atualizar status do pedido' });
  }
});

// --- Dashboard ---
app.get('/api/dashboard', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { restaurantId: req.restaurantId!, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
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
      if(chartData[mappedIndex]) chartData[mappedIndex].vendas += order.total;
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
        restaurantId: req.restaurantId!,
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = orders.length;

    let pix = 0;
    let cash = 0;
    let card = 0;

    orders.forEach(order => {
      if (order.paymentMethod === 'PIX') pix += order.total;
      else if (order.paymentMethod === 'CASH') cash += order.total;
      else card += order.total;
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
      where: { restaurantId: req.restaurantId! },
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
    if (!customer || customer.restaurantId !== req.restaurantId) {
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
    where: { restaurantId: req.restaurantId! },
    orderBy: { createdAt: 'desc' }
  });
  res.json(coupons);
});

app.post('/api/coupons', ownerMiddleware, async (req, res) => {
  try {
    const coupon = await prisma.coupon.create({ 
      data: { ...req.body, restaurantId: req.restaurantId! } 
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar cupom' });
  }
});

app.put('/api/coupons/:id/status', ownerMiddleware, async (req, res) => {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id as string } });
    if (!existing || existing.restaurantId !== req.restaurantId) {
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
    if (!customer || customer.restaurantId !== req.restaurantId) {
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
    if (!existing || existing.restaurantId !== req.restaurantId) {
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
        code_restaurantId: { code, restaurantId: req.restaurantId! } 
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
    where: { restaurantId: req.restaurantId! }
  });
  if (!settings) {
    settings = await prisma.loyaltySettings.create({ data: { restaurantId: req.restaurantId! } });
  }
  res.json(settings);
});

app.put('/api/loyalty', ownerMiddleware, async (req, res) => {
  try {
    let settings = await prisma.loyaltySettings.findUnique({
      where: { restaurantId: req.restaurantId! }
    });
    if (!settings) {
      settings = await prisma.loyaltySettings.create({ data: { restaurantId: req.restaurantId! } });
    }
    const updated = await prisma.loyaltySettings.update({
      where: { restaurantId: req.restaurantId! },
      data: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar fidelidade' });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🔥 PixelFood API rodando na porta ${PORT}`);
});
