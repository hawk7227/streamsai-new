import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail } from "@/lib/team";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email ? normalizeEmail(user.email) : "";
  if (!email) {
    return NextResponse.json({ error: "User email unavailable" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: invites, error: inviteError } = await admin
      .from("workspace_invites")
      .select("id, workspace_id, role, invited_by, created_at")
      .eq("email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    if (!invites || invites.length === 0) {
      return NextResponse.json({ invites: [] });
    }

    const workspaceIds = invites.map((invite) => invite.workspace_id);
    const inviterIds = invites
      .map((invite) => invite.invited_by)
      .filter(Boolean) as string[];

    const [{ data: workspaces, error: workspaceError }, { data: inviters }] =
      await Promise.all([
        admin
          .from("workspaces")
          .select("id, name, owner_id")
          .in("id", workspaceIds),
        inviterIds.length
          ? admin
              .from("profiles")
              .select("id, full_name, email")
              .in("id", inviterIds)
          : Promise.resolve({ data: [] }),
      ]);

    if (workspaceError) {
      return NextResponse.json({ error: workspaceError.message }, { status: 500 });
    }

    const workspaceMap = new Map(
      (workspaces ?? []).map((workspace) => [workspace.id, workspace])
    );
    const inviterMap = new Map(
      (inviters ?? []).map((profile) => [profile.id, profile])
    );

    const formattedInvites = invites
      .map((invite) => {
        const workspace = workspaceMap.get(invite.workspace_id);
        if (!workspace) {
          return null;
        }
        const inviter = invite.invited_by
          ? inviterMap.get(invite.invited_by)
          : null;
        const inviterName =
          inviter?.full_name ??
          inviter?.email?.split("@")[0] ??
          inviter?.email ??
          null;

        return {
          id: invite.id,
          role: invite.role,
          createdAt: invite.created_at ?? null,
          workspace: {
            id: workspace.id,
            name: workspace.name ?? "Workspace",
            ownerId: workspace.owner_id,
          },
          invitedBy: inviterName,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ invites: formattedInvites });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load invites" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
      .select("id, email, status")
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

    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from("workspace_invites")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", inviteId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to decline invite" },
      { status: 500 }
    );
  }
}
