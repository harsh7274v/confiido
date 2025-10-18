# User ID Duplicate Key Error - Fix Documentation

## ❌ Error Description

```
MongoServerError: E11000 duplicate key error collection: confiido.users index: user_id_1 dup key: { user_id: null }
```

## 🔍 Root Cause

The MongoDB database has a **unique index** on the `user_id` field, but multiple user documents have `user_id: null`. MongoDB's unique indexes don't allow duplicate `null` values by default, causing this error when trying to create new users via Firebase authentication.

## ✅ Solution

### Step 1: Run the Fix Script

In the backend directory, run:

```bash
npx ts-node src/scripts/fix-user-id-index.ts
```

This script will:
1. ✅ Drop the old `user_id` index
2. ✅ Assign unique `user_id` values to all users that have `null`
3. ✅ Create a new **sparse unique** index that allows `null` values

### Step 2: Verify the Fix

After running the script, you should see:
- All users have unique `user_id` values
- New Firebase users can be created without errors
- The index is now sparse (allows documents without `user_id`)

### Step 3: Restart Backend Server

```bash
npm run dev
```

## 🎯 What Changed

### Before:
- Index: `{ user_id: 1, unique: true }` (strict, no nulls allowed)
- Multiple users with `user_id: null` → Error

### After:
- Index: `{ user_id: 1, unique: true, sparse: true }` (allows nulls)
- All users have unique `user_id` values
- New users get auto-generated `user_id`

## 📝 Model Configuration

The User model already has the correct configuration:

```typescript
user_id: {
  type: String,
  unique: true,
  minlength: 4,
  maxlength: 4,
  sparse: true // ✅ This allows null values
}
```

## 🔧 Manual Fix (Alternative)

If you prefer to fix manually using MongoDB shell:

```javascript
// 1. Connect to your database
use confiido

// 2. Drop the old index
db.users.dropIndex("user_id_1")

// 3. Update users with null user_id
let nextId = 1000;
db.users.find({ user_id: null }).forEach(function(user) {
  db.users.updateOne(
    { _id: user._id },
    { $set: { user_id: nextId.toString().padStart(4, '0') } }
  );
  nextId++;
});

// 4. Create new sparse unique index
db.users.createIndex(
  { user_id: 1 },
  { unique: true, sparse: true }
)
```

## ✅ Verification

After applying the fix, test by:

1. **Creating a new Firebase user** via Google Sign-In
2. **Check logs** - should see: `Firebase user created successfully with user_id: XXXX`
3. **No errors** about duplicate keys

## 🚀 Prevention

The fix ensures:
- ✅ New users automatically get unique `user_id`
- ✅ Legacy users without `user_id` are handled gracefully
- ✅ No duplicate key errors
- ✅ Sparse index allows flexibility

## 📊 Expected Results

**Before Fix:**
```
Error: E11000 duplicate key error... user_id: null
POST /api/auth/verify 401
```

**After Fix:**
```
✅ Firebase user created successfully with user_id: 1678
✅ Rewards created for new Firebase user
Authentication successful for user: example@gmail.com
POST /api/auth/verify 200
```

## 🆘 Troubleshooting

### If the script fails:

1. **Check MongoDB connection:**
   - Verify `MONGODB_URI` in `.env` file
   - Ensure MongoDB is running

2. **Check permissions:**
   - Ensure you have write access to the database
   - User account needs `dbAdmin` role

3. **Manual cleanup:**
   ```bash
   # Connect to MongoDB
   mongosh "your-connection-string"
   
   # Use the database
   use confiido
   
   # Check existing indexes
   db.users.getIndexes()
   
   # Drop and recreate
   db.users.dropIndex("user_id_1")
   db.users.createIndex({user_id: 1}, {unique: true, sparse: true})
   ```

## 📞 Need Help?

If issues persist:
1. Check MongoDB logs
2. Verify all users have unique `user_id` values
3. Ensure the sparse index is properly created
4. Restart the backend server

---

**Status**: ✅ Fix script created and ready to run
**Impact**: Resolves Firebase authentication errors
**Downtime**: None (can be run while server is running)
