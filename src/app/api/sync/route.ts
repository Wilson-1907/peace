import { NextResponse } from "next/server";
import { createAdminClient, isSharedSyncServerReady } from "@/lib/supabase/admin";
import { coupleProfiles } from "@/lib/couple-profiles";

/** GET — full shared state for every device */
export async function GET() {
  if (!isSharedSyncServerReady()) {
    return NextResponse.json(
      {
        error:
          "Shared sync is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel.",
      },
      { status: 503 }
    );
  }

  try {
    const supabase = createAdminClient();
    const [{ data: habits, error: hErr }, { data: completions, error: cErr }] =
      await Promise.all([
        supabase
          .from("shared_habits")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase.from("shared_completions").select("*"),
      ]);

    if (hErr) throw hErr;
    if (cErr) throw cErr;

    return NextResponse.json({
      profiles: coupleProfiles(),
      habits: habits ?? [],
      completions: completions ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
