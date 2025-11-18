import { Request, Response } from 'express';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { catchAsync, CustomError } from '../middleware/error.middleware';
import jwt from 'jsonwebtoken';

/**
 * Send token response
 */
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
  };

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    status: 'success',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        subscription: user.subscription,
      },
      token,
      refreshToken,
    },
  });
};

export const authController = {
  /**
   * Register new user
   */
  register: catchAsync(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      throw new CustomError('Please provide email, password, and name', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new CustomError('User with this email already exists', 400);
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
    });

    // Create free subscription for new user
    const subscription = await Subscription.create({
      user: user._id,
      tier: 'free',
      status: 'active',
    });

    // Update user with subscription reference
    user.subscription = subscription._id;
    await user.save();

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    sendTokenResponse(user, 201, res);
  }),

  /**
   * Login user
   */
  login: catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new CustomError('Please provide email and password', 400);
    }

    // Check if user exists (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('subscription');

    if (!user || !(await user.comparePassword(password))) {
      throw new CustomError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  }),

  /**
   * Logout user
   */
  logout: catchAsync(async (req: Request, res: Response) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  }),

  /**
   * Get current user
   */
  getMe: catchAsync(async (req: Request, res: Response) => {
    const user = await User.findById(req.user?._id).populate('subscription');

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  }),

  /**
   * Update user password
   */
  updatePassword: catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new CustomError('Please provide current and new password', 400);
    }

    // Get user with password
    const user = await User.findById(req.user?._id).select('+password');

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    // Check current password
    if (!(await user.comparePassword(currentPassword))) {
      throw new CustomError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  }),

  /**
   * Update user profile
   */
  updateProfile: catchAsync(async (req: Request, res: Response) => {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { name },
      { new: true, runValidators: true }
    ).populate('subscription');

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  }),

  /**
   * Refresh JWT token
   */
  refreshToken: catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new CustomError('Refresh token is required', 400);
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret'
      ) as any;

      const user = await User.findById(decoded.id).populate('subscription');

      if (!user) {
        throw new CustomError('User not found', 404);
      }

      sendTokenResponse(user, 200, res);
    } catch (error) {
      throw new CustomError('Invalid or expired refresh token', 401);
    }
  }),

  /**
   * Verify email
   */
  verifyEmail: catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as any;

      const user = await User.findById(decoded.id).select(
        '+emailVerificationToken +emailVerificationExpires'
      );

      if (!user) {
        throw new CustomError('Invalid verification token', 400);
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        throw new CustomError('Verification token has expired', 400);
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully',
      });
    } catch (error) {
      throw new CustomError('Invalid or expired verification token', 400);
    }
  }),

  /**
   * Resend verification email
   */
  resendVerification: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new CustomError('Not authenticated', 401);
    }

    if (req.user.isEmailVerified) {
      throw new CustomError('Email is already verified', 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent',
    });
  }),

  /**
   * Forgot password
   */
  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new CustomError('Please provide email address', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      res.status(200).json({
        status: 'success',
        message: 'If email exists, password reset link has been sent',
      });
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send password reset email
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      status: 'success',
      message: 'Password reset link has been sent to your email',
    });
  }),

  /**
   * Reset password
   */
  resetPassword: catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new CustomError('Please provide new password', 400);
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as any;

      const user = await User.findById(decoded.id)
        .select('+passwordResetToken +passwordResetExpires')
        .select('+password');

      if (!user) {
        throw new CustomError('Invalid reset token', 400);
      }

      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        throw new CustomError('Reset token has expired', 400);
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      sendTokenResponse(user, 200, res);
    } catch (error) {
      throw new CustomError('Invalid or expired reset token', 400);
    }
  }),
};
