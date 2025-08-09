import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  clientId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
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
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ clientId: 1 });
bookingSchema.index({ expertId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ createdAt: -1 });

export default mongoose.model<IBooking>('Booking', bookingSchema); 