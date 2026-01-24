"use client";

import { useState } from "react";
import Link from "next/link";

export default function VideoPage() {
  const [prompt, setPrompt] = useState(
    "A breathtaking aerial view of a futuristic city at sunset, with flying cars weaving between towering glass skyscrapers, neon lights beginning to glow"
  );
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("8s");
  const [quality, setQuality] = useState("1080p Full HD");
  const [activeTab, setActiveTab] = useState("All");

  const tabs = [
    { id: "script", label: "Script", icon: "📝" },
    { id: "voice", label: "Voice", icon: "🎙️" },
    { id: "image", label: "Image", icon: "🖼️" },
    { id: "video", label: "Video", icon: "🎬" },
    { id: "edit", label: "Edit", icon: "✂️" },
  ];

  const templates = [
    { name: "Product Demo", icon: "🎥", uses: "2.4k" },
    { name: "Social Reel", icon: "📱", uses: "1.8k" },
    { name: "Corporate Intro", icon: "🏢", uses: "1.2k" },
    { name: "Tutorial", icon: "🎓", uses: "980" },
    { name: "E-commerce", icon: "🛍️", uses: "756" },
  ];

  const historyItems = [
    {
      title: "Futuristic city aerial shot sunset...",
      type: "video",
      duration: "8s",
      aspect: "16:9",
      time: "5m ago",
      favorited: true,
    },
    {
      title: "Product showcase spinning phone...",
      type: "video",
      duration: "6s",
      aspect: "1:1",
      time: "15m ago",
      favorited: false,
    },
    {
      title: "Nature landscape mountains clouds...",
      type: "video",
      duration: "Processing...",
      aspect: "",
      time: "20m ago",
      processing: true,
    },
    {
      title: "Professional headshot business...",
      type: "image",
      duration: "",
      aspect: "1:1",
      time: "1h ago",
      favorited: false,
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Product Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/dashboard/${tab.id}`}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                tab.id === "video"
                  ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                  : "border-border-color bg-bg-secondary text-text-secondary hover:border-accent-indigo/50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span> {tab.label}
            </Link>
          ))}
        </div>

        {/* Templates Bar */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>📚</span> Quick Templates
            </div>
            <span className="text-sm text-accent-indigo cursor-pointer hover:underline">
              See all →
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {templates.map((template, i) => (
              <div
                key={i}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary border border-border-color rounded-xl cursor-pointer hover:border-accent-indigo/50 transition-colors"
              >
                <span className="text-xl">{template.icon}</span>
                <div>
                  <p className="text-sm font-medium whitespace-nowrap">
                    {template.name}
                  </p>
                  <p className="text-[10px] text-text-muted">{template.uses} uses</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Generation Panel */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border-color flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center">
                🎬
              </div>
              <span className="font-semibold">Video Generation</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-border-color text-text-secondary text-xs hover:bg-bg-tertiary transition-colors">
                🕐 History
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-border-color text-text-secondary text-xs hover:bg-bg-tertiary transition-colors">
                ⭐ Templates
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>✨</span> Describe your video
                </div>
                <span className="text-xs text-text-muted">
                  {prompt.length} / 500
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-36 px-4 py-4 rounded-xl border border-border-color bg-bg-tertiary text-white text-[15px] leading-relaxed resize-none focus:outline-none focus:border-accent-indigo placeholder-text-muted"
                placeholder="Describe your video..."
                maxLength={500}
              />

              {/* Prompt Score */}
              <div className="flex items-center gap-4 mt-3 p-4 bg-bg-tertiary rounded-xl">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center relative"
                  style={{
                    background:
                      "conic-gradient(#10b981 0deg, #10b981 270deg, #1a1a24 270deg)",
                  }}
                >
                  <div className="absolute inset-1 bg-bg-tertiary rounded-full"></div>
                  <span className="relative text-sm font-bold text-accent-emerald">
                    75
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Good prompt quality</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 text-xs text-accent-emerald">
                      ✓ Detailed
                    </span>
                    <span className="flex items-center gap-1 text-xs text-accent-emerald">
                      ✓ Visual
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      ○ Add style
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      ○ Camera angle
                    </span>
                  </div>
                </div>
                <button className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-accent-indigo/25 transition-all">
                  🪄 Enhance
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-bg-tertiary rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
                  Aspect Ratio
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setAspectRatio("16:9")}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-medium flex flex-col items-center transition-colors ${
                      aspectRatio === "16:9"
                        ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                        : "border-border-color bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    <span className="text-lg mb-0.5">🖥️</span> 16:9
                  </button>
                  <button
                    onClick={() => setAspectRatio("9:16")}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-medium flex flex-col items-center transition-colors ${
                      aspectRatio === "9:16"
                        ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                        : "border-border-color bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    <span className="text-lg mb-0.5">📱</span> 9:16
                  </button>
                  <button
                    onClick={() => setAspectRatio("1:1")}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-medium flex flex-col items-center transition-colors ${
                      aspectRatio === "1:1"
                        ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                        : "border-border-color bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    <span className="text-lg mb-0.5">⬜</span> 1:1
                  </button>
                </div>
              </div>
              <div className="bg-bg-tertiary rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
                  Duration
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setDuration("4s")}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      duration === "4s"
                        ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                        : "border-border-color bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    4s
                  </button>
                  <button
                    onClick={() => setDuration("8s")}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      duration === "8s"
                        ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                        : "border-border-color bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    8s
                  </button>
                  <button
                    onClick={() => setDuration("16s")}
                    className={`flex-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      duration === "16s"
                        ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                        : "border-border-color bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    16s
                  </button>
                </div>
              </div>
              <div className="bg-bg-tertiary rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
                  Quality
                </p>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-border-color bg-bg-secondary text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent-indigo"
                >
                  <option>1080p Full HD</option>
                  <option>720p HD</option>
                  <option>4K Ultra HD</option>
                </select>
              </div>
            </div>

            {/* Cost Estimator & Generate */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-gradient-to-r from-accent-indigo/10 to-accent-purple/10 border border-accent-indigo/20 rounded-xl gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center">
                  💎
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Estimated Cost</p>
                  <p className="text-xl font-bold">$2.40</p>
                </div>
              </div>
              <button className="flex-1 sm:ml-6 w-full sm:w-auto py-4 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent-indigo/30 transition-all">
                ✨ Generate Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - AI Assistant & History */}
      <div className="space-y-6">
        {/* AI Assistant */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-color flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-sm">
              🤖
            </div>
            <span className="font-medium text-sm">AI Assistant</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] bg-accent-emerald/10 text-accent-emerald">
              Active
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div className="p-3 bg-accent-indigo/10 border border-accent-indigo/20 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-accent-indigo mb-1">
                ENHANCE
              </p>
              <p className="text-sm text-text-secondary">
                Add "cinematic lighting, 4K quality, dramatic atmosphere" for
                better visual impact
              </p>
            </div>
            <div className="p-3 bg-accent-amber/10 border border-accent-amber/20 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-accent-amber mb-1">
                ADD DETAIL
              </p>
              <p className="text-sm text-text-secondary">
                Specify camera movement like "slow dolly forward" or "aerial
                crane shot"
              </p>
            </div>
            <div className="p-3 bg-accent-purple/10 border border-accent-purple/20 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-accent-purple mb-1">
                STYLE
              </p>
              <p className="text-sm text-text-secondary">
                Consider adding a specific visual style: "neon cyberpunk" or
                "golden hour warmth"
              </p>
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-color flex items-center justify-between">
            <span className="font-medium text-sm">Recent History</span>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("All")}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === "All"
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("Video")}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === "Video"
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                Video
              </button>
              <button
                onClick={() => setActiveTab("Image")}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === "Image"
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                Image
              </button>
            </div>
          </div>
          <div className="divide-y divide-white/[0.05] max-h-80 overflow-y-auto">
            {historyItems.map((item, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    item.type === "video"
                      ? "bg-gradient-to-br from-accent-pink/20 to-accent-purple/20"
                      : "bg-gradient-to-br from-accent-purple/20 to-accent-indigo/20"
                  } ${item.processing ? "animate-pulse" : ""}`}
                >
                  {item.type === "video" ? "🎬" : "🖼️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.title}</p>
                  <p
                    className={`text-[10px] ${
                      item.processing ? "text-accent-amber" : "text-text-muted"
                    }`}
                  >
                    {item.duration && `${item.duration} • `}
                    {item.aspect && `${item.aspect} • `}
                    {item.time}
                  </p>
                </div>
                {item.favorited && (
                  <span className="text-accent-amber">⭐</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tool Rules */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Tool Rules</span>
            <button className="text-xs text-accent-indigo hover:underline">
              + Add
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <div>
                <p className="text-xs font-medium">Cinematic Lighting</p>
                <p className="text-[10px] text-text-muted">
                  Add to all video prompts
                </p>
              </div>
              <div className="w-8 h-4 rounded-full bg-accent-indigo relative cursor-pointer">
                <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <div>
                <p className="text-xs font-medium">Default 1080p</p>
                <p className="text-[10px] text-text-muted">
                  Use 1080p unless specified
                </p>
              </div>
              <div className="w-8 h-4 rounded-full bg-accent-indigo relative cursor-pointer">
                <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-medium">Smooth Motion</p>
                <p className="text-[10px] text-text-muted">Prefer steady camera</p>
              </div>
              <div className="w-8 h-4 rounded-full bg-bg-tertiary relative cursor-pointer">
                <span className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
