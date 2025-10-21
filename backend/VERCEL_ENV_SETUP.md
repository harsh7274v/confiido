# Vercel Environment Variables Setup Guide

## Problem
Your backend is getting a 500 error because **Vercel doesn't have your environment variables** (MongoDB URI, JWT Secret, etc.).

## Solution: Add Environment Variables to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your **backend project** (harsh7274v's backend)

2. **Navigate to Settings**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Each Variable**

Click **Add New** and add these variables one by one:

#### Required Variables (Copy from `.env.production`):

```
NODE_ENV = production
PORT = 5003
MONGODB_URI = mongodb+srv://confiidoio:UzCmaVZ2SICeFh2H@confiido.r6k2ucx.mongodb.net/confiido?retryWrites=true&w=majority&appName=confiido
JWT_SECRET = 3772b5b0141a2ba27fe0a1377b4bb312f4eb8c8e960ada2f01e709552ebddd60a5579d0640dff6db1c8495b0bed0b3a5b9bed9ace9c171424b5e1fe942d7d2af
JWT_EXPIRES_IN = 7d
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = confiido.io@gmail.com
EMAIL_PASS = iknk vflp mcfv mtix
CLOUDINARY_CLOUD_NAME = dgvyqneys
CLOUDINARY_API_KEY = 919848339592212
CLOUDINARY_API_SECRET = eLVpNcSbF-hFiCvdbjR3OokDbys
FRONTEND_URL = https://www.confiido.in
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
GOOGLE_CLIENT_ID = 1068955374376-nva9qrcdmt5b2ihti1mjmaf85a66idjf.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = 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
GOOGLE_REDIRECT_URI = https://api.confiido.in/auth/google/callback
GOOGLE_REFRESH_TOKEN = <your_refresh_token_from_.env.production>
GOOGLE_CALENDAR_ID = primary
FIREBASE_PROJECT_ID = lumina-16fd9
FIREBASE_PRIVATE_KEY_ID = df74174cf3dec8143dbae93e2afcad860d9c8958
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@lumina-16fd9.iam.gserviceaccount.com
FIREBASE_CLIENT_ID = 100126605489805959302
FIREBASE_CLIENT_CERT_URL = https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40lumina-16fd9.iam.gserviceaccount.com
RAZORPAY_KEY_ID = rzp_test_RMjoxUksimzl92
RAZORPAY_KEY_SECRET = P4mOUPsPQv3cd6l60XkJxsAE
```

**Special Variable (Multi-line)**:

