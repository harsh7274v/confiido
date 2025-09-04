# Automatic Rewards Creation System

## Overview

The rewards system has been updated to automatically create reward accounts for new users during registration, rather than when they first visit the rewards page.

## How It Works Now

### 1. **User Registration** (`/api/auth/register`)
- When a new user registers via traditional signup
- **Automatically creates** a reward account with:
  - `userId`: References the user's `_id` (ObjectId)
  - `points`: 0 (no welcome bonus)
  - `totalEarned`: 0
  - `totalSpent`: 0
  - `history`: Welcome bonus transaction

### 2. **Firebase Authentication** (`/api/auth/*`)
- When a new user signs in via Firebase for the first time
- **Automatically creates** a reward account with same structure
- Handles both main auth and optional auth middleware

### 3. **Mock User Creation** (Development)
- When mock users are created for testing
- **Automatically creates** reward accounts for them too

### 4. **Rewards Page** (`/api/rewards/me`)
- **Only fetches** existing rewards
- **No longer creates** new reward accounts
- Returns 404 if no reward account exists (shouldn't happen with new users)

## Benefits

✅ **Better User Experience**: Users get rewards immediately upon registration  
✅ **Consistent Data**: All users have reward accounts from day one  
✅ **No Race Conditions**: Rewards created during user creation, not page access  
✅ **Proper References**: Uses `userId` (ObjectId) that matches user's `_id`  
✅ **Single Source of Truth**: Rewards creation logic centralized in auth flows  

## Technical Implementation

### Reward Model Schema
```typescript
{
  userId: ObjectId,        // References User._id (MongoDB ObjectId)
  user_id: String,         // 4-digit unique user ID from users collection
  points: Number,          // Current balance
  totalEarned: Number,     // Total points earned
  totalSpent: Number,      // Total points spent
  history: [RewardActivity], // Transaction history
  createdAt: Date,
  updatedAt: Date
}
```

### Reward Creation Flow
```typescript
// During user creation (registration/auth)
await Reward.create({
  userId: user._id,        // User's MongoDB ObjectId
  user_id: user.user_id,   // User's 4-digit unique ID
  points: 0,               // No welcome bonus
  totalEarned: 0,
  totalSpent: 0,
  history: [{
    type: 'earned',
    description: 'Welcome bonus for new user',
    points: 0,
    status: 'completed',
    date: new Date()
  }]
});
```

### Rewards Fetching Flow
```typescript
// When accessing rewards page
const reward = await Reward.findOne({ userId: user._id });
if (!reward) {
  return res.status(404).json({ 
    message: 'Reward account not found. Please contact support.' 
  });
}
```

## Error Handling

- **Rewards creation failure** doesn't fail user registration
- **Logs errors** for debugging but continues with user creation
- **Graceful fallback** if rewards system is temporarily unavailable

## Migration Notes

- **Existing users** without rewards will get 404 when accessing rewards page
- **New users** will automatically get reward accounts
- **Database schema** uses `userId` field (ObjectId) for proper references

## Testing

To test the new system:

1. **Register a new user** via `/api/auth/register`
2. **Check database** - should see reward document with `userId` field
3. **Access rewards page** - should see 0 points initially
4. **Verify references** - `userId` should match user's `_id`

## Future Enhancements

- **Bulk reward creation** for existing users without rewards
- **Reward templates** for different user types
- **Welcome bonus customization** based on registration method
