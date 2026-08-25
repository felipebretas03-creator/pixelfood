import { Router } from 'express';
import { 
  getOrdersOwner, 
  getOrdersCustomer, 
  getOrderById, 
  createOrder, 
  updateOrderStatus, 
  validateCoupon 
} from '../controllers/orderController';
import { ownerMiddleware, customerMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// ==========================================
// CUSTOMER ROUTES
// ==========================================
// Rotas de cliente que usam o tenantMiddleware para saber a qual loja o pedido pertence
router.get('/customer/orders', tenantMiddleware, customerMiddleware, getOrdersCustomer);
router.post('/orders', tenantMiddleware, createOrder);
router.post('/orders/validate-coupon', tenantMiddleware, validateCoupon);

// Rota compartilhada (busca pelo ID). Pode ser acessada pelo cliente sem auth no app, ou com auth
router.get('/orders/:id', tenantMiddleware, getOrderById);

// ==========================================
// OWNER ROUTES
// ==========================================
// Rotas de lojista que usam o ownerMiddleware para garantir acesso
router.get('/orders', tenantMiddleware, ownerMiddleware, getOrdersOwner);
router.put('/orders/:id/status', tenantMiddleware, ownerMiddleware, updateOrderStatus);

export default router;
