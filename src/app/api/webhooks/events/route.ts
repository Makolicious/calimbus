import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Declare global type for SSE listeners
declare global {
  // eslint-disable-next-line no-var
  var calendarUpdateListeners: Map<string, (data: string) => void>;
}

if (!global.calendarUpdateListeners) {
  global.calendarUpdateListeners = new Map();
}

// GET - Server-Sent Events endpoint for real-time updates
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

      // Function to send updates to this client
      const sendUpdate = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Client disconnected
          global.calendarUpdateListeners.delete(userId);
        }
      };

      // Register this client
      global.calendarUpdateListeners.set(userId, sendUpdate);

      // Send heartbeat every 55 seconds to keep connection alive
      // (55s is just under typical 60s proxy timeouts, minimising server wakeups)
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
          global.calendarUpdateListeners.delete(userId);
        }
      }, 55000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        global.calendarUpdateListeners.delete(userId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
