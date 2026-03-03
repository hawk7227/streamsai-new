import { z } from "zod";

/**
 * Validated environment schema.
 * Called at boot in API routes and workers.
 * Missing/invalid vars throw immediately — fail loud, not silent.
 */

const serverSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_STARTER_MONTHLY: z.string().optional(),
  STRIPE_PRICE_STARTER_YEARLY: z.string().optional(),
  STRIPE_PRICE_PROFESSIONAL_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PROFESSIONAL_YEARLY: z.string().optional(),

  // AI Providers
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  FAL_KEY: z.string().min(1).optional(),
  SHOTSTACK_API_KEY: z.string().min(1).optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  CRON_SECRET: z.string().min(1).optional(),
  VERCEL_REGION: z.string().optional(),

  // Workers
  TOOL_TYPE: z.string().optional(),
  MAX_CONCURRENT: z.coerce.number().int().positive().optional(),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().optional(),

  // Runtime
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let _validated: ServerEnv | null = null;

/**
 * Validate and cache env vars. Throws on first invalid/missing required var.
 * Safe to call multiple times — returns cached result after first parse.
 */
export function validateEnv(): ServerEnv {
  if (_validated) return _validated;

  const result = serverSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues.map(
      (i) => `  ${i.path.join(".")}: ${i.message}`
    );
    throw new Error(
      `[ENV VALIDATION FAILED]\n${issues.join("\n")}\n\nFix these environment variables before starting.`
    );
  }

  _validated = result.data;
  return _validated;
}

/**
 * Get health status of env configuration.
 * Does NOT throw — returns structured result for /api/system-status.
 */
export function getEnvHealth(): {
  valid: boolean;
  configured: string[];
  missing: string[];
  errors: string[];
} {
  const result = serverSchema.safeParse(process.env);

  if (result.success) {
    const configured = Object.keys(result.data).filter(
      (k) => result.data[k as keyof ServerEnv] !== undefined
    );
    return { valid: true, configured, missing: [], errors: [] };
  }

  const errors = result.error.issues.map(
    (i) => `${i.path.join(".")}: ${i.message}`
  );
  const missing = result.error.issues
    .filter((i) => i.code === "invalid_type" && i.received === "undefined")
    .map((i) => i.path.join("."));
  const configured = Object.keys(serverSchema.shape).filter(
    (k) => process.env[k] !== undefined
  );

  return { valid: false, configured, missing, errors };
}
