import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import User from '../models/User';

const run = async () => {
  try {
    await connectDB();

    const email = 'megha@confiido.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      await mongoose.connection.close();
      return;
    }

    user.password = 'megha@123'; // pre-save hook will hash it
    await user.save();
    console.log('✅ Password reset for:', email);
  } catch (err) {
    console.error('❌ Failed to reset password:', err);
  } finally {
    await mongoose.connection.close();
  }
};

run();



