import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";

// POST - Subscribe to Google Calendar push notifications
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const supabase = createServerSupabaseClient();

    // Generate unique channel ID
    const channelId = uuidv4();

    // Get the webhook URL from environment or construct it
    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.NEXTAUTH_URL}/api/webhooks/calendar`;

    // Channel expiration (max 7 days for Google Calendar)
    const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // Subscribe to calendar events
    const response = await calendar.events.watch({
      calendarId: "primary",
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
        expiration: expiration.toString(),
      },
    });

    console.log("Calendar webhook subscription created:", response.data);

    // Store channel info in database
    await supabase.from("webhook_channels").upsert(
      {
        user_id: session.user.id,
        channel_id: channelId,
        resource_id: response.data.resourceId,
        expiration: new Date(expiration).toISOString(),
        channel_type: "calendar",
      },
      { onConflict: "user_id,channel_type" }
    );

    return NextResponse.json({
      success: true,
      channelId,
      expiration: new Date(expiration).toISOString(),
    });
  } catch (error) {
    console.error("Webhook subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe to calendar updates" },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from Google Calendar push notifications
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // Get existing channel
    const { data: channelData } = await supabase
      .from("webhook_channels")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("channel_type", "calendar")
      .single();

    if (channelData) {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: session.accessToken });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Stop the channel
      try {
        await calendar.channels.stop({
          requestBody: {
            id: channelData.channel_id,
            resourceId: channelData.resource_id,
          },
        });
      } catch (stopError) {
        // Channel might already be expired
        console.log("Channel stop error (may be already expired):", stopError);
      }

      // Remove from database
      await supabase
        .from("webhook_channels")
        .delete()
        .eq("user_id", session.user.id)
        .eq("channel_type", "calendar");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from calendar updates" },
      { status: 500 }
    );
  }
}
