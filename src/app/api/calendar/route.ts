import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCalendarEvents } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await getCalendarEvents(session.accessToken);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    );
  }
}
