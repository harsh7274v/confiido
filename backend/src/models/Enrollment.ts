import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  expertId: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  completionDate?: Date;
  progress: number; // percentage completed (0-100)
  completedLessons: mongoose.Types.ObjectId[];
  currentLesson?: mongoose.Types.ObjectId;
  lastAccessedAt: Date;
  certificateIssued: boolean;
  certificateIssuedAt?: Date;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentAmount: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  expertId: {
    type: Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100']
  },
  completedLessons: [{
    type: Schema.Types.ObjectId
  }],
  currentLesson: {
    type: Schema.Types.ObjectId
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedAt: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ expertId: 1 });
enrollmentSchema.index({ paymentStatus: 1 });
enrollmentSchema.index({ isActive: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });

// Compound index for unique enrollment per user per course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', enrollmentSchema); 