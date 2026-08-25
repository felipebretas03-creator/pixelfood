import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
import masterRoutes from './routes/masterRoutes';
import customerRoutes from './routes/customerRoutes';
import couponRoutes from './routes/couponRoutes';
import checkoutRoutes from './routes/checkoutRoutes';
import mercadopagoRouter from './routes/mercadopago'; // Rota existente

// Mount routes here
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
// app.use('/api', tenantMiddleware, routes);

// Global Error Handler
app.use(errorHandler);

export default app;
