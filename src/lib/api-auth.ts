import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "./session";
import type { Role } from "./types";

export interface AuthedUser {
  id: string;
  name: string;
  role: Role;
}

/**
 * Resolve the current request's authenticated user from the signed session
 * cookie. The session is a tamper-proof HMAC-signed JWT, so we trust its
 * userId/role directly — no database round-trip per request. (Disabled users
 * are blocked at login; existing sessions can be ended by resetting the PIN.)
 */
export async function requireUser(): Promise<
  { user: AuthedUser; response?: never } | { user?: never; response: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { user: { id: session.userId, name: session.name, role: session.role } };
}

export async function requireAdmin(): Promise<
  { user: AuthedUser; response?: never } | { user?: never; response: NextResponse }
> {
  const result = await requireUser();
  if (result.response) return result;
  if (result.user.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  }
  return result;
}

/**
 * Like requireUser, but rejects the view-only chef role. Use on endpoints that
 * write data (recording meals, settling balances) which a chef must never do.
 */
export async function requireContributor(): Promise<
  { user: AuthedUser; response?: never } | { user?: never; response: NextResponse }
> {
  const result = await requireUser();
  if (result.response) return result;
  if (result.user.role === "chef") {
    return { response: NextResponse.json({ error: "This account is view-only." }, { status: 403 }) };
  }
  return result;
}
