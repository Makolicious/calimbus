import { google } from "googleapis";
import { CalendarEvent } from "@/types";

export async function getCalendarEvents(
  accessToken: string,
  timeMin?: Date,
  timeMax?: Date
): Promise<CalendarEvent[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const now = new Date();
  const defaultTimeMin = timeMin || new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTimeMax = timeMax || new Date(now.getFullYear(), now.getMonth() + 2, 0);

  try {
    // Get list of calendars
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    const allEvents: CalendarEvent[] = [];

    // Fetch events from each calendar
    for (const cal of calendars) {
      if (!cal.id) continue;

      try {
        const response = await calendar.events.list({
          calendarId: cal.id,
          timeMin: defaultTimeMin.toISOString(),
          timeMax: defaultTimeMax.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 100,
        });

        const events = response.data.items || [];

        for (const event of events) {
          if (!event.id || !event.summary) continue;

          allEvents.push({
            id: event.id,
            title: event.summary,
            description: event.description || undefined,
            start: event.start?.dateTime || event.start?.date || "",
            end: event.end?.dateTime || event.end?.date || "",
            location: event.location || undefined,
            colorId: event.colorId || undefined,
            calendarId: cal.id,
            type: "event",
          });
        }
      } catch (err) {
        console.error(`Error fetching events from calendar ${cal.id}:`, err);
      }
    }

    return allEvents;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}
