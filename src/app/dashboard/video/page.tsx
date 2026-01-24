"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  createGeneration,
  listGenerations,
  type GenerationRecord,
} from "@/lib/generations";
import { formatRelativeTime, truncateText } from "@/lib/formatters";

type VideoTemplate = {
  id: string;
  name: string;
  icon: string;
  uses: string;
  prompt: string;
  aspectRatio: string;
  duration: string;
  quality: string;
  isDefault?: boolean;
};

const TEMPLATE_STORAGE_KEY = "streamsai.video.templates";

const DEFAULT_TEMPLATES: VideoTemplate[] = [
  {
    id: "product-demo",
    name: "Product Demo",
    icon: "🎥",
    uses: "2.4k",
    prompt:
      "A sleek product demo showcasing a smartphone rotating in soft studio light, clean background, crisp reflections",
    aspectRatio: "16:9",
    duration: "8s",
    quality: "1080p Full HD",
    isDefault: true,
  },
  {
    id: "social-reel",
    name: "Social Reel",
    icon: "📱",
    uses: "1.8k",
    prompt:
      "Fast-paced montage of lifestyle shots with dynamic cuts, vibrant colors, and energetic transitions",
    aspectRatio: "9:16",
    duration: "8s",
    quality: "1080p Full HD",
    isDefault: true,
  },
  {
    id: "corporate-intro",
    name: "Corporate Intro",
    icon: "🏢",
    uses: "1.2k",
    prompt:
      "Corporate intro with aerial city skyline, modern office interiors, and subtle motion graphics",
    aspectRatio: "16:9",
    duration: "16s",
    quality: "4K Ultra HD",
    isDefault: true,
  },
  {
    id: "tutorial",
    name: "Tutorial",
    icon: "🎓",
    uses: "980",
    prompt:
      "Screen-record style tutorial with clear callouts, smooth zooms, and minimal background",
    aspectRatio: "16:9",
    duration: "16s",
    quality: "1080p Full HD",
    isDefault: true,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    icon: "🛍️",
    uses: "756",
    prompt:
      "Lifestyle product showcase with soft natural light, shallow depth of field, and clean typography",
    aspectRatio: "1:1",
    duration: "8s",
    quality: "1080p Full HD",
    isDefault: true,
  },
];

