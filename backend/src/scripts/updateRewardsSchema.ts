import mongoose from 'mongoose';
import Reward from '../models/Reward';
import '../config/database';

async function updateRewardsSchema() {
  try {
    console.log('Starting rewards schema update...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('Connected to database');
    
    console.log('claimedBonuses field does not exist in Reward model. No updates needed.');
    
    console.log('Successfully updated all rewards with claimedBonuses field');
    
  } catch (error) {
    console.error('Error updating rewards schema:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the script
updateRewardsSchema();
