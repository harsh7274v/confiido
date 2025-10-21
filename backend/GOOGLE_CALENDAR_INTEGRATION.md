# Google Calendar Integration - Complete Guide

## Overview
This guide documents the Google Calendar integration for Lumina (Confiido) platform. The integration uses Google Calendar API v3 with OAuth 2.0 authentication to create, manage, and sync calendar events with automatic Google Meet link generation.

## Features
✅ **Auto-Refresh Tokens**: Access tokens refresh automatically when expired  
✅ **Google Meet Integration**: Automatically creates Google Meet links for events  
✅ **Email Notifications**: Sends calendar invites to attendees  
✅ **CRUD Operations**: Full create, read, update, delete support for events  
✅ **Centralized Account**: Uses confiido.io@gmail.com as organizer  
✅ **TypeScript Support**: Full type safety  

## Setup Instructions

### 1. Google Cloud Console Setup

#### Enable APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Library**
4. Enable:
   - **Google Calendar API**
   - **Google+ API** (for profile info)

#### Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Fill in required fields:
   - App name: `Lumina Platform`
   - User support email: `confiido.io@gmail.com`
   - Developer contact: `confiido.io@gmail.com`
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (if in Testing mode)
6. **Publish** the app for production

#### Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add redirect URIs:
   ```
   https://developers.google.com/oauthplayground
   http://localhost:5003/callback
   https://api.yourdomain.com/callback
   ```
5. Copy **Client ID** and **Client Secret**

### 2. Generate Refresh Token

#### Using OAuth 2.0 Playground
1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click **Settings** (gear icon) → Check "Use your own OAuth credentials"
3. Enter your Client ID and Client Secret
4. In **Step 1**, select both scopes:
   - ☑ `https://www.googleapis.com/auth/calendar`
   - ☑ `https://www.googleapis.com/auth/calendar.events`
5. Click **Authorize APIs**
6. Sign in with `confiido.io@gmail.com`
7. Grant permissions
8. **Step 2**: Click **Exchange authorization code for tokens**
9. Copy the **refresh_token**

### 3. Environment Configuration

Add to `backend/.env`:
```properties
# Google Calendar Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5003/callback
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_CALENDAR_ID=primary
```

### 4. Test the Integration

```bash
cd backend
npm run test:google-calendar-integration
```

## API Endpoints

### Create Calendar Event
```http
POST /api/calendar/events
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "summary": "Client Meeting",
  "description": "Discuss project requirements",
  "startTime": "2025-10-25T14:00:00+05:30",
  "endTime": "2025-10-25T15:00:00+05:30",
  "attendees": ["client@example.com", "team@confiido.io"],
  "location": "Google Meet",
  "timeZone": "Asia/Kolkata"
}
```

**Response:**
```json
{
  "success": true,
  "eventId": "abc123xyz",
  "eventLink": "https://calendar.google.com/event?eid=...",
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "data": { ... }
}
```

### List Calendar Events
```http
GET /api/calendar/events?maxResults=20&timeMin=2025-10-22T00:00:00Z
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [ ... ]
}
```

### Get Single Event
```http
GET /api/calendar/events/{eventId}
Authorization: Bearer {JWT_TOKEN}
```

### Update Event
```http
PUT /api/calendar/events/{eventId}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "summary": "Updated Meeting Title",
  "startTime": "2025-10-25T15:00:00+05:30"
}
```

### Delete Event
```http
DELETE /api/calendar/events/{eventId}
Authorization: Bearer {JWT_TOKEN}
```

## Usage in Code

### Creating Events
```typescript
import googleCalendarService from '../services/googleCalendarService';

// Create event for a booking
const result = await googleCalendarService.createMeetEventForSession({
  expertUserObjectId: expert._id,
  clientEmail: 'client@example.com',
  expertEmail: 'expert@example.com',
  title: 'Consultation Session',
  description: 'Booked via Lumina Platform',
  scheduledDate: new Date('2025-10-25'),
  startTime: '14:00',
  endTime: '15:00'
});

console.log('Meet Link:', result.hangoutLink);
console.log('Event ID:', result.eventId);
```

