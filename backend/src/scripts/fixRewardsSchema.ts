import mongoose from 'mongoose';

async function fixRewardsSchema() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/confiido';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop the old rewards collection to remove old indexes and constraints
    console.log('Dropping old rewards collection...');
    await db.dropCollection('rewards');
    console.log('Old rewards collection dropped successfully');

    // The new schema will be created automatically when the first reward is inserted
    console.log('Schema fix completed. New rewards will use the updated schema.');

  } catch (error) {
    console.error('Schema fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if this script is executed directly
if (require.main === module) {
  fixRewardsSchema();
}

export default fixRewardsSchema;
