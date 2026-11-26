/** Client/server flag: shared cloud sync (not per-device localStorage). */
export function isSharedSyncEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
}
