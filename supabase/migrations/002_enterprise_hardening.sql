-- =============================================================================
-- StreamsAI Phase 1 — Migration 002: Enterprise Hardening
-- Workspace members, credit audit log, storage, upgraded RLS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- WORKSPACE MEMBERS (multi-user workspaces with role-based access)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Trigger: auto-create owner membership when workspace is created
CREATE OR REPLACE FUNCTION create_workspace_owner_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role, accepted_at)
  VALUES (NEW.id, NEW.user_id, 'owner', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_workspace_create_owner
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION create_workspace_owner_member();

CREATE TRIGGER trg_workspace_members_updated_at BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- TOOL CONFIGS (per-workspace tool settings)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (tool_type IN ('image', 'video', 'voice', 'script', 'pipeline')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  default_quality_tier TEXT NOT NULL DEFAULT 'standard' CHECK (default_quality_tier IN ('standard', 'premium', 'ultra')),
  default_params JSONB NOT NULL DEFAULT '{}',
  usage_count BIGINT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, tool_type)
);

CREATE INDEX idx_tool_configs_workspace ON tool_configs(workspace_id);

ALTER TABLE tool_configs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_tool_configs_updated_at BEFORE UPDATE ON tool_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create tool configs when workspace is created
CREATE OR REPLACE FUNCTION create_workspace_tool_configs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tool_configs (workspace_id, tool_type) VALUES
    (NEW.id, 'image'),
    (NEW.id, 'video'),
    (NEW.id, 'voice'),
    (NEW.id, 'script'),
    (NEW.id, 'pipeline');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_workspace_create_tool_configs
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION create_workspace_tool_configs();

-- ---------------------------------------------------------------------------
-- CREDIT TRANSACTIONS (audit log — every credit movement)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN (
    'deduction_preview', 'deduction_final',
    'refund_preview', 'refund_final',
    'purchase', 'monthly_allowance',
    'admin_adjustment', 'promo_credit'
  )),
  amount NUMERIC(12, 2) NOT NULL, -- positive = credit added, negative = credit deducted
  balance_before NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_workspace ON credit_transactions(workspace_id, created_at DESC);
CREATE INDEX idx_credit_tx_generation ON credit_transactions(generation_id) WHERE generation_id IS NOT NULL;
CREATE INDEX idx_credit_tx_type ON credit_transactions(workspace_id, type);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- UPGRADED FUNCTIONS: deduct/refund with audit trail
-- ---------------------------------------------------------------------------

