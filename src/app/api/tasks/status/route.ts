import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, taskListId, completed } = body;

    if (!taskId || !taskListId) {
      return NextResponse.json(
        { error: "taskId and taskListId are required" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const tasks = google.tasks({ version: "v1", auth: oauth2Client });

    // Update task status
    const response = await tasks.tasks.patch({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        status: completed ? "completed" : "needsAction",
        // When marking as not completed, we need to clear the completed date
        completed: completed ? new Date().toISOString() : null,
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        id: response.data.id,
        status: response.data.status,
      },
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
