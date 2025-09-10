import mongoose, { Document, Schema } from 'mongoose';

export interface ISession {
  sessionId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  expertUserId: string; // 4-digit user_id for the expert/mentor
  expertEmail: string; // Expert's email address
  sessionType: 'video' | 'audio' | 'chat' | 'in-person';
  duration: number; // in minutes
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  price: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod?: string;
  meetingLink?: string;
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: 'client' | 'expert' | 'system';
  cancellationTime?: Date;
  refundAmount?: number;
  // Timeout fields for 5-minute booking timeout
  timeoutAt?: Date; // When the booking will expire
  timeoutStatus?: 'active' | 'expired' | 'completed'; // Timeout tracking status
  // Payment completion fields
  paymentCompletedAt?: Date; // When the payment was completed
  loyaltyPointsUsed?: number; // Number of loyalty points used
  finalAmount?: number; // Final amount after loyalty points deduction
  // Creation timestamp
  createdTime?: Date; // When the session was created (when book now was clicked)
}

export interface IBooking extends Document {
  clientId: mongoose.Types.ObjectId;
  clientUserId: string; // 4-digit user_id for the client
  clientEmail: string; // Client's email address
  sessions: ISession[]; // Array of sessions
  totalSessions: number; // Total number of sessions
  totalSpent: number; // Total amount spent across all sessions
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>({
  sessionId: {
    type: Schema.Types.ObjectId,
    auto: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  expertUserId: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'Expert user_id must be a 4-digit number']
  },
  expertEmail: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  sessionType: {
    type: String,
    required: true,
    enum: ['video', 'audio', 'chat', 'in-person']
  },
  duration: {
    type: Number,
    required: true,
    min: [15, 'Session duration must be at least 15 minutes']
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledBy: {
    type: String,
    enum: ['client', 'expert', 'system']
  },
  cancellationTime: {
    type: Date
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative']
  },
  // Timeout fields for 5-minute booking timeout
  timeoutAt: {
    type: Date,
    default: function() {
      // Set timeout to 5 minutes from now
      return new Date(Date.now() + 5 * 60 * 1000);
    }
  },
  timeoutStatus: {
    type: String,
    enum: ['active', 'expired', 'completed'],
    default: 'active'
  },
  // Payment completion fields
  paymentCompletedAt: {
    type: Date
  },
  loyaltyPointsUsed: {
    type: Number,
    min: [0, 'Loyalty points used cannot be negative']
  },
  finalAmount: {
    type: Number,
    min: [0, 'Final amount cannot be negative']
  },
  // Creation timestamp
  createdTime: {
    type: Date,
    default: Date.now
  }
});

const bookingSchema = new Schema<IBooking>({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientUserId: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'Client user_id must be a 4-digit number']
  },
  clientEmail: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  sessions: [sessionSchema],
  totalSessions: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ clientId: 1 });
bookingSchema.index({ clientUserId: 1 });
bookingSchema.index({ 'sessions.expertId': 1 });
bookingSchema.index({ 'sessions.status': 1 });
bookingSchema.index({ 'sessions.scheduledDate': 1 });
bookingSchema.index({ 'sessions.paymentStatus': 1 });
bookingSchema.index({ updatedAt: -1 });

// Pre-save middleware to update totalSessions and totalSpent
bookingSchema.pre('save', function(next) {
  this.totalSessions = this.sessions.length;
  this.totalSpent = this.sessions.reduce((total, session) => total + (session.price || 0), 0);
  next();
});

export default mongoose.model<IBooking>('Booking', bookingSchema); 