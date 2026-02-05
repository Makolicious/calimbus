import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Store for active SSE connections (in production, use Redis)
// This is a simple in-memory store for development
declare global {
  // eslint-disable-next-line no-var
  var calendarUpdateListeners: Map<string, (data: string) => void>;
}

if (!global.calendarUpdateListeners) {
  global.calendarUpdateListeners = new Map();
}

// POST - Receive webhook notifications from Google Calendar
export async function POST(request: NextRequest) {
  try {
    // Google sends a sync message first, then actual notifications
    const channelId = request.headers.get("x-goog-channel-id");
    const resourceState = request.headers.get("x-goog-resource-state");
    const resourceId = request.headers.get("x-goog-resource-id");

    console.log("Calendar webhook received:", {
      channelId,
      resourceState,
      resourceId,
    });

    // Acknowledge the webhook immediately
    if (resourceState === "sync") {
      // This is just Google confirming the channel is set up
      console.log("Calendar webhook sync confirmation");
      return new NextResponse(null, { status: 200 });
    }

    // For actual changes (exists, not_exists, etc.)
    if (channelId) {
      // Look up which user this channel belongs to
      const supabase = createServerSupabaseClient();
      const { data: channelData } = await supabase
        .from("webhook_channels")
        .select("user_id")
        .eq("channel_id", channelId)
        .single();

      if (channelData?.user_id) {
        // Notify any connected SSE clients for this user
        const listener = global.calendarUpdateListeners.get(channelData.user_id);
        if (listener) {
          listener(JSON.stringify({ type: "calendar_update", timestamp: Date.now() }));
        }

        // Also store the update notification for polling clients
        await supabase.from("pending_updates").upsert(
          {
            user_id: channelData.user_id,
            update_type: "calendar",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,update_type" }
        );
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Calendar webhook error:", error);
    // Always return 200 to prevent Google from retrying
    return new NextResponse(null, { status: 200 });
  }
}

// Verify webhook - Google may send GET to verify endpoint
export async function GET() {
  return new NextResponse("OK", { status: 200 });
}
