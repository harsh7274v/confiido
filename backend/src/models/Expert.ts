import mongoose, { Document, Schema } from 'mongoose';

export interface IExpert extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  company: string;
  expertise: string[];
  description: string;
  hourlyRate: number;
  currency: 'INR';
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  sessionTypes: {
    type: 'video' | 'audio' | 'chat' | 'in-person';
    duration: number; // in minutes
    price: number;
    description: string;
  }[];
  languages: string[];
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  experience: {
    title: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    year: number;
    expiryDate?: Date;
  }[];
  achievements: {
    title: string;
    description: string;
    year: number;
  }[];
  media: {
    photos: string[];
    videos: string[];
  };
  rating: number;
  totalReviews: number;
  totalSessions: number;
  totalEarnings: number;
  isFeatured: boolean;
  isAvailable: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expertSchema = new Schema<IExpert>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Professional title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  expertise: [{
    type: String,
    required: [true, 'At least one expertise area is required'],
    trim: true
  }],
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [10, 'Hourly rate must be at least ₹10']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },
  availability: {
    monday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    tuesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    wednesday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    thursday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    friday: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      available: { type: Boolean, default: true }
    },
    saturday: {
      start: { type: String, default: '10:00' },
      end: { type: String, default: '16:00' },
      available: { type: Boolean, default: false }
    },
    sunday: {
      start: { type: String, default: '10:00' },
      end: { type: String, default: '16:00' },
      available: { type: Boolean, default: false }
    }
  },
  sessionTypes: [{
    type: {
      type: String,
      required: true,
      enum: ['video', 'audio', 'chat', 'in-person']
    },
    duration: {
      type: Number,
      required: true,
      min: [15, 'Session duration must be at least 15 minutes']
    },
    price: {
      type: Number,
      required: true,
      min: [5, 'Session price must be at least ₹5']
    },
    description: {
      type: String,
      required: true,
      maxlength: [200, 'Session description cannot exceed 200 characters']
    }
  }],
  languages: [{
    type: String,
    required: true,
    trim: true
  }],
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: [1900, 'Year must be valid']
    }
  }],
  experience: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      maxlength: [500, 'Experience description cannot exceed 500 characters']
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuer: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: Number,
      required: true,
      min: [1900, 'Year must be valid']
    },
    expiryDate: {
      type: Date
    }
  }],
  achievements: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      maxlength: [300, 'Achievement description cannot exceed 300 characters']
    },
    year: {
      type: Number,
      required: true,
      min: [1900, 'Year must be valid']
    }
  }],
  media: {
    photos: [{
      type: String
    }],
    videos: [{
      type: String
    }]
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: [0, 'Total reviews cannot be negative']
  },
  totalSessions: {
    type: Number,
    default: 0,
    min: [0, 'Total sessions cannot be negative']
  },
  totalEarnings: {
    type: Number,
    default: 0,
    min: [0, 'Total earnings cannot be negative']
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance (userId index is created automatically by unique: true)
expertSchema.index({ expertise: 1 });
expertSchema.index({ rating: -1 });
expertSchema.index({ isFeatured: 1 });
expertSchema.index({ isAvailable: 1 });
expertSchema.index({ verificationStatus: 1 });

export default mongoose.model<IExpert>('Expert', expertSchema); 