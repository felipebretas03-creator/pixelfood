import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Headers de segurança HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Desativado pois o Next.js gerencia no frontend
  crossOriginEmbedderPolicy: false,
}));

// Origens permitidas
const allowedOrigins = [
  'https://pixelfood-frontend.vercel.app',
  'https://painel-pixelfood.vercel.app',
  'https://frontend-pixelfood.vercel.app',
  'https://painel-pixelfood.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (mobile, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') // Permite preview deployments da Vercel
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS bloqueado: origem não permitida — ${origin}`));
  },
  credentials: true,
}));

// Rate Limit — rotas de autenticação (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                   // Máx 20 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// Rate Limit geral — proteção contra abuso
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200,                 // Máx 200 req/min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de requisições excedido. Tente novamente em instantes.' },
  skip: (req) => req.path.startsWith('/api/health'), // Não limita health check
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request ID Middleware
app.use((req, res, next) => {
  const reqId = uuidv4();
  req.headers['x-request-id'] = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
});

// Structured Logging
morgan.token('reqId', (req: express.Request) => req.headers['x-request-id'] as string);
app.use(morgan('[:date[iso]] [ReqID: :reqId] :method :url :status :res[content-length] - :response-time ms'));

import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tenantRoutes from './routes/tenantRoutes';
import masterRoutes from './routes/master';
import customerRoutes from './routes/customerRoutes';
import couponRoutes from './routes/couponRoutes';
import checkoutRoutes from './routes/checkoutRoutes';
import mercadopagoRouter from './routes/mercadopago';

// Rate limit específico nas rotas de autenticação
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);

// Montagem das rotas
app.use('/api/auth', authRoutes);
app.use('/api', orderRoutes);
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', tenantRoutes);
app.use('/api/master', masterRoutes);
app.use('/api', customerRoutes);
app.use('/api', couponRoutes);
app.use('/api', checkoutRoutes);
app.use('/api/mercadopago', mercadopagoRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Global Error Handler
app.use(errorHandler);

export default app;
