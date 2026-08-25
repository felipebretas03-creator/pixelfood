import { Router } from 'express';
import { getRestaurants, toggleRestaurantStatus } from '../controllers/masterController';
import { masterMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas master requerem masterMiddleware
router.use(masterMiddleware);

router.get('/restaurants', getRestaurants);
router.post('/restaurants/:id/toggle', toggleRestaurantStatus);

export default router;
