import mongoose from 'mongoose';

async function testDatabaseConnection() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';
    console.log('Connecting to MongoDB:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections in database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Check if rewards collection exists
    const rewardsCollection = collections.find(col => col.name === 'rewards');
    if (rewardsCollection) {
      console.log('✅ Rewards collection exists');
      
      // Get collection info
      const collectionInfo = await db.collection('rewards').indexes();
      console.log('📊 Rewards collection indexes:');
      collectionInfo.forEach(index => {
        console.log(`  - ${JSON.stringify(index)}`);
      });
    } else {
      console.log('❌ Rewards collection does not exist');
    }

    console.log('Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testDatabaseConnection();
}

export default testDatabaseConnection;
