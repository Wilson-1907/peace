import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSharedSyncServerReady } from "@/lib/supabase/admin";
import { DEMO_PEACE_ID, DEMO_WILSON_ID } from "@/lib/demo-store";

const ALLOWED = new Set([DEMO_PEACE_ID, DEMO_WILSON_ID]);

export async function POST(req: NextRequest) {
  if (!isSharedSyncServerReady()) {
    return NextResponse.json({ error: "Shared sync not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      user_id?: string;
      name?: string;
      assigned_to?: string;
      sort_order?: number;
    };

    const user_id = body.user_id?.trim();
    const name = body.name?.trim();
    const assigned_to = body.assigned_to ?? "me";

    if (!user_id || !ALLOWED.has(user_id)) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    if (!["me", "partner", "both"].includes(assigned_to)) {
      return NextResponse.json({ error: "Invalid assign" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shared_habits")
      .insert({
        user_id,
        name,
        assigned_to,
        sort_order: body.sort_order ?? 0,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ habit: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isSharedSyncServerReady()) {
    return NextResponse.json({ error: "Shared sync not configured" }, { status: 503 });
  }

  try {
    const body = (await req.json()) as {
      id?: string;
      is_active?: boolean;
      archived_at?: string | null;
      sort_order?: number;
      orders?: { id: string; sort_order: number }[];
    };

    const supabase = createAdminClient();

    if (body.orders?.length) {
      await Promise.all(
        body.orders.map((row) =>
          supabase
            .from("shared_habits")
            .update({ sort_order: row.sort_order })
            .eq("id", row.id)
        )
      );
      return NextResponse.json({ ok: true });
    }

    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
    if (body.archived_at !== undefined) patch.archived_at = body.archived_at;
    if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;

    const { data, error } = await supabase
      .from("shared_habits")
      .update(patch)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ habit: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
