import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { AuditAction } from "./types";

/** Best-effort audit log write — never throws into the request path. */
export async function logAudit(
  userId: string | null,
  action: AuditAction,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("audit_logs")
      .insert({ user_id: userId, action, details: details ?? null });
  } catch (err) {
    console.error("audit log failed", err);
  }
}
