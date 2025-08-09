import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceBundle extends Document {
  expertId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  
  // Bundle details
  bundleType: 'course_bundle' | 'session_bundle' | 'mixed_bundle' | 'subscription';
  
  // Included services
  services: {
    type: 'course' | 'session' | 'webinar' | 'priority_dm';
    serviceId: mongoose.Types.ObjectId;
    quantity?: number; // For sessions
    duration?: number; // For priority DM
    originalPrice: number;
  }[];
  
  // Pricing
  totalOriginalPrice: number;
  bundlePrice: number;
  currency: string;
  discountPercentage: number;
  
  // Subscription details (if bundleType is subscription)
  subscription?: {
    billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    trialPeriodDays?: number;
    maxCancellations?: number;
  };
  
  // Access and validity
  validityPeriod?: number; // in days
  maxRedemptions?: number; // null for unlimited
  currentRedemptions: number;
  
  // Bundle features
  features: string[];
  bonusContent?: {
    title: string;
    description: string;
    type: 'pdf' | 'video' | 'link' | 'template';
    url: string;
  }[];
  
  // Terms and conditions
  terms: string;
  refundPolicy: string;
  
  // Availability
  isActive: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  
  // Sale period
  saleStartDate?: Date;
  saleEndDate?: Date;
  
  // Limits
  maxPurchases?: number; // per user
  totalMaxPurchases?: number; // globally
  currentPurchases: number;
  
  // Analytics
  viewCount: number;
  purchaseCount: number;
  rating: number;
  totalReviews: number;
  
  tags: string[];
  category: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IBundlePurchase extends Document {
  bundleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  
  // Purchase details
  purchasePrice: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  
  // Access control
  accessGranted: boolean;
  validUntil?: Date;
  
  // Service redemptions
  redemptions: {
    serviceType: 'course' | 'session' | 'webinar' | 'priority_dm';
    serviceId: mongoose.Types.ObjectId;
    redeemedAt: Date;
    status: 'redeemed' | 'scheduled' | 'completed';
    notes?: string;
  }[];
  
  // Subscription details (if applicable)
  subscription?: {
    status: 'active' | 'cancelled' | 'paused' | 'expired';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    nextBillingDate?: Date;
    cancelAtPeriodEnd: boolean;
    cancellationReason?: string;
  };
  
  // Usage tracking
  totalValueRedeemed: number;
  remainingValue: number;
  
  // Reviews
  review?: {
    rating: number;
    comment: string;
    createdAt: Date;
  };
  
  isActive: boolean;
  purchasedAt: Date;
  updatedAt: Date;
}

const serviceBundleSchema = new Schema<IServiceBundle>({
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 300
  },
  thumbnail: String,
  bundleType: {
    type: String,
    enum: ['course_bundle', 'session_bundle', 'mixed_bundle', 'subscription'],
    required: true
  },
  services: [{
    type: {
      type: String,
      enum: ['course', 'session', 'webinar', 'priority_dm'],
      required: true
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    quantity: Number,
    duration: Number,
    originalPrice: {
      type: Number,
      required: true
    }
  }],
  totalOriginalPrice: {
    type: Number,
    required: true
  },
  bundlePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  subscription: {
    billingCycle: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly']
    },
    trialPeriodDays: Number,
    maxCancellations: Number
  },
  validityPeriod: Number,
  maxRedemptions: Number,
  currentRedemptions: {
    type: Number,
    default: 0
  },
  features: [String],
  bonusContent: [{
    title: String,
    description: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'template']
    },
    url: String
  }],
  terms: String,
  refundPolicy: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  saleStartDate: Date,
  saleEndDate: Date,
  maxPurchases: Number,
  totalMaxPurchases: Number,
  currentPurchases: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  tags: [String],
  category: String
}, {
  timestamps: true
});

const bundlePurchaseSchema = new Schema<IBundlePurchase>({
  bundleId: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceBundle',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  accessGranted: {
    type: Boolean,
    default: false
  },
  validUntil: Date,
  redemptions: [{
    serviceType: {
      type: String,
      enum: ['course', 'session', 'webinar', 'priority_dm'],
      required: true
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['redeemed', 'scheduled', 'completed'],
      default: 'redeemed'
    },
    notes: String
  }],
  subscription: {
    status: {
      type: String,
      enum: ['active', 'cancelled', 'paused', 'expired']
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    nextBillingDate: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    cancellationReason: String
  },
  totalValueRedeemed: {
    type: Number,
    default: 0
  },
  remainingValue: {
    type: Number,
    default: 0
  },
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
serviceBundleSchema.index({ expertId: 1 });
serviceBundleSchema.index({ bundleType: 1 });
serviceBundleSchema.index({ isPublished: 1 });
serviceBundleSchema.index({ isFeatured: 1 });
serviceBundleSchema.index({ category: 1 });
serviceBundleSchema.index({ rating: -1 });

bundlePurchaseSchema.index({ bundleId: 1 });
bundlePurchaseSchema.index({ userId: 1 });
bundlePurchaseSchema.index({ expertId: 1 });
bundlePurchaseSchema.index({ paymentStatus: 1 });

export const ServiceBundle = mongoose.model<IServiceBundle>('ServiceBundle', serviceBundleSchema);
export const BundlePurchase = mongoose.model<IBundlePurchase>('BundlePurchase', bundlePurchaseSchema);
