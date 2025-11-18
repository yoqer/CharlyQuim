import express from 'express';
import { authController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes (with rate limiting)
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authRateLimiter, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.patch('/update-password', protect, authController.updatePassword);
router.patch('/update-profile', protect, authController.updateProfile);
router.post('/resend-verification', protect, authController.resendVerification);

export default router;
