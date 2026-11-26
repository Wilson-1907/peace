import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSharedSyncServerReady } from "@/lib/supabase/admin";
import { DEMO_PEACE_ID, DEMO_WILSON_ID } from "@/lib/demo-store";

const ALLOWED = new Set([DEMO_PEACE_ID, DEMO_WILSON_ID]);

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Toggle or set today's completion (shared across devices). */
export async function POST(req: NextRequest) {
  if (!isSharedSyncServerReady()) {
    return NextResponse.json({ error: "Shared sync not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      habit_id?: string;
      user_id?: string;
      date?: string;
    };

    const habit_id = body.habit_id?.trim();
    const user_id = body.user_id?.trim();
    const date = body.date?.trim() || localToday();

    if (!habit_id || !user_id || !ALLOWED.has(user_id)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (date !== localToday()) {
      return NextResponse.json(
        { error: "Only today's date can be marked" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("shared_completions")
      .select("*")
      .eq("habit_id", habit_id)
      .eq("user_id", user_id)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("shared_completions")
        .update({ completed: !existing.completed })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return NextResponse.json({ completion: data });
    }

    const { data, error } = await supabase
      .from("shared_completions")
      .insert({
        habit_id,
        user_id,
        date,
        completed: true,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ completion: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Toggle failed" },
      { status: 500 }
    );
  }
}

/** Clean all completions — requires Wilson PIN willy1 */
export async function DELETE(req: NextRequest) {
  if (!isSharedSyncServerReady()) {
    return NextResponse.json({ error: "Shared sync not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { pin?: string };
    const pin = body.pin?.trim() ?? "";
    const expected =
      process.env.NEXT_PUBLIC_CLEAN_PIN?.trim() ||
      process.env.NEXT_PUBLIC_WILSON_PIN?.trim() ||
      "willy1";

    if (pin !== expected) {
      return NextResponse.json({ error: "Wrong PIN" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("shared_completions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Clean failed" },
      { status: 500 }
    );
  }
}
