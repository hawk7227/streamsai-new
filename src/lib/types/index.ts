// =============================================================================
// StreamsAI — Core Type Contracts
// Every provider adapter, API route, component, and worker builds against these.
// Change these = change everything downstream. Treat as sacred.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

export type ToolType = 'image' | 'video' | 'voice' | 'script';

export type QualityTier = 'standard' | 'premium' | 'ultra';

export type GenerationStatus =
  | 'queued'
  | 'running_preview'
  | 'preview_ready'
  | 'queued_final'
  | 'running_final'
  | 'final_ready'
  | 'failed'
  | 'cancelled';

export type BatchMode = 'single' | 'multi_provider' | 'bulk' | 'multi_both';

export type BatchStatus =
  | 'in_progress'
  | 'all_previews_ready'
  | 'completed'
  | 'partial_failure';

export type WorkspaceTier = 'free' | 'pro' | 'enterprise';

export type SignupSource =
  | 'platform'
  | 'videoGen'
  | 'imageGen'
  | 'voiceGen'
  | 'scriptGen';

export type PipelineExecutionMode = 'manual' | 'hybrid' | 'automatic';

export type PipelineStatus =
  | 'draft'
  | 'active'
  | 'archived';

export type PipelineRunStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PipelineStepStatus =
  | 'pending'
  | 'ai-generating'
  | 'awaiting-approval'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped';

export type StepType = 'script' | 'voice' | 'image' | 'video' | 'edit' | 'export';

// ---------------------------------------------------------------------------
// Generation Engine Types
// ---------------------------------------------------------------------------

/** Row in the `generations` table */
export interface Generation {
  id: string;
  batch_id: string | null;
  workspace_id: string;
  user_id: string;
  type: ToolType;
  provider: string; // internal provider key, e.g. 'openai-sora-2'
  quality_tier: QualityTier;
  prompt: string;
  negative_prompt: string | null;

  // Media-specific params (nullable — depends on tool type)
  aspect_ratio: string | null; // '16:9', '9:16', '1:1'
  duration: number | null; // seconds (video/voice)
  resolution: string | null; // '720p', '1080p', '4k'
  style: string | null;
  voice_id: string | null; // voice tool
  language: string | null;

  // Status & Progress
  status: GenerationStatus;
  progress: number; // 0-100
  error_message: string | null;
  retry_count: number;
  max_retries: number;

  // Results
  preview_url: string | null;
  final_url: string | null;
  preview_metadata: Record<string, unknown> | null; // dimensions, duration, format, etc.
  final_metadata: Record<string, unknown> | null;

  // Cost
  preview_cost_credits: number;
  final_cost_credits: number;
  cost_cents: number; // actual provider cost in cents

  // Worker tracking
  worker_id: string | null;
  worker_heartbeat_at: string | null;

  // External provider tracking
  external_job_id: string | null; // e.g. OpenAI video job ID

  // Timestamps
  created_at: string;
  started_at: string | null;
  preview_completed_at: string | null;
  final_requested_at: string | null;
  completed_at: string | null;

  // Extensible
  metadata: Record<string, unknown>;
}

