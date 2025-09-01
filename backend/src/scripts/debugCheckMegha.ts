import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database';
import User from '../models/User';

const run = async () => {
  try {
    await connectDB();
    const email = 'megha@confiido.com';
    const user = await User.findOne({ email }).lean(false); // get document instance
    if (!user) {
      console.log('User not found');
      return;
    }
    const plain = 'megha@123';
    const isMatch = await bcrypt.compare(plain, user.password as string);
    console.log('Hashed in DB:', user.password);
    console.log('Compare result for megha@123:', isMatch);
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.connection.close();
  }
};

run();



