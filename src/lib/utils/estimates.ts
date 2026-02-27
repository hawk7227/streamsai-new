import type { ToolType, QualityTier } from '@/lib/types';

const ESTIMATES: Record<ToolType, Record<QualityTier, number>> = {
  image:  { standard: 5,  premium: 15, ultra: 20 },
  video:  { standard: 60, premium: 120, ultra: 180 },
  voice:  { standard: 8,  premium: 12, ultra: 15 },
  script: { standard: 3,  premium: 5,  ultra: 8 },
  image_to_video: { standard: 45, premium: 90, ultra: 150 },
  video_to_video: { standard: 50, premium: 100, ultra: 160 },
  avatar: { standard: 40, premium: 80, ultra: 140 },
  edit:   { standard: 20, premium: 40, ultra: 60 },
};

export function estimateSeconds(toolType: ToolType, tier: QualityTier): number {
  return ESTIMATES[toolType]?.[tier] ?? 30;
}
