import mongoose, { Document, Schema } from 'mongoose';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';

export interface ISubscriptionLimits {
  traqAutoRequests: number; // -1 for unlimited
  claudeRequests: number; // -1 for unlimited
  gpt4Requests: number; // -1 for unlimited
}

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCurrentPeriodStart?: Date;
  stripeCurrentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  limits: ISubscriptionLimits;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  isActive(): boolean;
  canUseService(service: 'traqauto' | 'claude' | 'gpt4'): boolean;
  getRemainingRequests(service: 'traqauto' | 'claude' | 'gpt4'): Promise<number>;
}

// Subscription limits for each tier
export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, ISubscriptionLimits> = {
  free: {
    traqAutoRequests: 50, // 50 per day
    claudeRequests: 0,
    gpt4Requests: 0,
  },
  pro: {
    traqAutoRequests: -1, // unlimited
    claudeRequests: 100, // 100 per day
    gpt4Requests: 50, // 50 per day
  },
  enterprise: {
    traqAutoRequests: -1, // unlimited
    claudeRequests: -1, // unlimited
    gpt4Requests: -1, // unlimited
  },
};

// Pricing information (in cents)
export const SUBSCRIPTION_PRICING = {
  free: 0,
  pro: 2000, // $20.00
  enterprise: 5000, // $50.00
};

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user can only have one subscription
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid', 'trialing'],
      default: 'active',
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true, // Free tier won't have this
    },
    stripePriceId: {
      type: String,
      sparse: true,
    },
    stripeCurrentPeriodStart: {
      type: Date,
    },
    stripeCurrentPeriodEnd: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
    },
    limits: {
      traqAutoRequests: {
        type: Number,
        default: function (this: ISubscription) {
          return SUBSCRIPTION_LIMITS[this.tier].traqAutoRequests;
        },
      },
      claudeRequests: {
        type: Number,
        default: function (this: ISubscription) {
          return SUBSCRIPTION_LIMITS[this.tier].claudeRequests;
        },
      },
      gpt4Requests: {
        type: Number,
        default: function (this: ISubscription) {
          return SUBSCRIPTION_LIMITS[this.tier].gpt4Requests;
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for faster queries
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ tier: 1, status: 1 });
subscriptionSchema.index({ stripeCurrentPeriodEnd: 1 });

// Pre-save hook to update limits when tier changes
subscriptionSchema.pre('save', function (next) {
  if (this.isModified('tier')) {
    this.limits = SUBSCRIPTION_LIMITS[this.tier];
  }
  next();
});

// Check if subscription is active
subscriptionSchema.methods.isActive = function (): boolean {
  return this.status === 'active' || this.status === 'trialing';
};

// Check if user can use a specific service
subscriptionSchema.methods.canUseService = function (
  service: 'traqauto' | 'claude' | 'gpt4'
): boolean {
  if (!this.isActive()) {
    return false;
  }

  const limitKey = `${service === 'traqauto' ? 'traqAuto' : service}Requests` as keyof ISubscriptionLimits;
  const limit = this.limits[limitKey];

  // -1 means unlimited
  return limit !== 0;
};

// Get remaining requests for a service (requires usage data)
subscriptionSchema.methods.getRemainingRequests = async function (
  service: 'traqauto' | 'claude' | 'gpt4'
): Promise<number> {
  const limitKey = `${service === 'traqauto' ? 'traqAuto' : service}Requests` as keyof ISubscriptionLimits;
  const limit = this.limits[limitKey];

  // -1 means unlimited
  if (limit === -1) {
    return -1;
  }

  // Import Usage model here to avoid circular dependency
  const { Usage } = await import('./Usage');

  // Get today's usage
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const usage = await Usage.findOne({
    user: this.user,
    service,
    date: { $gte: startOfDay },
  });

  const used = usage ? usage.requestCount : 0;
  return Math.max(0, limit - used);
};

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
