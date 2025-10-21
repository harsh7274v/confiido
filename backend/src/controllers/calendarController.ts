import { Request, Response } from 'express';
import { google } from 'googleapis';

interface CalendarEventDetails {
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  location?: string;
  timeZone?: string;
}

/**
 * Google Calendar Controller
 * Handles CRUD operations for Google Calendar events using centralized confiido.io@gmail.com account
 */

// Initialize OAuth2 Client with auto-refresh capability
const getOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set refresh token for automatic access token refresh
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  // Listen for token refresh events
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      console.log('🔄 New refresh token received:', tokens.refresh_token);
    }
    if (tokens.access_token) {
      console.log('✅ Access token refreshed automatically');
    }
  });

  return oauth2Client;
};

/**
 * @route   POST /api/calendar/events
 * @desc    Create a new calendar event with Google Meet link
 * @access  Private
 */
export const createCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { summary, description, startTime, endTime, attendees, location, timeZone } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Summary, startTime, and endTime are required'
      });
    }

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary,
      description: description || '',
      location: location || '',
      start: {
        dateTime: startTime,
        timeZone: timeZone || 'Asia/Kolkata',
      },
      end: {
        dateTime: endTime,
        timeZone: timeZone || 'Asia/Kolkata',
      },
      attendees: attendees?.map((email: string) => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `meeting-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    console.log('📅 Calendar event created:', response.data.id);

    res.status(201).json({
      success: true,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
      meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri,
      data: response.data,
    });
  } catch (error: any) {
    console.error('❌ Calendar event creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create calendar event'
    });
  }
};

/**
 * @route   GET /api/calendar/events
 * @desc    List upcoming calendar events
 * @access  Private
 */
export const listCalendarEvents = async (req: Request, res: Response) => {
  try {
    const { timeMin, timeMax, maxResults } = req.query;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: (timeMin as string) || new Date().toISOString(),
      timeMax: timeMax as string,
      maxResults: maxResults ? parseInt(maxResults as string) : 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.status(200).json({
      success: true,
      count: response.data.items?.length || 0,
      data: response.data.items || []
    });
  } catch (error: any) {
    console.error('❌ Calendar events list error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list calendar events'
    });
  }
};

/**
 * @route   GET /api/calendar/events/:eventId
 * @desc    Get a single calendar event
 * @access  Private
 */
export const getCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.get({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
    });

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error: any) {
    console.error('❌ Calendar event fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch calendar event'
    });
  }
};

/**
 * @route   PUT /api/calendar/events/:eventId
 * @desc    Update an existing calendar event
 * @access  Private
 */
export const updateCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const updates = req.body;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event: any = {};

    if (updates.summary) event.summary = updates.summary;
    if (updates.description) event.description = updates.description;
    if (updates.location) event.location = updates.location;
    
    if (updates.startTime) {
      event.start = {
        dateTime: updates.startTime,
        timeZone: updates.timeZone || 'Asia/Kolkata',
      };
    }
    
    if (updates.endTime) {
      event.end = {
        dateTime: updates.endTime,
        timeZone: updates.timeZone || 'Asia/Kolkata',
      };
    }
    
    if (updates.attendees) {
      event.attendees = updates.attendees.map((email: string) => ({ email }));
    }

    const response = await calendar.events.patch({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      requestBody: event,
      sendUpdates: 'all',
    });

    console.log('📅 Calendar event updated:', eventId);

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.error('❌ Calendar event update error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update calendar event'
    });
  }
};

/**
 * @route   DELETE /api/calendar/events/:eventId
 * @desc    Delete a calendar event
 * @access  Private
 */
export const deleteCalendarEvent = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });

    console.log('🗑️ Calendar event deleted:', eventId);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error: any) {
    console.error('❌ Calendar event deletion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete calendar event'
    });
  }
};
