"use client";

import { useState } from "react";

export default function TeamPage() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const members = [
    {
      id: 1,
      name: "Marcus Hawkins",
      email: "marcus@example.com",
      role: "owner",
      status: "active",
      lastActive: "Now",
      generations: 1240,
    },
    {
      id: 2,
      name: "Sarah Chen",
      email: "sarah@example.com",
      role: "admin",
      status: "active",
      lastActive: "10 mins ago",
      generations: 850,
    },
    {
      id: 3,
      name: "Mike Wilson",
      email: "mike@example.com",
      role: "member",
      status: "active",
      lastActive: "2 hours ago",
      generations: 320,
    },
    {
      id: 4,
      name: "David Kim",
      email: "david@example.com",
      role: "member",
      status: "pending",
      lastActive: "Invited 1 day ago",
      generations: 0,
    },
  ];

  const filteredMembers = members.filter((member) => {
    const matchesFilter = filter === "all" || member.status === filter;
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-indigo/10 rounded-xl flex items-center justify-center text-accent-indigo">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-[28px] font-bold">Team Members</h1>
            <p className="text-text-secondary text-sm">
              Manage who has access to your workspace
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-indigo to-accent-purple text-white rounded-xl font-bold text-sm transition-all hover:shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:-translate-y-0.5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-[18px] h-[18px]"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 hover:border-border-hover transition-colors">
          <p className="text-[13px] text-text-muted font-medium mb-2">
            Total Members
          </p>
          <p className="text-[32px] font-bold">{members.length}</p>
        </div>
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 hover:border-border-hover transition-colors">
          <p className="text-[13px] text-text-muted font-medium mb-2">
            Active
          </p>
          <p className="text-[32px] font-bold text-accent-emerald">
            {members.filter((m) => m.status === "active").length}
          </p>
        </div>
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6 hover:border-border-hover transition-colors">
          <p className="text-[13px] text-text-muted font-medium mb-2">
            Pending Invites
          </p>
          <p className="text-[32px] font-bold text-accent-amber">
            {members.filter((m) => m.status === "pending").length}
          </p>
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
            className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-border-color rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-indigo focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all placeholder:text-text-muted"
            placeholder="Search members..."
          />
        </div>
        <div className="flex gap-2">
          {["All", "Active", "Pending"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t.toLowerCase())}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                filter === t.toLowerCase()
                  ? "bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/20"
                  : "bg-bg-secondary border border-border-color text-text-secondary hover:text-white hover:bg-bg-tertiary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-secondary border border-border-color rounded-[20px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-bg-tertiary border-b border-border-color">
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {member.status === "pending" ? (
                        <div className="w-11 h-11 rounded-full bg-bg-tertiary border border-border-color flex items-center justify-center font-bold text-[15px] border-dashed text-text-muted">
                          ?
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center font-bold text-[15px] text-white">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-[15px]">
                          {member.name}
                        </div>
                        <div className="text-[13px] text-text-muted">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium ${
                        member.role === "owner"
                          ? "bg-amber-500/10 text-amber-300"
                          : member.role === "admin"
                          ? "bg-indigo-500/10 text-indigo-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {member.role === "owner" && (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-3.5 h-3.5"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      )}
                      <span className="capitalize">{member.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium capitalize ${
                        member.status === "active"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member.status === "active"
                            ? "bg-accent-emerald"
                            : "bg-accent-amber"
                        }`}
                      />
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[14px]">{member.lastActive}</div>
                    <div className="text-[12px] text-text-muted mt-0.5">
                      {member.generations} gens
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {member.role !== "owner" && (
                           <>
                           <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-tertiary hover:text-white transition-colors" title="Settings">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </button>
                             <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors" title="Remove">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                           </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4 text-text-muted">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-8 h-8"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-1">No members found</h3>
              <p className="text-text-secondary">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[480px] bg-bg-secondary border border-border-color rounded-3xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-border-color">
              <h2 className="text-xl font-bold">Invite New Member</h2>
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
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border-color rounded-xl text-text-primary text-[15px] focus:outline-none focus:border-accent-indigo focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all placeholder:text-text-muted"
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Member", "Admin", "Viewer"].map((role) => (
                    <button
                      key={role}
                      className="px-2 py-3 rounded-xl bg-bg-tertiary border border-border-color text-sm font-medium text-text-secondary hover:text-white hover:border-border-hover transition-colors text-center"
                    >
                      {role}
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-indigo to-accent-purple text-white font-bold text-sm transition-all hover:shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:-translate-y-0.5"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
