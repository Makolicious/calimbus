import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET - Fetch checklist items for a specific item
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("item_id");

  if (!itemId) {
    return NextResponse.json({ error: "item_id is required" }, { status: 400 });
  }

  try {
    const { data: items, error } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("item_id", itemId)
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json(items || []);
  } catch (error) {
    console.error("Checklist API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist items" },
      { status: 500 }
    );
  }
}

// POST - Create a new checklist item
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { item_id, item_type, text } = body;

    // Get the highest position for this item
    const { data: existingItems } = await supabase
      .from("checklist_items")
      .select("position")
      .eq("user_id", session.user.id)
      .eq("item_id", item_id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existingItems && existingItems.length > 0
      ? existingItems[0].position + 1
      : 0;

    const { data, error } = await supabase
      .from("checklist_items")
      .insert({
        user_id: session.user.id,
        item_id,
        item_type,
        text,
        checked: false,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Checklist create error:", error);
    return NextResponse.json(
      { error: "Failed to create checklist item" },
      { status: 500 }
    );
  }
}

// PATCH - Update a checklist item (toggle checked or update text)
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { id, checked, text } = body;

    const updateData: { checked?: boolean; text?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (checked !== undefined) updateData.checked = checked;
    if (text !== undefined) updateData.text = text;

    const { data, error } = await supabase
      .from("checklist_items")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Checklist update error:", error);
    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a checklist item
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from("checklist_items")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Checklist delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete checklist item" },
      { status: 500 }
    );
  }
}
