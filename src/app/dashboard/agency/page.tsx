"use client";

import { useState } from "react";

export default function AgencyDashboardPage() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const clients = [
    {
      id: 1,
      name: "Acme Inc.",
      slug: "acme-inc",
      tier: "pro",
      mrr: "$49",
      gens: "450",
      users: 12,
      usage: 75,
      trend: "+12%",
      trendUp: true,
    },
    {
      id: 2,
      name: "TechStart",
      slug: "techstart",
      tier: "starter",
      mrr: "$29",
      gens: "120",
      users: 4,
      usage: 45,
      trend: "+5%",
      trendUp: true,
    },
    {
      id: 3,
      name: "Global Media",
      slug: "global-media",
      tier: "enterprise",
      mrr: "$499",
      gens: "2,100",
      users: 45,
      usage: 92,
      trend: "+24%",
      trendUp: true,
    },
    {
      id: 4,
      name: "Design Co",
      slug: "design-co",
      tier: "free",
      mrr: "$0",
      gens: "24",
      users: 2,
      usage: 12,
      trend: "0%",
      trendUp: true,
    },
  ];

  const filteredClients = clients.filter((client) => {
    const matchesFilter = filter === "all" || client.tier === filter;
    const matchesSearch = client.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-indigo to-accent-pink rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-7 h-7"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-[32px] font-bold leading-tight">
                Agency Dashboard
              </h1>
              <p className="text-accent-purple font-medium text-sm">
                Managing {clients.length} client workspaces
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-indigo to-accent-pink text-white rounded-xl font-bold text-sm transition-all hover:shadow-[0_8px_25px_rgba(168,85,247,0.35)] hover:-translate-y-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-[18px] h-[18px]"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Client
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              label: "Total MRR",
              value: "$627",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              bg: "bg-accent-emerald/10",
              color: "text-accent-emerald",
            },
            {
              label: "Active Clients",
              value: "4",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              ),
              bg: "bg-accent-indigo/10",
              color: "text-accent-indigo",
            },
            {
              label: "Total Generations",
              value: "2,401",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              bg: "bg-accent-purple/10",
              color: "text-accent-purple",
            },
            {
              label: "Total Users",
              value: "37",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              bg: "bg-[#3b82f6]/10",
              color: "text-accent-blue",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-bg-secondary border border-border-color rounded-[20px] p-6 transition-all hover:border-border-hover hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}
                >
                  <div className="w-[22px] h-[22px]">{stat.icon}</div>
                </div>
                <span className="text-[13px] text-text-muted font-medium">
                  {stat.label}
                </span>
              </div>
              <p className="text-[28px] font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-[400px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-border-color rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all placeholder:text-text-muted"
            placeholder="Search clients..."
          />
        </div>
        <div className="flex bg-bg-secondary border border-border-color rounded-xl p-1 overflow-x-auto">
          {["all", "free", "starter", "pro", "enterprise"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all capitalize whitespace-nowrap ${
                filter === t
                  ? "bg-white text-black shadow-sm"
                  : "text-text-secondary hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="group relative bg-bg-secondary border border-border-color rounded-[20px] p-6 transition-all duration-300 hover:border-border-hover hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center font-bold text-lg text-white">
                  {client.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{client.name}</h3>
                  <p className="text-[13px] text-text-muted truncate max-w-[120px]">
                    {client.slug}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${
                  client.tier === "free"
                    ? "bg-zinc-500/10 text-zinc-400"
                    : client.tier === "starter"
                    ? "bg-blue-500/10 text-blue-300"
                    : client.tier === "pro"
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "bg-purple-500/10 text-purple-300"
                }`}
              >
                {client.tier}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-xs text-text-muted mb-1">MRR</p>
                <div className="flex items-baseline gap-1.5 align-baseline">
                  <span className="text-xl font-bold">{client.mrr}</span>
                  <span
                    className={`flex items-center text-xs font-medium ${
                      client.trendUp ? "text-accent-emerald" : "text-accent-red"
                    }`}
                  >
                    {client.trendUp ? "↑" : "↓"} {client.trend}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Generations</p>
                <p className="text-xl font-bold">{client.gens}</p>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-text-muted">Usage</span>
                <span
                  className={
                    client.usage > 90
                      ? "text-accent-red"
                      : client.usage > 70
                      ? "text-accent-amber"
                      : "text-accent-emerald"
                  }
                >
                  {client.usage}%
                </span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    client.usage > 90
                      ? "bg-accent-red"
                      : client.usage > 70
                      ? "bg-accent-amber"
                      : "bg-accent-emerald"
                  }`}
                  style={{ width: `${client.usage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-color">
              <div className="flex items-center gap-4 text-[13px] text-text-muted">
                <span className="flex items-center gap-1.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {client.users}
                </span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-tertiary hover:text-white transition-colors">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4.5 h-4.5"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-tertiary hover:text-white transition-colors">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4.5 h-4.5"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Client Card */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="group bg-bg-secondary border-2 border-dashed border-border-color rounded-[20px] p-6 flex flex-col items-center justify-center min-h-[280px] cursor-pointer transition-all hover:border-accent-purple hover:bg-accent-purple/5"
        >
          <div className="w-14 h-14 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-4 transition-colors group-hover:bg-accent-purple/10 group-hover:text-accent-purple text-text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-7 h-7"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span className="font-semibold text-text-secondary group-hover:text-text-primary transition-colors">
            Add New Client
          </span>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[480px] bg-bg-secondary border border-border-color rounded-3xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-border-color">
              <h2 className="text-xl font-bold">Add New Client</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:bg-bg-tertiary hover:text-white transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Client Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border-color rounded-xl text-text-primary text-[15px] focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all placeholder:text-text-muted"
                  placeholder="Acme Inc."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border-color rounded-xl text-text-primary text-[15px] focus:outline-none focus:border-accent-purple focus:shadow-[0_0_0_3px_rgba(168,85,247,0.1)] transition-all placeholder:text-text-muted"
                  placeholder="acme-inc"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Starting Plan
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Free", "Starter", "Pro", "Enterprise"].map((tier) => (
                    <button
                      key={tier}
                      className="px-2 py-3 rounded-xl bg-bg-tertiary border border-border-color text-sm font-medium text-text-secondary hover:text-white hover:border-border-hover transition-colors text-center"
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-border-color flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-3 rounded-xl font-bold text-sm text-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-pink text-white font-bold text-sm transition-all hover:shadow-[0_8px_25px_rgba(168,85,247,0.35)] hover:-translate-y-0.5"
              >
                Create Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
