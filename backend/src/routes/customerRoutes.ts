import { Router } from 'express';
import { 
  updateProfile, 
  getAddresses, 
  createAddress, 
  deleteAddress, 
  getCustomersOwner, 
  getCustomerByIdOwner, 
  deleteCustomerOwner 
} from '../controllers/customerController';
import { customerMiddleware, ownerMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// Todas as rotas usam tenantMiddleware
router.use(tenantMiddleware);

// --- Rotas do Cliente (Customer App) ---
router.put('/customer/profile', customerMiddleware, updateProfile);
router.get('/customer/addresses', customerMiddleware, getAddresses);
router.post('/customer/addresses', customerMiddleware, createAddress);
router.delete('/customer/addresses/:id', customerMiddleware, deleteAddress);

// --- Rotas do Lojista (Owner Panel) ---
router.get('/customers', ownerMiddleware, getCustomersOwner);
router.get('/customers/:id', ownerMiddleware, getCustomerByIdOwner);
router.delete('/customers/:id', ownerMiddleware, deleteCustomerOwner);

export default router;
