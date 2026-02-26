// =============================================================================
// StreamsAI — Core Type Contracts (v3 — with new tool types + automations)
// =============================================================================

export type ToolType = 'image' | 'video' | 'voice' | 'script' | 'image_to_video' | 'video_to_video' | 'avatar' | 'edit';

export type QualityTier = 'standard' | 'premium' | 'ultra';

export type GenerationStatus =
  | 'queued' | 'running_preview' | 'preview_ready'
  | 'queued_final' | 'running_final' | 'final_ready'
  | 'failed' | 'cancelled';

export type BatchMode = 'single' | 'multi_provider' | 'bulk' | 'multi_both';
export type BatchStatus = 'in_progress' | 'all_previews_ready' | 'completed' | 'partial_failure';
export type WorkspaceTier = 'free' | 'pro' | 'enterprise';
export type SignupSource = 'platform' | 'videoGen' | 'imageGen' | 'voiceGen' | 'scriptGen';
export type PipelineExecutionMode = 'manual' | 'hybrid' | 'automatic';
export type PipelineStatus = 'draft' | 'active' | 'archived';
export type PipelineRunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
export type PipelineStepStatus = 'pending' | 'ai-generating' | 'awaiting-approval' | 'processing' | 'completed' | 'failed' | 'skipped';
export type StepType = 'script' | 'voice' | 'image' | 'video' | 'image_to_video' | 'video_to_video' | 'avatar' | 'edit' | 'export';
export type GenerateStep = 'configure' | 'preview' | 'compare' | 'finalize';

// Generation
export interface Generation {
  id: string;
  batch_id: string | null;
  workspace_id: string;
  user_id: string;
  type: ToolType;
  provider: string;
  quality_tier: QualityTier;
  prompt: string;
  negative_prompt: string | null;
  aspect_ratio: string | null;
  duration: number | null;
  resolution: string | null;
  style: string | null;
  voice_id: string | null;
  language: string | null;
  reference_image_url: string | null;
  reference_video_url: string | null;
  reference_audio_url: string | null;
  overlay_config: Record<string, unknown> | null;
  status: GenerationStatus;
  progress: number;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  preview_url: string | null;
  final_url: string | null;
  preview_metadata: Record<string, unknown> | null;
  final_metadata: Record<string, unknown> | null;
  preview_cost_credits: number;
  final_cost_credits: number;
  cost_cents: number;
  worker_id: string | null;
  worker_heartbeat_at: string | null;
  external_job_id: string | null;
  created_at: string;
  started_at: string | null;
  preview_completed_at: string | null;
  final_requested_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface GenerationBatch {
  id: string; workspace_id: string; user_id: string; mode: BatchMode;
  prompt: string | null; prompts: string[] | null; quality_tiers: QualityTier[];
  total_generations: number; status: BatchStatus; created_at: string; updated_at: string;
}

// Provider
export interface ProviderCapabilities {
  formats: string[];
  webhooks: boolean;
  acceptsReferenceImage?: boolean;
  acceptsReferenceVideo?: boolean;
  acceptsReferenceAudio?: boolean;
}

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
  referenceImageUrl?: string;
  referenceVideoUrl?: string;
  referenceAudioUrl?: string;
  overlayConfig?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GenerationResult {
  success: boolean;
  externalJobId?: string;
  resultUrl?: string;
  resultBase64?: string;
  format?: string;
  durationMs?: number;
  costCents?: number;
  metadata?: Record<string, unknown>;
  error?: { code: string; message: string; retryable: boolean };
}

export interface ProviderStatusResult {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; resultUrl?: string; error?: string;
}

export interface MediaProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  generate(params: GenerationParams): Promise<GenerationResult>;
  pollStatus?(externalJobId: string): Promise<ProviderStatusResult>;
  downloadResult?(externalJobId: string): Promise<Buffer>;
}

export interface ProviderMapping {
  id: string; tool_type: ToolType; quality_tier: QualityTier; provider_key: string;
  display_name: string; config: Record<string, unknown>;
  preview_cost_credits: number; final_cost_credits: number;
  is_active: boolean; priority: number; max_concurrent: number; requests_per_minute: number;
  created_at: string; updated_at: string;
}

// Workspace
export interface Workspace {
  id: string; user_id: string; name: string; tier: WorkspaceTier;
  enabled_tools: ToolType[]; signup_source: SignupSource; created_at: string; updated_at: string;
}

export interface WorkspaceLimits {
  workspace_id: string; tier: WorkspaceTier;
  max_concurrent_image: number; max_concurrent_video: number;
  max_concurrent_voice: number; max_concurrent_script: number; max_concurrent_total: number;
  credits_balance: number; credits_monthly_allowance: number; credits_reset_at: string;
}

// Pipeline
export interface PipelineVariable {
  name: string; type: 'text' | 'number' | 'select' | 'file';
  label: string; defaultValue: string; required: boolean;
  options?: string[]; description?: string;
}

