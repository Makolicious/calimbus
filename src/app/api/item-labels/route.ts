import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET - Fetch all item-label associations for the user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("item_labels")
      .select("*, labels!inner(*)")
      .eq("labels.user_id", session.user.id);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Failed to fetch item labels:", error);
    return NextResponse.json({ error: "Failed to fetch item labels" }, { status: 500 });
  }
}

// POST - Add a label to an item
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { item_id, label_id } = await request.json();
    if (!item_id || !label_id) {
      return NextResponse.json({ error: "item_id and label_id are required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify the label belongs to the user
    const { data: label } = await supabase
      .from("labels")
      .select("id")
      .eq("id", label_id)
      .eq("user_id", session.user.id)
      .single();

    if (!label) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }

    // Check if association already exists
    const { data: existing } = await supabase
      .from("item_labels")
      .select("id")
      .eq("item_id", item_id)
      .eq("label_id", label_id)
      .single();

    if (existing) {
      return NextResponse.json(existing);
    }

    const { data, error } = await supabase
      .from("item_labels")
      .insert({ item_id, label_id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to add item label:", error);
    return NextResponse.json({ error: "Failed to add item label" }, { status: 500 });
  }
}

// DELETE - Remove a label from an item
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get("item_id");
    const label_id = searchParams.get("label_id");

    if (!item_id || !label_id) {
      return NextResponse.json({ error: "item_id and label_id are required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("item_labels")
      .delete()
      .eq("item_id", item_id)
      .eq("label_id", label_id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove item label:", error);
    return NextResponse.json({ error: "Failed to remove item label" }, { status: 500 });
  }
}
