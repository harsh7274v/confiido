import mongoose, { Document, Schema } from 'mongoose';

export interface IUserData extends Document {
  user_id: string;
  username: string;
  password: string;
  dateOfBirth: string;
  profession: string;
  phoneNumber: string;
  whatsappNumber: string;
  linkedin: string;
  createdAt: Date;
  updatedAt: Date;
}

const userDataSchema = new Schema<IUserData>({
  user_id: {
    type: String,
    unique: true,
    required: true
  },
  username: { type: String, required: true },
  password: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  profession: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  whatsappNumber: { type: String, required: true },
  linkedin: { type: String, required: true },
}, { timestamps: true });

const UserData = mongoose.model<IUserData>('UserData', userDataSchema);
export default UserData;
