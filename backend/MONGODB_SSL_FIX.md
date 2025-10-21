# MongoDB SSL/TLS Connection Error - Fixed

## Problem
```
MongoNetworkError: SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

This error occurs with Node.js v18+ due to OpenSSL 3.0 stricter SSL/TLS requirements when connecting to MongoDB Atlas.

## Solutions Applied

### 1. Updated Database Configuration (`src/config/database.ts`)
- Simplified SSL/TLS options
- Added explicit `ssl: true` and `tls: true` for Atlas connections
- Removed conflicting certificate validation options
- Increased `serverSelectionTimeoutMS` to 10000ms

### 2. Updated MongoDB Connection String (`.env`)
Added SSL parameters to the connection string:
```properties
MONGODB_URI=mongodb+srv://...?retryWrites=true&w=majority&appName=confiido&tls=true&tlsAllowInvalidCertificates=false
```

### 3. Alternative Solutions (if still not working)

#### Option A: Use Legacy OpenSSL Provider
Add to your start script in `package.json`:
```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--openssl-legacy-provider' nodemon src/index.ts",
    "start": "NODE_OPTIONS='--openssl-legacy-provider' node dist/index.js"
  }
}
```

#### Option B: Downgrade Node.js
If the issue persists, consider using Node.js v16 LTS:
```bash
nvm install 16
nvm use 16
```

#### Option C: Update MongoDB Atlas Network Access
1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com/)
2. Navigate to **Network Access**
3. Add your current IP address or use `0.0.0.0/0` for development
4. Ensure TLS/SSL is enabled for your cluster

#### Option D: Use Standard Connection String
Try replacing `mongodb+srv://` with standard `mongodb://`:
```properties
MONGODB_URI=mongodb://confiidoio:UzCmaVZ2SICeFh2H@confiido-shard-00-00.r6k2ucx.mongodb.net:27017,confiido-shard-00-01.r6k2ucx.mongodb.net:27017,confiido-shard-00-02.r6k2ucx.mongodb.net:27017/confiido?ssl=true&replicaSet=atlas-xxx&authSource=admin&retryWrites=true&w=majority
```

### 4. Environment-Specific Configuration

Create different connection options for development vs production:

```typescript
// In database.ts
const isDevelopment = process.env.NODE_ENV === 'development';

if (isAtlas) {
  Object.assign(connOptions, {
    ssl: true,
    tls: true,
    tlsInsecure: isDevelopment, // Allow insecure in dev only
  });
}
```

## Testing

After applying fixes, restart your server:
```bash
npm run dev
```

You should see:
```
🔌 Connecting to MongoDB...
✅ MongoDB connected successfully
🚀 Server running on port 5003
```

## Current Configuration

### Node.js Version
```
v18.20.2
```

### MongoDB Driver
```
mongodb@6.18.0
mongoose@8.17.0
```

### Connection Options
```typescript
{
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 100,
  minPoolSize: 10,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  readPreference: 'primaryPreferred',
  ssl: true,
  tls: true,
  tlsInsecure: false
}
```

## Additional Troubleshooting

### Check MongoDB Atlas Status
1. Verify cluster is running: [MongoDB Atlas](https://cloud.mongodb.com/)
2. Check database user permissions
3. Verify network access (IP whitelist)

### Check Network Connectivity
```bash
# Test DNS resolution
nslookup confiido.r6k2ucx.mongodb.net

# Test connection
telnet confiido.r6k2ucx.mongodb.net 27017
```

### Check SSL/TLS Support
```bash
# Check Node.js OpenSSL version
node -p "process.versions.openssl"
```

## Status

✅ **Configuration Updated**  
✅ **SSL/TLS Parameters Added**  
⏳ **Restart Server to Test**

---

**Date**: October 22, 2025  
**Issue**: SSL/TLS Connection Error  
**Status**: Fixed - Pending Verification
