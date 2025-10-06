# Razorpay Payment Integration

This document describes the Razorpay payment integration implemented in the Lumina expert consultation platform.

## Overview

The Razorpay integration allows users to make payments for expert consultations using the Razorpay payment gateway. When users click the "Pay" button in the complete transaction section, it opens the Razorpay payment window.

## Implementation Details

### Backend Integration

#### 1. Dependencies
- `razorpay`: ^2.9.6 (already installed)

#### 2. New API Endpoints

**POST /api/payments/create-razorpay-order**
- Creates a Razorpay order for payment
- Parameters: `amount`, `currency` (optional, defaults to INR), `receipt` (optional), `notes` (optional)
- Returns: Razorpay order details including order ID

**POST /api/payments/verify-razorpay-payment**
- Verifies Razorpay payment signature
- Parameters: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`
- Returns: Verification status

**POST /api/payments/webhook**
- Handles Razorpay webhook events
- Supports events: `payment.captured`, `payment.failed`, `order.paid`

#### 3. Environment Variables Required

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

### Frontend Integration

#### 1. Dependencies
- `razorpay`: Installed via npm

#### 2. New Service: razorpayApi.ts

The `razorpayApi` service provides:
- `createOrder()`: Creates Razorpay order via backend API
- `verifyPayment()`: Verifies payment signature
- `initializePayment()`: Opens Razorpay payment window

#### 3. Updated Component: CompleteTransactionPopup.tsx

The payment popup now:
- Creates Razorpay orders for payments
- Opens Razorpay payment window
- Handles payment success/failure
- Supports loyalty points integration
- Processes payments of ₹0 (fully paid with loyalty points)

#### 4. Environment Variables Required

```env
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:5003
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your-razorpay-key-id
```

## Payment Flow

1. **User clicks "Complete Transaction"** → Opens payment popup
2. **User configures loyalty points** (optional) → Calculates final amount
3. **User clicks "Pay" button**:
   - If final amount is ₹0 → Processes directly (loyalty points only)
   - If final amount > ₹0 → Creates Razorpay order and opens payment window
4. **Razorpay payment window opens** → User completes payment
5. **Payment verification** → Backend verifies payment signature
6. **Success handling** → Updates payment status and deducts loyalty points
7. **Popup closes** → Returns to payments page

## Features

### ✅ Implemented Features
- Razorpay order creation
- Payment window integration
- Payment signature verification
- Webhook handling
- Loyalty points integration
- Error handling
- User-friendly UI

### 🔧 Configuration Required

To use this integration, you need to:

1. **Set up Razorpay Account**:
   - Create account at https://razorpay.com
   - Get API keys from dashboard
   - Set up webhook endpoint: `https://yourdomain.com/api/payments/webhook`

2. **Configure Environment Variables**:
   - Add Razorpay keys to backend `.env` file
   - Add Razorpay key ID to frontend `.env.local` file

3. **Test Integration**:
   - Use Razorpay test mode for development
   - Test with test card numbers provided by Razorpay

## Security Features

- Payment signature verification using HMAC SHA256
- Webhook signature verification
- Secure API key handling
- Environment variable protection

## Error Handling

The integration includes comprehensive error handling:
- Network errors
- Payment failures
- Signature verification failures
- Loyalty points deduction errors
- User cancellation

## Testing

### Test Cards (Razorpay Test Mode)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test Flow
1. Create a payment in your application
2. Click "Complete Transaction"
3. Use test card details
4. Verify payment success/failure handling

## Support

For issues or questions:
1. Check Razorpay documentation: https://razorpay.com/docs/
2. Verify environment variables are set correctly
3. Check browser console for frontend errors
4. Check backend logs for API errors

## Next Steps

1. Set up Razorpay account and get API keys
2. Configure environment variables
3. Test the payment flow
4. Set up webhook endpoint for production
5. Switch to live mode for production use
