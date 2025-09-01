import mongoose from 'mongoose';
import Reward from '../models/Reward';

async function migrateRewardsUserId() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Find all rewards with the old user_id field
    const rewards = await Reward.find({ user_id: { $exists: true } } as any);
    console.log(`Found ${rewards.length} rewards with old user_id field`);

    if (rewards.length === 0) {
      console.log('No rewards to migrate');
      return;
    }

    // Update each reward
    for (const reward of rewards) {
      try {
        // Copy user_id value to userId field
        const oldUserId = (reward as any).user_id;
        
        // Update the document
        await Reward.updateOne(
          { _id: reward._id },
          { 
            $set: { userId: oldUserId },
            $unset: { user_id: 1 }
          }
        );
        
        console.log(`Migrated reward ${reward._id}: user_id ${oldUserId} -> userId ${oldUserId}`);
      } catch (error) {
        console.error(`Error migrating reward ${reward._id}:`, error);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateRewardsUserId();
}

export default migrateRewardsUserId;
