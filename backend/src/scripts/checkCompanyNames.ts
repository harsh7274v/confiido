import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import Expert from '../models/Expert';

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Check for any remaining "Independent Consultant" records
    const independentConsultants = await Expert.find({ company: 'Independent Consultant' });
    console.log(`Found ${independentConsultants.length} Expert records with "Independent Consultant"`);
    
    if (independentConsultants.length > 0) {
      independentConsultants.forEach(expert => {
        console.log(`Expert ID: ${expert._id}, Name: ${expert.title}, Company: ${expert.company}`);
      });
    }

    // Check for "Professional Mentor" records
    const professionalMentors = await Expert.find({ company: 'Professional Mentor' });
    console.log(`Found ${professionalMentors.length} Expert records with "Professional Mentor"`);
    
    if (professionalMentors.length > 0) {
      professionalMentors.forEach(expert => {
        console.log(`Expert ID: ${expert._id}, Name: ${expert.title}, Company: ${expert.company}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Failed to check company names:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from database');
  }
};

run();
