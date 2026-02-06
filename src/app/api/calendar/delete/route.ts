import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const calendarId = searchParams.get("calendarId") || "primary";

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    // Delete from Google Calendar
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });

    console.log(`Deleted event ${eventId} from Google Calendar`);

    // Also delete associated data from Supabase
    const supabase = createServerSupabaseClient();

    // Delete event_details (location, description stored separately)
    await supabase
      .from("event_details")
      .delete()
      .eq("user_id", session.user.id)
      .eq("event_id", eventId);

    // Delete notes
    await supabase
      .from("notes")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", eventId);

    // Delete checklist items
    await supabase
      .from("checklist_items")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", eventId);

    // Delete card category
    await supabase
      .from("card_categories")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", eventId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Delete event error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Failed to delete event", message: errorMessage },
      { status: 500 }
    );
  }
}
