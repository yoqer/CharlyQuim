import express from 'express';
import { usageController } from '../controllers/usage.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { apiUsageRateLimiter } from '../middleware/rateLimiter.middleware';

const router = express.Router();

// All usage routes require authentication
router.use(protect);

// Get current user's usage statistics
router.get('/stats', usageController.getUserStats);

// Get current user's daily usage
router.get('/daily', usageController.getDailyUsage);

// Get current user's usage for a specific service
router.get('/service/:service', usageController.getServiceUsage);

// Get usage history (with date range)
router.get('/history', usageController.getUsageHistory);

// Get remaining quota for all services
router.get('/quota', usageController.getRemainingQuota);

// Admin routes
router.get('/all', restrictTo('admin'), usageController.getAllUsage);
router.get('/user/:userId', restrictTo('admin'), usageController.getUserUsageById);
router.delete('/reset/:userId', restrictTo('admin'), usageController.resetUserUsage);

// API proxy endpoints with usage tracking
router.post(
  '/api/traqauto',
  apiUsageRateLimiter,
  usageController.proxyTraqAuto
);

router.post(
  '/api/claude',
  apiUsageRateLimiter,
  usageController.proxyClaude
);

router.post(
  '/api/gpt4',
  apiUsageRateLimiter,
  usageController.proxyGPT4
);

export default router;
