# New Booking Structure Implementation

## Overview

The booking system has been restructured to store multiple sessions in a single document instead of creating separate documents for each booking. This approach saves database space and makes it easier to manage user booking history.

## New Data Structure

### Before (Old Structure)
Each booking was a separate document with fields like:
- `clientId`, `expertId`, `sessionType`, `duration`, `scheduledDate`, etc.

### After (New Structure)
Multiple sessions are stored in a single booking document:

```json
{
  "_id": "68b61bd7a4c0bf9eaab38ee7",
  "clientId": "68b6134f8e21e1ae686349f7",
  "clientUserId": "9062",
  "clientEmail": "test0209@gmail.com",
  "sessions": [
    {
      "sessionId": "68b61bd7a4c0bf9eaab38ee6",
      "expertId": "68b0daa5349f0802590e2755",
      "expertUserId": "1534",
      "expertEmail": "megha@confiido.com",
      "sessionType": "chat",
      "duration": 30,
      "scheduledDate": "2025-08-29T00:00:00.000+00:00",
      "startTime": "12:30",
      "endTime": "13:00",
      "status": "pending",
      "price": 20,
      "currency": "INR",
      "paymentStatus": "pending",
      "notes": "Service: Resume Review"
    }
  ],
  "totalSessions": 1,
  "totalSpent": 20,
  "createdAt": "2025-09-01T22:19:03.359+00:00",
  "updatedAt": "2025-09-01T22:19:03.359+00:00"
}
```

## Key Benefits

1. **Space Efficiency**: Reduces database storage by eliminating duplicate client information
2. **Better Data Organization**: All sessions for a client are grouped together
3. **Easier Analytics**: Simple to calculate total sessions and spending per client
4. **Improved Performance**: Fewer documents to query and manage

## Implementation Details

### Model Changes (`backend/src/models/Booking.ts`)

- **New Interface**: `ISession` for individual session data
- **Updated Interface**: `IBooking` now contains `sessions` array instead of individual fields
- **Auto-calculation**: `totalSessions` and `totalSpent` are automatically calculated
- **Pre-save Middleware**: Updates totals whenever sessions are modified

### Route Changes (`backend/src/routes/bookings.ts`)

- **POST `/api/bookings`**: Now either creates new booking or adds session to existing one
- **Conflict Detection**: Checks for time conflicts within existing sessions
- **Session Management**: Each session gets a unique `sessionId`
- **Updated Queries**: All routes now work with the new nested structure

### Session Operations

- **Create**: New sessions are added to existing booking or create new booking
- **Update**: Individual sessions can be updated (confirm, cancel, complete)
- **Query**: Sessions can be filtered by status, date, expert, etc.

## API Changes

### Creating Bookings
```javascript
POST /api/bookings
{
  "expertId": "expert_user_id",
  "sessionType": "chat",
  "duration": 30,
  "scheduledDate": "2025-08-29",
  "startTime": "12:30",
  "notes": "Service: Resume Review"
}
```

### Response Structure
```javascript
{
  "success": true,
  "message": "Session booked successfully",
  "data": {
    "booking": { /* full booking document */ },
    "session": { /* newly created session */ }
  }
}
```

### Updating Sessions
All session operations now require a `sessionId`:

```javascript
PUT /api/bookings/:bookingId/confirm
{
  "sessionId": "session_object_id"
}

PUT /api/bookings/:bookingId/cancel
{
  "sessionId": "session_object_id",
  "reason": "Cancellation reason"
}

PUT /api/bookings/:bookingId/complete
{
  "sessionId": "session_object_id"
}
```

## Database Migration

### For Existing Data
If you have existing booking data in the old format, you'll need to migrate it. The new structure is backward-compatible for reading, but new bookings will use the new format.

### Migration Strategy
1. Create new booking documents for each client
2. Convert old booking records to sessions
3. Update any frontend code that expects the old structure

## Testing

A test script has been created at `backend/test-new-booking.js` to verify the new structure works correctly.

## Frontend Considerations

The frontend will need to be updated to:
1. Handle the new response structure
2. Display sessions from the `sessions` array
3. Use `sessionId` for individual session operations
4. Show aggregated data like `totalSessions` and `totalSpent`

## Backward Compatibility

The new structure maintains backward compatibility for:
- Reading existing booking data
- Basic CRUD operations
- Authentication and authorization

However, new bookings will use the new structure, so the frontend should be updated accordingly.

