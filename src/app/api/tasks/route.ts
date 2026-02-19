import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTasks } from "@/lib/google-tasks";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    console.warn("Tasks API: Missing accessToken in session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for token expiration/refresh errors
  if (session.error) {
    console.error("Tasks API: Session error -", session.error);
    return NextResponse.json(
      { error: "Authentication failed: " + session.error },
      { status: 401 }
    );
  }

  try {
    const tasks = await getTasks(session.accessToken);
    return NextResponse.json(tasks, {
      headers: {
        // Allow the browser/CDN to serve a cached response for up to 60s,
        // but always revalidate in the background (stale-while-revalidate).
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Tasks API error:", errorMessage, error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: errorMessage },
      { status: 500 }
    );
  }
}
