-- =============================================================================
-- StreamsAI Phase 1 — Migration 001: Foundation
-- Core tables for workspace-based multi-tenant generation platform
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- WORKSPACES
-- =============================================================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  enabled_tools TEXT[] NOT NULL DEFAULT '{image,script}',
  signup_source TEXT NOT NULL DEFAULT 'platform' CHECK (signup_source IN ('platform','videoGen','imageGen','voiceGen','scriptGen')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_workspaces_user ON workspaces(user_id);
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- WORKSPACE LIMITS (denormalized for fast queries)
-- =============================================================================
CREATE TABLE workspace_limits (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  max_concurrent_image INT NOT NULL DEFAULT 3,
  max_concurrent_video INT NOT NULL DEFAULT 1,
  max_concurrent_voice INT NOT NULL DEFAULT 2,
  max_concurrent_script INT NOT NULL DEFAULT 5,
  max_concurrent_total INT NOT NULL DEFAULT 6,
  credits_balance INT NOT NULL DEFAULT 50,
  credits_monthly_allowance INT NOT NULL DEFAULT 50,
  credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month'
);

ALTER TABLE workspace_limits ENABLE ROW LEVEL SECURITY;

-- Auto-create limits when workspace is created
CREATE OR REPLACE FUNCTION create_workspace_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_limits (workspace_id, tier, credits_balance, credits_monthly_allowance)
  VALUES (NEW.id, NEW.tier,
    CASE NEW.tier WHEN 'free' THEN 50 WHEN 'pro' THEN 2000 WHEN 'enterprise' THEN 50000 ELSE 50 END,
    CASE NEW.tier WHEN 'free' THEN 50 WHEN 'pro' THEN 2000 WHEN 'enterprise' THEN 50000 ELSE 50 END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_workspace_create_limits
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION create_workspace_limits();

-- =============================================================================
-- PROVIDER MAPPINGS (tool_type + quality_tier → provider)
-- =============================================================================
CREATE TABLE provider_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_type TEXT NOT NULL CHECK (tool_type IN ('image', 'video', 'voice', 'script')),
  quality_tier TEXT NOT NULL CHECK (quality_tier IN ('standard', 'premium', 'ultra')),
  provider_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  preview_cost_credits INT NOT NULL DEFAULT 1,
  final_cost_credits INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 1,
  max_concurrent INT NOT NULL DEFAULT 10,
  requests_per_minute INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tool_type, quality_tier, provider_key)
);

CREATE TRIGGER trg_provider_mappings_updated_at BEFORE UPDATE ON provider_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- GENERATION BATCHES
-- =============================================================================
CREATE TABLE generation_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'single' CHECK (mode IN ('single','multi_provider','bulk','multi_both')),
  prompt TEXT,
  prompts TEXT[],
  quality_tiers TEXT[] NOT NULL DEFAULT '{standard}',
  total_generations INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','all_previews_ready','completed','partial_failure')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batches_workspace ON generation_batches(workspace_id);
