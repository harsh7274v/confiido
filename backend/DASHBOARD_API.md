# Dashboard API Documentation

This document describes the backend API endpoints for the dashboard functionality.

## Base URL
```
http://localhost:5000/api/dashboard
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Dashboard Data
**GET** `/api/dashboard`

Returns comprehensive dashboard data including user info, setup steps, goals, stats, and recent activity.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "fullName": "Full User Name",
      "handle": "user_handle",
      "email": "user@example.com",
      "avatar": "avatar_url",
      "profileUrl": "profile_url",
      "userType": "expert" | "seeker"
    },
    "setupSteps": [
      {
        "id": "step_id",
        "title": "Step Title",
        "description": "Step description",
        "completed": false,
        "action": "Action button text",
        "icon": "Icon name"
      }
    ],
    "goals": [
      {
        "id": "goal_id",
        "text": "Goal text",
        "completed": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "stats": {
      "totalBookings": 10,
      "completedBookings": 8,
      "pendingBookings": 2,
      "totalEarnings": 1500,
      "thisMonthEarnings": 500,
      "averageRating": 4.5,
      "totalReviews": 25
    },
    "recentActivity": [
      {
        "id": "activity_id",
        "type": "booking_received",
        "title": "New booking from John Doe",
        "description": "Consultation session",
        "time": "2024-01-01T00:00:00.000Z",
        "amount": 100
      }
    ],
    "inspiration": [
      {
        "id": "expert_id",
        "name": "Expert Name",
        "avatar": "avatar_url",
        "handle": "expert_handle"
      }
    ]
  }
}
```

### 2. Update User Profile
**PUT** `/api/dashboard/profile`

Update user profile information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John Doe",
  "bio": "Expert bio",
  "handle": "john_doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "handle": "john_doe",
    "bio": "Expert bio"
  }
}
```

### 3. Update User Settings
**PUT** `/api/dashboard/settings`

Update user account settings.

**Request Body:**
```json
{
  "username": "new_username",
  "currentPassword": "current_password",
  "newPassword": "new_password",
  "emailNotifications": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "new_username",
    "emailNotifications": true
  }
}
```

### 4. Get Goals
**GET** `/api/dashboard/goals`

Get all goals for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "goal_id",
      "text": "Goal text",
      "completed": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 5. Create Goal
**POST** `/api/dashboard/goals`

Create a new goal.

**Request Body:**
```json
{
  "text": "New goal text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "goal_id",
    "text": "New goal text",
    "completed": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Update Goal
**PUT** `/api/dashboard/goals/:goalId`

Update a specific goal.

**Request Body:**
```json
{
  "text": "Updated goal text",
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "goal_id",
    "text": "Updated goal text",
    "completed": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7. Delete Goal
**DELETE** `/api/dashboard/goals/:goalId`

Delete a specific goal.

**Response:**
```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

### 8. Get Setup Steps
**GET** `/api/dashboard/setup-steps`

Get all setup steps for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "step_id",
      "title": "Step Title",
      "description": "Step description",
      "completed": false,
      "action": "Action button text",
      "icon": "Icon name",
      "order": 1
    }
  ]
}
```

### 9. Update Setup Steps
**PUT** `/api/dashboard/setup-steps`

Update setup steps completion status.

**Request Body:**
```json
{
  "steps": [
    {
      "id": "step_id",
      "completed": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "step_id",
      "title": "Step Title",
      "description": "Step description",
      "completed": true,
      "action": "Action button text",
      "icon": "Icon name",
      "order": 1
    }
  ]
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:
   ```
   MONGODB_URI=mongodb://localhost:27017/lumina
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

3. **Seed the database:**
   ```bash
   npm run seed
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Testing

You can test the API endpoints using tools like Postman or curl. Make sure to:

1. First authenticate and get a JWT token
2. Include the token in the Authorization header for all dashboard requests
3. Use the test user created by the seed script (email: test@example.com, password: password123) 