import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("item_id");

  try {
    if (itemId) {
      // Get note for specific item
      const { data: note, error } = await supabase
        .from("item_notes")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("item_id", itemId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned

      return NextResponse.json(note || { notes: "" });
    } else {
      // Get all notes for user
      const { data: notes, error } = await supabase
        .from("item_notes")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) throw error;

      return NextResponse.json(notes || []);
    }
  } catch (error) {
    console.error("Notes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
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
    const { item_id, item_type, notes } = body;

    // Upsert: update if exists, insert if not
    const { data: existing } = await supabase
      .from("item_notes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("item_id", item_id)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("item_notes")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("item_notes")
        .insert({
          user_id: session.user.id,
          item_id,
          item_type,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Notes save error:", error);
    return NextResponse.json(
      { error: "Failed to save notes" },
      { status: 500 }
    );
  }
}
