import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarIntegration extends Document {
  userId: mongoose.Types.ObjectId;
  expertId?: mongoose.Types.ObjectId;
  
  // Calendar provider
  provider: 'google' | 'outlook' | 'apple' | 'calendly' | 'cal.com';
  
  // Authentication details
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  
  // Provider specific IDs
  calendarId?: string;
  accountEmail: string;
  
  // Sync settings
  syncSettings: {
    autoSync: boolean;
    syncDirection: 'one_way' | 'two_way'; // from Lumina to calendar or both ways
    syncAvailability: boolean; // sync availability slots
    syncBookings: boolean; // sync confirmed bookings
    syncWebinars: boolean; // sync webinars
    conflictResolution: 'lumina_priority' | 'calendar_priority' | 'ask_user';
  };
  
  // Calendar mapping
  calendarMapping?: {
    bookingsCalendarId?: string; // which calendar to put bookings in
    webinarsCalendarId?: string; // which calendar to put webinars in
    blockedTimeCalendarId?: string; // which calendar to check for blocked time
  };
  
  // Event preferences
  eventSettings: {
    eventTitle: string; // template for event titles
    includeClientName: boolean;
    includeSessionType: boolean;
    addMeetingLink: boolean;
    reminderMinutes: number[];
    eventDescription: string; // template
    location?: string; // default location
    visibility: 'public' | 'private' | 'default';
  };
  
  // Sync status
  lastSyncAt?: Date;
  syncStatus: 'active' | 'error' | 'disconnected' | 'rate_limited';
  lastSyncError?: string;
  
  // Calendar timezone
  timezone: string;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailabilityRule extends Document {
  expertId: mongoose.Types.ObjectId;
  
  // Rule type
  ruleType: 'availability' | 'buffer_time' | 'break' | 'holiday' | 'custom_block';
  
  // Time pattern
  pattern: {
    type: 'weekly' | 'specific_date' | 'date_range' | 'monthly';
    
    // For weekly patterns
    weekdays?: number[]; // 0=Sunday, 1=Monday, etc.
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
    
    // For specific dates or ranges
    startDate?: Date;
    endDate?: Date;
    
    // For monthly patterns
    dayOfMonth?: number; // 1-31
    weekOfMonth?: number; // 1-4 (first, second, third, fourth week)
    dayOfWeek?: number; // 0-6 (for "second Tuesday of month" type rules)
  };
  
  // Rule details
  isAvailable: boolean; // true for available, false for blocked
  title?: string; // for blocked time, what it's for
  description?: string;
  
  // Buffer time settings (for buffer_time type)
  bufferBefore?: number; // minutes before session
  bufferAfter?: number; // minutes after session
  
  // Override settings
  canOverride: boolean; // can this rule be overridden for urgent bookings
  overridePrice?: number; // extra charge for override
  
  // Recurrence end
  recurrenceEnd?: Date;
  maxOccurrences?: number;
  
  // Timezone
  timezone: string;
  
  // Priority (higher number = higher priority)
  priority: number;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailabilitySlot extends Document {
  expertId: mongoose.Types.ObjectId;
  
  // Slot timing
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  
  // Slot status
  status: 'available' | 'booked' | 'blocked' | 'tentative';
  
  // If booked
  bookingId?: mongoose.Types.ObjectId;
  
  // If blocked
  blockReason?: string;
  blockType?: 'manual' | 'rule' | 'calendar_sync' | 'buffer';
  
  // Session type availability
  allowedSessionTypes?: string[]; // if empty, all types allowed
  
  // Pricing for this specific slot (override default)
  priceOverride?: number;
  currency?: string;
  
  // Recurring slot information
  recurringSlotId?: string; // groups recurring slots together
  
  // Generated from rules or manual
  source: 'rule' | 'manual' | 'calendar_sync';
  sourceRuleId?: mongoose.Types.ObjectId;
  
  // Timezone
  timezone: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalendarEvent extends Document {
  userId: mongoose.Types.ObjectId;
  expertId?: mongoose.Types.ObjectId;
  integrationId: mongoose.Types.ObjectId;
  
  // Event details
  title: string;
  description?: string;
  location?: string;
  
  // Timing
  startTime: Date;
  endTime: Date;
  timezone: string;
  isAllDay: boolean;
  
  // External calendar info
  externalEventId: string; // ID in the external calendar
  calendarId: string;
  
  // Sync info
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error' | 'deleted';
  syncError?: string;
  
  // Lumina relation
  relatedBookingId?: mongoose.Types.ObjectId;
  relatedWebinarId?: mongoose.Types.ObjectId;
  
  // Event type
  eventType: 'booking' | 'webinar' | 'availability_block' | 'external';
  
  // Attendees
  attendees?: {
    email: string;
    name?: string;
    responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }[];
  
  // Meeting info
  meetingLink?: string;
  meetingPassword?: string;
  
  // Reminders
  reminders: {
    method: 'email' | 'popup' | 'sms';
    minutes: number;
  }[];
  
  // Recurrence
  isRecurring: boolean;
  recurrenceRule?: string; // RRULE format
  recurringEventId?: string; // groups recurring events
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar Integration Schema
const calendarIntegrationSchema = new Schema<ICalendarIntegration>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert'
  },
  provider: {
    type: String,
    enum: ['google', 'outlook', 'apple', 'calendly', 'cal.com'],
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: String,
  expiresAt: Date,
  calendarId: String,
  accountEmail: {
    type: String,
    required: true
  },
  syncSettings: {
    autoSync: {
      type: Boolean,
      default: true
    },
    syncDirection: {
      type: String,
      enum: ['one_way', 'two_way'],
      default: 'one_way'
    },
    syncAvailability: {
      type: Boolean,
      default: true
    },
    syncBookings: {
      type: Boolean,
      default: true
    },
    syncWebinars: {
      type: Boolean,
      default: true
    },
    conflictResolution: {
      type: String,
      enum: ['lumina_priority', 'calendar_priority', 'ask_user'],
      default: 'lumina_priority'
    }
  },
  calendarMapping: {
    bookingsCalendarId: String,
    webinarsCalendarId: String,
    blockedTimeCalendarId: String
  },
  eventSettings: {
    eventTitle: {
      type: String,
      default: '{{sessionType}} with {{clientName}}'
    },
    includeClientName: {
      type: Boolean,
      default: true
    },
    includeSessionType: {
      type: Boolean,
      default: true
    },
    addMeetingLink: {
      type: Boolean,
      default: true
    },
    reminderMinutes: {
      type: [Number],
      default: [15, 60] // 15 minutes and 1 hour before
    },
    eventDescription: {
      type: String,
      default: 'Booked via Lumina Platform'
    },
    location: String,
    visibility: {
      type: String,
      enum: ['public', 'private', 'default'],
      default: 'default'
    }
  },
  lastSyncAt: Date,
  syncStatus: {
    type: String,
    enum: ['active', 'error', 'disconnected', 'rate_limited'],
    default: 'active'
  },
  lastSyncError: String,
  timezone: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Availability Rule Schema
const availabilityRuleSchema = new Schema<IAvailabilityRule>({
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  ruleType: {
    type: String,
    enum: ['availability', 'buffer_time', 'break', 'holiday', 'custom_block'],
    required: true
  },
  pattern: {
    type: {
      type: String,
      enum: ['weekly', 'specific_date', 'date_range', 'monthly'],
      required: true
    },
    weekdays: [Number],
    startTime: String,
    endTime: String,
    startDate: Date,
    endDate: Date,
    dayOfMonth: Number,
    weekOfMonth: Number,
    dayOfWeek: Number
  },
  isAvailable: {
    type: Boolean,
    required: true
  },
  title: String,
  description: String,
  bufferBefore: Number,
  bufferAfter: Number,
  canOverride: {
    type: Boolean,
    default: false
  },
  overridePrice: Number,
  recurrenceEnd: Date,
  maxOccurrences: Number,
  timezone: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Availability Slot Schema
const availabilitySlotSchema = new Schema<IAvailabilitySlot>({
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'blocked', 'tentative'],
    default: 'available'
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  blockReason: String,
  blockType: {
    type: String,
    enum: ['manual', 'rule', 'calendar_sync', 'buffer']
  },
  allowedSessionTypes: [String],
  priceOverride: Number,
  currency: String,
  recurringSlotId: String,
  source: {
    type: String,
    enum: ['rule', 'manual', 'calendar_sync'],
    required: true
  },
  sourceRuleId: {
    type: Schema.Types.ObjectId,
    ref: 'AvailabilityRule'
  },
  timezone: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calendar Event Schema
const calendarEventSchema = new Schema<ICalendarEvent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert'
  },
  integrationId: {
    type: Schema.Types.ObjectId,
    ref: 'CalendarIntegration',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  location: String,
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    required: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  },
  externalEventId: {
    type: String,
    required: true
  },
  calendarId: {
    type: String,
    required: true
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error', 'deleted'],
    default: 'synced'
  },
  syncError: String,
  relatedBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedWebinarId: {
    type: Schema.Types.ObjectId,
    ref: 'Webinar'
  },
  eventType: {
    type: String,
    enum: ['booking', 'webinar', 'availability_block', 'external'],
    required: true
  },
  attendees: [{
    email: String,
    name: String,
    responseStatus: {
      type: String,
      enum: ['accepted', 'declined', 'tentative', 'needsAction']
    }
  }],
  meetingLink: String,
  meetingPassword: String,
  reminders: [{
    method: {
      type: String,
      enum: ['email', 'popup', 'sms']
    },
    minutes: Number
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: String,
  recurringEventId: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
calendarIntegrationSchema.index({ userId: 1 });
calendarIntegrationSchema.index({ expertId: 1 });
calendarIntegrationSchema.index({ provider: 1 });

availabilityRuleSchema.index({ expertId: 1 });
availabilityRuleSchema.index({ ruleType: 1 });
availabilityRuleSchema.index({ isActive: 1 });

availabilitySlotSchema.index({ expertId: 1, startTime: 1 });
availabilitySlotSchema.index({ status: 1 });
availabilitySlotSchema.index({ bookingId: 1 });

calendarEventSchema.index({ userId: 1 });
calendarEventSchema.index({ expertId: 1 });
calendarEventSchema.index({ integrationId: 1 });
calendarEventSchema.index({ externalEventId: 1 });
calendarEventSchema.index({ startTime: 1 });

export const CalendarIntegration = mongoose.model<ICalendarIntegration>('CalendarIntegration', calendarIntegrationSchema);
export const AvailabilityRule = mongoose.model<IAvailabilityRule>('AvailabilityRule', availabilityRuleSchema);
export const AvailabilitySlot = mongoose.model<IAvailabilitySlot>('AvailabilitySlot', availabilitySlotSchema);
export const CalendarEvent = mongoose.model<ICalendarEvent>('CalendarEvent', calendarEventSchema);
