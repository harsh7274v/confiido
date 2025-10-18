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

// No need to create index on _id - MongoDB does this automatically

export default mongoose.model<IUserIdCounter>('UserIdCounter', UserIdCounterSchema);