```
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDPNVNfIdW+uCm7
dcea5n41wj6Cvg21bFfkDBCnPLvzuJjg/aOv7EI5Sqwi2yinshB2nOD5fc+ZqjmC
HthjSbePtte7YJ5vGLLnFv/qzeC2AG1BCvVtbIOgILP7xMubIfEOEbsQUiGs6qFX
5oL86BNyFYAZFls6OT+XN6NoSGJJx8oH6DGlxoPZDvoRSRLSegU3REC2xR9/PD5v
OSoIz2YIOUosa8HM8L0wwFWGxbDrzN64DtYuAwxxWBPx78Ut56hrQVr+PwZMNWtH
6KJ1GhsMO1CeVZ71lj8ZEP/UGIgfs/zuR23Ti8obmv3j09yRntz3jbTcvGLCcEoC
H/LfbHnRAgMBAAECggEAAfavV+OjIfnert+pjOWt6OJiq2Rjzr4kadVFr+EI5rEP
VVQAAev5L2/uSE0HgknTIz2eueyL2+jfn0SdsDivzjNJUXWzoKnFMcCPe60Yad8g
ie0RuPgOGgWPURWrCIkCftuzCC9AEZJ+ZY3qHD2SiBptLqeuJQPLfwpMYJHNiSWQ
uFudFGZ0rYQutGv5z0Wm5+Ub6jrOCLxNionoLnDOxYwIEHAz4EtElMlO36YkW0Fr
MJj1waVmpuq7f8KqUPamMOwDSr2xRoMPfpS9fwzeoLke2tLXm7T1ji/a2o/ODmPs
nigxhXLmEgs1DxFBWSTPZABkjv179f75UdNRImaVIQKBgQD/w5F2aGIzLFeWI5Cy
SPLbYKelol0O2JBWIPYP+aCZJM3fxQei+wWT4XPisCySCM3e6uonYlArb3pFgsDp
RjkXNXeKjmmlaX6ONiLQsJo6P8Q3ZAKl7fpBYHH94aoYcYBdSfVdDv5u1mqUX0oV
Khm/h3tQwPGUpcyETmB3Bc1q4QKBgQDPZkjlo4zvloqGOg6IrP4jP+VpPp4b0LSa
pWlfArFNS8lZxhy03Gv5CNvNJx/oIexK5EsaYwn2IVF87OMI4mo1KGkx17ARYEu9
wuuvEyfTkfWwKprt4VMUJsQj29mIdetHmrY1FeQXGeWiKKtOAKMqWFS632nbIUcu
Z9JbvOJc8QKBgQDWMY2P0Wl0G82aQly6wpcInFCqSWiPt1RhnScVR+R0fLshjNuR
ZZJNP4GStiINhuwKpUfGBfLH/YszzYYLlrDXPALJ+eyGB+xh4vqTNWNkJuUH0mzZ
U4zC1aeBjEysPdnXxsmCzrzMTCtj6M2dHe4EVc0zWvK2n4fAwfbNlwFqYQKBgQC5
GtVc/4e+HmIsQozON3frBhA+yoBa2v8WNyPAhKqyDj37PfJJCaHkdp+WjqDPkddP
UEonltVBM6ODF/nZ6Bpar2KT9alTGNsA1oN7kmEtV0wsmxoDzeNUTPUp/AI+5N/E
3LRa1NrqM1bcT+f0imUWWhflYZkc1qqtJER/VCnEQQKBgQCPnvNA6D/jHoXk6B5Z
17VT2fXZRMYvW2Edm+ZMDYnC0rpSahfwaEbDBYTCi2DBdOWwzCuXARFpXSwvFC1D
6mmzFTkLIg4TqlxiuYKX6iXGGyjQjf3GpS6Ads+gPincCwdVx94IlWkU+VX/egWz
SstugPz722VXdrGvMFOvDYlKPQ==
-----END PRIVATE KEY-----
```

**Important Note for FIREBASE_PRIVATE_KEY**:
- Remove the `\n` characters and use actual line breaks
- Keep the quotes around it
- OR paste it as a single line with `\n` preserved

4. **Set Environment for Each Variable**
   - Select **Production** (required)
   - You can also select **Preview** and **Development** if needed

5. **Save**
   - Click **Save** after adding each variable

### Method 2: Via Vercel CLI (Faster)

Run these commands from the `backend` directory:

```powershell
cd E:\lumina\confiido\backend

# Pull environment variables (if any exist)
vercel env pull

# Or add all at once using the Vercel CLI
vercel env add MONGODB_URI production
# Then paste: mongodb+srv://confiidoio:UzCmaVZ2SICeFh2H@confiido.r6k2ucx.mongodb.net/confiido?retryWrites=true&w=majority&appName=confiido

vercel env add JWT_SECRET production
# Then paste: 3772b5b0141a2ba27fe0a1377b4bb312f4eb8c8e960ada2f01e709552ebddd60a5579d0640dff6db1c8495b0bed0b3a5b9bed9ace9c171424b5e1fe942d7d2af

# Repeat for all variables...
```

### After Adding Variables

1. **Redeploy** (Automatic)
   - Vercel will automatically redeploy after you save environment variables
   - OR manually redeploy: `vercel --prod` from backend directory

2. **Wait 2-3 minutes** for deployment

3. **Test Login** from https://www.confiido.in

## Verification

After deployment, check if variables are set:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. You should see all ~25 variables listed

## Common Issues

### Issue: "Failed to connect to database"
**Solution**: Check if `MONGODB_URI` is exactly correct (no extra spaces)

### Issue: "JWT Secret is not defined"
**Solution**: Add `JWT_SECRET` environment variable

### Issue: "Still getting 500 error"
**Solution**: Check Vercel logs:
```bash
vercel logs [deployment-url]
```

---

## Quick Checklist

- [ ] Opened Vercel Dashboard
- [ ] Found backend project
- [ ] Added all 25+ environment variables
- [ ] Set each to "Production" environment
- [ ] Saved all variables
- [ ] Waited for auto-redeploy (2-3 minutes)
- [ ] Tested login from www.confiido.in

---

**Status**: Environment variables need to be added to Vercel  
**ETA**: 10-15 minutes to add all variables  
**Next Step**: Add variables via Vercel Dashboard, then test
