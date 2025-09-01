import mongoose from 'mongoose';

async function exploreDatabase() {
  try {
    // Connect to MongoDB using the same connection logic as the main app
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lumina';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB:', mongoURI);

    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Check users collection specifically
    if (collections.find(col => col.name === 'users')) {
      console.log('\n👥 Users collection found!');
      const userCount = await db.collection('users').countDocuments();
      console.log(`Total users: ${userCount}`);
      
      if (userCount > 0) {
        const sampleUser = await db.collection('users').findOne({});
        console.log('Sample user:', JSON.stringify(sampleUser, null, 2));
      }
    } else {
      console.log('\n❌ Users collection not found');
    }

    // Check if there are any other user-related collections
    const userRelatedCollections = collections.filter(col => 
      col.name.includes('user') || 
      col.name.includes('User') ||
      col.name.includes('auth')
    );
    
    if (userRelatedCollections.length > 0) {
      console.log('\n🔍 User-related collections found:');
      for (const col of userRelatedCollections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`  - ${col.name}: ${count} documents`);
      }
    }

    // Check rewards collection
    if (collections.find(col => col.name === 'rewards')) {
      console.log('\n🎁 Rewards collection found!');
      const rewardCount = await db.collection('rewards').countDocuments();
      console.log(`Total rewards: ${rewardCount}`);
      
      if (rewardCount > 0) {
        const sampleReward = await db.collection('rewards').findOne({});
        console.log('Sample reward:', JSON.stringify(sampleReward, null, 2));
      }
    } else {
      console.log('\n❌ Rewards collection not found');
    }

    // Check database name
    console.log('\n🏗️ Database info:');
    console.log(`Database name: ${db.databaseName}`);
    console.log(`Connection string: ${mongoURI}`);

  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  exploreDatabase();
}

export default exploreDatabase;
