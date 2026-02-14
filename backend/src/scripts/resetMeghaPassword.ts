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

    user.password = 'megha@7274'; // pre-save hook will hash it
    user.isExpert = true; // Ensure user is marked as expert
    await user.save();
    console.log('✅ Password updated to megha@7274 and expert status secured for:', email);
  } catch (err) {
    console.error('❌ Failed to reset password:', err);
  } finally {
    await mongoose.connection.close();
  }
};

run();



