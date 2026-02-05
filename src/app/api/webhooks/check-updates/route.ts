import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET - Check for pending updates (polling fallback)
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // Get pending updates for this user
    const { data: updates } = await supabase
      .from("pending_updates")
      .select("*")
      .eq("user_id", session.user.id);

    const hasCalendarUpdate = updates?.some((u) => u.update_type === "calendar");
    const hasTaskUpdate = updates?.some((u) => u.update_type === "task");

    // Clear pending updates after reading
    if (updates && updates.length > 0) {
      await supabase
        .from("pending_updates")
        .delete()
        .eq("user_id", session.user.id);
    }

    return NextResponse.json({
      hasCalendarUpdate,
      hasTaskUpdate,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Check updates error:", error);
    return NextResponse.json(
      { error: "Failed to check updates" },
      { status: 500 }
    );
  }
}
