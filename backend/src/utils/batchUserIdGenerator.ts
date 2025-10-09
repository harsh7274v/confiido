import UserIdCounter from '../models/UserIdCounter';
import User from '../models/User';

/**
 * Batch user ID generator for high-volume scenarios
 * Generates multiple user IDs in a single operation for better performance
 */
export class BatchUserIdGenerator {
  private static instance: BatchUserIdGenerator;
  private batchSize: number;
  private reservedIds: number[] = [];
  private lastReservedId: number = 0;

  constructor(batchSize: number = 100) {
    this.batchSize = batchSize;
  }

  static getInstance(batchSize?: number): BatchUserIdGenerator {
    if (!BatchUserIdGenerator.instance) {
      BatchUserIdGenerator.instance = new BatchUserIdGenerator(batchSize);
    }
    return BatchUserIdGenerator.instance;
  }

  /**
   * Reserves a batch of user IDs for high-volume scenarios
   * @returns Promise<number[]> - Array of reserved user IDs
   */
  async reserveBatch(): Promise<number[]> {
    try {
      // Get the current counter and reserve a batch
      const counter = await UserIdCounter.findByIdAndUpdate(
        'userIdCounter',
        { $inc: { nextUserId: this.batchSize } },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      if (!counter) {
        throw new Error('Failed to get user ID counter');
      }

      const startId = counter.nextUserId - this.batchSize + 1;
      const endId = counter.nextUserId;
      
      // Generate the batch of IDs
      const batchIds: number[] = [];
      for (let id = startId; id <= endId; id++) {
        batchIds.push(id);
      }

      this.reservedIds = batchIds;
      this.lastReservedId = endId;
      
      return batchIds;
    } catch (error) {
      console.error('Failed to reserve batch of user IDs:', error);
      throw error;
    }
  }

  /**
   * Gets the next available user ID from the reserved batch
   * @returns string - The next user ID
   */
  getNextUserId(): string {
    if (this.reservedIds.length === 0) {
      throw new Error('No reserved user IDs available. Call reserveBatch() first.');
    }

    const userId = this.reservedIds.shift();
    if (userId === undefined) {
      throw new Error('No more reserved user IDs available');
    }

    return userId.toString();
  }

  /**
   * Checks if more user IDs are available in the current batch
   * @returns boolean
   */
  hasMoreIds(): boolean {
    return this.reservedIds.length > 0;
  }

  /**
   * Gets the number of remaining user IDs in the current batch
   * @returns number
   */
  getRemainingCount(): number {
    return this.reservedIds.length;
  }

  /**
   * Generates a single user ID with automatic batch management
   * @returns Promise<string> - A unique user ID
   */
  async generateUserId(): Promise<string> {
    if (!this.hasMoreIds()) {
      await this.reserveBatch();
    }

    return this.getNextUserId();
  }

  /**
   * Generates multiple user IDs efficiently
   * @param count - Number of user IDs to generate
   * @returns Promise<string[]> - Array of user IDs
   */
  async generateUserIds(count: number): Promise<string[]> {
    const userIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      userIds.push(await this.generateUserId());
    }
    
    return userIds;
  }

  /**
   * Validates that reserved user IDs don't conflict with existing users
   * @returns Promise<boolean> - True if all IDs are unique
   */
  async validateReservedIds(): Promise<boolean> {
    if (this.reservedIds.length === 0) {
      return true;
    }

    try {
      const existingUsers = await User.find({
        user_id: { $in: this.reservedIds.map(id => id.toString()) }
      }).lean();

      if (existingUsers.length > 0) {
        console.warn(`Found ${existingUsers.length} conflicting user IDs in reserved batch`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate reserved user IDs:', error);
      return false;
    }
  }

  /**
   * Clears the current batch and forces a new reservation
   */
  clearBatch(): void {
    this.reservedIds = [];
    this.lastReservedId = 0;
  }
}

/**
 * Convenience function to generate a single user ID using batch processing
 * @returns Promise<string> - A unique user ID
 */
export const generateBatchUserId = async (): Promise<string> => {
  const generator = BatchUserIdGenerator.getInstance();
  return await generator.generateUserId();
};

/**
 * Convenience function to generate multiple user IDs efficiently
 * @param count - Number of user IDs to generate
 * @returns Promise<string[]> - Array of user IDs
 */
export const generateBatchUserIds = async (count: number): Promise<string[]> => {
  const generator = BatchUserIdGenerator.getInstance();
  return await generator.generateUserIds(count);
};

