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

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists with email:', email);
      await mongoose.connection.close();
      return;
    }

    const passwordPlain = 'megha@123';

    const now = new Date();

    const created = await User.create({
      email,
      mentor_email: 'meghaupadhyay414@gmail.com',
      // let mongoose pre-save hook hash this
      password: passwordPlain,
      firstName: 'Megha',
      lastName: 'Upadhyay',
      username: 'megha_expert',
      role: 'expert',
      isExpert: true,
      isVerified: true,
      isActive: true,
      user_id: '1534',
      category: 'working_professional',
      profession: 'Mentor',
      domain: 'General Mentoring',
      bio: 'Experienced mentor helping students and professionals achieve their goals.',
      lastLogin: now,
      // timestamps will be set automatically by Mongoose
      preferences: {
        notifications: { email: true, push: true, sms: false },
        privacy: { profileVisibility: 'public', showOnlineStatus: true }
      }
    });

    console.log('✅ Inserted user:', created.email);
  } catch (err) {
    console.error('❌ Failed to insert user:', err);
  } finally {
    await mongoose.connection.close();
  }
};

run();