export default function VideoPage() {
  const { usage, usageLoading, incrementUsage } = useAuth();
  const [prompt, setPrompt] = useState(
    "A breathtaking aerial view of a futuristic city at sunset, with flying cars weaving between towering glass skyscrapers, neon lights beginning to glow"
  );
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("8s");
  const [quality, setQuality] = useState("1080p Full HD");
  const [activeTab, setActiveTab] = useState("All");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageError, setUsageError] = useState("");
  const [historyItems, setHistoryItems] = useState<GenerationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState("");
  const [assistantSuggestions, setAssistantSuggestions] = useState([
    {
      type: "enhance",
      text: 'Add "cinematic lighting, 4K quality, dramatic atmosphere" for better visual impact',
    },
    {
      type: "detail",
      text: 'Specify camera movement like "slow dolly forward" or "aerial crane shot"',
    },
    {
      type: "style",
      text: 'Consider adding a specific visual style: "neon cyberpunk" or "golden hour warmth"',
    },
  ]);
  const [templates, setTemplates] = useState<VideoTemplate[]>(DEFAULT_TEMPLATES);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    icon: "✨",
    prompt: "",
    aspectRatio: "16:9",
    duration: "8s",
    quality: "1080p Full HD",
  });

  const isLimitReached =
    typeof usage?.limit === "number" && usage.used >= usage.limit;

  const handleGenerate = async () => {
    if (isLimitReached || usageLoading || isGenerating) {
      return;
    }

    setUsageError("");
    setIsGenerating(true);

    const { error } = await incrementUsage(1);
    if (error) {
      setUsageError(error);
      setIsGenerating(false);
      return;
    }

    try {
      const created = await createGeneration({
        type: "video",
        prompt,
        title: truncateText(prompt, 48),
        aspectRatio,
        duration,
        quality,
      });
      setHistoryItems((prev) => [created, ...prev]);
    } catch (createError) {
      setUsageError(
        createError instanceof Error
          ? createError.message
          : "Unable to save generation"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: "script", label: "Script", icon: "📝" },
    { id: "voice", label: "Voice", icon: "🎙️" },
    { id: "image", label: "Image", icon: "🖼️" },
    { id: "video", label: "Video", icon: "🎬" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return;
      }

      const savedTemplates = parsed as VideoTemplate[];
      const savedById = new Map(savedTemplates.map((item) => [item.id, item]));
      const mergedDefaults = DEFAULT_TEMPLATES.map((template) => {
        const override = savedById.get(template.id);
        if (!override) {
          return template;
        }
        return {
          ...template,
          ...override,
          uses: template.uses,
          isDefault: true,
        };
      });

      const customTemplates = savedTemplates
        .filter((template) => !DEFAULT_TEMPLATES.some((t) => t.id === template.id))
        .map((template) => ({
          ...template,
          uses: template.uses ?? "Custom",
          isDefault: false,
        }));

      setTemplates([...mergedDefaults, ...customTemplates]);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    let isMounted = true;
    setHistoryLoading(true);
    setHistoryError("");

    listGenerations({ limit: 12 })
      .then((data) => {
        if (isMounted) {
          setHistoryItems(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setHistoryError(
            error instanceof Error ? error.message : "Unable to load history"
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setHistoryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredHistory = useMemo(() => {
    if (activeTab === "All") {
      return historyItems;
    }
    const normalized = activeTab.toLowerCase();
    return historyItems.filter((item) => item.type === normalized);
  }, [activeTab, historyItems]);

  const handleTemplateApply = (template: VideoTemplate) => {
    setPrompt(template.prompt);
    setAspectRatio(template.aspectRatio);
    setDuration(template.duration);
    setQuality(template.quality);
  };

  const handleTemplateUpdate = (id: string, updates: Partial<VideoTemplate>) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === id ? { ...template, ...updates } : template
      )
    );
  };

  const handleTemplateDelete = (id: string) => {
    setTemplates((prev) =>
      prev.filter((template) => template.id !== id || template.isDefault)
    );
  };

  const handleTemplateCreate = () => {
    const trimmedName = newTemplate.name.trim();
    const trimmedPrompt = newTemplate.prompt.trim();

    if (!trimmedName) {
      setTemplateError("Template name is required.");
      return;
    }

    if (!trimmedPrompt) {
      setTemplateError("Template prompt is required.");
      return;
    }

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setTemplates((prev) => [
      ...prev,
      {
        id,
        name: trimmedName,
        icon: newTemplate.icon.trim() || "✨",
        uses: "Custom",
        prompt: trimmedPrompt,
        aspectRatio: newTemplate.aspectRatio,
        duration: newTemplate.duration,
        quality: newTemplate.quality,
        isDefault: false,
      },
    ]);

    setTemplateError("");
    setNewTemplate({
      name: "",
      icon: "✨",
      prompt: "",
      aspectRatio: "16:9",
      duration: "8s",
      quality: "1080p Full HD",
    });
  };

  const handleAssistantRefresh = async () => {
    if (!prompt.trim()) {
      setAssistantError("Add a prompt to get suggestions.");
      return;
    }

    setAssistantError("");
    setAssistantLoading(true);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          generationType: "video",
          aspectRatio,
          duration,
          quality,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to fetch assistant tips");
      }

      if (Array.isArray(data?.suggestions)) {
        setAssistantSuggestions(data.suggestions);
      }
    } catch (error) {
      setAssistantError(
        error instanceof Error ? error.message : "Assistant unavailable"
      );
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <>
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
            <button
              type="button"
              onClick={() => setIsTemplateDialogOpen(true)}
              className="text-sm text-accent-indigo hover:underline"
            >
              See all →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {templates.map((template) => (
              <button
                type="button"
                key={template.id}
                onClick={() => handleTemplateApply(template)}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary border border-border-color rounded-xl cursor-pointer hover:border-accent-indigo/50 transition-colors"
              >
                <span className="text-xl">{template.icon}</span>
                <div>
                  <p className="text-sm font-medium whitespace-nowrap">
                    {template.name}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {template.uses} uses
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Generation Panel */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border-color flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent-indigo to-accent-purple flex items-center justify-center">
                🎬
              </div>
              <span className="font-semibold">Video Generation</span>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-border-color text-text-secondary text-xs hover:bg-bg-tertiary transition-colors">
                🕐 History
              </button>
              <button
                type="button"
                onClick={() => setIsTemplateDialogOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-border-color text-text-secondary text-xs hover:bg-bg-tertiary transition-colors"
              >
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
                <button
                  type="button"
                  onClick={handleAssistantRefresh}
                  className="px-4 py-2.5 rounded-lg bg-linear-to-r from-accent-indigo to-accent-purple text-white text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-accent-indigo/25 transition-all"
                >
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
            <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-linear-to-r from-accent-indigo/10 to-accent-purple/10 border border-accent-indigo/20 rounded-xl gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent-indigo to-accent-purple flex items-center justify-center">
                  💎
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Estimated Cost</p>
                  <p className="text-xl font-bold">$2.40</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLimitReached || usageLoading || isGenerating}
                className="flex-1 sm:ml-6 w-full sm:w-auto py-4 rounded-xl bg-linear-to-r from-accent-indigo to-accent-purple text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent-indigo/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLimitReached
                  ? "Limit Reached"
                  : isGenerating
                  ? "Generating..."
                  : "✨ Generate Video"}
              </button>
            </div>
            {usageError && (
              <p className="text-xs text-accent-red">{usageError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - AI Assistant & History */}
      <div className="space-y-6">
        {/* AI Assistant */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border-color flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-linear-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-sm">
              🤖
            </div>
            <span className="font-medium text-sm">AI Assistant</span>
            <span className="ml-auto px-2 py-0.5 rounded text-[10px] bg-accent-emerald/10 text-accent-emerald">
              Active
            </span>
          </div>
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={handleAssistantRefresh}
              className="w-full px-3 py-2 rounded-lg border border-border-color text-xs text-text-secondary hover:bg-bg-tertiary transition-colors"
            >
              {assistantLoading ? "Thinking..." : "Refresh Suggestions"}
            </button>
            {assistantError && (
              <p className="text-[11px] text-accent-red">{assistantError}</p>
            )}
            {assistantSuggestions.map((suggestion) => {
              const config =
                suggestion.type === "enhance"
                  ? {
                      label: "ENHANCE",
                      className:
                        "bg-accent-indigo/10 border-accent-indigo/20 text-accent-indigo",
                    }
                  : suggestion.type === "detail"
                  ? {
                      label: "ADD DETAIL",
                      className:
                        "bg-accent-amber/10 border-accent-amber/20 text-accent-amber",
                    }
                  : {
                      label: "STYLE",
                      className:
                        "bg-accent-purple/10 border-accent-purple/20 text-accent-purple",
                    };

              return (
                <div
                  key={suggestion.type}
                  className={`p-3 border rounded-xl ${config.className}`}
                >
                  <p className="text-[10px] uppercase tracking-wider mb-1">
                    {config.label}
                  </p>
                  <p className="text-sm text-text-secondary">{suggestion.text}</p>
                </div>
              );
            })}
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
              <button
                onClick={() => setActiveTab("Script")}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  activeTab === "Script"
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                Script
              </button>
            </div>
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {historyLoading && (
              <div className="px-4 py-3 text-xs text-text-muted">
                Loading history...
              </div>
            )}
            {!historyLoading && historyError && (
              <div className="px-4 py-3 text-xs text-accent-red">
                {historyError}
              </div>
            )}
            {!historyLoading && !historyError && filteredHistory.length === 0 && (
              <div className="px-4 py-3 text-xs text-text-muted">
                No recent history yet.
              </div>
            )}
            {!historyLoading &&
              !historyError &&
              filteredHistory.map((item) => {
                const isProcessing = item.status === "processing";
                const displayTitle = truncateText(
                  item.title ?? item.prompt,
                  42
                );
                const displayTime = formatRelativeTime(item.created_at);
                const icon =
                  item.type === "video"
                    ? "🎬"
                    : item.type === "image"
                    ? "🖼️"
                    : item.type === "script"
                    ? "📝"
                    : "🎙️";
                const gradient =
                  item.type === "video"
                    ? "from-accent-pink/20 to-accent-purple/20"
                    : item.type === "image"
                    ? "from-accent-purple/20 to-accent-indigo/20"
                    : "from-accent-emerald/20 to-accent-blue/20";

                return (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-white/2 cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center bg-linear-to-br ${gradient} ${
                        isProcessing ? "animate-pulse" : ""
                      }`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{displayTitle}</p>
                      <p
                        className={`text-[10px] ${
                          isProcessing ? "text-accent-amber" : "text-text-muted"
                        }`}
                      >
                        {item.duration && `${item.duration} • `}
                        {item.aspect_ratio && `${item.aspect_ratio} • `}
                        {displayTime}
                      </p>
                    </div>
                    {item.favorited && (
                      <span className="text-accent-amber">⭐</span>
                    )}
                  </div>
                );
              })}
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
            <div className="flex items-center justify-between py-2 border-b border-white/5">
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
            <div className="flex items-center justify-between py-2 border-b border-white/5">
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

      {isTemplateDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={() => setIsTemplateDialogOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-bg-secondary border border-border-color rounded-2xl shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border-color flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Manage Templates</h3>
                <p className="text-xs text-text-muted">
                  Saved locally in your browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateDialogOpen(false)}
                className="text-text-muted hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {templateError && (
                <div className="text-xs text-accent-red">{templateError}</div>
              )}
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-border-color rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <input
                          value={template.name}
                          onChange={(event) =>
                            handleTemplateUpdate(template.id, {
                              name: event.target.value,
                            })
                          }
                          className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                          placeholder="Template name"
                        />
                        {template.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-tertiary text-text-muted">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleTemplateApply(template);
                            setIsTemplateDialogOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs bg-accent-indigo/10 text-accent-indigo hover:bg-accent-indigo/20"
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          disabled={template.isDefault}
                          onClick={() => handleTemplateDelete(template.id)}
                          className="px-3 py-1.5 rounded-lg text-xs border border-border-color text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        value={template.icon}
                        onChange={(event) =>
                          handleTemplateUpdate(template.id, {
                            icon: event.target.value,
                          })
                        }
                        maxLength={2}
                        className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                        placeholder="Icon"
                      />
                      <select
                        value={template.aspectRatio}
                        onChange={(event) =>
                          handleTemplateUpdate(template.id, {
                            aspectRatio: event.target.value,
                          })
                        }
                        className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                      >
                        <option>16:9</option>
                        <option>9:16</option>
                        <option>1:1</option>
                      </select>
                      <select
                        value={template.duration}
                        onChange={(event) =>
                          handleTemplateUpdate(template.id, {
                            duration: event.target.value,
                          })
                        }
                        className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                      >
                        <option>4s</option>
                        <option>8s</option>
                        <option>16s</option>
                      </select>
                      <select
                        value={template.quality}
                        onChange={(event) =>
                          handleTemplateUpdate(template.id, {
                            quality: event.target.value,
                          })
                        }
                        className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                      >
                        <option>1080p Full HD</option>
                        <option>720p HD</option>
                        <option>4K Ultra HD</option>
                      </select>
                    </div>
                    <textarea
                      value={template.prompt}
                      onChange={(event) =>
                        handleTemplateUpdate(template.id, {
                          prompt: event.target.value,
                        })
                      }
                      className="w-full h-24 px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm resize-none"
                      placeholder="Template prompt"
                    />
                  </div>
                ))}
              </div>

              <div className="border-t border-border-color pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Add new template</h4>
                  <button
                    type="button"
                    onClick={handleTemplateCreate}
                    className="px-3 py-1.5 rounded-lg text-xs bg-accent-indigo text-white hover:opacity-90"
                  >
                    + Add Template
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    value={newTemplate.name}
                    onChange={(event) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                    placeholder="Name"
                  />
                  <input
                    value={newTemplate.icon}
                    onChange={(event) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        icon: event.target.value,
                      }))
                    }
                    maxLength={2}
                    className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                    placeholder="Icon"
                  />
                  <select
                    value={newTemplate.aspectRatio}
                    onChange={(event) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        aspectRatio: event.target.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                  >
                    <option>16:9</option>
                    <option>9:16</option>
                    <option>1:1</option>
                  </select>
                  <select
                    value={newTemplate.duration}
                    onChange={(event) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        duration: event.target.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                  >
                    <option>4s</option>
                    <option>8s</option>
                    <option>16s</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={newTemplate.quality}
                    onChange={(event) =>
                      setNewTemplate((prev) => ({
                        ...prev,
                        quality: event.target.value,
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm"
                  >
                    <option>1080p Full HD</option>
                    <option>720p HD</option>
                    <option>4K Ultra HD</option>
                  </select>
                  <div className="text-xs text-text-muted flex items-center">
                    Custom templates can be deleted later.
                  </div>
                </div>
                <textarea
                  value={newTemplate.prompt}
                  onChange={(event) =>
                    setNewTemplate((prev) => ({
                      ...prev,
                      prompt: event.target.value,
                    }))
                  }
                  className="w-full h-24 px-3 py-2 rounded-lg border border-border-color bg-bg-tertiary text-sm resize-none"
                  placeholder="Prompt"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
