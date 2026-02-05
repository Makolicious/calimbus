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

    console.log("Task status update request:", { taskId, taskListId, completed });

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
    // For completing: set status to "completed"
    // For uncompleting: set status to "needsAction" (Google handles clearing the completed date)
    const requestBody: { status: string; completed?: string } = {
      status: completed ? "completed" : "needsAction",
    };

    console.log("Calling Google Tasks API with:", { tasklist: taskListId, task: taskId, requestBody });

    const response = await tasks.tasks.patch({
      tasklist: taskListId,
      task: taskId,
      requestBody,
    });

    console.log("Google Tasks API response:", response.data);

    return NextResponse.json({
      success: true,
      task: {
        id: response.data.id,
        status: response.data.status,
      },
    });
  } catch (error: unknown) {
    console.error("Error updating task status:", error);

    // Extract more details from the error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : null;

    return NextResponse.json(
      {
        error: "Failed to update task status",
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
