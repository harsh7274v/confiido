import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
  type: 'login' | 'reset' | 'signup';
}

const OTPSchema: Schema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  type: { type: String, enum: ['login', 'reset', 'signup'], default: 'login', required: true }
}, { timestamps: true });

export default mongoose.model<IOTP>('OTP', OTPSchema);
