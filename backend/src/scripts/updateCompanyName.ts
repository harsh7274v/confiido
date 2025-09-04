import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import Expert from '../models/Expert';
import Booking from '../models/Booking';

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Update all Expert records with company "Independent Consultant" to "Professional Mentor"
    const expertResult = await Expert.updateMany(
      { company: 'Independent Consultant' },
      { $set: { company: 'Professional Mentor' } }
    );
    console.log(`Updated ${expertResult.modifiedCount} Expert records`);

    // Note: Booking records don't store company information directly
    // The company is stored in the Expert collection and referenced via expertId
    // So we only need to update Expert records, which we already did above
    console.log('Booking records use references to Expert collection, no direct update needed');

    // Also update any other collections that might have this company name
    // Check if there are any other models that might store expert data
    console.log('Company name update completed successfully');
    
  } catch (err) {
    console.error('❌ Failed to update company names:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
};

run();
