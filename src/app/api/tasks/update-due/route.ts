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
    const { taskId, taskListId, due } = body;

    console.log("Task due date update request:", { taskId, taskListId, due });

    if (!taskId || !taskListId || !due) {
      return NextResponse.json(
        { error: "taskId, taskListId, and due are required" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const tasks = google.tasks({ version: "v1", auth: oauth2Client });

    // Update task due date
    const response = await tasks.tasks.patch({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        due: due,
      },
    });

    console.log("Google Tasks API response:", response.data);

    return NextResponse.json({
      success: true,
      task: {
        id: response.data.id,
        due: response.data.due,
      },
    });
  } catch (error: unknown) {
    console.error("Error updating task due date:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : null;

    return NextResponse.json(
      {
        error: "Failed to update task due date",
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
