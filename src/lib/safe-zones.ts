import type { PlatformSafeZone, OverlayElement, SafeZoneComplianceResult } from '@/lib/types';

export const PLATFORM_SAFE_ZONES: Record<string, PlatformSafeZone> = {
  tiktok: {
    id: 'tiktok', name: 'TikTok',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 960, height: 1390 },
    organic: { top: 108, bottom: 320, left: 60, right: 120 },
    ads: { top: 150, bottom: 480, left: 60, right: 120 },
    maxDuration: '10min', codec: 'H.264', fps: '30/60',
    notes: 'Shop ads: bottom 30% dead. Caption length expands bottom.',
  },
  ig_reels: {
    id: 'ig_reels', name: 'IG Reels',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 996, height: 1400 },
    organic: { top: 210, bottom: 250, left: 42, right: 42 },
    ads: { top: 210, bottom: 390, left: 42, right: 42 },
    maxDuration: '90s', codec: 'H.264', fps: '30',
    notes: 'Grid thumbnail crops to 1080x1440. Sponsored +80px bottom.',
  },
  ig_stories: {
    id: 'ig_stories', name: 'IG Stories',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 1080, height: 1420 },
    organic: { top: 250, bottom: 250, left: 0, right: 0 },
    ads: { top: 250, bottom: 340, left: 0, right: 0 },
    maxDuration: '60s', codec: 'H.264', fps: '30',
    notes: '24h ephemeral. Stickers need 300px margin all edges.',
  },
  yt_shorts: {
    id: 'yt_shorts', name: 'YT Shorts',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 900, height: 1160 },
    organic: { top: 380, bottom: 300, left: 60, right: 120 },
    ads: { top: 380, bottom: 450, left: 60, right: 150 },
    maxDuration: '3min', codec: 'H.264', fps: '30/60',
    notes: 'Cleanest UI. Subscribe bottom-left 180x80. Desc expanded +60.',
  },
  fb_reels: {
    id: 'fb_reels', name: 'FB Reels',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 1010, height: 1280 },
    organic: { top: 220, bottom: 350, left: 35, right: 35 },
    ads: { top: 270, bottom: 670, left: 35, right: 35 },
    maxDuration: '90s', codec: 'H.264', fps: '30',
    notes: 'Cross-posts from IG. Ad bottom 35% due to product cards.',
  },
  fb_stories: {
    id: 'fb_stories', name: 'FB Stories',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 1080, height: 1680 },
    organic: { top: 250, bottom: 250, left: 0, right: 0 },
    ads: { top: 270, bottom: 380, left: 0, right: 0 },
    maxDuration: '20s', codec: 'H.264', fps: '30',
    notes: '24h ephemeral. Splits >10s into cards.',
  },
  snapchat: {
    id: 'snapchat', name: 'Snapchat',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 1080, height: 1570 },
    organic: { top: 175, bottom: 175, left: 0, right: 0 },
    ads: { top: 175, bottom: 300, left: 0, right: 0 },
    maxDuration: '60s', codec: 'H.264', fps: '30',
    notes: 'Ephemeral. AR Lens overlays are dynamic.',
  },
  pinterest: {
    id: 'pinterest', name: 'Pinterest',
    canvas: { width: 1000, height: 1500 }, ratio: '2:3',
    safeZone: { width: 1000, height: 1200 },
    organic: { top: 150, bottom: 150, left: 0, right: 0 },
    ads: { top: 150, bottom: 200, left: 0, right: 0 },
    maxDuration: '15min', codec: 'H.264', fps: '30',
    notes: '2:3 vertical, not 9:16. Center middle 80% for text.',
  },
  linkedin: {
    id: 'linkedin', name: 'LinkedIn',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 1080, height: 1600 },
    organic: { top: 160, bottom: 160, left: 0, right: 0 },
    ads: { top: 160, bottom: 200, left: 0, right: 0 },
    maxDuration: '10min', codec: 'H.264', fps: '30',
    notes: 'Also supports 16:9 landscape. Feed preview crops to 4:5.',
  },
  x_twitter: {
    id: 'x_twitter', name: 'X/Twitter',
    canvas: { width: 1080, height: 1920 }, ratio: '9:16',
    safeZone: { width: 1080, height: 1600 },
    organic: { top: 160, bottom: 160, left: 0, right: 0 },
    ads: { top: 160, bottom: 200, left: 0, right: 0 },
    maxDuration: '140s', codec: 'H.264', fps: '30/60',
    notes: 'Feed preview crops to 16:9. Center content in middle third.',
  },
  yt_standard: {
    id: 'yt_standard', name: 'YT 16:9',
    canvas: { width: 1920, height: 1080 }, ratio: '16:9',
    safeZone: { width: 1720, height: 920 },
    organic: { top: 80, bottom: 80, left: 100, right: 100 },
    ads: { top: 80, bottom: 120, left: 100, right: 100 },
    maxDuration: '12hr', codec: 'H.264/H.265', fps: '24/30/60',
    notes: 'Landscape. Title safe: 1546x423px center.',
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORM_SAFE_ZONES);

export function isInSafeZone(
  platform: PlatformSafeZone,
  mode: 'organic' | 'ads',
  element: { x: number; y: number; width: number; height: number }
): { safe: boolean; violations: string[] } {
  const margins = mode === 'ads' ? platform.ads : platform.organic;
  const violations: string[] = [];
  if (element.y < margins.top) violations.push('Top overflow: y=' + element.y + ', zone starts y=' + margins.top);
  if (element.y + element.height > platform.canvas.height - margins.bottom) violations.push('Bottom overflow');
  if (element.x < margins.left) violations.push('Left overflow');
  if (element.x + element.width > platform.canvas.width - margins.right) violations.push('Right overflow');
  return { safe: violations.length === 0, violations };
}

export function validateSafeZoneCompliance(
  elements: OverlayElement[],
  targetPlatformIds: string[],
  adMode: boolean
): SafeZoneComplianceResult {
  const mode = adMode ? 'ads' : 'organic';
  const platforms: SafeZoneComplianceResult['platforms'] = {};
  let allPass = true;
  for (const id of targetPlatformIds) {
    const platform = PLATFORM_SAFE_ZONES[id];
    if (!platform) { platforms[id] = { pass: false, violations: ['Unknown platform: ' + id] }; allPass = false; continue; }
    const violations: string[] = [];
    for (const el of elements) {
      const result = isInSafeZone(platform, mode, el);
      if (!result.safe) { for (const v of result.violations) violations.push('[' + el.type + ':' + el.label + '] ' + v); }
    }
    const pass = violations.length === 0;
    if (!pass) allPass = false;
    platforms[id] = { pass, violations };
  }
  return { allPass, platforms };
}

export function getIntersectionSafeZone(
  platformIds: string[],
  mode: 'organic' | 'ads'
): { top: number; bottom: number; left: number; right: number } {
  let top = 0, bottom = 0, left = 0, right = 0;
  for (const id of platformIds) {
    const platform = PLATFORM_SAFE_ZONES[id];
    if (!platform) continue;
    const margins = mode === 'ads' ? platform.ads : platform.organic;
    top = Math.max(top, margins.top);
    bottom = Math.max(bottom, margins.bottom);
    left = Math.max(left, margins.left);
    right = Math.max(right, margins.right);
  }
  return { top, bottom, left, right };
}
