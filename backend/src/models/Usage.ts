import mongoose, { Document, Schema } from 'mongoose';

export type ServiceType = 'traqauto' | 'claude' | 'gpt4';

export interface IUsageMetadata {
  model?: string; // e.g., 'claude-3-sonnet', 'gpt-4-turbo'
  tokensUsed?: number;
  responseTime?: number; // in milliseconds
  statusCode?: number;
  errorMessage?: string;
}

export interface IUsage extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  service: ServiceType;
  requestCount: number;
  date: Date; // Start of the day (00:00:00)
  metadata: IUsageMetadata[];
  createdAt: Date;
  updatedAt: Date;

  // Methods
  incrementUsage(metadata?: IUsageMetadata): Promise<IUsage>;
  canMakeRequest(limit: number): boolean;
}

const usageSchema = new Schema<IUsage>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: String,
      enum: ['traqauto', 'claude', 'gpt4'],
      required: true,
    },
    requestCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      // Store as start of day for easy querying
    },
    metadata: [
      {
        model: {
          type: String,
        },
        tokensUsed: {
          type: Number,
        },
        responseTime: {
          type: Number,
        },
        statusCode: {
          type: Number,
        },
        errorMessage: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

// Compound index for unique constraint and fast queries
usageSchema.index({ user: 1, service: 1, date: 1 }, { unique: true });
usageSchema.index({ user: 1, date: -1 });
usageSchema.index({ service: 1, date: -1 });
usageSchema.index({ createdAt: -1 });

// Static method to get or create today's usage document
usageSchema.statics.getOrCreateTodayUsage = async function (
  userId: mongoose.Types.ObjectId,
  service: ServiceType
): Promise<IUsage> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let usage = await this.findOne({
    user: userId,
    service,
    date: startOfDay,
  });

  if (!usage) {
    usage = await this.create({
      user: userId,
      service,
      date: startOfDay,
      requestCount: 0,
      metadata: [],
    });
  }

  return usage;
};

// Increment usage count
usageSchema.methods.incrementUsage = async function (
  metadata?: IUsageMetadata
): Promise<IUsage> {
  this.requestCount += 1;

  if (metadata) {
    this.metadata.push({
      ...metadata,
      timestamp: new Date(),
    });
  }

  await this.save();
  return this;
};

// Check if user can make another request based on limit
usageSchema.methods.canMakeRequest = function (limit: number): boolean {
  // -1 means unlimited
  if (limit === -1) {
    return true;
  }

  return this.requestCount < limit;
};

// Static method to get usage statistics for a user
usageSchema.statics.getUserStats = async function (
  userId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const matchQuery: any = { user: userId };

  if (startDate || endDate) {
    matchQuery.date = {};
    if (startDate) matchQuery.date.$gte = startDate;
    if (endDate) matchQuery.date.$lte = endDate;
  }

  return await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$service',
        totalRequests: { $sum: '$requestCount' },
        totalTokens: {
          $sum: {
            $reduce: {
              input: '$metadata',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.tokensUsed', 0] }] },
            },
          },
        },
        avgResponseTime: {
          $avg: {
            $reduce: {
              input: '$metadata',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.responseTime', 0] }] },
            },
          },
        },
      },
    },
    {
      $project: {
        service: '$_id',
        totalRequests: 1,
        totalTokens: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        _id: 0,
      },
    },
  ]);
};

// TTL index to automatically delete old usage records after 90 days
usageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const Usage = mongoose.model<IUsage>('Usage', usageSchema);

// Add static methods to interface
export interface IUsageModel extends mongoose.Model<IUsage> {
  getOrCreateTodayUsage(
    userId: mongoose.Types.ObjectId,
    service: ServiceType
  ): Promise<IUsage>;
  getUserStats(
    userId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]>;
}
