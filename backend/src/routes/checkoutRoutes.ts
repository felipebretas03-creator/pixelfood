import { Router } from 'express';
import { 
  createPixCheckout, 
  createCardCheckout, 
  mercadoPagoWebhook, 
  caktoWebhook 
} from '../controllers/checkoutController';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();

// Webhooks
// Importante: Os webhooks geralmente não usam tenantMiddleware porque o provedor 
// de pagamento não envia os headers 'x-tenant-slug', mas o ID pode vir na URL.
router.post('/webhooks/mercadopago/:tenantId', mercadoPagoWebhook);
router.post('/webhooks/cakto', caktoWebhook);

// Checkouts (Requerem o tenantMiddleware)
router.post('/checkout/pix', tenantMiddleware, createPixCheckout);
router.post('/checkout/card', tenantMiddleware, createCardCheckout);

export default router;
