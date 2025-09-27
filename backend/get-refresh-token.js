// get-refresh-token.js
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// For a Desktop flow, this loopback redirect is fine and doesn't need to be pre-registered
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5003/callback';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

console.log('CLIENT_ID:', CLIENT_ID ? 'Set' : 'Not set');
console.log('CLIENT_SECRET:', CLIENT_SECRET ? 'Set' : 'Not set');
console.log('REDIRECT_URI:', REDIRECT_URI);

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith('/callback')) {
      const qs = new url.URL(req.url, `http://localhost:${REDIRECT_URI.split(':')[2].split('/')[0]}`).searchParams;
      const code = qs.get('code');
      const error = qs.get('error');

      if (error) {
        console.error('OAuth Error:', error);
        console.error('Error Description:', qs.get('error_description') || 'No description provided');
        res.end(`OAuth Error: ${error}. Check console for details.`);
        server.close();
        process.exit(1);
      }

      if (!code) {
        console.error('No authorization code received');
        res.end('No authorization code received. Check console for details.');
        server.close();
        process.exit(1);
      }

      try {
        console.log('Exchanging code for tokens...');
        const { tokens } = await oauth2Client.getToken(code);
        res.end('Success! You can close this window.');
        server.close();

        console.log('\n=== TOKENS RECEIVED ===');
        console.log('Access Token:', tokens.access_token || '');
        console.log('Refresh Token:', tokens.refresh_token || 'NO_REFRESH_TOKEN_RETURNED');
        console.log('Expiry Date:', tokens.expiry_date || '');
        console.log('Token Type:', tokens.token_type || '');
        console.log('Scope:', tokens.scope || '');
        console.log('========================\n');
        
        if (tokens.refresh_token) {
          console.log('✅ Refresh token obtained successfully!');
          console.log('Add this to your .env file:');
          console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          console.log('⚠️  No refresh token received. This might happen if:');
          console.log('1. You have already authorized this app before');
          console.log('2. The app is not configured for offline access');
          console.log('3. The user denied consent for offline access');
        }
        
        process.exit(0);
      } catch (err) {
        console.error('Error exchanging code for tokens:', err);
        console.error('Error details:', err.message);
        res.end('Error exchanging code for tokens. Check console for details.');
        server.close();
        process.exit(1);
      }
    } else {
      res.end('Waiting for OAuth callback...');
    }
  });

  const port = REDIRECT_URI.split(':')[2].split('/')[0] || '5003';
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log('Open this URL in your browser to authorize:\n', authorizeUrl);
    console.log('\nMake sure the redirect URI in your Google Cloud Console matches:');
    console.log(REDIRECT_URI);
    console.log('\nIf you get an "invalid_request" error, check that:');
    console.log('1. The redirect URI is exactly the same in Google Cloud Console');
    console.log('2. The OAuth consent screen is properly configured');
    console.log('3. The client ID and secret are correct');
    // Try to auto-open on Windows
    try { exec(`start "" "${authorizeUrl}"`); } catch {}
  });
}

main().catch(console.error);