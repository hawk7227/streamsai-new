import type { ToolType, QualityTier } from '@/lib/types';

const ESTIMATES: Record<ToolType, Record<QualityTier, number>> = {
  image:  { standard: 5,  premium: 15, ultra: 20 },
  video:  { standard: 60, premium: 120, ultra: 180 },
  voice:  { standard: 8,  premium: 12, ultra: 15 },
  script: { standard: 3,  premium: 5,  ultra: 8 },
};

export function estimateSeconds(toolType: ToolType, tier: QualityTier): number {
  return ESTIMATES[toolType]?.[tier] ?? 30;
}