export interface PipelineStepConfig {
  step_type: StepType; name: string; provider_tier: QualityTier;
  prompt_template: string; config: Record<string, unknown>;
  require_approval_even_in_auto: boolean;
}

export interface Pipeline {
  id: string; workspace_id: string; user_id: string; name: string;
  description: string | null; execution_mode: PipelineExecutionMode;
  steps: PipelineStepConfig[]; variables: PipelineVariable[];
  ai_guidelines: { tone?: string; audience?: string; brand_voice?: string; restrictions?: string[] };
  auto_settings: { pause_on_error: boolean; max_budget_credits: number; retry_attempts: number; require_approval_steps: number[] };
  status: PipelineStatus; created_at: string; updated_at: string;
}

export interface PipelineRun {
  id: string; pipeline_id: string; workspace_id: string; user_id: string;
  status: PipelineRunStatus; current_step_index: number;
  variable_values: Record<string, string>; total_cost_credits: number;
  started_at: string | null; completed_at: string | null; created_at: string;
}

export interface PipelineStepResult {
  id: string; run_id: string; step_index: number; step_type: StepType;
  status: PipelineStepStatus; output: Record<string, unknown> | null;
  cost_credits: number; error: string | null; duration_ms: number | null;
  generation_id: string | null; created_at: string; updated_at: string;
}

// Automation
export type AutomationTriggerType = 'schedule' | 'webhook' | 'credit_balance' | 'pipeline_complete';

export interface Automation {
  id: string; workspace_id: string; user_id: string; name: string;
  description: string | null; is_active: boolean;
  trigger_type: AutomationTriggerType;
  trigger_config: { cron?: string; webhook_path?: string; threshold?: number; pipeline_id?: string; quality_score_min?: number };
  action_config: { tool_type?: ToolType; quality_tier?: QualityTier; prompt_template?: string; count?: number; auto_finalize?: boolean; auto_finalize_threshold?: number; pause_all?: boolean; notify_email?: boolean };
  last_run_at: string | null; run_count: number; total_cost_credits: number;
  created_at: string; updated_at: string;
}

export interface AutomationRun {
  id: string; automation_id: string; workspace_id: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  trigger_event: string; generations_created: number; cost_credits: number;
  error: string | null; started_at: string; completed_at: string | null; created_at: string;
}

// White Label
export interface WhiteLabelConfig {
  id: string; workspace_id: string; brand_name: string; logo_url: string | null;
  primary_color: string; custom_domain: string | null; enabled_tools: ToolType[];
  landing_page_config: Record<string, unknown>; custom_api_keys: Record<string, unknown> | null;
  use_platform_keys: boolean; markup_percentage: number; created_at: string; updated_at: string;
}

// API Request/Response
export interface CreateGenerationRequest {
  type: ToolType; prompt: string; negative_prompt?: string; quality_tiers: QualityTier[];
  aspect_ratio?: string; duration?: number; resolution?: string; style?: string;
  voice_id?: string; language?: string; batch_mode?: BatchMode; prompts?: string[];
  reference_image_url?: string; reference_video_url?: string; reference_audio_url?: string;
  overlay_config?: Record<string, unknown>; metadata?: Record<string, unknown>;
}

export interface CreateGenerationResponse {
  batch_id: string | null;
  generations: Array<{ id: string; type: ToolType; quality_tier: QualityTier; status: GenerationStatus; preview_cost_credits: number; estimated_seconds: number }>;
  total_preview_cost: number; remaining_credits: number;
}

export interface FinalizeResponse { id: string; status: GenerationStatus; final_cost_credits: number; remaining_credits: number; }
export type GetGenerationResponse = Generation;
export interface ListGenerationsResponse { generations: Generation[]; total: number; has_more: boolean; }

export interface GenerationJobData {
  generationId: string; workspaceId: string; userId: string; type: ToolType;
  providerKey: string; quality: 'preview' | 'final'; params: GenerationParams;
}

export interface GenerationRealtimePayload {
  id: string; status: GenerationStatus; progress: number;
  preview_url: string | null; final_url: string | null; error_message: string | null;
}

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
export interface WorkspaceMember { id: string; workspace_id: string; user_id: string; role: WorkspaceRole; invited_by: string | null; invited_email: string | null; accepted_at: string | null; created_at: string; updated_at: string; }
export interface ToolConfig { id: string; workspace_id: string; tool_type: ToolType; is_enabled: boolean; default_quality_tier: QualityTier; default_params: Record<string, unknown>; usage_count: number; last_used_at: string | null; created_at: string; updated_at: string; }
export type CreditTransactionType = 'deduction_preview' | 'deduction_final' | 'refund_preview' | 'refund_final' | 'purchase' | 'monthly_allowance' | 'admin_adjustment' | 'promo_credit';
export interface CreditTransaction { id: string; workspace_id: string; user_id: string | null; generation_id: string | null; type: CreditTransactionType; amount: number; balance_before: number; balance_after: number; description: string | null; metadata: Record<string, unknown>; created_at: string; }
