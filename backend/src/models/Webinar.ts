import mongoose, { Document, Schema } from 'mongoose';

export interface IWebinar extends Document {
  expertId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  
  // Webinar details
  scheduledDate: Date;
  duration: number; // in minutes
  timezone: string;
  maxAttendees?: number; // null for unlimited
  
  // Pricing
  price: number;
  currency: string;
  originalPrice?: number;
  
  // Access control
  accessType: 'free' | 'paid' | 'invite_only';
  registrationRequired: boolean;
  
  // Webinar platform integration
  platform: 'zoom' | 'teams' | 'meet' | 'webex' | 'youtube' | 'custom';
  meetingId?: string;
  meetingPassword?: string;
  meetingUrl?: string;
  streamingUrl?: string;
  
  // Registration settings
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  registrationFields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    company: boolean;
    jobTitle: boolean;
    customFields?: {
      label: string;
      type: 'text' | 'select' | 'checkbox';
      required: boolean;
      options?: string[];
    }[];
  };
  
  // Content and materials
  agenda?: {
    time: string;
    topic: string;
    duration: number;
  }[];
  
  resources?: {
    title: string;
    type: 'pdf' | 'link' | 'video' | 'document';
    url: string;
    description?: string;
  }[];
  
  // Follow-up
  followUpEmail?: {
    subject: string;
    content: string;
    sendAfterHours: number;
  };
  
  recordingSettings: {
    allowRecording: boolean;
    autoRecord: boolean;
    recordingPassword?: string;
    recordingUrl?: string;
    recordingAvailableUntil?: Date;
  };
  
  // Status and metrics
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  registrationCount: number;
  attendeeCount: number;
  actualDuration?: number;
  
  // Analytics
  analytics: {
    views: number;
    uniqueViews: number;
    averageWatchTime: number;
    peakAttendees: number;
    chatMessages: number;
    polls?: {
      question: string;
      options: string[];
      responses: number[];
    }[];
  };
  
  tags: string[];
  category: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  
  isFeatured: boolean;
  isPublished: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IWebinarRegistration extends Document {
  webinarId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  
  // Registration data
  registrationData: {
    name: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    customFields?: {
      label: string;
      value: string;
    }[];
  };
  
  // Payment (if paid webinar)
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentAmount?: number;
  paymentId?: string;
  
  // Attendance
  attended: boolean;
  joinedAt?: Date;
  leftAt?: Date;
  totalWatchTime?: number; // in minutes
  
  // Communication preferences
  remindersSent: {
    type: '24h' | '1h' | '10m';
    sentAt: Date;
  }[];
  
  // Post-webinar
  feedback?: {
    rating: number;
    comment?: string;
    submittedAt: Date;
  };
  
  isActive: boolean;
  registeredAt: Date;
  updatedAt: Date;
}

const webinarSchema = new Schema<IWebinar>({
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
  scheduledDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  timezone: {
    type: String,
    required: true
  },
  maxAttendees: Number,
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
  accessType: {
    type: String,
    enum: ['free', 'paid', 'invite_only'],
    default: 'free'
  },
  registrationRequired: {
    type: Boolean,
    default: true
  },
  platform: {
    type: String,
    enum: ['zoom', 'teams', 'meet', 'webex', 'youtube', 'custom'],
    required: true
  },
  meetingId: String,
  meetingPassword: String,
  meetingUrl: String,
  streamingUrl: String,
  registrationStartDate: Date,
  registrationEndDate: Date,
  registrationFields: {
    name: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    phone: { type: Boolean, default: false },
    company: { type: Boolean, default: false },
    jobTitle: { type: Boolean, default: false },
    customFields: [{
      label: String,
      type: {
        type: String,
        enum: ['text', 'select', 'checkbox']
      },
      required: Boolean,
      options: [String]
    }]
  },
  agenda: [{
    time: String,
    topic: String,
    duration: Number
  }],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'video', 'document']
    },
    url: String,
    description: String
  }],
  followUpEmail: {
    subject: String,
    content: String,
    sendAfterHours: {
      type: Number,
      default: 2
    }
  },
  recordingSettings: {
    allowRecording: { type: Boolean, default: true },
    autoRecord: { type: Boolean, default: false },
    recordingPassword: String,
    recordingUrl: String,
    recordingAvailableUntil: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
    default: 'draft'
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  attendeeCount: {
    type: Number,
    default: 0
  },
  actualDuration: Number,
  analytics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    averageWatchTime: { type: Number, default: 0 },
    peakAttendees: { type: Number, default: 0 },
    chatMessages: { type: Number, default: 0 },
    polls: [{
      question: String,
      options: [String],
      responses: [Number]
    }]
  },
  tags: [String],
  category: String,
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    interval: Number,
    endDate: Date
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const webinarRegistrationSchema = new Schema<IWebinarRegistration>({
  webinarId: {
    type: Schema.Types.ObjectId,
    ref: 'Webinar',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  email: {
    type: String,
    required: true
  },
  registrationData: {
    name: { type: String, required: true },
    phone: String,
    company: String,
    jobTitle: String,
    customFields: [{
      label: String,
      value: String
    }]
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentAmount: Number,
  paymentId: String,
  attended: {
    type: Boolean,
    default: false
  },
  joinedAt: Date,
  leftAt: Date,
  totalWatchTime: Number,
  remindersSent: [{
    type: {
      type: String,
      enum: ['24h', '1h', '10m']
    },
    sentAt: Date
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
webinarSchema.index({ expertId: 1 });
webinarSchema.index({ scheduledDate: 1 });
webinarSchema.index({ status: 1 });
webinarSchema.index({ category: 1 });
webinarSchema.index({ isPublished: 1 });
webinarSchema.index({ isFeatured: 1 });

webinarRegistrationSchema.index({ webinarId: 1 });
webinarRegistrationSchema.index({ userId: 1 });
webinarRegistrationSchema.index({ email: 1 });
webinarRegistrationSchema.index({ paymentStatus: 1 });

export const Webinar = mongoose.model<IWebinar>('Webinar', webinarSchema);
export const WebinarRegistration = mongoose.model<IWebinarRegistration>('WebinarRegistration', webinarRegistrationSchema);