/** Row in the `generation_batches` table */
export interface GenerationBatch {
  id: string;
  workspace_id: string;
  user_id: string;
  mode: BatchMode;
  prompt: string | null;
  prompts: string[] | null; // for bulk mode
  quality_tiers: QualityTier[];
  total_generations: number;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Provider Abstraction
// ---------------------------------------------------------------------------

/** What a provider adapter must declare about itself */
export interface ProviderCapabilities {
  preview: boolean;
  final: boolean;
  batchCount: number; // max images/videos per single API call
  webhooks: boolean; // supports async webhook notification
  streaming: boolean; // supports streaming response
  nativeAudio: boolean; // video provider generates audio
  maxDuration: number | null; // max seconds (video/voice)
  maxResolution: string | null; // e.g. '4k', '1080p'
  supportedAspectRatios: string[];
  supportedStyles: string[];
}

export interface ProviderLimits {
  maxConcurrent: number;
  requestsPerMinute: number;
}

/** Parameters passed to a provider's generate() method */
export interface GenerationParams {
  generationId: string;
  prompt: string;
  negativePrompt?: string;
  quality: 'preview' | 'final';
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  style?: string;
  voiceId?: string;
  language?: string;
  metadata?: Record<string, unknown>;
}

/** What a provider's generate() returns */
export interface GenerationResult {
  success: boolean;
  externalJobId?: string; // for async providers (video)
  resultUrl?: string; // for sync providers (image)
  resultBase64?: string; // for providers returning base64
  format?: string; // 'mp4', 'png', 'mp3', 'webp'
  durationMs?: number; // how long generation took
  costCents?: number; // actual cost
  metadata?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

/** Status result from polling an async provider */
export interface ProviderStatusResult {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  resultUrl?: string;
  error?: string;
}

/** The interface every provider adapter must implement */
export interface MediaProvider {
  readonly name: string;
  readonly toolType: ToolType;
  readonly capabilities: ProviderCapabilities;
  readonly limits: ProviderLimits;

