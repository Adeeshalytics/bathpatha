import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Admin-only: remove a settlement that was recorded by mistake.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const { data: existing } = await supabaseAdmin()
    .from("settlements")
    .select("*")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Settlement not found." }, { status: 404 });

  const { error } = await supabaseAdmin().from("settlements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user.id, "settlement_deleted", { settlement_id: id, record: existing });
  return new NextResponse(null, { status: 204 });
}
