import { Router } from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';
import { ownerMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// Todas as rotas de produtos dependem do tenantMiddleware
router.use(tenantMiddleware);

// Rotas públicas (Clientes)
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Rotas privadas (Lojista)
router.post('/products', ownerMiddleware, createProduct);
router.put('/products/:id', ownerMiddleware, updateProduct);
router.delete('/products/:id', ownerMiddleware, deleteProduct);

export default router;
