import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Transaction from '../models/Transaction';

async function run(): Promise<void> {
  const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL || '';
  if (!mongoUri) {
    console.error('MONGO_URI/DATABASE_URL not set');
    process.exit(1);
  }

  try {
    console.log('[FIX] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    const indexes = await Transaction.collection.indexes();
    console.log('[FIX] Current indexes:', indexes.map(i => i.name));

    const legacy = indexes.find((idx: any) => idx.name === 'transaction_id_1');
    if (legacy) {
      console.log('[FIX] Dropping legacy index transaction_id_1');
      await Transaction.collection.dropIndex('transaction_id_1').catch(() => {});
    } else {
      console.log('[FIX] Legacy index not found, nothing to drop');
    }

    console.log('[FIX] Syncing schema indexes');
    await Transaction.syncIndexes();
    console.log('[FIX] Done');
  } catch (err) {
    console.error('[FIX] Error fixing transaction indexes:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


