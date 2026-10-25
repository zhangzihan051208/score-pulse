import type { SupabaseClient } from "@supabase/supabase-js";
import { ADMIN_EMAIL } from "@/lib/operator";

/** Users hidden from this viewer. A block works in both directions. */
export async function blockedUserIds(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  if (error || !data) return new Set();
  const ids = new Set<string>();
  for (const row of data) {
    if (row.blocker_id !== userId) ids.add(row.blocker_id);
    if (row.blocked_id !== userId) ids.add(row.blocked_id);
  }
  return ids;
}

export function adminEmails() {
  const listed = (process.env.SAFETY_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return listed.length > 0 ? listed : [ADMIN_EMAIL];
}

export function isSafetyAdmin(email: string | undefined) {
  if (!email) return false;
  const list = adminEmails();
  return list.includes(email.trim().toLowerCase());
}
