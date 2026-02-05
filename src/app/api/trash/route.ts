import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET - Get all trashed items for current user
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("trashed_items")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Get trashed items error:", error);
    return NextResponse.json(
      { error: "Failed to get trashed items" },
      { status: 500 }
    );
  }
}

// POST - Move item to trash (soft delete)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { item_id, item_type, previous_column_id } = body;

    if (!item_id || !item_type || !previous_column_id) {
      return NextResponse.json(
        { error: "item_id, item_type, and previous_column_id are required" },
        { status: 400 }
      );
    }

    // Upsert trashed item record
    const { data, error } = await supabase
      .from("trashed_items")
      .upsert(
        {
          user_id: session.user.id,
          item_id,
          item_type,
          previous_column_id,
          trashed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,item_id" }
      )
      .select()
      .single();

    if (error) throw error;

    console.log(`Trashed item ${item_id} (was in column ${previous_column_id})`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Trash item error:", error);
    return NextResponse.json(
      { error: "Failed to trash item" },
      { status: 500 }
    );
  }
}

// DELETE - Restore item from trash (remove from trashed_items table)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get("item_id");

    if (!item_id) {
      return NextResponse.json({ error: "item_id is required" }, { status: 400 });
    }

    // Get the previous column before deleting
    const { data: trashedItem, error: fetchError } = await supabase
      .from("trashed_items")
      .select("previous_column_id")
      .eq("user_id", session.user.id)
      .eq("item_id", item_id)
      .single();

    if (fetchError) throw fetchError;

    // Delete from trashed_items
    const { error: deleteError } = await supabase
      .from("trashed_items")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", item_id);

    if (deleteError) throw deleteError;

    console.log(`Restored item ${item_id} to column ${trashedItem.previous_column_id}`);

    return NextResponse.json({
      success: true,
      previous_column_id: trashedItem.previous_column_id
    });
  } catch (error) {
    console.error("Restore item error:", error);
    return NextResponse.json(
      { error: "Failed to restore item" },
      { status: 500 }
    );
  }
}
