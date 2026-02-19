import { google } from "googleapis";
import { Task } from "@/types";

export async function getTasks(accessToken: string): Promise<Task[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const tasks = google.tasks({ version: "v1", auth: oauth2Client });

  try {
    // Get all task lists
    const taskListsResponse = await tasks.tasklists.list();
    const taskLists = taskListsResponse.data.items || [];

    // Fetch all task lists in parallel instead of sequentially
    const results = await Promise.allSettled(
      taskLists
        .filter((list) => !!list.id)
        .map((list) =>
          tasks.tasks.list({
            tasklist: list.id!,
            maxResults: 100,
            showCompleted: true,
            showHidden: false,
          }).then((response) => ({ list, items: response.data.items || [] }))
        )
    );

    const allTasks: Task[] = [];

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Error fetching tasks from list:", result.reason);
        continue;
      }
      const { list, items } = result.value;
      for (const task of items) {
        if (!task.id || !task.title) continue;
        allTasks.push({
          id: task.id,
          title: task.title,
          notes: task.notes || undefined,
          due: task.due || undefined,
          status: task.status as "needsAction" | "completed",
          taskListId: list.id!,
          type: "task",
        });
      }
    }

    return allTasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}
