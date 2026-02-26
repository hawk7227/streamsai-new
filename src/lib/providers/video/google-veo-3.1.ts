import type { MediaProvider, ProviderCapabilities, ProviderLimits, GenerationParams, GenerationResult, ProviderStatusResult } from '@/lib/types';

export class GoogleVeo31Provider implements MediaProvider {
  readonly name = 'google-veo-3.1';
  readonly toolType = 'video' as const;

  readonly capabilities: ProviderCapabilities = {
    preview: true, final: true, batchCount: 4, webhooks: false, streaming: false,
    nativeAudio: true, maxDuration: 8, maxResolution: '4k',
    supportedAspectRatios: ['16:9', '9:16'],
    supportedStyles: [],
  };

  readonly limits: ProviderLimits = { maxConcurrent: 3, requestsPerMinute: 5 };

  private getModel(quality: 'preview' | 'final'): string {
    return quality === 'preview' ? 'veo-3.1-fast-generate-preview' : 'veo-3.1-generate-preview';
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const start = Date.now();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { success: false, error: { code: 'NO_API_KEY', message: 'GOOGLE_AI_API_KEY not set', retryable: false } };

    const model = this.getModel(params.quality);
    const duration = params.duration ?? 8;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateVideos?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: params.prompt,
            config: {
              aspectRatio: params.aspectRatio ?? '16:9',
              numberOfVideos: 1,
              durationSeconds: duration,
              personGeneration: 'allow_all',
            },
          }),
          signal: AbortSignal.timeout(30_000),
        },
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as Record<string, unknown>;
        const errMsg = (err.error as Record<string, string>)?.message ?? `HTTP ${response.status}`;
        return { success: false, error: { code: `HTTP_${response.status}`, message: errMsg, retryable: response.status === 429 || response.status >= 500 } };
      }

      const data = await response.json() as { name: string };
      const costPerSec = params.quality === 'preview' ? 15 : 40;

      return {
        success: true, externalJobId: data.name, format: 'mp4',
        durationMs: Date.now() - start, costCents: costPerSec * duration,
        metadata: { model, duration, aspectRatio: params.aspectRatio ?? '16:9' },
      };
    } catch (err) {
      return { success: false, error: { code: 'NETWORK', message: err instanceof Error ? err.message : 'Unknown', retryable: true } };
    }
  }

  async pollStatus(operationName: string): Promise<ProviderStatusResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { status: 'failed', error: 'No API key' };

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
        { signal: AbortSignal.timeout(15_000) },
      );
      if (!response.ok) return { status: 'failed', error: `HTTP ${response.status}` };

      const data = await response.json() as { done?: boolean; error?: { message: string }; response?: { generatedVideos: Array<{ video: { uri: string } }> } };

      if (data.error) return { status: 'failed', error: data.error.message };
      if (data.done && data.response?.generatedVideos?.[0]) {
        return { status: 'completed', progress: 100, resultUrl: data.response.generatedVideos[0].video.uri };
      }
      return { status: 'processing', progress: 50 };
    } catch { return { status: 'processing' }; }
  }

  async downloadResult(operationName: string): Promise<Buffer> {
    const status = await this.pollStatus(operationName);
    if (status.status !== 'completed' || !status.resultUrl) throw new Error('Video not ready');
    const apiKey = process.env.GOOGLE_AI_API_KEY!;
    const url = status.resultUrl.includes('?') ? `${status.resultUrl}&key=${apiKey}` : `${status.resultUrl}?key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(300_000) });
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}
