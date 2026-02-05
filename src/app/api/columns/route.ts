import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Column } from "@/types";

const DEFAULT_COLUMNS = [
  { name: "Events", position: 0, color: "#6b7280" },
  { name: "Tasks", position: 1, color: "#3b82f6" },
  { name: "Roll Over", position: 2, color: "#6b7280" },
  { name: "Done", position: 3, color: "#22c55e" },
  { name: "Trash", position: 4, color: "#ef4444" },
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const { data: columns, error } = await supabase
      .from("columns")
      .select("*")
      .eq("user_id", session.user.id)
      .order("position");

    if (error) throw error;

    // If no columns exist, create defaults
    if (!columns || columns.length === 0) {
      const newColumns = DEFAULT_COLUMNS.map((col) => ({
        ...col,
        user_id: session.user.id,
      }));

      const { data: createdColumns, error: createError } = await supabase
        .from("columns")
        .insert(newColumns)
        .select();

      if (createError) throw createError;

      return NextResponse.json(createdColumns);
    }

    return NextResponse.json(columns);
  } catch (error) {
    console.error("Columns API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch columns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { name, position, color } = body;

    const { data: column, error } = await supabase
      .from("columns")
      .insert({
        name,
        position,
        color: color || "#6b7280",
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(column);
  } catch (error) {
    console.error("Create column error:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const body = await request.json();
    const { id, name, position, color } = body;

    const { data: column, error } = await supabase
      .from("columns")
      .update({ name, position, color })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(column);
  } catch (error) {
    console.error("Update column error:", error);
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing column ID" }, { status: 400 });
    }

    // First delete all card categories for this column
    await supabase
      .from("card_categories")
      .delete()
      .eq("column_id", id)
      .eq("user_id", session.user.id);

    // Then delete the column
    const { error } = await supabase
      .from("columns")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete column error:", error);
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 }
    );
  }
}
