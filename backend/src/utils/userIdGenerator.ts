import User from '../models/User';
import UserIdCounter from '../models/UserIdCounter';
import mongoose from 'mongoose';

// Connection retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // Start with 100ms delay

/**
 * Generates a unique serial user ID starting from 1000
 * Optimized for high concurrency with connection pooling and retry logic
 * @returns Promise<string> - A unique serial user ID string
 */
export const generateUniqueUserId = async (): Promise<string> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use a lightweight approach without sessions for better performance
      const counter = await UserIdCounter.findByIdAndUpdate(
        'userIdCounter',
        { $inc: { nextUserId: 1 } },
        { 
          upsert: true, 
          new: true,
          // Remove session for better performance in high concurrency
          // The atomic operation is already safe without explicit transactions
        }
      );
      
      if (!counter) {
        throw new Error('Failed to get user ID counter');
      }
      
      const userId = counter.nextUserId;
      
      // Quick check if this user_id already exists (should be extremely rare)
      const existingUser = await User.findOne({ user_id: userId.toString() }).lean();
      
      if (existingUser) {
        // If it exists, find the next available ID and update counter
        let checkId = userId + 1;
        while (checkId <= 9999) {
          const userExists = await User.findOne({ user_id: checkId.toString() }).lean();
          if (!userExists) {
            // Update the counter to this ID to maintain sequence
            await UserIdCounter.findByIdAndUpdate(
              'userIdCounter',
              { nextUserId: checkId }
            );
            return checkId.toString();
          }
          checkId++;
        }
        
        throw new Error('Maximum user ID limit reached (9999)');
      }
      
      return userId.toString();
      
    } catch (error) {
      lastError = error as Error;
      
      // Handle specific MongoDB connection errors
      if (error instanceof Error) {
        if (error.message.includes('Connection pool') || 
            error.message.includes('SSL') ||
            error.message.includes('timeout')) {
          
          console.warn(`User ID generation attempt ${attempt} failed:`, error.message);
          
          if (attempt < MAX_RETRIES) {
            // Exponential backoff with jitter
            const delay = RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 50;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }
      
      // For non-connection errors, don't retry
      throw error;
    }
  }
  
  throw new Error(`Failed to generate user ID after ${MAX_RETRIES} attempts: ${lastError?.message}`);
};

/**
 * Ensures a user has a unique user_id, generates one if missing
 * @param user - The user document
 * @returns Promise<void>
 */
export const ensureUserId = async (user: any): Promise<void> => {
  if (!user.user_id) {
    try {
      user.user_id = await generateUniqueUserId();
      await user.save();
      console.log(`✅ Generated user_id ${user.user_id} for user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to generate user_id for user ${user.email}:`, error);
      throw error;
    }
  }
};
