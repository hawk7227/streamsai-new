"use client";

import { useState } from "react";
import Link from "next/link";

export default function VoicePage() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("Natural");
  const [speed, setSpeed] = useState("Normal");

  const tabs = [
    { id: "script", label: "Script", icon: "📝" },
    { id: "voice", label: "Voice", icon: "🎙️" },
    { id: "image", label: "Image", icon: "🖼️" },
    { id: "video", label: "Video", icon: "🎬" },
    { id: "edit", label: "Edit", icon: "✂️" },
  ];

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
                tab.id === "voice"
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center">
                🎙️
              </div>
              <span className="font-semibold">Voice Generation</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>✨</span> Enter text to convert to speech
                </div>
                <span className="text-xs text-text-muted">
                  {text.length} / 5000
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-48 px-4 py-4 rounded-xl border border-border-color bg-bg-tertiary text-white text-[15px] leading-relaxed resize-none focus:outline-none focus:border-accent-indigo placeholder-text-muted"
                placeholder="Type or paste the text you want to convert to speech..."
                maxLength={5000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-bg-tertiary rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
                  Voice Style
                </p>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-border-color bg-bg-secondary text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent-indigo"
                >
                  <option>Natural</option>
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Narrator</option>
                </select>
              </div>
              <div className="bg-bg-tertiary rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3">
                  Speed
                </p>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-border-color bg-bg-secondary text-white text-sm appearance-none cursor-pointer focus:outline-none focus:border-accent-indigo"
                >
                  <option>Slow</option>
                  <option>Normal</option>
                  <option>Fast</option>
                </select>
              </div>
            </div>

            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-accent-purple/30 transition-all">
              ✨ Generate Voice
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-4">
          <h3 className="text-sm font-medium mb-3">Recent Voices</h3>
          <p className="text-xs text-text-muted">No voices generated yet</p>
        </div>
      </div>
    </div>
  );
}
