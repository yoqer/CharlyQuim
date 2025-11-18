import express from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { webhookRateLimiter } from '../middleware/rateLimiter.middleware';

const router = express.Router();

// Stripe webhook (no auth required, uses Stripe signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  webhookRateLimiter,
  subscriptionController.handleWebhook
);

// Protected routes - require authentication
router.use(protect);

// Get current subscription
router.get('/current', subscriptionController.getCurrentSubscription);

// Get subscription plans
router.get('/plans', subscriptionController.getPlans);

// Create checkout session (upgrade/subscribe)
router.post('/create-checkout-session', subscriptionController.createCheckoutSession);

// Create customer portal session (manage subscription)
router.post('/create-portal-session', subscriptionController.createPortalSession);

// Cancel subscription
router.post('/cancel', subscriptionController.cancelSubscription);

// Resume canceled subscription
router.post('/resume', subscriptionController.resumeSubscription);

// Admin routes
router.get('/all', restrictTo('admin'), subscriptionController.getAllSubscriptions);
router.get('/:userId', restrictTo('admin'), subscriptionController.getUserSubscription);
router.patch('/:userId', restrictTo('admin'), subscriptionController.updateSubscription);

export default router;
