import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, due, notes } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const tasks = google.tasks({ version: "v1", auth: oauth2Client });

    // Get the default task list (first one)
    const taskListsResponse = await tasks.tasklists.list();
    const taskLists = taskListsResponse.data.items || [];

    if (taskLists.length === 0) {
      return NextResponse.json({ error: "No task lists found" }, { status: 404 });
    }

    const defaultTaskList = taskLists[0];

    // Create the task
    const taskData: { title: string; due?: string; notes?: string } = { title };

    // Format due date for Google Tasks API (RFC 3339)
    if (due) {
      // Convert YYYY-MM-DD to RFC 3339 format
      taskData.due = `${due}T00:00:00.000Z`;
    }

    // Add notes if provided
    if (notes) {
      taskData.notes = notes;
    }

    const response = await tasks.tasks.insert({
      tasklist: defaultTaskList.id!,
      requestBody: taskData,
    });

    const createdTask = response.data;

    console.log("Created task:", createdTask);

    // Return in the format our app expects
    return NextResponse.json({
      id: createdTask.id,
      title: createdTask.title,
      notes: createdTask.notes || undefined,
      due: createdTask.due ? createdTask.due.split("T")[0] : undefined,
      status: createdTask.status as "needsAction" | "completed",
      taskListId: defaultTaskList.id,
      type: "task",
    });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
