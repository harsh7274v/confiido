import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  expertId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // For user analytics
  
  // Time period
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  
  // Revenue analytics
  revenue: {
    total: number;
    byService: {
      sessions: number;
      courses: number;
      webinars: number;
      bundles: number;
      digitalProducts: number;
      priorityDM: number;
    };
    currency: string;
    growth: number; // percentage change from previous period
  };
  
  // Booking analytics
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    rescheduled: number;
    conversionRate: number; // bookings/profile views
    averageSessionValue: number;
    repeatBookingRate: number;
  };
  
  // Course analytics
  courses: {
    totalEnrollments: number;
    completionRate: number;
    averageRating: number;
    totalWatchTime: number; // in minutes
    dropOffPoints: {
      lessonId: mongoose.Types.ObjectId;
      dropOffRate: number;
    }[];
  };
  
  // Webinar analytics
  webinars: {
    totalRegistrations: number;
    totalAttendees: number;
    attendanceRate: number;
    averageWatchTime: number;
    engagementRate: number;
    conversionRate: number; // paid registrations/total views
  };
  
  // Digital product analytics
  digitalProducts: {
    totalDownloads: number;
    totalSales: number;
    conversionRate: number;
    averageRating: number;
    refundRate: number;
  };
  
  // User engagement
  engagement: {
    profileViews: number;
    uniqueVisitors: number;
    returnVisitors: number;
    averageSessionDuration: number; // in minutes
    bounceRate: number;
    messageResponseRate: number;
    averageResponseTime: number; // in minutes
  };
  
  // Geographic data
  geography: {
    country: string;
    visitors: number;
    revenue: number;
  }[];
  
  // Traffic sources
  trafficSources: {
    source: 'direct' | 'search' | 'social' | 'referral' | 'email' | 'ads';
    visitors: number;
    conversions: number;
  }[];
  
  // Client demographics
  demographics: {
    ageGroups: {
      range: string; // e.g., "25-34"
      count: number;
    }[];
    genderDistribution: {
      male: number;
      female: number;
      other: number;
      notSpecified: number;
    };
    industries: {
      industry: string;
      count: number;
    }[];
  };
  
  // Reviews and ratings
  reviews: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
    sentimentScore: number; // -1 to 1
  };
  
  // Performance metrics
  performance: {
    responseTime: number; // average in hours
    availability: number; // percentage
    cancellationRate: number;
    rescheduleRate: number;
    clientRetentionRate: number;
  };
  
  // Goals and targets
  goals?: {
    revenueTarget: number;
    bookingsTarget: number;
    newClientsTarget: number;
    progress: {
      revenue: number;
      bookings: number;
      newClients: number;
    };
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId;
  expertId?: mongoose.Types.ObjectId; // If activity is related to an expert
  
  // Activity details
  activityType: 'profile_view' | 'booking_created' | 'course_enrolled' | 'webinar_registered' | 
                'message_sent' | 'review_posted' | 'product_purchased' | 'search_performed' | 
                'page_visited' | 'session_completed' | 'download' | 'share';
  
  // Related entities
  relatedEntity?: {
    entityType: 'expert' | 'course' | 'webinar' | 'booking' | 'product' | 'bundle';
    entityId: mongoose.Types.ObjectId;
  };
  
  // Activity metadata
  metadata: {
    page?: string;
    duration?: number; // time spent in seconds
    source?: string; // how they got there
    searchQuery?: string;
    filters?: any;
    value?: number; // monetary value if applicable
    ip?: string;
    userAgent?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    location?: {
      country: string;
      city: string;
      timezone: string;
    };
  };
  
  timestamp: Date;
}

export interface IExpertPerformance extends Document {
  expertId: mongoose.Types.ObjectId;
  
  // Overall performance score (0-100)
  performanceScore: number;
  
  // Key metrics that contribute to score
  metrics: {
    responseTime: {
      average: number; // in hours
      score: number; // 0-100
      weight: number;
    };
    
    availability: {
      percentage: number;
      score: number;
      weight: number;
    };
    
    clientSatisfaction: {
      averageRating: number;
      score: number;
      weight: number;
    };
    
    reliability: {
      cancellationRate: number;
      noShowRate: number;
      score: number;
      weight: number;
    };
    
    engagement: {
      messageResponseRate: number;
      profileCompleteness: number;
      score: number;
      weight: number;
    };
    
    growth: {
      newClientsThisMonth: number;
      revenueGrowth: number;
      score: number;
      weight: number;
    };
  };
  
  // Performance trends
  trends: {
    period: 'week' | 'month' | 'quarter';
    performanceHistory: {
      date: Date;
      score: number;
    }[];
  };
  
  // Recommendations for improvement
  recommendations: {
    category: 'response_time' | 'availability' | 'profile' | 'pricing' | 'services';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    potentialImpact: string;
  }[];
  
