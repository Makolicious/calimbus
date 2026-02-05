import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const taskListId = searchParams.get("taskListId");

    if (!taskId || !taskListId) {
      return NextResponse.json(
        { error: "taskId and taskListId are required" },
        { status: 400 }
      );
    }

    // Delete from Google Tasks
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });

    const tasks = google.tasks({ version: "v1", auth: oauth2Client });

    await tasks.tasks.delete({
      tasklist: taskListId,
      task: taskId,
    });

    // Also delete associated data from Supabase (notes, checklist items, card categories)
    const supabase = createServerSupabaseClient();

    // Delete notes
    await supabase
      .from("notes")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", taskId);

    // Delete checklist items
    await supabase
      .from("checklist_items")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", taskId);

    // Delete card category
    await supabase
      .from("card_categories")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", taskId);

    console.log(`Deleted task ${taskId} from Google Tasks and Supabase`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
