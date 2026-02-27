import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function shouldRunNow(cronExpr: string): boolean {
  if (!cronExpr) return false;
  const now = new Date();
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [min, hour] = parts;

  if (min !== "*") {
    if (min.startsWith("*/")) { if (now.getMinutes() % parseInt(min.slice(2)) !== 0) return false; }
    else { if (now.getMinutes() !== parseInt(min)) return false; }
  }
  if (hour !== "*") {
    if (hour.startsWith("*/")) { if (now.getHours() % parseInt(hour.slice(2)) !== 0) return false; }
    else { if (now.getHours() !== parseInt(hour)) return false; }
  }
  return true;
}

function verifyCronAuth(request: NextRequest): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  let triggered = 0;
  let errors = 0;

  try {
    const { data: automations, error: fetchErr } = await db
      .from("automations").select("*").eq("is_active", true).eq("trigger_type", "schedule");

    if (fetchErr) {
      console.error("[AutoScheduler] Fetch error:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!automations?.length) {
      return NextResponse.json({ triggered: 0, total: 0, message: "No active scheduled automations" });
    }

    for (const auto of automations) {
      const config = auto.trigger_config as Record<string, unknown>;
      const cron = config?.cron as string;
      if (!shouldRunNow(cron)) continue;

      const runId = uuidv4();
      try {
        await db.from("automation_runs").insert({
          id: runId, automation_id: auto.id, workspace_id: auto.workspace_id,
          status: "running", trigger_event: `cron:${cron}`, generations_created: 0, cost_credits: 0,
        });

        const actionConfig = auto.action_config as Record<string, unknown>;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const genRes = await fetch(`${appUrl}/api/generations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-service-role": process.env.SUPABASE_SERVICE_ROLE_KEY || "" },
          body: JSON.stringify({
            type: actionConfig?.tool_type || "image",
            prompt: actionConfig?.prompt_template || "Generate content",
            quality_tiers: [actionConfig?.quality_tier || "standard"],
            metadata: { automation_id: auto.id, automation_run_id: runId },
          }),
        });

        const genData = await genRes.json();
        if (genRes.ok) {
          await db.from("automation_runs").update({
            status: "completed", generations_created: genData.generations?.length || 0,
            cost_credits: genData.total_preview_cost || 0, completed_at: new Date().toISOString(),
          }).eq("id", runId);
          await db.from("automations").update({
            last_run_at: new Date().toISOString(),
            run_count: (auto.run_count || 0) + 1,
          }).eq("id", auto.id);
          triggered++;
        } else {
          await db.from("automation_runs").update({ status: "failed", error: genData.error || "Generation failed", completed_at: new Date().toISOString() }).eq("id", runId);
          errors++;
        }
      } catch (e) {
        console.error(`[AutoScheduler] Run error for ${auto.id}:`, e);
        await db.from("automation_runs").update({ status: "failed", error: (e as Error).message, completed_at: new Date().toISOString() }).eq("id", runId);
        errors++;
      }
    }

    return NextResponse.json({ triggered, errors, total: automations.length });
  } catch (e) {
    console.error("[AutoScheduler] Fatal error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
