import { Router } from 'express';
import { 
  registerOwner, 
  loginOwner, 
  registerCustomer, 
  loginCustomer 
} from '../controllers/authController';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// Lojista (Owner)
router.post('/register', registerOwner);
router.post('/login', loginOwner);

// Cliente (Customer) - Requer tenantMiddleware para saber de qual loja é o cliente
router.post('/customer/register', tenantMiddleware, registerCustomer);
router.post('/customer/login', tenantMiddleware, loginCustomer);

export default router;
