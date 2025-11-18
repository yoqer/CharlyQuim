import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Subscription } from '../models/Subscription';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route. Please login.',
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as JWTPayload;

      // Get user from token
      const user = await User.findById(decoded.id).populate('subscription');

      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'User not found. Token is invalid.',
        });
        return;
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        status: 'error',
        message: 'Token is invalid or expired',
      });
      return;
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Authentication error',
    });
    return;
  }
};

/**
 * Middleware to restrict access to specific roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has an active subscription
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const subscription = await Subscription.findOne({ user: req.user._id });

    if (!subscription) {
      res.status(403).json({
        status: 'error',
        message: 'No subscription found',
      });
      return;
    }

    if (!subscription.isActive()) {
      res.status(403).json({
        status: 'error',
        message: 'Your subscription is not active',
        subscription: {
          tier: subscription.tier,
          status: subscription.status,
        },
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking subscription status',
    });
    return;
  }
};

/**
 * Middleware to check if user's email is verified
 */
export const requireEmailVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Not authenticated',
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      status: 'error',
      message: 'Please verify your email address to access this resource',
    });
    return;
  }

  next();
};

/**
 * Optional auth - attaches user if token is valid, but doesn't fail if not
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as JWTPayload;

        const user = await User.findById(decoded.id).populate('subscription');
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Invalid token, but continue anyway
      }
    }

    next();
  } catch (error) {
    next();
  }
};