ALTER TABLE generation_batches ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON generation_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- GENERATIONS (the core table)
-- =============================================================================
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES generation_batches(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image','video','voice','script')),
  provider TEXT NOT NULL,
  quality_tier TEXT NOT NULL CHECK (quality_tier IN ('standard','premium','ultra')),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  aspect_ratio TEXT,
  duration INT,
  resolution TEXT,
  style TEXT,
  voice_id TEXT,
  language TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running_preview','preview_ready','queued_final','running_final','final_ready','failed','cancelled')),
  progress INT NOT NULL DEFAULT 0,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  preview_url TEXT,
  final_url TEXT,
  preview_metadata JSONB,
  final_metadata JSONB,
  preview_cost_credits INT NOT NULL DEFAULT 0,
  final_cost_credits INT NOT NULL DEFAULT 0,
  cost_cents INT NOT NULL DEFAULT 0,
  worker_id TEXT,
  worker_heartbeat_at TIMESTAMPTZ,
  external_job_id TEXT,
  started_at TIMESTAMPTZ,
  preview_completed_at TIMESTAMPTZ,
  final_requested_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gen_workspace ON generations(workspace_id);
CREATE INDEX idx_gen_status ON generations(status);
CREATE INDEX idx_gen_batch ON generations(batch_id);
CREATE INDEX idx_gen_worker ON generations(worker_id) WHERE worker_id IS NOT NULL;
CREATE INDEX idx_gen_external ON generations(external_job_id) WHERE external_job_id IS NOT NULL;
CREATE INDEX idx_gen_queue ON generations(status, type, created_at) WHERE status IN ('queued','queued_final');

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PIPELINES
-- =============================================================================
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  execution_mode TEXT NOT NULL DEFAULT 'manual' CHECK (execution_mode IN ('manual','hybrid','automatic')),
  steps JSONB NOT NULL DEFAULT '[]',
  variables JSONB NOT NULL DEFAULT '{}',
  ai_guidelines JSONB NOT NULL DEFAULT '{}',
  auto_settings JSONB NOT NULL DEFAULT '{"pause_on_error":true,"max_budget_credits":1000,"retry_attempts":2,"require_approval_steps":[]}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pipelines_workspace ON pipelines(workspace_id);
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_pipelines_updated_at BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- PIPELINE RUNS
-- =============================================================================
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','paused','completed','failed','cancelled')),
  current_step_index INT NOT NULL DEFAULT 0,
  variable_values JSONB NOT NULL DEFAULT '{}',
  total_cost_credits INT NOT NULL DEFAULT 0,
  inngest_run_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runs_pipeline ON pipeline_runs(pipeline_id);
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PIPELINE STEP RESULTS
-- =============================================================================
CREATE TABLE pipeline_step_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('script','voice','image','video','edit','export')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ai-generating','awaiting-approval','processing','completed','failed','skipped')),
  ai_generated_input JSONB,
  user_approved_input JSONB,
  provider TEXT,
  output JSONB,
  cost_credits INT NOT NULL DEFAULT 0,
  error TEXT,
  duration_ms INT,
  generation_id UUID REFERENCES generations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_steps_run ON pipeline_step_results(run_id);
ALTER TABLE pipeline_step_results ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_steps_updated_at BEFORE UPDATE ON pipeline_step_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- WHITE LABEL CONFIGS
-- =============================================================================
CREATE TABLE white_label_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  brand_name TEXT NOT NULL DEFAULT 'StreamsAI',
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  custom_domain TEXT,
  enabled_tools TEXT[] NOT NULL DEFAULT '{image,video,voice,script}',
  landing_page_config JSONB NOT NULL DEFAULT '{}',
  custom_api_keys JSONB,
  use_platform_keys BOOLEAN NOT NULL DEFAULT true,
  markup_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE white_label_configs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_wl_updated_at BEFORE UPDATE ON white_label_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- CREDIT FUNCTIONS (atomic deduct + refund)
-- =============================================================================
CREATE OR REPLACE FUNCTION deduct_credits(
  p_workspace_id UUID,
  p_amount INT,
  p_generation_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE workspace_limits
  SET credits_balance = credits_balance - p_amount
  WHERE workspace_id = p_workspace_id AND credits_balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refund_credits(
  p_workspace_id UUID,
  p_amount INT,
  p_generation_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE workspace_limits
  SET credits_balance = credits_balance + p_amount
  WHERE workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count active (non-terminal) generations for concurrency checks
CREATE OR REPLACE FUNCTION count_active_generations(
  p_workspace_id UUID,
  p_tool_type TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE result INT;
BEGIN
  IF p_tool_type IS NOT NULL THEN
    SELECT COUNT(*) INTO result FROM generations
    WHERE workspace_id = p_workspace_id AND type = p_tool_type
      AND status IN ('queued','running_preview','queued_final','running_final');
  ELSE
    SELECT COUNT(*) INTO result FROM generations
    WHERE workspace_id = p_workspace_id
      AND status IN ('queued','running_preview','queued_final','running_final');
  END IF;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RLS POLICIES (owner-only for v1 — upgraded to membership-based in 002)
-- =============================================================================
CREATE POLICY ws_owner ON workspaces FOR ALL USING (user_id = auth.uid());
CREATE POLICY wl_owner ON workspace_limits FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
);
CREATE POLICY gen_owner ON generations FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
);
CREATE POLICY batch_owner ON generation_batches FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
);
CREATE POLICY pipe_owner ON pipelines FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
);
CREATE POLICY run_owner ON pipeline_runs FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
);
CREATE POLICY step_owner ON pipeline_step_results FOR ALL USING (
  run_id IN (SELECT id FROM pipeline_runs WHERE workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()))
);
CREATE POLICY wl_config_owner ON white_label_configs FOR ALL USING (
  workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
);

-- =============================================================================
-- REALTIME PUBLICATIONS
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE generations;
ALTER PUBLICATION supabase_realtime ADD TABLE generation_batches;

-- =============================================================================
-- SEED: Provider Mappings
-- =============================================================================
INSERT INTO provider_mappings (tool_type, quality_tier, provider_key, display_name, config, preview_cost_credits, final_cost_credits, priority) VALUES
  ('image', 'standard', 'openai-gpt-image-1-mini', 'Standard Image', '{"model":"gpt-image-1-mini"}', 1, 5, 1),
  ('image', 'premium',  'openai-gpt-image-1',      'Premium Image',  '{"model":"gpt-image-1"}', 3, 15, 1),
  ('image', 'ultra',    'openai-gpt-image-1.5',     'Ultra Image',    '{"model":"gpt-image-1.5"}', 5, 25, 1),
  ('video', 'standard', 'openai-sora-2',            'Standard Video', '{"model":"sora-2","resolution":"1280x720"}', 50, 200, 1),
  ('video', 'premium',  'openai-sora-2-pro',        'Premium Video',  '{"model":"sora-2-pro","resolution":"1920x1080"}', 100, 400, 1),
  ('video', 'ultra',    'google-veo-3.1',           'Ultra Video',    '{"model":"veo-3.1-generate-preview"}', 75, 300, 1),
  ('voice', 'standard', 'openai-tts',               'Standard Voice', '{"model":"tts-1"}', 2, 8, 1),
  ('voice', 'premium',  'elevenlabs-standard',      'Premium Voice',  '{"model":"eleven_multilingual_v2"}', 5, 15, 1),
  ('voice', 'ultra',    'elevenlabs-turbo',         'Ultra Voice',    '{"model":"eleven_turbo_v2_5"}', 8, 25, 1),
  ('script','standard', 'anthropic-haiku',          'Standard Script','{"model":"claude-haiku-4-5-20251001"}', 1, 3, 1),
  ('script','premium',  'anthropic-sonnet',         'Premium Script', '{"model":"claude-sonnet-4-5-20250929"}', 3, 10, 1),
  ('script','ultra',    'anthropic-opus',           'Ultra Script',   '{"model":"claude-opus-4-5-20250929"}', 5, 20, 1);
