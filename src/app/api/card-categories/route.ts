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

  try {
    const { data: categories, error } = await supabase
      .from("card_categories")
      .select("*")
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error("Card categories API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch card categories" },
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
    const { item_id, item_type, column_id } = body;

    // Upsert: update if exists, insert if not
    const { data: existing } = await supabase
      .from("card_categories")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("item_id", item_id)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("card_categories")
        .update({ column_id })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("card_categories")
        .insert({
          user_id: session.user.id,
          item_id,
          item_type,
          column_id,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Card category update error:", error);
    return NextResponse.json(
      { error: "Failed to update card category" },
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
    const body = await request.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "item_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("card_categories")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", item_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Card category delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete card category" },
      { status: 500 }
    );
  }
}
