"use client";

import { useEffect, useState } from "react";
import { listGenerations, type GenerationRecord } from "@/lib/generations";
import { formatRelativeTime, truncateText } from "@/lib/formatters";

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [files, setFiles] = useState<
    Array<{
      id: string;
      title: string;
      type: "video" | "image" | "audio" | "script";
      size: string;
      time: string;
      duration?: string;
      gradient: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = [
    { id: "All", label: "All", icon: "" },
    { id: "Videos", label: "Videos", icon: "🎬" },
    { id: "Images", label: "Images", icon: "🖼️" },
    { id: "Audio", label: "Audio", icon: "🎙️" },
    { id: "Scripts", label: "Scripts", icon: "📝" },
  ];

  useEffect(() => {
    let isMounted = true;

    const mapGeneration = (item: GenerationRecord) => {
      const type: "video" | "image" | "audio" | "script" =
        item.type === "voice"
          ? "audio"
          : item.type === "image"
          ? "image"
          : item.type === "script"
          ? "script"
          : "video";
      const gradient =
        type === "video"
          ? "from-pink-500/20 to-purple-500/20"
          : type === "image"
          ? "from-purple-500/20 to-indigo-500/20"
          : type === "audio"
          ? "from-emerald-500/20 to-teal-500/20"
          : "from-blue-500/20 to-indigo-500/20";

      return {
        id: item.id,
        title: truncateText(item.title ?? item.prompt, 40),
        type,
        size: "—",
        time: formatRelativeTime(item.created_at),
        duration: item.duration ?? undefined,
        gradient,
      };
    };

    listGenerations({ limit: 50 })
      .then((data) => {
        if (isMounted) {
          setError("");
          setFiles(data.map(mapGeneration));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load files");
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFiles = files.filter((file) => {
    const matchesFilter =
      activeFilter === "All" || file.type === activeFilter.toLowerCase();
    const matchesSearch =
      !normalizedQuery || file.title.toLowerCase().includes(normalizedQuery);
    return matchesFilter && matchesSearch;
  });

  const totalFiles = files.length;
  const totalSize = "—";
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedFiles = filteredFiles.slice(startIndex, endIndex);

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border-color bg-bg-secondary text-white text-sm placeholder-text-muted focus:outline-none focus:border-accent-indigo/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setActiveFilter(filter.id);
                    setCurrentPage(1);
                  }}
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

          {loading && (
            <div className="text-sm text-text-muted">Loading library...</div>
          )}
          {!loading && error && (
            <div className="text-sm text-accent-red">{error}</div>
          )}
          {!loading && !error && displayedFiles.length === 0 && (
            <div className="text-sm text-text-muted">No files yet.</div>
          )}
          {!loading && !error && displayedFiles.length > 0 && (
            <>
              {/* File Grid */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {displayedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-bg-secondary border border-border-color rounded-xl overflow-hidden group cursor-pointer hover:border-accent-indigo/30 transition-all"
                    >
                      <div
                        className={`aspect-video bg-linear-to-br ${file.gradient} flex items-center justify-center relative`}
                      >
                        <span className="text-4xl">{getFileIcon(file.type)}</span>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                            {file.type === "video" || file.type === "audio"
                              ? "▶️"
                              : "👁️"}
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
                        className={`w-16 h-16 rounded-lg bg-linear-to-br ${file.gradient} flex items-center justify-center shrink-0`}
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
                          {file.type === "video" || file.type === "audio"
                            ? "▶️"
                            : "👁️"}
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
            </>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
            <p className="text-sm text-text-muted">
              Showing {totalFiles === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, totalFiles)} of {totalFiles} files
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
