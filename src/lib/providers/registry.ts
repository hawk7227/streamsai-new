import { createClient } from '@supabase/supabase-js';
import type { ToolType, QualityTier, ProviderMapping, MediaProvider } from '@/lib/types';
import { OpenAIGPTImageMiniProvider } from './image/openai-gpt-image-1-mini';
import { OpenAIGPTImage1Provider } from './image/openai-gpt-image-1';
import { OpenAIGPTImage15Provider } from './image/openai-gpt-image-1.5';
import { OpenAISora2Provider } from './video/openai-sora-2';
import { OpenAISora2ProProvider } from './video/openai-sora-2-pro';
import { GoogleVeo31Provider } from './video/google-veo-3.1';
import { OpenAITTSProvider } from './voice/openai-tts';
import { ElevenLabsStandardProvider } from './voice/elevenlabs-standard';
import { ElevenLabsTurboProvider } from './voice/elevenlabs-turbo';
import { AnthropicHaikuProvider } from './script/anthropic-haiku';
import { AnthropicSonnetProvider } from './script/anthropic-sonnet';
import { AnthropicOpusProvider } from './script/anthropic-opus';
// New tool type providers
import { KlingImageToVideoProvider } from './image-to-video/kling-i2v';
import { KlingVideoToVideoProvider } from './video-to-video/kling-v2v';
import { KlingAvatarProvider } from './avatar/kling-avatar';
import { ShotstackEditProvider } from './edit/shotstack-edit';

const ADAPTERS: Record<string, MediaProvider> = {
  // Original 12
  'openai-gpt-image-1-mini': new OpenAIGPTImageMiniProvider(),
  'openai-gpt-image-1': new OpenAIGPTImage1Provider(),
  'openai-gpt-image-1.5': new OpenAIGPTImage15Provider(),
  'openai-sora-2': new OpenAISora2Provider(),
  'openai-sora-2-pro': new OpenAISora2ProProvider(),
  'google-veo-3.1': new GoogleVeo31Provider(),
  'openai-tts': new OpenAITTSProvider(),
  'elevenlabs-standard': new ElevenLabsStandardProvider(),
  'elevenlabs-turbo': new ElevenLabsTurboProvider(),
  'anthropic-haiku': new AnthropicHaikuProvider(),
  'anthropic-sonnet': new AnthropicSonnetProvider(),
  'anthropic-opus': new AnthropicOpusProvider(),
  // New 4
  'kling-i2v': new KlingImageToVideoProvider(),
  'kling-v2v': new KlingVideoToVideoProvider(),
  'kling-avatar': new KlingAvatarProvider(),
  'shotstack-edit': new ShotstackEditProvider(),
};

export function getAdapter(key: string): MediaProvider | null { return ADAPTERS[key] ?? null; }

export async function resolveProvider(toolType: ToolType, qualityTier: QualityTier): Promise<{ adapter: MediaProvider; mapping: ProviderMapping } | null> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from('provider_mappings').select('*').eq('tool_type', toolType).eq('quality_tier', qualityTier).eq('is_active', true).order('priority', { ascending: true }).limit(1).single();
  if (error || !data) return null;
  const mapping = data as ProviderMapping;
  const adapter = ADAPTERS[mapping.provider_key];
  if (!adapter) return null;
  return { adapter, mapping };
}

// Batch resolve — single DB query for multiple tiers (fixes N+1 sequential bottleneck)
export async function resolveProvidersBatch(
  toolType: ToolType,
  qualityTiers: QualityTier[],
): Promise<Map<QualityTier, { adapter: MediaProvider; mapping: ProviderMapping }>> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase
    .from('provider_mappings')
    .select('*')
    .eq('tool_type', toolType)
    .in('quality_tier', qualityTiers)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  const results = new Map<QualityTier, { adapter: MediaProvider; mapping: ProviderMapping }>();
  if (error || !data) return results;

  // Pick best (lowest priority number) per tier
  for (const tier of qualityTiers) {
    const mapping = (data as ProviderMapping[]).find(m => m.quality_tier === tier);
    if (!mapping) continue;
    const adapter = ADAPTERS[mapping.provider_key];
    if (!adapter) continue;
    results.set(tier, { adapter, mapping });
  }
  return results;
}

// Direct adapter lookup by provider_key (used by worker)
export function getAdapterByKey(providerKey: string): { adapter: MediaProvider; mapping: ProviderMapping } | null {
  const adapter = ADAPTERS[providerKey];
  if (!adapter) return null;
  // Return with a minimal mapping — worker already has the full generation row
  return {
    adapter,
    mapping: {
      id: '', tool_type: 'image' as ToolType, quality_tier: 'standard' as QualityTier,
      provider_key: providerKey, display_name: adapter.name,
      preview_cost_credits: 0, final_cost_credits: 0,
      is_active: true, priority: 1, max_concurrent: 5, requests_per_minute: 30,
      config: {},
    },
  };
}

// Get raw adapter (simplest form)
export function getAdapter(providerKey: string): MediaProvider | null {
  return ADAPTERS[providerKey] || null;
}
