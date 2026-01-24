import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentWorkspaceSelection } from "@/lib/team-server";

const allowedTypes = ["video", "image", "script", "voice"] as const;

type AllowedType = (typeof allowedTypes)[number];

const isAllowedType = (value: string): value is AllowedType =>
  allowedTypes.includes(value as AllowedType);

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const limit = Number(searchParams.get("limit") ?? "10");
  const offset = Number(searchParams.get("offset") ?? "0");

  const admin = createAdminClient();
  const selection = await getCurrentWorkspaceSelection(admin, user);

  let query = admin
    .from("generations")
    .select(
      "id, type, prompt, title, status, aspect_ratio, duration, quality, style, favorited, created_at"
    )
    .eq("workspace_id", selection.current.workspace.id)
    .order("created_at", { ascending: false });

  if (type && isAllowedType(type)) {
    query = query.eq("type", type);
  }

  if (Number.isFinite(limit) && limit > 0) {
    const safeOffset = Number.isFinite(offset) && offset >= 0 ? offset : 0;
    query = query.range(safeOffset, safeOffset + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const type = typeof payload?.type === "string" ? payload.type : "";
  const prompt = typeof payload?.prompt === "string" ? payload.prompt.trim() : "";

  if (!type || !isAllowedType(type)) {
    return NextResponse.json({ error: "Invalid generation type" }, { status: 400 });
  }

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const selection = await getCurrentWorkspaceSelection(admin, user);

  const insertPayload = {
    user_id: user.id,
    workspace_id: selection.current.workspace.id,
    type,
    prompt,
    title: typeof payload?.title === "string" ? payload.title : null,
    status: typeof payload?.status === "string" ? payload.status : "completed",
    aspect_ratio:
      typeof payload?.aspectRatio === "string" ? payload.aspectRatio : null,
    duration: typeof payload?.duration === "string" ? payload.duration : null,
    quality: typeof payload?.quality === "string" ? payload.quality : null,
    style: typeof payload?.style === "string" ? payload.style : null,
  };

  const { data, error } = await admin
    .from("generations")
    .insert(insertPayload)
    .select(
      "id, type, prompt, title, status, aspect_ratio, duration, quality, style, favorited, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
