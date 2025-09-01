import mongoose, { Document, Schema } from 'mongoose';

export interface IAvailability extends Document {
  mentorId: mongoose.Types.ObjectId;
  user_id: string; // 4-digit user ID like "1533"
  availabilityPeriods: Array<{
    _id: mongoose.Types.ObjectId;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    timeSlots: Array<{
      dayOfWeek: number; // 0-6 (Sunday-Saturday)
      startTime: string; // Format: "HH:MM" (24-hour)
      endTime: string; // Format: "HH:MM" (24-hour)
      isAvailable: boolean;
    }>;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>({
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    match: /^\d{4}$/, // Validates 4-digit format
    index: true
  },
  availabilityPeriods: [{
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    dateRange: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      }
    },
    timeSlots: [{
      dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
      },
      startTime: {
        type: String,
        required: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format validation
      },
      endTime: {
        type: String,
        required: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format validation
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }],
    notes: {
      type: String,
      maxlength: 500
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
availabilitySchema.index({ mentorId: 1, 'availabilityPeriods.dateRange.startDate': 1, 'availabilityPeriods.dateRange.endDate': 1 });

// Validate that endDate is after startDate for each period
availabilitySchema.pre('save', function(next) {
  for (const period of this.availabilityPeriods) {
    if (period.dateRange.endDate <= period.dateRange.startDate) {
      next(new Error('End date must be after start date for each period'));
    }
    
    // Validate time slots for each period
    for (const slot of period.timeSlots) {
      if (slot.startTime >= slot.endTime) {
        next(new Error('End time must be after start time for each time slot'));
      }
    }
  }
  
  next();
});

export default mongoose.model<IAvailability>('Availability', availabilitySchema, 'availabilityslots');
