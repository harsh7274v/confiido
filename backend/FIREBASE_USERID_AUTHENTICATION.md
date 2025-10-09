# Firebase UserId Authentication System

## Overview
This document explains the unified authentication system that allows both Firebase and traditional users to use the same 4-digit `userId` for authentication.

## Key Features

### ✅ Unified Authentication
- **Firebase users**: Use 4-digit `userId` for authentication (same as traditional users)
- **Traditional users**: Continue using 4-digit `userId` for authentication
- **Consistent experience**: Both user types use the same authentication flow

### ✅ Automatic UserId Generation
- **New Firebase users**: Automatically get a unique 4-digit `userId` when created
- **New traditional users**: Continue to get unique 4-digit `userId` when created
- **Existing users**: Get `userId` assigned when they next authenticate

## Authentication Flow

### 1. Firebase Authentication
```
1. User signs in with Firebase
2. Firebase token is verified
3. User gets 4-digit userId (if new user)
4. JWT token is generated using userId
5. Client uses JWT token for future requests
```

### 2. Traditional Authentication
```
1. User signs in with email/password
2. User gets 4-digit userId (if new user)
3. JWT token is generated using userId
4. Client uses JWT token for future requests
```

## API Endpoints

### Firebase Authentication
- **POST** `/api/auth/verify` - Verify Firebase token and return JWT with userId
- **Response includes**:
  - `user.user_id`: 4-digit user ID
  - `token`: JWT token for future authentication

### Traditional Authentication
- **POST** `/api/auth/login` - Login with email/password
- **POST** `/api/auth/register` - Register new user
- **Both return JWT token with userId**

## JWT Token Format

### New Format (Recommended)
- **Type**: Standard JWT token
- **Payload**: `{ id: "1234" }` (where 1234 is the 4-digit userId)
- **Usage**: All new authentications use this format

### Legacy Format (Still Supported)
- **Type**: Custom format
- **Format**: `token_<mongodb_id>_<timestamp>`
- **Usage**: Backward compatibility for existing tokens

## Database Schema

### User Model
```typescript
{
  _id: ObjectId,           // MongoDB ID
  user_id: "1234",         // 4-digit unique ID (NEW)
  firebaseUid: "abc123",   // Firebase UID (for Firebase users)
  email: "user@example.com",
  // ... other fields
}
```

## Middleware Updates

### Auth Middleware (`protect`)
1. **Firebase token**: Verify Firebase token, get user, ensure userId
2. **JWT token (new)**: Verify JWT, find user by userId
3. **JWT token (legacy)**: Verify legacy JWT, find user by MongoDB _id

### Optional Auth Middleware (`optionalAuth`)
- Same logic as `protect` but allows requests without authentication
- Supports all token formats

## Migration Scripts

### For Existing Users
```bash
# Assign userId to existing users
npx ts-node src/scripts/assignUserIdToExistingUsers.ts
```

### Testing
```bash
# Test userId generation
npx ts-node src/scripts/testUserIdGeneration.ts

# Test Firebase authentication
npx ts-node src/scripts/testFirebaseUserIdAuth.ts
```

## Benefits

### 🔄 Unified System
- Both Firebase and traditional users use the same authentication method
- Consistent API responses and user identification
- Same JWT token format for all users

### 🔒 Security
- 4-digit userIds are easier to manage than long MongoDB IDs
- JWT tokens are properly signed and verified
- Backward compatibility maintained

### 🚀 Performance
- Faster user lookups using indexed userId field
- Consistent authentication flow reduces complexity
- Better caching and session management

## Usage Examples

### Frontend Authentication
```javascript
// Firebase user authentication
const firebaseUser = await signInWithEmailAndPassword(auth, email, password);
const idToken = await firebaseUser.user.getIdToken();

// Verify with backend
const response = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const { data } = await response.json();
const { user, token } = data;

// Use JWT token for future requests
localStorage.setItem('authToken', token);
```

### API Requests
```javascript
// Make authenticated requests
const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}` // JWT token with userId
  }
});
```

## Troubleshooting

### Common Issues
1. **Missing userId**: Run the migration script to assign userIds to existing users
2. **Token format errors**: Ensure you're using the new JWT format
3. **Authentication failures**: Check that the user has a valid userId

### Debug Logs
The authentication middleware includes detailed logging:
- Token type detection
- User lookup results
- Authentication success/failure reasons

## Future Enhancements

### Planned Features
- [ ] UserId-based session management
- [ ] Enhanced token refresh mechanism
- [ ] UserId-based API rate limiting
- [ ] Analytics integration with userId tracking

---

## Summary

The Firebase UserId Authentication system provides a unified authentication experience for both Firebase and traditional users. All users now use 4-digit `userId` for authentication, ensuring consistency across the platform while maintaining backward compatibility with existing systems.