-- Replace deduct_credits to log transactions
CREATE OR REPLACE FUNCTION deduct_credits(
  p_workspace_id UUID,
  p_amount NUMERIC,
  p_generation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
  deduction_type TEXT;
  gen_status TEXT;
BEGIN
  -- Lock the row
  SELECT credits_balance INTO current_balance
  FROM workspace_limits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN FALSE;
  END IF;

  IF current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  new_balance := current_balance - p_amount;

  UPDATE workspace_limits
  SET credits_balance = new_balance,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  -- Determine deduction type from generation status
  SELECT status INTO gen_status FROM generations WHERE id = p_generation_id;
  IF gen_status IN ('queued_final', 'running_final') THEN
    deduction_type := 'deduction_final';
  ELSE
    deduction_type := 'deduction_preview';
  END IF;

  -- Audit log
  INSERT INTO credit_transactions (
    workspace_id, generation_id, type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_workspace_id, p_generation_id, deduction_type, -p_amount,
    current_balance, new_balance,
    'Credit deduction for generation ' || p_generation_id::text
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Replace refund_credits to log transactions
CREATE OR REPLACE FUNCTION refund_credits(
  p_workspace_id UUID,
  p_amount NUMERIC,
  p_generation_id UUID
)
RETURNS VOID AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
  refund_type TEXT;
  gen_status TEXT;
BEGIN
  -- Lock the row
  SELECT credits_balance INTO current_balance
  FROM workspace_limits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RETURN;
  END IF;

  new_balance := current_balance + p_amount;

  UPDATE workspace_limits
  SET credits_balance = new_balance,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  -- Determine refund type
  SELECT status INTO gen_status FROM generations WHERE id = p_generation_id;
  IF gen_status IN ('queued_final', 'running_final') THEN
    refund_type := 'refund_final';
  ELSE
    refund_type := 'refund_preview';
  END IF;

  -- Audit log
  INSERT INTO credit_transactions (
    workspace_id, generation_id, type, amount,
    balance_before, balance_after, description
  ) VALUES (
    p_workspace_id, p_generation_id, refund_type, p_amount,
    current_balance, new_balance,
    'Credit refund for generation ' || p_generation_id::text
  );
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- HELPER: Check workspace membership (used by all RLS policies)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has a specific role or higher
CREATE OR REPLACE FUNCTION has_workspace_role(p_workspace_id UUID, p_min_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_level INT;
  min_level INT;
BEGIN
  SELECT role INTO user_role FROM workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid()
    AND accepted_at IS NOT NULL;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Role hierarchy: owner(4) > admin(3) > editor(2) > viewer(1)
  role_level := CASE user_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END;

  min_level := CASE p_min_role
    WHEN 'owner' THEN 4
    WHEN 'admin' THEN 3
    WHEN 'editor' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END;

  RETURN role_level >= min_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- DROP OLD RLS POLICIES (from migration 001)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS workspace_select ON workspaces;
DROP POLICY IF EXISTS workspace_insert ON workspaces;
DROP POLICY IF EXISTS workspace_update ON workspaces;
DROP POLICY IF EXISTS wl_select ON workspace_limits;
DROP POLICY IF EXISTS gen_select ON generations;
DROP POLICY IF EXISTS gen_insert ON generations;
DROP POLICY IF EXISTS gen_update ON generations;
DROP POLICY IF EXISTS batch_select ON generation_batches;
DROP POLICY IF EXISTS batch_insert ON generation_batches;
DROP POLICY IF EXISTS pipe_select ON pipelines;
DROP POLICY IF EXISTS pipe_insert ON pipelines;
DROP POLICY IF EXISTS pipe_update ON pipelines;
DROP POLICY IF EXISTS pipe_delete ON pipelines;
DROP POLICY IF EXISTS run_select ON pipeline_runs;
DROP POLICY IF EXISTS run_insert ON pipeline_runs;
DROP POLICY IF EXISTS run_update ON pipeline_runs;
DROP POLICY IF EXISTS step_select ON pipeline_step_results;
DROP POLICY IF EXISTS wl_config_select ON white_label_configs;
DROP POLICY IF EXISTS wl_config_update ON white_label_configs;

-- ---------------------------------------------------------------------------
-- NEW RLS POLICIES (membership-based, role-aware)
-- ---------------------------------------------------------------------------

-- WORKSPACE MEMBERS: Can see members of workspaces you belong to
CREATE POLICY wm_select ON workspace_members FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY wm_insert ON workspace_members FOR INSERT
  WITH CHECK (has_workspace_role(workspace_id, 'admin'));
CREATE POLICY wm_update ON workspace_members FOR UPDATE
  USING (has_workspace_role(workspace_id, 'admin'));
CREATE POLICY wm_delete ON workspace_members FOR DELETE
  USING (
    has_workspace_role(workspace_id, 'admin')
    OR user_id = auth.uid() -- members can remove themselves
  );

-- WORKSPACES: Members can read, only owner can update
CREATE POLICY workspace_select_v2 ON workspaces FOR SELECT
  USING (is_workspace_member(id));
CREATE POLICY workspace_insert_v2 ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY workspace_update_v2 ON workspaces FOR UPDATE
  USING (has_workspace_role(id, 'admin'));
CREATE POLICY workspace_delete_v2 ON workspaces FOR DELETE
  USING (has_workspace_role(id, 'owner'));

-- WORKSPACE LIMITS: Members can read, admins can update
CREATE POLICY wl_select_v2 ON workspace_limits FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY wl_update_v2 ON workspace_limits FOR UPDATE
  USING (has_workspace_role(workspace_id, 'admin'));

-- TOOL CONFIGS: Members can read, editors+ can modify
CREATE POLICY tc_select ON tool_configs FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY tc_update ON tool_configs FOR UPDATE
  USING (has_workspace_role(workspace_id, 'editor'));

-- GENERATIONS: Members can read, editors+ can create/update
CREATE POLICY gen_select_v2 ON generations FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY gen_insert_v2 ON generations FOR INSERT
  WITH CHECK (has_workspace_role(workspace_id, 'editor'));
CREATE POLICY gen_update_v2 ON generations FOR UPDATE
  USING (has_workspace_role(workspace_id, 'editor'));

-- GENERATION BATCHES: Members can read, editors+ can create
CREATE POLICY batch_select_v2 ON generation_batches FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY batch_insert_v2 ON generation_batches FOR INSERT
  WITH CHECK (has_workspace_role(workspace_id, 'editor'));

-- PIPELINES: Members can read, editors+ can create/edit, admins+ can delete
CREATE POLICY pipe_select_v2 ON pipelines FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY pipe_insert_v2 ON pipelines FOR INSERT
  WITH CHECK (has_workspace_role(workspace_id, 'editor'));
CREATE POLICY pipe_update_v2 ON pipelines FOR UPDATE
  USING (has_workspace_role(workspace_id, 'editor'));
CREATE POLICY pipe_delete_v2 ON pipelines FOR DELETE
  USING (has_workspace_role(workspace_id, 'admin'));

-- PIPELINE RUNS: Members can read, editors+ can create/update
CREATE POLICY run_select_v2 ON pipeline_runs FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY run_insert_v2 ON pipeline_runs FOR INSERT
  WITH CHECK (has_workspace_role(workspace_id, 'editor'));
CREATE POLICY run_update_v2 ON pipeline_runs FOR UPDATE
  USING (has_workspace_role(workspace_id, 'editor'));

-- PIPELINE STEP RESULTS: Via run membership
CREATE POLICY step_select_v2 ON pipeline_step_results FOR SELECT
  USING (run_id IN (
    SELECT id FROM pipeline_runs WHERE is_workspace_member(workspace_id)
  ));

-- CREDIT TRANSACTIONS: Members can read (audit trail)
CREATE POLICY ctx_select ON credit_transactions FOR SELECT
  USING (is_workspace_member(workspace_id));

-- WHITE LABEL: Members can read, admins can modify
CREATE POLICY wl_select_v2 ON white_label_configs FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY wl_insert_v2 ON white_label_configs FOR INSERT
  WITH CHECK (has_workspace_role(workspace_id, 'admin'));
CREATE POLICY wl_update_v2 ON white_label_configs FOR UPDATE
  USING (has_workspace_role(workspace_id, 'admin'));

-- ---------------------------------------------------------------------------
-- STORAGE: generations bucket
-- ---------------------------------------------------------------------------

-- Create the storage bucket for generation outputs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generations',
  'generations',
  true, -- public read (files are accessed via preview_url/final_url)
  524288000, -- 500MB max (for long videos)
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'text/plain', 'text/markdown',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies: service role uploads, public reads
-- Workers use service role key so they bypass RLS for uploads.
-- End users get public read access via the CDN URL.

-- Public read access for generation outputs
CREATE POLICY storage_gen_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'generations');

-- Authenticated users can upload to their workspace path (format: preview/{gen_id}.ext)
-- Workers use service role, so this policy is for direct user uploads if needed
CREATE POLICY storage_gen_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'generations'
    AND auth.role() = 'authenticated'
  );

-- Only service role can delete (cleanup)
CREATE POLICY storage_gen_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generations'
    AND auth.role() = 'service_role'
  );

