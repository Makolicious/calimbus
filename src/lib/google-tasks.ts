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

    const allTasks: Task[] = [];

    // Fetch tasks from each list
    for (const list of taskLists) {
      if (!list.id) continue;

      try {
        const response = await tasks.tasks.list({
          tasklist: list.id,
          maxResults: 100,
          showCompleted: true,
          showHidden: false,
        });

        const items = response.data.items || [];

        for (const task of items) {
          if (!task.id || !task.title) continue;

          allTasks.push({
            id: task.id,
            title: task.title,
            notes: task.notes || undefined,
            due: task.due || undefined,
            status: task.status as "needsAction" | "completed",
            taskListId: list.id,
            type: "task",
          });
        }
      } catch (err) {
        console.error(`Error fetching tasks from list ${list.id}:`, err);
      }
    }

    return allTasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}
