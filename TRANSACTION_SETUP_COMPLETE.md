# Complete Transaction Setup Guide

## Overview
This guide will help you set up the transaction functionality with real database data. The system includes:
- Database seeding with sample transaction data
- Authentication token generation for testing
- Backend API endpoints for fetching transactions
- Frontend integration with the dashboard

## Prerequisites
- MongoDB running locally or accessible via MONGODB_URI
- Backend server dependencies installed
- Frontend dependencies installed

## Step 1: Database Setup

### 1.1 Install Backend Dependencies
```bash
cd backend
npm install
```

### 1.2 Set Up Environment Variables
Create or update `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/lumina
JWT_SECRET=your-secret-key-here
PORT=5003
```

### 1.3 Seed the Database with Transaction Data
```bash
cd backend
npm run seed:transactions
```

This will:
- Create a test user (test@example.com)
- Create a test expert (priya.sharma@example.com)
- Create 8 sample transactions with various statuses and types
- Display the created user and expert IDs

**Expected Output:**
```
Connected to MongoDB
Created test user
Created test expert user
Created test expert profile
Cleared existing transactions
Created 8 transactions
Transaction data seeded successfully!
User ID: [user-id]
Expert User ID: [expert-user-id]
Expert Profile ID: [expert-profile-id]
```

## Step 2: Generate Authentication Token

### 2.1 Generate Test Token
```bash
cd backend
npm run token
```

This will generate a JWT token for the test user.

**Expected Output:**
```
=== TEST AUTHENTICATION TOKEN ===
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
=== HOW TO USE ===
1. Copy this token
2. Open browser developer tools
3. Go to Application/Storage tab
4. Set localStorage.setItem("token", "PASTE_TOKEN_HERE")
5. Refresh the transactions page
```

## Step 3: Start the Backend Server

### 3.1 Start Backend Development Server
```bash
cd backend
npm run dev
```

The server should start on port 5003 (or the port specified in your .env file).

## Step 4: Test the Frontend

### 4.1 Start Frontend Development Server
```bash
cd frontend
npm run dev
```

### 4.2 Set Up Authentication in Browser
1. Open your browser and navigate to the frontend application
2. Open Developer Tools (F12)
3. Go to Application/Storage tab
4. Find Local Storage for your domain
5. Add a new item:
   - Key: `token`
   - Value: [Paste the token from Step 2.1]

### 4.3 Test the Transactions Page
1. Navigate to the dashboard
2. Click the "Transactions" button in the sidebar
3. You should see real transaction data from the database

## Step 5: Verify the Data

### 5.1 Check Transaction Statistics
The transactions page should display:
- Total Transactions: 8
- Total Spent: ₹25,700 (sum of completed transactions)
- Completed: 5 transactions
- Pending: 1 transaction
- Failed: 1 transaction
- Cancelled: 1 transaction

### 5.2 Sample Transaction Data
You should see transactions like:
- TXN001 - Career Coaching with Priya Sharma (₹2,500 - Completed)
- TXN002 - Online Course with Priya Sharma (₹5,000 - Pending)
- TXN003 - Webinar with Priya Sharma (₹1,500 - Completed)
- TXN004 - Course Bundle with Priya Sharma (₹8,000 - Completed)
- TXN005 - Digital Product with Priya Sharma (₹1,200 - Completed)
- TXN006 - Priority DM with Priya Sharma (₹500 - Failed)
- TXN007 - Interview Coaching with Priya Sharma (₹3,000 - Cancelled)
- TXN008 - Online Course with Priya Sharma (₹3,500 - Refunded)

## Step 6: Test Features

### 6.1 Filtering
- Test status filters (All, Completed, Pending, Failed, Cancelled, Refunded)
- Test type filters (All, Booking, Course, Webinar, Bundle, Digital Product, Priority DM)

### 6.2 Search
- Search for "coaching" to find coaching sessions
- Search for "course" to find course purchases
- Search for "webinar" to find webinar registrations

### 6.3 Pagination
- If you have more than 10 transactions, test pagination

## Troubleshooting

### Issue: "HTTP error! status: 500"
**Solution:**
1. Ensure MongoDB is running
2. Check MONGODB_URI in .env file
3. Verify backend server is running on correct port
4. Check console logs for specific error messages

### Issue: "No transactions found"
**Solution:**
1. Verify the token is correctly set in localStorage
2. Check that the user ID in the token matches the seeded user
3. Run the seed script again: `npm run seed:transactions`

### Issue: "Authentication failed"
**Solution:**
1. Generate a new token: `npm run token`
2. Update the token in localStorage
3. Refresh the page

### Issue: "Cannot connect to database"
**Solution:**
1. Check MongoDB connection string
2. Ensure MongoDB service is running
3. Check network connectivity

## API Endpoints

### GET `/api/payments/transactions`
- **Query Parameters**: `status`, `type`, `page`, `limit`
- **Authentication**: Required (Bearer token)
- **Response**: Transactions array, stats, pagination info

### GET `/api/payments/transactions/:id`
- **Path Parameters**: Transaction ID
- **Authentication**: Required (Bearer token)
- **Response**: Single transaction details

## Database Schema

### Transaction Collection
```javascript
{
  _id: ObjectId,
  user_id: String (4-digit unique user ID),
  transaction_id: String (unique transaction identifier),
  status: String (pending|completed|failed|cancelled|refunded),
  mentor_name: String (name of the expert/mentor),
  service: String (service type - coaching, course, webinar, etc.),
  userId: ObjectId (ref: 'User'),
  expertId: ObjectId (ref: 'User'),
  type: String (booking|course|webinar|bundle|digital_product|priority_dm),
  itemId: ObjectId,
  amount: Number,
  currency: String (default: 'INR'),
  paymentMethod: String (stripe|paypal|bank_transfer|upi|crypto),
  description: String,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps

1. **Add Real Payment Integration**: Connect with Stripe, PayPal, etc.
2. **Implement Export Functionality**: Add CSV/PDF export
3. **Add Real-time Updates**: Implement WebSocket for live transaction updates
4. **Add Transaction Details Modal**: Show detailed transaction information
5. **Implement Refund Processing**: Add refund functionality
6. **Add Transaction Analytics**: Charts and insights

## Development Notes

- All transactions are linked to the test user (test@example.com)
- Expert data is populated from the User collection
- The system gracefully falls back to mock data if backend is unavailable
- Console logging is enabled for debugging API calls
- Error handling includes automatic fallback to demo mode
