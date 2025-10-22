# 🚀 Razorpay Production Deployment Guide

## ✅ **Current Status: Development Ready**
Your Razorpay integration is working in development mode. Here's what you need to do to make it production-ready:

## 🔧 **Step 1: Get Razorpay Live Keys**

1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Switch to Live Mode**: Toggle from "Test" to "Live" mode
3. **Get Live Keys**:
   - Key ID: `rzp_live_xxxxxxxxxxxxx`
   - Key Secret: `xxxxxxxxxxxxxxxxxxxxxxxx`
   - Webhook Secret: Generate a new webhook secret

## 🔧 **Step 2: Update Environment Variables**

### Backend (.env)
```bash
# Production Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Production Settings
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### Frontend (.env.local)
```bash
# Production
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_live_key_id
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

## 🔧 **Step 3: Code Changes for Production**

### A. Replace Development Files
```bash
# Backend
mv backend/src/routes/payments.ts backend/src/routes/payments-dev.ts
mv backend/src/routes/payments-production.ts backend/src/routes/payments.ts

# Frontend
mv frontend/app/services/razorpayApi.ts frontend/app/services/razorpayApi-dev.ts
mv frontend/app/services/razorpayApi-production.ts frontend/app/services/razorpayApi.ts
```

### B. Update CompleteTransactionPopup
Replace the import in `CompleteTransactionPopup.tsx`:
```typescript
// Change from:
import razorpayApi from '../services/razorpayApi';

// To:
import razorpayApi from '../services/razorpayApi';
```

## 🔧 **Step 4: Database Integration**

### Add Payment Records
```typescript
// In the webhook handler, add:
const transaction = new Transaction({
  userId: req.user.id,
  orderId: razorpay_order_id,
  paymentId: razorpay_payment_id,
  amount: order.amount,
  currency: order.currency,
  status: 'completed',
  paymentMethod: 'razorpay',
  createdAt: new Date()
});
await transaction.save();
```

### Update Booking Status
```typescript
// Update the booking status when payment is successful
await Booking.findByIdAndUpdate(bookingId, {
  paymentStatus: 'paid',
  status: 'confirmed',
  paymentId: razorpay_payment_id
});
```

## 🔧 **Step 5: Webhook Configuration**

1. **Set up Webhook URL**: `https://your-api-domain.com/api/payments/webhook`
2. **Configure Events**:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
3. **Test Webhook**: Use Razorpay's webhook testing tool

## 🔧 **Step 6: Security & Monitoring**

### Add Rate Limiting
```typescript
// In your main app file
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many payment attempts, please try again later.'
});

app.use('/api/payments', paymentLimiter);
```

### Add Logging
```typescript
// Add structured logging
console.log(`[PAYMENT] Order created: ${orderId}, Amount: ${amount}, User: ${userId}`);
console.log(`[PAYMENT] Payment verified: ${paymentId}, Status: ${status}`);
```

## 🔧 **Step 7: Testing**

### Test with Real Payments
1. **Use Test Cards**: Razorpay provides test card numbers
2. **Test Different Scenarios**:
   - Successful payment
   - Failed payment
   - Cancelled payment
   - Webhook delivery

### Test Cards for Live Mode
```
Success: 4111 1111 1111 1111
Failure: 4000 0000 0000 0002
```

## 🔧 **Step 8: Go Live Checklist**

- [ ] ✅ Live Razorpay keys configured
- [ ] ✅ Environment variables set
- [ ] ✅ Production code deployed
- [ ] ✅ Webhook URL configured
- [ ] ✅ Database integration working
- [ ] ✅ Error handling in place
- [ ] ✅ Rate limiting enabled
- [ ] ✅ SSL certificates installed
- [ ] ✅ CORS configured for production domain
- [ ] ✅ Test payments successful
- [ ] ✅ Monitoring and logging active

## 🚨 **Important Notes**

1. **Never commit live keys to version control**
2. **Use environment variables for all sensitive data**
3. **Test thoroughly in staging before production**
4. **Monitor payment success rates**
5. **Set up alerts for failed payments**
6. **Keep webhook secrets secure**

## 📞 **Support**

If you encounter issues:
1. Check Razorpay dashboard for payment status
2. Verify webhook delivery in Razorpay dashboard
3. Check server logs for errors
4. Contact Razorpay support if needed

---

**Your Razorpay integration is now production-ready! 🎉**


















