import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST - Mark all checklist items for an item as uncompleted
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "item_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("checklist_items")
      .update({
        checked: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)
      .eq("item_id", item_id)
      .select();

    if (error) throw error;

    console.log(`Marked ${data?.length || 0} checklist items as uncompleted for item ${item_id}`);

    return NextResponse.json({ success: true, updated: data?.length || 0 });
  } catch (error) {
    console.error("Checklist uncomplete-all error:", error);
    return NextResponse.json(
      { error: "Failed to uncomplete checklist items" },
      { status: 500 }
    );
  }
}