  // Competitive analysis
  marketPosition: {
    ranking: number; // among similar experts
    totalExperts: number;
    category: string;
    percentile: number;
  };
  
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Schema
const analyticsSchema = new Schema<IAnalytics>({
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  revenue: {
    total: { type: Number, default: 0 },
    byService: {
      sessions: { type: Number, default: 0 },
      courses: { type: Number, default: 0 },
      webinars: { type: Number, default: 0 },
      bundles: { type: Number, default: 0 },
      digitalProducts: { type: Number, default: 0 },
      priorityDM: { type: Number, default: 0 }
    },
    currency: { type: String, default: 'USD' },
    growth: { type: Number, default: 0 }
  },
  bookings: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    noShow: { type: Number, default: 0 },
    rescheduled: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageSessionValue: { type: Number, default: 0 },
    repeatBookingRate: { type: Number, default: 0 }
  },
  courses: {
    totalEnrollments: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalWatchTime: { type: Number, default: 0 },
    dropOffPoints: [{
      lessonId: { type: Schema.Types.ObjectId, ref: 'Course.lessons' },
      dropOffRate: Number
    }]
  },
  webinars: {
    totalRegistrations: { type: Number, default: 0 },
    totalAttendees: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    averageWatchTime: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },
  digitalProducts: {
    totalDownloads: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    refundRate: { type: Number, default: 0 }
  },
  engagement: {
    profileViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    returnVisitors: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 },
    messageResponseRate: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }
  },
  geography: [{
    country: String,
    visitors: Number,
    revenue: Number
  }],
  trafficSources: [{
    source: {
      type: String,
      enum: ['direct', 'search', 'social', 'referral', 'email', 'ads']
    },
    visitors: Number,
    conversions: Number
  }],
  demographics: {
    ageGroups: [{
      range: String,
      count: Number
    }],
    genderDistribution: {
      male: { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
      notSpecified: { type: Number, default: 0 }
    },
    industries: [{
      industry: String,
      count: Number
    }]
  },
  reviews: {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    },
    sentimentScore: { type: Number, default: 0 }
  },
  performance: {
    responseTime: { type: Number, default: 0 },
    availability: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    rescheduleRate: { type: Number, default: 0 },
    clientRetentionRate: { type: Number, default: 0 }
  },
  goals: {
    revenueTarget: Number,
    bookingsTarget: Number,
    newClientsTarget: Number,
    progress: {
      revenue: { type: Number, default: 0 },
      bookings: { type: Number, default: 0 },
      newClients: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// User Activity Schema
const userActivitySchema = new Schema<IUserActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert'
  },
  activityType: {
    type: String,
    enum: ['profile_view', 'booking_created', 'course_enrolled', 'webinar_registered', 
           'message_sent', 'review_posted', 'product_purchased', 'search_performed', 
           'page_visited', 'session_completed', 'download', 'share'],
    required: true
  },
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['expert', 'course', 'webinar', 'booking', 'product', 'bundle']
    },
    entityId: Schema.Types.ObjectId
  },
  metadata: {
    page: String,
    duration: Number,
    source: String,
    searchQuery: String,
    filters: Schema.Types.Mixed,
    value: Number,
    ip: String,
    userAgent: String,
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet']
    },
    location: {
      country: String,
      city: String,
      timezone: String
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Expert Performance Schema
const expertPerformanceSchema = new Schema<IExpertPerformance>({
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true,
    unique: true
  },
  performanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  metrics: {
    responseTime: {
      average: Number,
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 20 }
    },
    availability: {
      percentage: Number,
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 15 }
    },
    clientSatisfaction: {
      averageRating: Number,
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 25 }
    },
    reliability: {
      cancellationRate: Number,
      noShowRate: Number,
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 20 }
    },
    engagement: {
      messageResponseRate: Number,
      profileCompleteness: Number,
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 10 }
    },
    growth: {
      newClientsThisMonth: Number,
      revenueGrowth: Number,
      score: { type: Number, min: 0, max: 100 },
      weight: { type: Number, default: 10 }
    }
  },
  trends: {
    period: {
      type: String,
      enum: ['week', 'month', 'quarter'],
      default: 'month'
    },
    performanceHistory: [{
      date: Date,
      score: Number
    }]
  },
  recommendations: [{
    category: {
      type: String,
      enum: ['response_time', 'availability', 'profile', 'pricing', 'services']
    },
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    potentialImpact: String
  }],
  marketPosition: {
    ranking: Number,
    totalExperts: Number,
    category: String,
    percentile: Number
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ expertId: 1, period: 1, startDate: 1 });
analyticsSchema.index({ userId: 1, period: 1 });

userActivitySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ expertId: 1, timestamp: -1 });
userActivitySchema.index({ activityType: 1, timestamp: -1 });

// expertId index is created automatically by unique: true in field definition
expertPerformanceSchema.index({ performanceScore: -1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export const UserActivity = mongoose.model<IUserActivity>('UserActivity', userActivitySchema);
export const ExpertPerformance = mongoose.model<IExpertPerformance>('ExpertPerformance', expertPerformanceSchema);
