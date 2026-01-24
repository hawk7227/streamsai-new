"use client";

import { useState } from "react";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filters = [
    { id: "All", label: "All", icon: "" },
    { id: "Videos", label: "Videos", icon: "🎬" },
    { id: "Images", label: "Images", icon: "🖼️" },
    { id: "Audio", label: "Audio", icon: "🎙️" },
    { id: "Scripts", label: "Scripts", icon: "📝" },
  ];

  const files = [
    {
      id: 1,
      title: "Futuristic city sunset",
      type: "video",
      size: "24 MB",
      time: "5 min ago",
      duration: "0:08",
      gradient: "from-pink-500/20 to-purple-500/20",
    },
    {
      id: 2,
      title: "Product earbuds photo",
      type: "image",
      size: "2.4 MB",
      time: "12 min ago",
      gradient: "from-purple-500/20 to-indigo-500/20",
    },
    {
      id: 3,
      title: "Welcome voiceover",
      type: "audio",
      size: "1.2 MB",
      time: "1 hour ago",
      duration: "0:45",
      gradient: "from-emerald-500/20 to-teal-500/20",
    },
    {
      id: 4,
      title: "Launch video script",
      type: "script",
      size: "4 KB",
      time: "2 hours ago",
      gradient: "from-blue-500/20 to-indigo-500/20",
    },
    {
      id: 5,
      title: "Nature landscape 4K",
      type: "video",
      size: "156 MB",
      time: "3 hours ago",
      duration: "0:16",
      gradient: "from-amber-500/20 to-orange-500/20",
    },
    {
      id: 6,
      title: "Social media banner",
      type: "image",
      size: "1.8 MB",
      time: "Yesterday",
      gradient: "from-rose-500/20 to-pink-500/20",
    },
    {
      id: 7,
      title: "Product demo video",
      type: "video",
      size: "45 MB",
      time: "Yesterday",
      duration: "0:30",
      gradient: "from-cyan-500/20 to-blue-500/20",
    },
    {
      id: 8,
      title: "Podcast intro",
      type: "audio",
      size: "800 KB",
      time: "2 days ago",
      duration: "1:20",
      gradient: "from-violet-500/20 to-purple-500/20",
    },
    {
      id: 9,
      title: "Email sequence copy",
      type: "script",
      size: "8 KB",
      time: "2 days ago",
      gradient: "from-teal-500/20 to-emerald-500/20",
    },
    {
      id: 10,
      title: "Team headshots",
      type: "image",
      size: "5.2 MB",
      time: "3 days ago",
      gradient: "from-indigo-500/20 to-blue-500/20",
    },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎬";
      case "image":
        return "🖼️";
      case "audio":
        return "🎙️";
      case "script":
        return "📝";
      default:
        return "📄";
    }
  };

  const filteredFiles =
    activeFilter === "All"
      ? files
      : files.filter((file) => file.type === activeFilter.toLowerCase());

  const totalFiles = 156;
  const totalSize = "2.4 GB";
  const totalPages = Math.ceil(totalFiles / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedFiles = filteredFiles.slice(0, itemsPerPage);

  return (
    <div className="flex-1 flex flex-col -m-6 lg:-m-8">
      {/* Header */}
      <header className="h-14 bg-bg-secondary border-b border-border-color px-6 lg:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Library</h1>
          <span className="text-sm text-text-muted hidden sm:inline">
            {totalFiles} files • {totalSize} used
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-accent-indigo/25 transition-all">
            ⬆️ Upload
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border-color bg-bg-secondary text-white text-sm placeholder-text-muted focus:outline-none focus:border-accent-indigo/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter.id
                      ? "bg-accent-indigo/10 text-accent-indigo"
                      : "border border-border-color text-text-secondary hover:bg-bg-tertiary"
                  }`}
                >
                  {filter.icon && <span className="mr-1">{filter.icon}</span>}
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "border border-border-color text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                ▦
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "border border-border-color text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                ☰
              </button>
            </div>
          </div>

          {/* File Grid */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {displayedFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-bg-secondary border border-border-color rounded-xl overflow-hidden group cursor-pointer hover:border-accent-indigo/30 transition-all"
                >
                  <div
                    className={`aspect-video bg-gradient-to-br ${file.gradient} flex items-center justify-center relative`}
                  >
                    <span className="text-4xl">{getFileIcon(file.type)}</span>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        {file.type === "video" || file.type === "audio" ? "▶️" : "👁️"}
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        ⬇️
                      </button>
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        ⭐
                      </button>
                    </div>
                    {file.duration && (
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/60">
                        {file.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{file.title}</p>
                    <p className="text-xs text-text-muted">
                      {file.time} • {file.size}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-bg-secondary border border-border-color rounded-xl p-4 flex items-center gap-4 hover:border-accent-indigo/30 transition-all cursor-pointer group"
                >
                  <div
                    className={`w-16 h-16 rounded-lg bg-gradient-to-br ${file.gradient} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.title}</p>
                    <p className="text-xs text-text-muted">
                      {file.time} • {file.size}
                      {file.duration && ` • ${file.duration}`}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary transition-colors">
                      {file.type === "video" || file.type === "audio" ? "▶️" : "👁️"}
                    </button>
                    <button className="p-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary transition-colors">
                      ⬇️
                    </button>
                    <button className="p-2 rounded-lg bg-bg-tertiary hover:bg-bg-primary transition-colors">
                      ⭐
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
            <p className="text-sm text-text-muted">
              Showing {startIndex + 1}-{Math.min(endIndex, totalFiles)} of{" "}
              {totalFiles} files
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-border-color text-text-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const page = currentPage <= 2 ? i + 1 : currentPage - 1 + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? "bg-accent-indigo text-white"
                        : "border border-border-color text-text-secondary hover:bg-bg-tertiary"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-border-color text-text-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-tertiary transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
