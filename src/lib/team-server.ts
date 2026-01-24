import { DEFAULT_PLAN_KEY, getPlanConfig, type PlanKey } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeEmail, type WorkspaceRole } from "@/lib/team";
import type { User } from "@supabase/supabase-js";

export interface WorkspaceSummary {
  id: string;
  name: string | null;
  ownerId: string;
}

export interface WorkspaceMembership {
  memberId: string;
  role: WorkspaceRole;
  workspace: WorkspaceSummary;
}

export interface WorkspaceMembershipRecord extends WorkspaceMembership {
  createdAt: string | null;
}

export interface WorkspacePlanSummary {
  key: PlanKey;
  name: string;
  limits: {
    teamMembers: number | "unlimited";
  };
}

export interface WorkspaceSelection {
  current: WorkspaceMembership;
  memberships: WorkspaceMembershipRecord[];
  plan: WorkspacePlanSummary;
}

type AdminClient = ReturnType<typeof createAdminClient>;

export const listWorkspaceMemberships = async (
  admin: AdminClient,
  userId: string
): Promise<WorkspaceMembershipRecord[]> => {
  const { data: memberships, error } = await admin
    .from("workspace_members")
    .select("id, role, workspace_id, created_at")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const workspaceIds = memberships.map((row) => row.workspace_id);
  const { data: workspaces, error: workspaceError } = await admin
    .from("workspaces")
    .select("id, name, owner_id")
    .in("id", workspaceIds);

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  const workspaceMap = new Map(
    (workspaces ?? []).map((workspace) => [workspace.id, workspace])
  );

  return memberships
    .map((row) => {
      const workspace = workspaceMap.get(row.workspace_id);
      if (!workspace) {
        return null;
      }
      return {
        memberId: row.id,
        role: row.role as WorkspaceRole,
        workspace: {
          id: workspace.id,
          name: workspace.name ?? null,
          ownerId: workspace.owner_id,
        },
        createdAt: row.created_at ?? null,
      } as WorkspaceMembershipRecord;
    })
    .filter((entry): entry is WorkspaceMembershipRecord => entry !== null);
};

const ensurePersonalWorkspace = async (admin: AdminClient, user: User) => {
  let memberships = await listWorkspaceMemberships(admin, user.id);
  const hasOwner = memberships.some((entry) => entry.role === "owner");

  if (hasOwner) {
    return memberships;
  }

  const ensureMembership = async (workspaceId: string, role: WorkspaceRole) => {
    const { error } = await admin.from("workspace_members").upsert(
      {
        workspace_id: workspaceId,
        user_id: user.id,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id" }
    );

    if (error) {
      throw new Error(error.message);
    }
  };

  const { data: ownedWorkspace } = await admin
    .from("workspaces")
    .select("id, name, owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  const email = user.email ? normalizeEmail(user.email) : null;

  if (ownedWorkspace) {
    await ensureMembership(ownedWorkspace.id, "owner");
  } else {
    const { data: profile } = await admin
      .from("profiles")
      .select("org_name, full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const workspaceName =
      profile?.org_name ??
      profile?.full_name ??
      profile?.email?.split("@")[0] ??
      email?.split("@")[0] ??
      "Workspace";

    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .insert({
        name: workspaceName,
        owner_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id, name, owner_id")
      .single();

    if (workspaceError || !workspace) {
      throw new Error(workspaceError?.message ?? "Unable to create workspace");
    }

    await ensureMembership(workspace.id, "owner");
  }

  memberships = await listWorkspaceMemberships(admin, user.id);
  if (memberships.length === 0) {
    throw new Error("Unable to create workspace membership");
  }
  return memberships;
};

const selectCurrentMembership = (
  memberships: WorkspaceMembershipRecord[],
  currentWorkspaceId?: string | null
) => {
  if (currentWorkspaceId) {
    const match = memberships.find(
      (entry) => entry.workspace.id === currentWorkspaceId
    );
    if (match) {
      return match;
    }
  }

  const ownerMembership = memberships.find((entry) => entry.role === "owner");
  if (ownerMembership) {
    return ownerMembership;
  }

  return memberships
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    })[0];
};

export const getCurrentWorkspaceSelection = async (
  admin: AdminClient,
  user: User
): Promise<WorkspaceSelection> => {
  const memberships = await ensurePersonalWorkspace(admin, user);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("current_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const current = selectCurrentMembership(
    memberships,
    profile?.current_workspace_id ?? null
  );

  if (!current) {
    throw new Error("No workspace membership found");
  }

  if (profile?.current_workspace_id !== current.workspace.id) {
    await admin
      .from("profiles")
      .update({
        current_workspace_id: current.workspace.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  const plan = await getWorkspacePlan(admin, current.workspace.ownerId);

  return {
    current: {
      memberId: current.memberId,
      role: current.role,
      workspace: current.workspace,
    },
    memberships,
    plan,
  };
};

export const setCurrentWorkspace = async (
  admin: AdminClient,
  user: User,
  workspaceId: string
): Promise<WorkspaceSelection> => {
  const memberships = await ensurePersonalWorkspace(admin, user);
  const current = memberships.find(
    (entry) => entry.workspace.id === workspaceId
  );

  if (!current) {
    throw new Error("Workspace not found for user");
  }

  await admin
    .from("profiles")
    .update({
      current_workspace_id: workspaceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  const plan = await getWorkspacePlan(admin, current.workspace.ownerId);

  return {
    current: {
      memberId: current.memberId,
      role: current.role,
      workspace: current.workspace,
    },
    memberships,
    plan,
  };
};

export const ensureWorkspaceMembership = async (
  admin: AdminClient,
  user: User
): Promise<WorkspaceMembership> => {
  const selection = await getCurrentWorkspaceSelection(admin, user);
  return selection.current;
};

export const getWorkspacePlan = async (
  admin: AdminClient,
  ownerId: string
): Promise<WorkspacePlanSummary> => {
  const { data: profile, error } = await admin
    .from("profiles")
    .select("plan_id")
    .eq("id", ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const plan = getPlanConfig(profile?.plan_id ?? DEFAULT_PLAN_KEY);
  return {
    key: plan.key,
    name: plan.name,
    limits: {
      teamMembers: plan.limits.teamMembers,
    },
  };
};