  generate(params: GenerationParams): Promise<GenerationResult>;
  pollStatus?(externalJobId: string): Promise<ProviderStatusResult>;
  downloadResult?(externalJobId: string): Promise<Buffer>;
}

/** Row in the `provider_mappings` table */
export interface ProviderMapping {
  id: string;
  tool_type: ToolType;
  quality_tier: QualityTier;
  provider_key: string; // e.g. 'openai-sora-2'
  display_name: string; // e.g. 'Standard Video' (user-facing)
  config: Record<string, unknown>; // model params, resolution, voice_id
  preview_cost_credits: number;
  final_cost_credits: number;
  is_active: boolean;
  priority: number; // for A/B testing (lower = preferred)
  max_concurrent: number;
  requests_per_minute: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Workspace & Credits
// ---------------------------------------------------------------------------

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  tier: WorkspaceTier;
  enabled_tools: ToolType[];
  signup_source: SignupSource;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceLimits {
  workspace_id: string;
  tier: WorkspaceTier;
  max_concurrent_image: number;
  max_concurrent_video: number;
  max_concurrent_voice: number;
  max_concurrent_script: number;
  max_concurrent_total: number;
  credits_balance: number;
  credits_monthly_allowance: number;
  credits_reset_at: string;
}

// ---------------------------------------------------------------------------
// Pipeline Types
// ---------------------------------------------------------------------------

export interface PipelineStepConfig {
  step_type: StepType;
  name: string;
  provider_tier: QualityTier;
  prompt_template: string; // can include {{variables}} and {{step_N_output}}
  config: Record<string, unknown>;
  require_approval_even_in_auto: boolean;
}

export interface Pipeline {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  execution_mode: PipelineExecutionMode;
  steps: PipelineStepConfig[];
  variables: Record<string, string>; // user-defined variables
  ai_guidelines: {
    tone?: string;
    audience?: string;
    brand_voice?: string;
    restrictions?: string[];
  };
  auto_settings: {
    pause_on_error: boolean;
    max_budget_credits: number;
    retry_attempts: number;
    require_approval_steps: number[]; // step indices
  };
  status: PipelineStatus;
  created_at: string;
  updated_at: string;
}

export interface PipelineRun {
  id: string;
  pipeline_id: string;
  workspace_id: string;
  user_id: string;
  status: PipelineRunStatus;
  current_step_index: number;
  variable_values: Record<string, string>;
  total_cost_credits: number;
  inngest_run_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PipelineStepResult {
  id: string;
  run_id: string;
  step_index: number;
  step_type: StepType;
  status: PipelineStepStatus;
  ai_generated_input: Record<string, unknown> | null;
  user_approved_input: Record<string, unknown> | null;
  provider: string | null;
  output: Record<string, unknown> | null;
  cost_credits: number;
  error: string | null;
  duration_ms: number | null;
  generation_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// White Label
// ---------------------------------------------------------------------------

export interface WhiteLabelConfig {
  id: string;
  workspace_id: string;
  brand_name: string;
  logo_url: string | null;
  primary_color: string;
  custom_domain: string | null;
  enabled_tools: ToolType[];
  landing_page_config: Record<string, unknown>;
  custom_api_keys: Record<string, unknown> | null; // encrypted
  use_platform_keys: boolean;
  markup_percentage: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API Request/Response Types
// ---------------------------------------------------------------------------

/** POST /api/generations — create generation(s) */
export interface CreateGenerationRequest {
  type: ToolType;
  prompt: string;
  negative_prompt?: string;
  quality_tiers: QualityTier[]; // generate across multiple tiers
  aspect_ratio?: string;
  duration?: number;
  resolution?: string;
  style?: string;
  voice_id?: string;
  language?: string;
  batch_mode?: BatchMode;
  prompts?: string[]; // for bulk mode
  metadata?: Record<string, unknown>;
}

export interface CreateGenerationResponse {
  batch_id: string | null;
  generations: Array<{
    id: string;
    type: ToolType;
    quality_tier: QualityTier;
    status: GenerationStatus;
    preview_cost_credits: number;
    estimated_seconds: number;
  }>;
  total_preview_cost: number;
  remaining_credits: number;
}

/** POST /api/generations/[id]/finalize */
export interface FinalizeResponse {
  id: string;
  status: GenerationStatus;
  final_cost_credits: number;
  remaining_credits: number;
}

/** GET /api/generations/[id] */
export type GetGenerationResponse = Generation;

/** GET /api/generations?workspace_id=X&status=Y */
export interface ListGenerationsResponse {
  generations: Generation[];
  total: number;
  has_more: boolean;
}

// ---------------------------------------------------------------------------
// Queue Job Types (BullMQ)
// ---------------------------------------------------------------------------

export interface GenerationJobData {
  generationId: string;
  workspaceId: string;
  userId: string;
  type: ToolType;
  providerKey: string;
  quality: 'preview' | 'final';
  params: GenerationParams;
}

export type QueueName =
  | 'image_preview'
  | 'image_final'
  | 'video_preview'
  | 'video_final'
  | 'voice_preview'
  | 'voice_final'
  | 'script_preview'
  | 'script_final';

// ---------------------------------------------------------------------------
// Realtime Event Types (Supabase)
// ---------------------------------------------------------------------------

export interface GenerationRealtimePayload {
  id: string;
  status: GenerationStatus;
  progress: number;
  preview_url: string | null;
  final_url: string | null;
  error_message: string | null;
}

// ---------------------------------------------------------------------------
// Workspace Members (multi-user, role-based)
// ---------------------------------------------------------------------------

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  invited_by: string | null;
  invited_email: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Tool Configs (per-workspace tool settings)
// ---------------------------------------------------------------------------

export interface ToolConfig {
  id: string;
  workspace_id: string;
  tool_type: ToolType;
  is_enabled: boolean;
  default_quality_tier: QualityTier;
  default_params: Record<string, unknown>;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Credit Transactions (audit log)
// ---------------------------------------------------------------------------

export type CreditTransactionType =
  | 'deduction_preview'
  | 'deduction_final'
  | 'refund_preview'
  | 'refund_final'
  | 'purchase'
  | 'monthly_allowance'
  | 'admin_adjustment'
  | 'promo_credit';

export interface CreditTransaction {
  id: string;
  workspace_id: string;
  user_id: string | null;
  generation_id: string | null;
  type: CreditTransactionType;
  amount: number; // positive = credit added, negative = deducted
  balance_before: number;
  balance_after: number;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
