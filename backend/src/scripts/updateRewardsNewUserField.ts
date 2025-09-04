import mongoose from 'mongoose';
import Reward from '../models/Reward';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';

async function updateRewardsNewUserField() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all existing reward documents to include the newUserRewardRedeemed field
    const result = await Reward.updateMany(
      { newUserRewardRedeemed: { $exists: false } },
      { $set: { newUserRewardRedeemed: false } }
    );

    console.log(`Updated ${result.modifiedCount} reward documents with newUserRewardRedeemed field`);

    // Verify the update
    const totalRewards = await Reward.countDocuments();
    const rewardsWithNewField = await Reward.countDocuments({ newUserRewardRedeemed: { $exists: true } });
    
    console.log(`Total reward documents: ${totalRewards}`);
    console.log(`Reward documents with newUserRewardRedeemed field: ${rewardsWithNewField}`);

    if (totalRewards === rewardsWithNewField) {
      console.log('✅ Migration completed successfully! All reward documents now have the newUserRewardRedeemed field.');
    } else {
      console.log('⚠️  Warning: Some reward documents may not have been updated.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
updateRewardsNewUserField();
