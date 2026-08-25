import { Router } from 'express';
import { 
  getCoupons, 
  createCoupon, 
  updateCouponStatus, 
  deleteCoupon 
} from '../controllers/couponController';
import { ownerMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// Todas as rotas de cupons dependem do tenantMiddleware
router.use(tenantMiddleware);

// Rotas do Lojista
router.get('/coupons', ownerMiddleware, getCoupons);
router.post('/coupons', ownerMiddleware, createCoupon);
router.put('/coupons/:id/status', ownerMiddleware, updateCouponStatus);
router.delete('/coupons/:id', ownerMiddleware, deleteCoupon);

export default router;
