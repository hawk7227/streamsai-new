import type { MediaProvider, ProviderCapabilities, ProviderLimits, GenerationParams, GenerationResult } from '@/lib/types';

export class ElevenLabsStandardProvider implements MediaProvider {
  readonly name = 'elevenlabs-standard';
  readonly toolType = 'voice' as const;

  readonly capabilities: ProviderCapabilities = {
    preview: true, final: true, batchCount: 1, webhooks: false, streaming: true,
    nativeAudio: true, maxDuration: 600, maxResolution: null,
    supportedAspectRatios: [], supportedStyles: [],
  };

  readonly limits: ProviderLimits = { maxConcurrent: 5, requestsPerMinute: 20 };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const start = Date.now();
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return { success: false, error: { code: 'NO_API_KEY', message: 'ELEVENLABS_API_KEY not set', retryable: false } };

    const voiceId = params.voiceId ?? 'pNInz6obpgDQGcFmaJgB'; // Adam default
    const modelId = params.quality === 'preview' ? 'eleven_flash_v2_5' : 'eleven_multilingual_v2';

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
        body: JSON.stringify({
          text: params.prompt,
          model_id: modelId,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errMsg = (err.detail as Record<string, string>)?.message ?? `HTTP ${response.status}`;
        return { success: false, error: { code: `HTTP_${response.status}`, message: errMsg, retryable: response.status === 429 || response.status >= 500 } };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const costCents = Math.ceil(params.prompt.length / 1000) * (params.quality === 'preview' ? 2 : 5);

      return {
        success: true, resultBase64: buffer.toString('base64'), format: 'mp3',
        durationMs: Date.now() - start, costCents,
        metadata: { model: modelId, voiceId, characters: params.prompt.length },
      };
    } catch (err) {
      return { success: false, error: { code: 'NETWORK', message: err instanceof Error ? err.message : 'Unknown', retryable: true } };
    }
  }
}
