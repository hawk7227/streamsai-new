import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  // Optional: protect this endpoint so random people can’t run your worker
  const key = req.headers.get("x-runner-key");
  if (process.env.JOB_RUNNER_KEY && key !== process.env.JOB_RUNNER_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const runnerId = `vercel-${process.env.VERCEL_REGION ?? "local"}-${process.env.VERCEL_DEPLOYMENT_ID ?? "dev"}`;

  // 1) claim a job
  const { data: job, error } = await supabaseAdmin.rpc("claim_next_job", { p_runner: runnerId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!job) return NextResponse.json({ ok: true, claimed: false });

  try {
    // 2) do work (replace this with your real pipeline)
    // Example: simulate progress
    for (const p of [10, 35, 60, 85, 100]) {
      await supabaseAdmin.from("jobs").update({ progress: p, updated_at: new Date().toISOString() }).eq("id", job.id);
      await sleep(400);
    }

    // 3) mark done
    await supabaseAdmin
      .from("jobs")
      .update({
        status: "done",
        progress: 100,
        output: { outputUrl: "https://example.com/output.mp4" },
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return NextResponse.json({ ok: true, claimed: true, jobId: job.id });
  } catch (e: any) {
    await supabaseAdmin
      .from("jobs")
      .update({
        status: "failed",
        error: e?.message ?? "unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return NextResponse.json({ ok: false, jobId: job.id }, { status: 500 });
  }
}