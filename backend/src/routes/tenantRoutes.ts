import { Router } from 'express';
import { 
  getSettings, 
  updateSettings, 
  uploadLogo, 
  uploadBanner, 
  getNeighborhoods, 
  createNeighborhood, 
  deleteNeighborhood, 
  getDashboard, 
  getDashboardFechamento, 
  getLoyalty, 
  updateLoyalty 
} from '../controllers/tenantController';
import { ownerMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// Todas as rotas de tenant dependem do tenantMiddleware
router.use(tenantMiddleware);

// --- Configurações da Loja ---
router.get('/settings', getSettings);
router.put('/settings', ownerMiddleware, updateSettings);
router.post('/settings/logo', ownerMiddleware, upload.single('logo'), uploadLogo);
router.post('/settings/banner', ownerMiddleware, upload.single('banner'), uploadBanner);

// --- Bairros (Áreas de Entrega) ---
router.get('/neighborhoods', getNeighborhoods);
router.post('/neighborhoods', ownerMiddleware, createNeighborhood);
router.delete('/neighborhoods/:id', ownerMiddleware, deleteNeighborhood);

// --- Dashboard ---
router.get('/dashboard', ownerMiddleware, getDashboard);
router.get('/dashboard/fechamento', ownerMiddleware, getDashboardFechamento);

// --- Programa de Fidelidade ---
router.get('/loyalty', getLoyalty);
router.put('/loyalty', ownerMiddleware, updateLoyalty);

// --- Assinaturas ---
import { getPlans, getSubscriptionCheckout, cancelSubscription } from '../controllers/tenantController';
router.get('/plans', getPlans);
router.get('/subscription/checkout', ownerMiddleware, getSubscriptionCheckout);
router.post('/subscription/cancel', ownerMiddleware, cancelSubscription);

export default router;
