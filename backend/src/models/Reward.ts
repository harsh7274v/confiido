import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRewardActivity {
  type: 'earned' | 'spent';
  description: string;
  points: number; // positive for earned, negative for spent
  date: Date;
  status: 'completed' | 'pending' | 'failed';
}

export interface IReward extends Document {
  userId: Types.ObjectId; // MongoDB ObjectId reference to User
  user_id: string; // 4-digit unique user ID from users collection
  points: number;
  totalEarned: number;
  totalSpent: number;
  history: IRewardActivity[];
  createdAt: Date;
  updatedAt: Date;
}

const RewardActivitySchema = new Schema<IRewardActivity>({
  type: { type: String, enum: ['earned', 'spent'], required: true },
  description: { type: String, required: true },
  points: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' }
}, { _id: false });

const RewardSchema = new Schema<IReward>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // MongoDB ObjectId
  user_id: { type: String, required: true }, // 4-digit unique user ID
  points: { type: Number, required: true, default: 0 },
  totalEarned: { type: Number, required: true, default: 0 },
  totalSpent: { type: Number, required: true, default: 0 },
  history: { type: [RewardActivitySchema], default: [] },
}, { timestamps: true });

// Force fresh model compilation by deleting old model first
if (mongoose.models.Reward) {
  delete mongoose.models.Reward;
}

const Reward = mongoose.model<IReward>('Reward', RewardSchema);

export default Reward;


