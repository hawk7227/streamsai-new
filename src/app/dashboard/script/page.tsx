"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  createGeneration,
  listGenerations,
  type GenerationRecord,
} from "@/lib/generations";
import { formatRelativeTime, truncateText } from "@/lib/formatters";

export default function ScriptPage() {
  const { usage, usageLoading, incrementUsage } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usageError, setUsageError] = useState("");
  const [historyItems, setHistoryItems] = useState<GenerationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const isLimitReached =
    typeof usage?.limit === "number" && usage.used >= usage.limit;

  const handleGenerate = async () => {
    if (isLimitReached || usageLoading || isGenerating) {
      return;
    }

    if (!prompt.trim()) {
      setUsageError("Please enter a prompt.");
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
        type: "script",
        prompt,
        title: truncateText(prompt, 48),
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
    let isMounted = true;
    setHistoryLoading(true);
    setHistoryError("");

    listGenerations({ type: "script", limit: 8 })
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

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
      <div className="space-y-6">
        {/* Product Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/dashboard/${tab.id}`}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium whitespace-nowrap transition-all ${
                tab.id === "script"
                  ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                  : "border-border-color bg-bg-secondary text-text-secondary hover:border-accent-indigo/50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span> {tab.label}
            </Link>
          ))}
        </div>

        {/* Main Generation Panel */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border-color flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-emerald to-accent-blue flex items-center justify-center">
                📝
              </div>
              <span className="font-semibold">Script Generation</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>✨</span> Describe your script
                </div>
                <span className="text-xs text-text-muted">
                  {prompt.length} / 2000
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-48 px-4 py-4 rounded-xl border border-border-color bg-bg-tertiary text-white text-[15px] leading-relaxed resize-none focus:outline-none focus:border-accent-indigo placeholder-text-muted"
                placeholder="What kind of script do you need? (e.g., blog post, video script, social media content...)"
                maxLength={2000}
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLimitReached || usageLoading || isGenerating}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-emerald to-accent-blue text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent-emerald/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLimitReached
                ? "Limit Reached"
                : isGenerating
                ? "Generating..."
                : "✨ Generate Script"}
            </button>
            {usageError && (
              <p className="text-xs text-accent-red">{usageError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-4">
          <h3 className="text-sm font-medium mb-3">Recent Scripts</h3>
          {historyLoading && (
            <p className="text-xs text-text-muted">Loading scripts...</p>
          )}
          {!historyLoading && historyError && (
            <p className="text-xs text-accent-red">{historyError}</p>
          )}
          {!historyLoading && !historyError && historyItems.length === 0 && (
            <p className="text-xs text-text-muted">No scripts yet</p>
          )}
          {!historyLoading &&
            !historyError &&
            historyItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-emerald/20 to-accent-blue/20 flex items-center justify-center">
                  📝
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {truncateText(item.title ?? item.prompt, 40)}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {formatRelativeTime(item.created_at)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
