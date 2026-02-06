import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, date, startTime, endTime, allDay = true, location, description } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: "title and date are required" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    let eventData;

    if (allDay) {
      // All-day event
      eventData = {
        summary: title,
        start: {
          date: date, // YYYY-MM-DD format
        },
        end: {
          date: date, // Same day for single-day event
        },
      };
    } else {
      // Timed event
      eventData = {
        summary: title,
        start: {
          dateTime: `${date}T${startTime || "09:00"}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: `${date}T${endTime || "10:00"}:00`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
    });

    const event = response.data;

    // Store additional details (location, description) in Supabase
    if (event.id && (location || description)) {
      const supabase = createServerSupabaseClient();
      await supabase.from("event_details").upsert({
        event_id: event.id,
        user_id: session.user.id,
        location: location || null,
        description: description || null,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: location || null,
      description: description || null,
      type: "event",
    });
  } catch (error: unknown) {
    console.error("Error creating event:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to create event", message: errorMessage },
      { status: 500 }
    );
  }
}
