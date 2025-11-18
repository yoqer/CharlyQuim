import express from 'express';
import { userController } from '../controllers/user.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Get current user profile (same as /auth/me but organized here)
router.get('/profile', userController.getProfile);

// Update current user profile
router.patch('/profile', userController.updateProfile);

// Delete account
router.delete('/account', userController.deleteAccount);

// Admin routes - user management
router.get('/', restrictTo('admin'), userController.getAllUsers);
router.get('/:userId', restrictTo('admin'), userController.getUserById);
router.patch('/:userId', restrictTo('admin'), userController.updateUser);
router.delete('/:userId', restrictTo('admin'), userController.deleteUser);

export default router;
