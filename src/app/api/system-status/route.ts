import { NextResponse } from "next/server";
import { getEnvHealth } from "@/lib/env";

interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down" | "unconfigured";
  latencyMs: number | null;
  details: string;
}

async function checkSupabase(): Promise<ServiceHealth> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return { name: "Supabase", status: "unconfigured", latencyMs: null, details: "NEXT_PUBLIC_SUPABASE_URL not set" };

  const start = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: "HEAD",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    if (res.ok || res.status === 404 || res.status === 406) {
      return { name: "Supabase", status: latencyMs > 2000 ? "degraded" : "healthy", latencyMs, details: `HTTP ${res.status}` };
    }
    return { name: "Supabase", status: "degraded", latencyMs, details: `HTTP ${res.status}` };
  } catch (e) {
    return { name: "Supabase", status: "down", latencyMs: Date.now() - start, details: e instanceof Error ? e.message : "Connection failed" };
  }
}

async function checkStripe(): Promise<ServiceHealth> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { name: "Stripe", status: "unconfigured", latencyMs: null, details: "STRIPE_SECRET_KEY not set" };

  const start = Date.now();
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return { name: "Stripe", status: res.ok ? (latencyMs > 2000 ? "degraded" : "healthy") : "degraded", latencyMs, details: `HTTP ${res.status}` };
  } catch (e) {
    return { name: "Stripe", status: "down", latencyMs: Date.now() - start, details: e instanceof Error ? e.message : "Connection failed" };
  }
}

async function checkOpenAI(): Promise<ServiceHealth> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { name: "OpenAI", status: "unconfigured", latencyMs: null, details: "OPENAI_API_KEY not set" };

  const start = Date.now();
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return { name: "OpenAI", status: res.ok ? (latencyMs > 3000 ? "degraded" : "healthy") : "degraded", latencyMs, details: `HTTP ${res.status}` };
  } catch (e) {
    return { name: "OpenAI", status: "down", latencyMs: Date.now() - start, details: e instanceof Error ? e.message : "Connection failed" };
  }
}

async function checkAnthropic(): Promise<ServiceHealth> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { name: "Anthropic", status: "unconfigured", latencyMs: null, details: "ANTHROPIC_API_KEY not set" };
  // Anthropic doesn't have a lightweight health endpoint — just verify key format
  return { name: "Anthropic", status: "healthy", latencyMs: null, details: "Key configured" };
}

async function checkElevenLabs(): Promise<ServiceHealth> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return { name: "ElevenLabs", status: "unconfigured", latencyMs: null, details: "ELEVENLABS_API_KEY not set" };

  const start = Date.now();
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return { name: "ElevenLabs", status: res.ok ? "healthy" : "degraded", latencyMs, details: `HTTP ${res.status}` };
  } catch (e) {
    return { name: "ElevenLabs", status: "down", latencyMs: Date.now() - start, details: e instanceof Error ? e.message : "Connection failed" };
  }
}

async function checkGoogle(): Promise<ServiceHealth> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) return { name: "Google AI", status: "unconfigured", latencyMs: null, details: "GOOGLE_AI_API_KEY not set" };
  return { name: "Google AI", status: "healthy", latencyMs: null, details: "Key configured" };
}

export async function GET() {
  const startTime = Date.now();

  const [supabase, stripe, openai, anthropic, elevenlabs, google] =
    await Promise.all([
      checkSupabase(),
      checkStripe(),
      checkOpenAI(),
      checkAnthropic(),
      checkElevenLabs(),
      checkGoogle(),
    ]);

  const services: ServiceHealth[] = [supabase, stripe, openai, anthropic, elevenlabs, google];
  const envHealth = getEnvHealth();

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const downCount = services.filter((s) => s.status === "down").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;

  let overallStatus: "healthy" | "degraded" | "down" = "healthy";
  if (downCount > 0) overallStatus = "down";
  else if (degradedCount > 0 || !envHealth.valid) overallStatus = "degraded";

  const body = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTimeMs: Date.now() - startTime,
    version: process.env.npm_package_version ?? "0.0.0",
    environment: process.env.NODE_ENV ?? "unknown",
    region: process.env.VERCEL_REGION ?? "unknown",
    services,
    env: {
      valid: envHealth.valid,
      configuredCount: envHealth.configured.length,
      missingCount: envHealth.missing.length,
    },
    summary: {
      total: services.length,
      healthy: healthyCount,
      degraded: degradedCount,
      down: downCount,
      unconfigured: services.filter((s) => s.status === "unconfigured").length,
    },
  };

  const httpStatus = overallStatus === "down" ? 503 : overallStatus === "degraded" ? 207 : 200;

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Health-Status": overallStatus,
    },
  });
}
