-- =============================================================================
-- Migration 005: Worker Infrastructure
-- Adds: claim_worker_jobs RPC, indexes for worker polling, stale job recovery
-- =============================================================================

-- Atomic job claim function — prevents double-processing
CREATE OR REPLACE FUNCTION claim_worker_jobs(
  p_worker_id TEXT,
  p_statuses TEXT[],
  p_stale_threshold TIMESTAMPTZ,
  p_limit INT DEFAULT 20
)
RETURNS SETOF generations
LANGUAGE sql
AS $$
  UPDATE generations
  SET
    worker_id = p_worker_id,
    worker_heartbeat_at = NOW()
  WHERE id IN (
    SELECT id FROM generations
    WHERE status = ANY(p_statuses)
      AND (worker_id IS NULL OR worker_heartbeat_at < p_stale_threshold)
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED  -- Critical: prevents race conditions between workers
  )
  RETURNING *;
$$;

-- Index for worker polling (fast queued job lookup)
CREATE INDEX IF NOT EXISTS idx_generations_worker_queue
  ON generations (status, created_at ASC)
  WHERE status IN ('queued', 'queued_final');

-- Index for stale job recovery
CREATE INDEX IF NOT EXISTS idx_generations_stale_worker
  ON generations (worker_heartbeat_at)
  WHERE status IN ('running_preview', 'running_final')
    AND worker_id IS NOT NULL;

-- Index for concurrency counting (active jobs per workspace/tool)
CREATE INDEX IF NOT EXISTS idx_generations_active
  ON generations (workspace_id, type)
  WHERE status IN ('queued', 'running_preview', 'queued_final', 'running_final');

-- Count active generations function (if not exists)
CREATE OR REPLACE FUNCTION count_active_generations(
  p_workspace_id UUID,
  p_tool_type TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INT FROM generations
  WHERE workspace_id = p_workspace_id
    AND status IN ('queued', 'running_preview', 'queued_final', 'running_final')
    AND (p_tool_type IS NULL OR type = p_tool_type);
$$;
