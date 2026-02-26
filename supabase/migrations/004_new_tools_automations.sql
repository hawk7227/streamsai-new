-- =============================================================================
-- Migration 004: New Tool Types, Automations, Pipeline Variables
-- Adds: image_to_video, video_to_video, avatar, edit tool support
-- Adds: automations + automation_runs tables
-- Adds: pipeline variables + run variable values
-- =============================================================================

-- Extend provider_mappings with new tool types (values fit existing enum check)
-- Note: if tool_type has a CHECK constraint, you may need to ALTER it first:
-- ALTER TABLE provider_mappings DROP CONSTRAINT IF EXISTS provider_mappings_tool_type_check;

-- New provider mappings for image_to_video
INSERT INTO provider_mappings (tool_type, quality_tier, provider_key, display_name, preview_cost_credits, final_cost_credits, is_active, priority, max_concurrent, requests_per_minute, config) VALUES
('image_to_video', 'standard', 'kling-i2v', 'Kling Turbo Image→Video', 5, 10, true, 10, 5, 10, '{"model": "kling-video/v2/turbo/image-to-video"}'),
('image_to_video', 'premium', 'kling-i2v', 'Kling 2.5 Pro Image→Video', 8, 18, true, 10, 3, 5, '{"model": "kling-video/v2.5/pro/image-to-video"}'),
('image_to_video', 'ultra', 'kling-i2v', 'Luma Ray 2 Image→Video', 10, 25, true, 10, 3, 5, '{"model": "luma-ray-2/image-to-video"}'),
-- New provider mappings for video_to_video
('video_to_video', 'standard', 'kling-v2v', 'Kling O1 Fast V2V', 8, 15, true, 10, 3, 5, '{"model": "kling-video/o1/video-to-video/reference"}'),
('video_to_video', 'premium', 'kling-v2v', 'Kling O1 Pro V2V', 10, 22, true, 10, 2, 3, '{"cfg_scale": 0.5}'),
('video_to_video', 'ultra', 'kling-v2v', 'Kling O1 Max V2V', 12, 30, true, 10, 2, 3, '{"cfg_scale": 0.7}'),
-- New provider mappings for avatar
('avatar', 'standard', 'kling-avatar', 'Kling Avatar Std', 6, 12, true, 10, 3, 5, '{"model": "kling-video/ai-avatar/v2/standard"}'),
('avatar', 'premium', 'kling-avatar', 'Kling Avatar Pro', 10, 20, true, 10, 2, 3, '{"model": "kling-video/ai-avatar/v2/pro"}'),
('avatar', 'ultra', 'kling-avatar', 'Kling Avatar Pro 48fps', 12, 28, true, 10, 2, 3, '{"model": "kling-video/ai-avatar/v2/pro", "fps": 48}'),
-- New provider mappings for edit
('edit', 'standard', 'shotstack-edit', 'Shotstack Preview', 2, 5, true, 10, 10, 30, '{"resolution": "preview"}'),
('edit', 'premium', 'shotstack-edit', 'Shotstack HD', 3, 8, true, 10, 5, 15, '{"resolution": "hd"}'),
('edit', 'ultra', 'shotstack-edit', 'Shotstack 4K', 5, 12, true, 10, 3, 10, '{"resolution": "4k"}');

-- Add reference columns to generations table (for new tools that take file inputs)
ALTER TABLE generations ADD COLUMN IF NOT EXISTS reference_image_url TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS reference_video_url TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS reference_audio_url TEXT;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS overlay_config JSONB;

-- Add variables column to pipelines table
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb;

-- Add variable_values column to pipeline_runs table
ALTER TABLE pipeline_runs ADD COLUMN IF NOT EXISTS variable_values JSONB DEFAULT '{}'::jsonb;

-- Automations table
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('schedule', 'webhook', 'credit_balance', 'pipeline_complete')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_config JSONB NOT NULL DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  total_cost_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automations_workspace ON automations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automations_active ON automations(is_active) WHERE is_active = true;

-- Automation runs table
CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  trigger_event TEXT,
  generations_created INTEGER DEFAULT 0,
  cost_credits INTEGER DEFAULT 0,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs(automation_id);

-- Pipeline step results table (if not already exists)
CREATE TABLE IF NOT EXISTS pipeline_step_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  step_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  output JSONB,
  cost_credits INTEGER DEFAULT 0,
  error TEXT,
  duration_ms INTEGER,
  generation_id UUID REFERENCES generations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_results_run ON pipeline_step_results(run_id);

-- RLS policies for automations
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can manage own automations" ON automations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view own automation runs" ON automation_runs
  FOR SELECT USING (workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid()));

-- Enable realtime for workspace_limits (for credit meter)
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_limits;