### Using Calendar Controller
```typescript
// In your routes or controllers
import { createCalendarEvent } from '../controllers/calendarController';

// The controller handles:
// - OAuth2 client initialization with auto-refresh
// - Event creation with Google Meet
// - Error handling and responses
```

## Token Management

### How Auto-Refresh Works
1. **Initial Setup**: Refresh token is set once in `.env`
2. **Access Token**: Generated automatically from refresh token
3. **Expiration**: Access tokens expire after ~60 minutes
4. **Auto-Refresh**: When access token expires, googleapis automatically:
   - Uses the refresh token to get a new access token
   - Triggers the `oauth2Client.on('tokens')` event
   - Logs the refresh activity

### Important Notes
- ✅ **Refresh token never expires** (unless revoked)
- ✅ **Access tokens refresh automatically**
- ✅ **No manual intervention needed**
- ⚠️ OAuth Playground revokes tokens after 24h by default
- ⚠️ Generate production tokens directly via API, not playground

## Architecture

### Flow Diagram
```
Client Request
    ↓
JWT Authentication
    ↓
Calendar Controller
    ↓
OAuth2 Client (with auto-refresh)
    ↓
Google Calendar API v3
    ↓
Response with Meet Link
```

### File Structure
```
backend/
├── src/
│   ├── controllers/
│   │   └── calendarController.ts    # CRUD operations
│   ├── routes/
│   │   └── calendar.ts               # API endpoints
│   ├── services/
│   │   └── googleCalendar.ts         # Core service for bookings
│   └── scripts/
│       └── testGoogleCalendarIntegration.ts  # Test script
├── .env                              # Environment config
└── env.example                       # Template
```

## Troubleshooting

### "Authorization blocked" Error
**Solution**: Publish OAuth consent screen or add email as test user

### "Invalid credentials" Error
**Solution**: Regenerate refresh token with both required scopes

### "No hangoutLink returned"
**Solution**: 
- Ensure `conferenceDataVersion: 1` is set
- Verify Google Meet is enabled for the account

### Token expired
**Solution**: Check that auto-refresh event listener is configured:
```typescript
oauth2Client.on('tokens', (tokens) => {
  if (tokens.access_token) {
    console.log('✅ Access token refreshed');
  }
});
```

### API quota exceeded
**Solution**: 
- Check [Google Cloud Console Quotas](https://console.cloud.google.com/apis/api/calendar-json.googleapis.com/quotas)
- Request quota increase if needed

## Security Best Practices

1. **Never commit `.env`** to version control
2. **Rotate credentials** regularly
3. **Use different credentials** for dev/staging/production
4. **Monitor API usage** in Google Cloud Console
5. **Implement rate limiting** in your API
6. **Log token refresh events** for monitoring

## Production Checklist

- [ ] OAuth consent screen published
- [ ] Production redirect URIs configured
- [ ] Calendar API enabled
- [ ] Refresh token generated with both scopes
- [ ] Environment variables set in production
- [ ] Test script passes successfully
- [ ] Error logging configured
- [ ] Monitoring set up for API quota usage

## Monitoring

### Key Metrics to Monitor
- Token refresh frequency
- API success/error rates
- Event creation latency
- Meet link generation success rate

### Logging
```typescript
// Token refresh events
oauth2Client.on('tokens', (tokens) => {
  logger.info('Token refreshed', { 
    hasRefreshToken: !!tokens.refresh_token,
    timestamp: new Date()
  });
});
```

## Support

### Useful Links
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)

### Contact
For issues or questions:
- Email: confiido.io@gmail.com
- Repository: [GitHub](https://github.com/harsh7274v/confiido)

---

**Last Updated**: October 22, 2025  
**Version**: 1.0.0
