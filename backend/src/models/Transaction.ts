import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  expertId?: mongoose.Types.ObjectId;
  type: 'booking' | 'course' | 'webinar' | 'bundle' | 'digital_product' | 'priority_dm';
  itemId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'upi' | 'crypto';
  paymentIntentId?: string;
  transactionId?: string;
  description: string;
  metadata?: {
    sessionTitle?: string;
    courseName?: string;
    webinarTitle?: string;
    bundleName?: string;
    productName?: string;
  };
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert'
  },
  type: {
    type: String,
    enum: ['booking', 'course', 'webinar', 'bundle', 'digital_product', 'priority_dm'],
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'upi', 'crypto'],
    required: true
  },
  paymentIntentId: String,
  transactionId: String,
  description: {
    type: String,
    required: true
  },
  metadata: {
    sessionTitle: String,
    courseName: String,
    webinarTitle: String,
    bundleName: String,
    productName: String
  },
  completedAt: Date,
  failedAt: Date,
  failureReason: String,
  refundAmount: {
    type: Number,
    min: 0
  },
  refundReason: String
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ userId: 1, status: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ expertId: 1, status: 1 });
transactionSchema.index({ paymentIntentId: 1 });
transactionSchema.index({ transactionId: 1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);

