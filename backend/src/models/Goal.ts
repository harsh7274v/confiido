import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries (compound index that includes userId)
goalSchema.index({ userId: 1, createdAt: -1 });

export const Goal = mongoose.model<IGoal>('Goal', goalSchema); 