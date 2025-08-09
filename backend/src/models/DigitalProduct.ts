import mongoose, { Document, Schema } from 'mongoose';

export interface IDigitalProduct extends Document {
  expertId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  
  // Product type
  productType: 'ebook' | 'template' | 'toolkit' | 'checklist' | 'guide' | 'worksheet' | 'audio' | 'video' | 'software' | 'other';
  
  // Files and content
  files: {
    type: 'pdf' | 'doc' | 'xls' | 'ppt' | 'zip' | 'mp3' | 'mp4' | 'png' | 'jpg' | 'other';
    name: string;
    url: string;
    size: number; // in bytes
    isPreview?: boolean;
  }[];
  
  // Preview content
  previewFiles?: {
    type: 'pdf' | 'image' | 'video';
    url: string;
    name: string;
  }[];
  
  sampleContent?: string; // Text preview
  
  // Pricing
  price: number;
  currency: string;
  originalPrice?: number;
  
  // License and usage rights
  license: {
    type: 'personal' | 'commercial' | 'extended';
    canResell: boolean;
    canModify: boolean;
    attribution: boolean;
    terms: string;
  };
  
  // Product specifications
  specifications?: {
    format: string[];
    compatibility: string[];
    language: string;
    pages?: number;
    duration?: number; // for audio/video
    fileSize: string;
    requirements?: string[];
  };
  
  // What's included
  included: string[];
  
  // Bonus materials
  bonusContent?: {
    title: string;
    description: string;
    type: 'pdf' | 'video' | 'audio' | 'template';
    url: string;
  }[];
  
  // FAQ
  faq?: {
    question: string;
    answer: string;
  }[];
  
  // Delivery method
  deliveryMethod: 'instant_download' | 'email' | 'member_area';
  accessDuration?: number; // days, null for lifetime
  
  // Versioning
  version: string;
  changeLog?: {
    version: string;
    changes: string[];
    date: Date;
  }[];
  
  // Analytics and metrics
  downloadCount: number;
  viewCount: number;
  purchaseCount: number;
  rating: number;
  totalReviews: number;
  
  // SEO and discovery
  tags: string[];
  category: string;
  keywords: string[];
  
  // Availability
  isActive: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  isExclusive: boolean; // Available only to certain users
  
  // Sale and promotion
  saleStartDate?: Date;
  saleEndDate?: Date;
  maxPurchases?: number; // limit total sales
  currentPurchases: number;
  
  // Requirements
  prerequisites?: string[];
  targetAudience: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductPurchase extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  
  // Purchase details
  purchasePrice: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  
  // License purchased
  licenseType: 'personal' | 'commercial' | 'extended';
  
  // Access control
  accessGranted: boolean;
  accessExpiresAt?: Date;
  downloadCount: number;
  maxDownloads?: number;
  
  // Download history
  downloads: {
    fileName: string;
    downloadedAt: Date;
    ipAddress: string;
    userAgent: string;
  }[];
  
  // Product version when purchased
  productVersion: string;
  
  // Updates access
  receivesUpdates: boolean;
  lastUpdateNotified?: Date;
  
  // Reviews
  review?: {
    rating: number;
    comment: string;
    title: string;
    isVerified: boolean;
    helpfulVotes: number;
    createdAt: Date;
  };
  
  // Refund information
  refund?: {
    reason: string;
    requestedAt: Date;
    processedAt?: Date;
    amount: number;
    status: 'requested' | 'approved' | 'rejected' | 'processed';
  };
  
  isActive: boolean;
  purchasedAt: Date;
  updatedAt: Date;
}

const digitalProductSchema = new Schema<IDigitalProduct>({
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
  productType: {
    type: String,
    enum: ['ebook', 'template', 'toolkit', 'checklist', 'guide', 'worksheet', 'audio', 'video', 'software', 'other'],
    required: true
  },
  files: [{
    type: {
      type: String,
      enum: ['pdf', 'doc', 'xls', 'ppt', 'zip', 'mp3', 'mp4', 'png', 'jpg', 'other'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    isPreview: {
      type: Boolean,
      default: false
    }
  }],
  previewFiles: [{
    type: {
      type: String,
      enum: ['pdf', 'image', 'video']
    },
    url: String,
    name: String
  }],
  sampleContent: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  originalPrice: Number,
  license: {
    type: {
      type: String,
      enum: ['personal', 'commercial', 'extended'],
      default: 'personal'
    },
    canResell: {
      type: Boolean,
      default: false
    },
    canModify: {
      type: Boolean,
      default: true
    },
    attribution: {
      type: Boolean,
      default: false
    },
    terms: String
  },
  specifications: {
    format: [String],
    compatibility: [String],
    language: {
      type: String,
      default: 'English'
    },
    pages: Number,
    duration: Number,
    fileSize: String,
    requirements: [String]
  },
  included: [String],
  bonusContent: [{
    title: String,
    description: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'audio', 'template']
    },
    url: String
  }],
  faq: [{
    question: String,
    answer: String
  }],
  deliveryMethod: {
    type: String,
    enum: ['instant_download', 'email', 'member_area'],
    default: 'instant_download'
  },
  accessDuration: Number,
  version: {
    type: String,
    default: '1.0'
  },
  changeLog: [{
    version: String,
    changes: [String],
    date: Date
  }],
  downloadCount: {
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
  category: String,
  keywords: [String],
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
  isExclusive: {
    type: Boolean,
    default: false
  },
  saleStartDate: Date,
  saleEndDate: Date,
  maxPurchases: Number,
  currentPurchases: {
    type: Number,
    default: 0
  },
  prerequisites: [String],
  targetAudience: [String],
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all_levels'],
    default: 'all_levels'
  }
}, {
  timestamps: true
});

const productPurchaseSchema = new Schema<IProductPurchase>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'DigitalProduct',
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
  licenseType: {
    type: String,
    enum: ['personal', 'commercial', 'extended'],
    default: 'personal'
  },
  accessGranted: {
    type: Boolean,
    default: false
  },
  accessExpiresAt: Date,
  downloadCount: {
    type: Number,
    default: 0
  },
  maxDownloads: Number,
  downloads: [{
    fileName: String,
    downloadedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  productVersion: {
    type: String,
    required: true
  },
  receivesUpdates: {
    type: Boolean,
    default: true
  },
  lastUpdateNotified: Date,
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    title: String,
    isVerified: {
      type: Boolean,
      default: true
    },
    helpfulVotes: {
      type: Number,
      default: 0
    },
    createdAt: Date
  },
  refund: {
    reason: String,
    requestedAt: Date,
    processedAt: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'processed']
    }
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
digitalProductSchema.index({ expertId: 1 });
digitalProductSchema.index({ productType: 1 });
digitalProductSchema.index({ category: 1 });
digitalProductSchema.index({ isPublished: 1 });
digitalProductSchema.index({ isFeatured: 1 });
digitalProductSchema.index({ rating: -1 });
digitalProductSchema.index({ purchaseCount: -1 });

productPurchaseSchema.index({ productId: 1 });
productPurchaseSchema.index({ userId: 1 });
productPurchaseSchema.index({ expertId: 1 });
productPurchaseSchema.index({ paymentStatus: 1 });

export const DigitalProduct = mongoose.model<IDigitalProduct>('DigitalProduct', digitalProductSchema);
export const ProductPurchase = mongoose.model<IProductPurchase>('ProductPurchase', productPurchaseSchema);
