import mongoose, { Document, Schema } from 'mongoose';

export interface IUserIdCounter extends Document {
  _id: string;
  nextUserId: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserIdCounterSchema = new Schema<IUserIdCounter>({
  _id: {
    type: String,
    default: 'userIdCounter'
  },
  nextUserId: {
    type: Number,
    default: 1000,
    required: true
  }
}, {
  timestamps: true,
  _id: false
});

// Create a unique index to ensure only one counter document exists
UserIdCounterSchema.index({ _id: 1 }, { unique: true });

export default mongoose.model<IUserIdCounter>('UserIdCounter', UserIdCounterSchema);
