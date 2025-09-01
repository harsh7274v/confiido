import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Transaction from '../models/Transaction';
import { connectDB } from '../config/database';

async function run() {
  await connectDB();
  const tx = await Transaction.create({
    user_id: '6558',
    transaction_id: 'TXN_TEST',
    status: 'completed',
    mentor_name: 'Test Mentor',
    service: 'Test Service',
    type: 'booking',
  itemId: new mongoose.Types.ObjectId(),
    amount: 1000,
    currency: 'INR',
    paymentMethod: 'stripe',
    description: 'Manual test transaction',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Inserted transaction:', tx);
  mongoose.connection.close();
}

run().catch(err => {
  console.error('Error inserting transaction:', err);
  mongoose.connection.close();
});
