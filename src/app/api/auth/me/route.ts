import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) {
    // Not authenticated / disabled — return a null user rather than an error,
    // so the client can simply show the login screen.
    return NextResponse.json({ user: null });
  }

  const safe: User = {
    id: user.id,
    name: user.name,
    role: user.role,
    active: true,
    created_at: "",
    has_pin: true,
  };
  return NextResponse.json({ user: safe });
}