-- ---------------------------------------------------------------------------
-- STORAGE: user-uploads bucket (for pipeline inputs, custom assets)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false, -- private — only workspace members can access
  104857600, -- 100MB max
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'text/plain', 'text/markdown', 'text/csv',
    'application/json', 'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Users can read their own uploads (path format: {workspace_id}/...)
CREATE POLICY storage_uploads_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-uploads'
    AND is_workspace_member((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY storage_uploads_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND has_workspace_role((storage.foldername(name))[1]::uuid, 'editor')
  );

CREATE POLICY storage_uploads_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-uploads'
    AND has_workspace_role((storage.foldername(name))[1]::uuid, 'editor')
  );

-- ---------------------------------------------------------------------------
-- REALTIME: Ensure publications (idempotent)
-- ---------------------------------------------------------------------------
-- These are already in migration 001 but re-affirm for safety
DO $$
BEGIN
  -- generation_batches wasn't in original publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'generation_batches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE generation_batches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'credit_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE credit_transactions;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- WORKSPACE INVITE FUNCTION (called from API)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION invite_workspace_member(
  p_workspace_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'editor'
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
  new_member_id UUID;
BEGIN
  -- Check inviter has admin+ role
  IF NOT has_workspace_role(p_workspace_id, 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to invite members';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, editor, or viewer', p_role;
  END IF;

  -- Look up user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = p_email;

  -- Create membership (accepted_at = NULL until user accepts)
  INSERT INTO workspace_members (workspace_id, user_id, role, invited_by, invited_email, accepted_at)
  VALUES (
    p_workspace_id,
    COALESCE(target_user_id, uuid_generate_v4()), -- placeholder if user doesn't exist yet
    p_role,
    auth.uid(),
    p_email,
    CASE WHEN target_user_id IS NOT NULL THEN NULL ELSE NULL END
  )
  ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, updated_at = NOW()
  RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- CREDIT PURCHASE FUNCTION (for Stripe webhook)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION add_purchased_credits(
  p_workspace_id UUID,
  p_amount NUMERIC,
  p_stripe_payment_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  SELECT credits_balance INTO current_balance
  FROM workspace_limits
  WHERE workspace_id = p_workspace_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Workspace not found';
  END IF;

  new_balance := current_balance + p_amount;

  UPDATE workspace_limits
  SET credits_balance = new_balance,
      updated_at = NOW()
  WHERE workspace_id = p_workspace_id;

  INSERT INTO credit_transactions (
    workspace_id, type, amount,
    balance_before, balance_after,
    description, metadata
  ) VALUES (
    p_workspace_id, 'purchase', p_amount,
    current_balance, new_balance,
    'Credit purchase: ' || p_amount || ' credits',
    CASE WHEN p_stripe_payment_id IS NOT NULL
      THEN jsonb_build_object('stripe_payment_id', p_stripe_payment_id)
      ELSE '{}'::jsonb
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- MONTHLY CREDIT RESET FUNCTION (called by cron)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS INT AS $$
DECLARE
  reset_count INT := 0;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT workspace_id, credits_balance, credits_monthly_allowance
    FROM workspace_limits
    WHERE credits_reset_at <= NOW()
    FOR UPDATE
  LOOP
    UPDATE workspace_limits
    SET credits_balance = rec.credits_monthly_allowance,
        credits_reset_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE workspace_id = rec.workspace_id;

    INSERT INTO credit_transactions (
      workspace_id, type, amount,
      balance_before, balance_after, description
    ) VALUES (
      rec.workspace_id, 'monthly_allowance',
      rec.credits_monthly_allowance - rec.credits_balance,
      rec.credits_balance, rec.credits_monthly_allowance,
      'Monthly credit reset'
    );

    reset_count := reset_count + 1;
  END LOOP;

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done. Migration 002 complete.
