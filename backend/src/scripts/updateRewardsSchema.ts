import mongoose from 'mongoose';
import Reward from '../models/Reward';
import '../config/database';

async function updateRewardsSchema() {
  try {
    console.log('Starting rewards schema update...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido');
    console.log('Connected to database');
    
    // Find all reward documents that don't have claimedBonuses field
    const rewards = await Reward.find({ claimedBonuses: { $exists: false } });
    console.log(`Found ${rewards.length} rewards without claimedBonuses field`);
    
    // Update each reward to include claimedBonuses field
    for (const reward of rewards) {
      reward.claimedBonuses = [];
      await reward.save();
      console.log(`Updated reward for user ${reward.userId}`);
    }
    
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
