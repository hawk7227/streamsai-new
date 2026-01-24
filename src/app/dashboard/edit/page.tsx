"use client";

import { useState } from "react";
import Link from "next/link";

export default function EditPage() {
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
                tab.id === "edit"
                  ? "border-accent-indigo bg-accent-indigo/10 text-accent-indigo"
                  : "border-border-color bg-bg-secondary text-text-secondary hover:border-accent-indigo/50"
              }`}
            >
              <span className="text-xl">{tab.icon}</span> {tab.label}
            </Link>
          ))}
        </div>

        {/* Main Editing Panel */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border-color flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-indigo flex items-center justify-center">
                ✂️
              </div>
              <span className="font-semibold">Edit Content</span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✂️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Content to Edit</h3>
              <p className="text-sm text-text-muted mb-6">
                Upload a video, image, or audio file to start editing
              </p>
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-indigo text-white font-medium hover:shadow-lg hover:shadow-accent-blue/30 transition-all">
                Upload File
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-4">
          <h3 className="text-sm font-medium mb-3">Recent Edits</h3>
          <p className="text-xs text-text-muted">No edits yet</p>
        </div>
      </div>
    </div>
  );
}
