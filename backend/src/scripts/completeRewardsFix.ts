import mongoose from 'mongoose';

async function completeRewardsFix() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // 1. Drop the rewards collection completely
    console.log('Step 1: Dropping rewards collection...');
    try {
      await db.dropCollection('rewards');
      console.log('✅ Rewards collection dropped successfully');
    } catch (error) {
      console.log('Rewards collection was already dropped or never existed');
    }

    // 2. Drop any hidden collections that might exist
    console.log('Step 2: Checking for hidden collections...');
    const collections = await db.listCollections().toArray();
    const rewardsRelated = collections.filter(col => 
      col.name.includes('rewards') || 
      col.name.includes('reward') ||
      col.name.includes('user_id')
    );
    
    if (rewardsRelated.length > 0) {
      console.log('Found related collections:', rewardsRelated.map(c => c.name));
      for (const col of rewardsRelated) {
        try {
          await db.dropCollection(col.name);
          console.log(`✅ Dropped collection: ${col.name}`);
        } catch (error) {
          console.log(`Could not drop collection: ${col.name}`);
        }
      }
    }

    // 3. Check if there are any system indexes that might be causing issues
    console.log('Step 3: Checking for system indexes...');
    try {
      const systemIndexes = await db.collection('system.indexes').find({}).toArray();
      const rewardsIndexes = systemIndexes.filter(idx => 
        idx.ns && idx.ns.includes('rewards')
      );
      
      if (rewardsIndexes.length > 0) {
        console.log('Found system indexes for rewards:', rewardsIndexes);
        // Note: We can't easily drop system indexes, but this gives us info
      }
    } catch (error) {
      console.log('Could not check system indexes');
    }

    // 4. Force a database sync
    console.log('Step 4: Forcing database sync...');
    await db.command({ fsync: 1 });
    console.log('✅ Database synced');

    console.log('🎉 Complete rewards fix completed!');
    console.log('📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. The new schema will be created automatically');
    console.log('   3. Test the rewards endpoint');

  } catch (error) {
    console.error('Complete rewards fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  completeRewardsFix();
}

export default completeRewardsFix;
