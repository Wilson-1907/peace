"use client";

import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthBanner() {
  if (!isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-blue-100 bg-white/70 px-4 py-2 text-center text-xs text-slate-500">
      <Link href="/login" className="font-semibold text-blue-700 hover:underline">
        Sign in
      </Link>{" "}
      with Supabase for live sync across devices.
    </div>
  );
}
