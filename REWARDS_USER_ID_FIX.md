# Rewards User ID Mismatch Fix

## Problem Description

The rewards collection in the backend had a field naming inconsistency that caused the `user_id` field to not match with the authenticated user's ID from the users collection.

### Root Cause

1. **User Model**: Has two ID fields:
   - `_id`: MongoDB ObjectId (auto-generated)
   - `user_id`: String (4-digit unique ID)

2. **Reward Model**: Had `user_id` field defined as ObjectId, but this was inconsistent with other models

3. **Data Mismatch**: 
   - Auth middleware sets `req.user` with User document (has `_id` as ObjectId)
   - Rewards route was using `user._id` (ObjectId) to query rewards
   - But the field name `user_id` was confusing and inconsistent

## Solution Implemented

### 1. Updated Reward Model (`backend/src/models/Reward.ts`)
- Changed field name from `user_id` to `userId` for consistency
- Kept the type as `Types.ObjectId` since that's what the auth system provides
- This makes it consistent with other models (Goal, Message, Analytics, etc.)

### 2. Updated Rewards Route (`backend/src/routes/rewards.ts`)
- Changed all queries from `user_id: user._id` to `userId: user._id`
- Updated both the GET `/me` and POST `/redeem` endpoints

### 3. Updated Frontend Interface (`frontend/app/services/rewardsApi.ts`)
- Changed `RewardAccount` interface from `user_id: string` to `userId: string`
- This maintains consistency with the backend

### 4. Created Migration Script (`backend/src/scripts/migrateRewardsUserId.ts`)
- Script to migrate existing rewards data from old `user_id` field to new `userId` field
- Safely handles the transition without data loss

## How to Apply the Fix

### 1. Run the Migration Script
```bash
cd backend
npm run migrate:rewards
```

This will:
- Find all existing rewards with the old `user_id` field
- Copy the value to the new `userId` field
- Remove the old `user_id` field
- Log the migration progress

### 2. Restart the Backend
After running the migration, restart your backend server to ensure the new model changes take effect.

### 3. Test the Fix
- The rewards should now properly match with authenticated users
- The `userId` field in rewards will contain the same ObjectId as the user's `_id` field
- Frontend should display rewards correctly for authenticated users

## Technical Details

### Before (Problematic)
```typescript
// Reward model
user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }

// Rewards route
let reward = await Reward.findOne({ user_id: user._id });
```

### After (Fixed)
```typescript
// Reward model
userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }

// Rewards route
let reward = await Reward.findOne({ userId: user._id });
```

## Benefits of This Fix

1. **Consistency**: All models now use `userId` with ObjectId type
2. **Clarity**: Field name clearly indicates it's a user ID reference
3. **Maintainability**: Easier to understand and maintain
4. **Data Integrity**: Proper ObjectId references ensure data consistency

## Verification

After applying the fix, you can verify:
1. Rewards are properly associated with authenticated users
2. The `userId` field in rewards matches the user's `_id` field
3. Frontend displays rewards correctly for logged-in users
4. No data loss occurred during the migration
