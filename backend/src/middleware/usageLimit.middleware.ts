import { Request, Response, NextFunction } from 'express';
import { Subscription } from '../models/Subscription';
import { Usage, ServiceType } from '../models/Usage';
import { redisClient } from '../index';

/**
 * Middleware to check if user has reached their usage limit for a service
 */
export const checkUsageLimit = (service: ServiceType) => {
  return async (
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

      // Get user's subscription
      const subscription = await Subscription.findOne({ user: req.user._id });

      if (!subscription) {
        res.status(403).json({
          status: 'error',
          message: 'No subscription found',
        });
        return;
      }

      // Check if subscription is active
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

      // Check if service is allowed for this tier
      if (!subscription.canUseService(service)) {
        res.status(403).json({
          status: 'error',
          message: `Your ${subscription.tier} plan does not include access to ${service}`,
          upgrade: {
            message: 'Upgrade to a higher tier to access this service',
            tier: subscription.tier === 'free' ? 'pro' : 'enterprise',
          },
        });
        return;
      }

      // Get the limit for this service
      const limitKey = `${
        service === 'traqauto' ? 'traqAuto' : service
      }Requests` as keyof typeof subscription.limits;
      const limit = subscription.limits[limitKey];

      // -1 means unlimited
      if (limit === -1) {
        next();
        return;
      }

      // Check Redis cache first for performance
      const cacheKey = `usage:${req.user._id}:${service}:${
        new Date().toISOString().split('T')[0]
      }`;

      try {
        const cachedUsage = await redisClient.get(cacheKey);
        if (cachedUsage) {
          const usageCount = parseInt(cachedUsage);
          if (usageCount >= limit) {
            res.status(429).json({
              status: 'error',
              message: `Daily limit reached for ${service}`,
              usage: {
                used: usageCount,
                limit: limit,
                remaining: 0,
              },
              resetAt: getNextDayStart(),
            });
            return;
          }
        }
      } catch (cacheError) {
        // Continue if Redis fails, fall back to database
        console.error('Redis cache error:', cacheError);
      }

      // Get today's usage from database
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const usage = await Usage.findOne({
        user: req.user._id,
        service,
        date: startOfDay,
      });

      const currentUsage = usage ? usage.requestCount : 0;

      // Check if limit is reached
      if (currentUsage >= limit) {
        res.status(429).json({
          status: 'error',
          message: `Daily limit reached for ${service}`,
          usage: {
            used: currentUsage,
            limit: limit,
            remaining: 0,
          },
          resetAt: getNextDayStart(),
        });
        return;
      }

      // Update cache
      try {
        await redisClient.setEx(cacheKey, 86400, currentUsage.toString()); // Cache for 24 hours
      } catch (cacheError) {
        console.error('Redis set error:', cacheError);
      }

      // Attach usage info to request for later use
      (req as any).usageInfo = {
        current: currentUsage,
        limit: limit,
        remaining: limit - currentUsage,
      };

      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error checking usage limit',
      });
      return;
    }
  };
};

/**
 * Helper function to get the start of next day
 */
function getNextDayStart(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Middleware to increment usage after successful API call
 */
export const incrementUsage = (service: ServiceType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        next();
        return;
      }

      // Get or create today's usage document
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      let usage = await Usage.findOne({
        user: req.user._id,
        service,
        date: startOfDay,
      });

      if (!usage) {
        usage = await Usage.create({
          user: req.user._id,
          service,
          date: startOfDay,
          requestCount: 0,
          metadata: [],
        });
      }

      // Increment usage
      await usage.incrementUsage({
        timestamp: new Date(),
        statusCode: res.statusCode,
      } as any);

      // Update cache
      const cacheKey = `usage:${req.user._id}:${service}:${
        new Date().toISOString().split('T')[0]
      }`;

      try {
        await redisClient.setEx(cacheKey, 86400, usage.requestCount.toString());
      } catch (cacheError) {
        console.error('Redis increment error:', cacheError);
      }

      next();
    } catch (error) {
      // Log error but don't block the response
      console.error('Error incrementing usage:', error);
      next();
    }
  };
};
