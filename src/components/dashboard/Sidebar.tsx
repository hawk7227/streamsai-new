"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-[260px] bg-bg-secondary border-r border-border-color flex flex-col z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-border-color">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-indigo to-accent-purple rounded-xl flex items-center justify-center text-white">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5"
              >
                <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" />
              </svg>
            </div>
            <span className="text-xl font-bold">StreamsAI</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Create
            </div>
            <div className="space-y-1">
              {[
                {
                  name: "Video",
                  href: "/dashboard/video",
                  icon: (
                    <>
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" />
                    </>
                  ),
                },
                {
                  name: "Images",
                  href: "/dashboard/image",
                  icon: (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </>
                  ),
                },
                {
                  name: "Voice",
                  href: "/dashboard/voice",
                  icon: (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </>
                  ),
                },
                {
                  name: "Scripts",
                  href: "/dashboard/script",
                  icon: (
                    <>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </>
                  ),
                },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-accent-indigo/10 text-accent-indigo"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5"
                  >
                    {item.icon}
                  </svg>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Workspace
            </div>
            <div className="space-y-1">
              {[
                {
                  name: "Dashboard",
                  href: "/dashboard",
                  icon: (
                    <rect x="3" y="3" width="7" height="7" />,
                    (
                      <>
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </>
                    )
                  ),
                },
                {
                  name: "Library",
                  href: "/dashboard/library",
                  icon: (
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  ),
                  badge: "24",
                },
                {
                  name: "Team",
                  href: "/dashboard/team",
                  icon: (
                    <>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </>
                  ),
                },
                {
                  name: "Agency",
                  href: "/dashboard/agency",
                  icon: (
                   <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-14l6-3 6 3v14" />
                  ),
                   // Using simple building icon for now as agency icon wasn't clear in list
                   // Actually agency isn't in main list, but I adding it for nav
                },
                {
                  name: "Analytics",
                  href: "/dashboard/analytics",
                  icon: (
                    <>
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </>
                  ),
                },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-accent-indigo/10 text-accent-indigo"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5 flex-shrink-0"
                  >
                    {item.name === "Dashboard" && (
                        <>
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </>
                    )}
                     {item.name === "Library" && (
                         <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                     )}
                      {item.name === "Team" && (
                         <>
                         <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                         <circle cx="9" cy="7" r="4" />
                         <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                         <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                       </>
                      )}
                      {item.name === "Agency" && (
                           <>
                           <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                           </>
                      )}
                      {item.name === "Analytics" && (
                          <>
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </>
                      )}
                  </svg>
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-accent-indigo text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Account
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm font-medium transition-colors ${
                  isActive("/dashboard/settings")
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </Link>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Help
              </a>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-white text-left"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-border-color">
          <div className="bg-bg-tertiary rounded-xl p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] text-text-secondary">
                Generations Used
              </span>
              <span className="text-[13px] font-semibold">42 / 100</span>
            </div>
            <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-indigo to-accent-purple"
                style={{ width: "42%" }}
              />
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 p-2.5 bg-gradient-to-r from-accent-indigo to-accent-purple text-white rounded-[10px] text-[13px] font-semibold transition-all hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Upgrade to Pro
          </button>
        </div>
      </aside>
    </>
  );
}
