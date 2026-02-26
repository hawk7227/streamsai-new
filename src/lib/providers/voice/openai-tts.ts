import type { MediaProvider, ProviderCapabilities, ProviderLimits, GenerationParams, GenerationResult } from '@/lib/types';

export class OpenAITTSProvider implements MediaProvider {
  readonly name = 'openai-tts';
  readonly toolType = 'voice' as const;

  readonly capabilities: ProviderCapabilities = {
    preview: true, final: true, batchCount: 1, webhooks: false, streaming: true,
    nativeAudio: true, maxDuration: 600, maxResolution: null,
    supportedAspectRatios: [],
    supportedStyles: [],
  };

  readonly limits: ProviderLimits = { maxConcurrent: 10, requestsPerMinute: 50 };

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const start = Date.now();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { success: false, error: { code: 'NO_API_KEY', message: 'OPENAI_API_KEY not set', retryable: false } };

    const model = params.quality === 'preview' ? 'tts-1' : 'tts-1-hd';
    const voice = params.voiceId ?? 'alloy';

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, input: params.prompt, voice, response_format: 'mp3', speed: 1.0 }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errMsg = (err.error as Record<string, string>)?.message ?? `HTTP ${response.status}`;
        return { success: false, error: { code: `HTTP_${response.status}`, message: errMsg, retryable: response.status === 429 || response.status >= 500 } };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const costCents = Math.ceil(params.prompt.length / 1000) * (model === 'tts-1' ? 2 : 3);

      return {
        success: true, resultBase64: buffer.toString('base64'), format: 'mp3',
        durationMs: Date.now() - start, costCents,
        metadata: { model, voice, characters: params.prompt.length },
      };
    } catch (err) {
      return { success: false, error: { code: 'NETWORK', message: err instanceof Error ? err.message : 'Unknown', retryable: true } };
    }
  }
}
