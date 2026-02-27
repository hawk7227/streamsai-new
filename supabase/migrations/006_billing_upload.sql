-- =============================================================================
-- Migration 006: Billing + Upload + Automation Scheduler support
-- =============================================================================

-- add_credits RPC (for subscription renewals via Stripe webhook)
CREATE OR REPLACE FUNCTION add_credits(
  p_workspace_id UUID,
  p_amount INT,
  p_reason TEXT DEFAULT 'manual'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance INT;
BEGIN
  UPDATE workspaces
  SET credits_balance = credits_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_workspace_id
  RETURNING credits_balance INTO new_balance;

  RETURN new_balance;
END;
$$;

-- Index for automation scheduler
CREATE INDEX IF NOT EXISTS idx_automations_active_schedule
  ON automations (trigger_type)
  WHERE is_active = true AND trigger_type = 'schedule';
