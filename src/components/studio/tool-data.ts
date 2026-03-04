/** AI Media Studio tool definitions — codenames from mockup */

export type ToolCodename =
  | "PHOENIX"
  | "NOVA"
  | "TITAN"
  | "PRISM"
  | "FLUX"
  | "AURORA"
  | "ECHO"
  | "ORACLE"
  | "PULSE"
  | "FORGE";

export type ToolCategory = "video" | "image" | "audio" | "voice" | "sfx" | "3d";

export type VideoSubMode = "text_to_video" | "image_to_video" | "video_to_video" | "lip_sync";

export type ExecutionMode = "manual" | "hybrid" | "auto";

export type JobStatus = "done" | "running" | "queued" | "failed";

export type GateStage = "storyboard" | "animatic" | "single_scene" | "full_render";

export interface ToolDef {
  codename: ToolCodename;
  icon: string;
  label: string;
  description: string;
  cost: string;
  category: ToolCategory;
}

export interface CameraChip {
  id: string;
  label: string;
}

export interface PlatformSafeZone {
  platform: string;
  canvas: string;
  ratio: string;
  safe: string;
  top: string;
  bottom: string;
  left: string;
  right: string;
  maxDur: string;
}

export const TOOLS: ToolDef[] = [
  { codename: "PHOENIX", icon: "🎬", label: "PHOENIX", description: "Cinematic video from text/image", cost: "50¢/gen", category: "video" },
  { codename: "NOVA", icon: "🎬", label: "NOVA", description: "Fast video w/ motion control", cost: "25¢/gen", category: "video" },
  { codename: "TITAN", icon: "🎬", label: "TITAN", description: "Long-form video generation", cost: "30¢/gen", category: "video" },
  { codename: "PRISM", icon: "🖼️", label: "PRISM", description: "Photorealistic images (DALL-E 3)", cost: "8¢/gen", category: "image" },
  { codename: "FLUX", icon: "🖼️", label: "FLUX", description: "Fast images w/ fine control", cost: "3¢/gen", category: "image" },
  { codename: "AURORA", icon: "🖼️", label: "AURORA", description: "Premium artistic images", cost: "12¢/gen", category: "image" },
  { codename: "ECHO", icon: "🎵", label: "ECHO", description: "Music & songs from text", cost: "10¢/gen", category: "audio" },
  { codename: "ORACLE", icon: "🎙️", label: "ORACLE", description: "TTS w/ voice cloning", cost: "3¢/gen", category: "voice" },
  { codename: "PULSE", icon: "🔊", label: "PULSE", description: "Sound effects & ambient", cost: "5¢/gen", category: "sfx" },
  { codename: "FORGE", icon: "🧊", label: "FORGE", description: "3D models from text/image", cost: "20¢/gen", category: "3d" },
];

export const CAMERA_CHIPS: CameraChip[] = [
  { id: "pan_l", label: "Pan L" },
  { id: "pan_r", label: "Pan R" },
  { id: "tilt", label: "Tilt" },
  { id: "zoom", label: "Zoom" },
  { id: "dolly", label: "Dolly" },
  { id: "orbit", label: "Orbit" },
  { id: "static", label: "Static" },
];

export const VIDEO_SUB_MODES: { id: VideoSubMode; label: string }[] = [
  { id: "text_to_video", label: "Text → Video" },
  { id: "image_to_video", label: "Image → Video" },
  { id: "video_to_video", label: "Video → Video" },
  { id: "lip_sync", label: "Lip Sync" },
];

export const MODEL_ROUTES = [
  "Auto (best per shot)",
  "Runway Gen-4.5",
  "Kling 3.0",
  "Veo 3.1",
  "Sora 2",
  "Seedance 1.5",
];

export const SAFE_ZONES: PlatformSafeZone[] = [
  { platform: "TikTok", canvas: "1080×1920", ratio: "9:16", safe: "960×1390", top: "150px", bottom: "370px", left: "60px", right: "120px", maxDur: "10min" },
  { platform: "IG Reels", canvas: "1080×1920", ratio: "9:16", safe: "996×1400", top: "210px", bottom: "310px", left: "42px", right: "42px", maxDur: "90s" },
  { platform: "IG Stories", canvas: "1080×1920", ratio: "9:16", safe: "1080×1420", top: "250px", bottom: "250px", left: "0px", right: "0px", maxDur: "60s" },
  { platform: "YT Shorts", canvas: "1080×1920", ratio: "9:16", safe: "900×1160", top: "380px", bottom: "380px", left: "60px", right: "120px", maxDur: "3min" },
  { platform: "FB Reels", canvas: "1080×1920", ratio: "9:16", safe: "1010×1280", top: "220px", bottom: "420px", left: "35px", right: "35px", maxDur: "90s" },
  { platform: "FB Stories", canvas: "1080×1920", ratio: "9:16", safe: "1080×1680", top: "250px", bottom: "250px", left: "0px", right: "0px", maxDur: "20s" },
  { platform: "Snapchat", canvas: "1080×1920", ratio: "9:16", safe: "1080×1570", top: "175px", bottom: "175px", left: "0px", right: "0px", maxDur: "60s" },
  { platform: "Pinterest", canvas: "1000×1500", ratio: "2:3", safe: "1000×1200", top: "150px", bottom: "150px", left: "0px", right: "0px", maxDur: "15min" },
  { platform: "LinkedIn", canvas: "1080×1920", ratio: "9:16", safe: "1080×1600", top: "160px", bottom: "160px", left: "0px", right: "0px", maxDur: "10min" },
  { platform: "X/Twitter", canvas: "1080×1920", ratio: "9:16", safe: "1080×1600", top: "160px", bottom: "160px", left: "0px", right: "0px", maxDur: "140s" },
  { platform: "YT 16:9", canvas: "1920×1080", ratio: "16:9", safe: "1720×920", top: "80px", bottom: "80px", left: "100px", right: "100px", maxDur: "12hr" },
  { platform: "Universal", canvas: "1080×1920", ratio: "9:16", safe: "900×1160", top: "380px", bottom: "380px", left: "90px", right: "90px", maxDur: "60s" },
];

export const GATE_STAGES: { id: GateStage; label: string; description: string; cost: string }[] = [
  { id: "storyboard", label: "Storyboard", description: "Still images per scene", cost: "~$0.04" },
  { id: "animatic", label: "Animatic", description: "Ken Burns on stills", cost: "$0 extra" },
  { id: "single_scene", label: "Single Scene", description: "1 clip at full quality", cost: "~$0.50" },
  { id: "full_render", label: "Full Render", description: "All scenes", cost: "~$5.00" },
];

export const TARGET_PLATFORMS = [
  { id: "tiktok", label: "TikTok", defaultOn: true },
  { id: "ig_reels", label: "IG Reels", defaultOn: true },
  { id: "ig_stories", label: "IG Stories", defaultOn: true },
  { id: "yt_shorts", label: "YT Shorts", defaultOn: true },
  { id: "fb_reels", label: "FB Reels", defaultOn: false },
  { id: "fb_stories", label: "FB Stories", defaultOn: false },
  { id: "snapchat", label: "Snapchat", defaultOn: false },
  { id: "pinterest", label: "Pinterest", defaultOn: false },
  { id: "linkedin", label: "LinkedIn", defaultOn: false },
  { id: "x_twitter", label: "X/Twitter", defaultOn: false },
  { id: "yt_16_9", label: "YT 16:9", defaultOn: false },
];
