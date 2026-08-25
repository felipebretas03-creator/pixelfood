import { Router } from 'express';
import { 
  getCategories, 
  createCategory, 
  deleteCategory 
} from '../controllers/categoryController';
import { ownerMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// Todas as rotas de categorias dependem do tenantMiddleware
router.use(tenantMiddleware);

// Rotas públicas (Clientes)
router.get('/categories', getCategories);

// Rotas privadas (Lojista)
router.post('/categories', ownerMiddleware, createCategory);
router.delete('/categories/:id', ownerMiddleware, deleteCategory);

export default router;
