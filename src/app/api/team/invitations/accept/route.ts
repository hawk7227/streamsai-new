import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/team";

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const inviteId = typeof payload?.inviteId === "string" ? payload.inviteId : "";

  if (!inviteId) {
    return NextResponse.json({ error: "Invite id required" }, { status: 400 });
  }

  const email = user.email ? normalizeEmail(user.email) : "";
  if (!email) {
    return NextResponse.json({ error: "User email unavailable" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: invite, error: inviteError } = await admin
      .from("workspace_invites")
      .select("id, workspace_id, role, status, email")
      .eq("id", inviteId)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: inviteError?.message ?? "Invite not found" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending" || normalizeEmail(invite.email) !== email) {
      return NextResponse.json({ error: "Invite not available" }, { status: 403 });
    }

    const { data: existingMember } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invite.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingMember) {
      const { error: memberError } = await admin.from("workspace_members").insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }
    }

    const now = new Date().toISOString();
    await admin
      .from("workspace_invites")
      .update({
        status: "accepted",
        accepted_user_id: user.id,
        accepted_at: now,
        updated_at: now,
      })
      .eq("id", invite.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to accept invite" },
      { status: 500 }
    );
  }
}
