import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Good morning, Marcus 👋</h1>
          <p className="text-text-secondary text-sm">
            Here's what's happening with your content today.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-bg-secondary border border-border-color rounded-xl font-semibold text-sm transition-all hover:bg-bg-tertiary hover:border-border-hover text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-[18px] h-[18px]"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search
          </button>
          <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent-indigo to-accent-purple text-white rounded-xl font-semibold text-sm transition-all hover:shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:-translate-y-0.5">
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
            Create New
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            title: "Create Video",
            desc: "Generate AI videos from text",
            href: "/dashboard/video",
            icon: (
              <>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </>
            ),
            bg: "bg-gradient-to-br from-accent-indigo to-accent-blue",
          },
          {
            title: "Generate Voice",
            desc: "Natural text-to-speech",
            href: "/dashboard/voice",
            icon: (
              <>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </>
            ),
            bg: "bg-gradient-to-br from-accent-purple to-accent-pink",
          },
          {
            title: "Create Image",
            desc: "AI image generation",
            href: "/dashboard/image",
            icon: (
              <>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </>
            ),
            bg: "bg-gradient-to-br from-[#f97316] to-[#ef4444]",
          },
          {
            title: "Write Script",
            desc: "AI copywriting assistant",
            href: "/dashboard/script",
            icon: (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </>
            ),
            bg: "bg-gradient-to-br from-accent-emerald to-[#14b8a6]",
          },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="group bg-bg-secondary border border-border-color rounded-2xl p-6 cursor-pointer transition-all hover:border-border-hover hover:-translate-y-0.5 hover:shadow-lg block"
          >
            <div
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 text-white ${action.bg}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6"
              >
                {action.icon}
              </svg>
            </div>
            <h3 className="font-semibold mb-1">{action.title}</h3>
            <p className="text-[13px] text-text-muted">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Generations this month",
            value: "42",
            trend: "+12%",
            trendUp: true,
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
            color: "text-accent-indigo",
            bg: "bg-accent-indigo/10",
          },
          {
            label: "Time saved",
            value: "2.4h",
            trend: "+8%",
            trendUp: true,
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            color: "text-accent-emerald",
            bg: "bg-accent-emerald/10",
          },
          {
            label: "Projects created",
            value: "24",
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            ),
            color: "text-accent-amber",
            bg: "bg-[#f59e0b1a]", // accent-amber with low opacity
          },
          {
            label: "Team members",
            value: "4",
            icon: (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            ),
            color: "text-accent-purple",
            bg: "bg-accent-purple/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-bg-secondary border border-border-color rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${stat.bg} ${stat.color}`}
              >
                <div className="w-5 h-5">{stat.icon}</div>
              </div>
              {stat.trend && (
                <span
                  className={`flex items-center gap-1 text-[13px] font-medium ${
                    stat.trendUp ? "text-accent-emerald" : "text-accent-red"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  </svg>
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="text-[28px] font-bold mb-1">{stat.value}</div>
            <div className="text-[13px] text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* Recent Projects */}
        <div className="bg-bg-secondary border border-border-color rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border-color">
            <h3 className="font-semibold">Recent Projects</h3>
            <a
              href="#"
              className="text-[13px] font-medium text-accent-indigo hover:underline"
            >
              View all →
            </a>
          </div>
          <div className="p-3 space-y-1">
            {[
              {
                name: "Product Launch Video",
                time: "2 hours ago",
                meta: "30 sec",
                type: "Video",
                typeClass: "bg-accent-indigo/10 text-[#a5b4fc]",
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                ),
              },
              {
                name: "Podcast Intro Voiceover",
                time: "5 hours ago",
                meta: "1:20 min",
                type: "Voice",
                typeClass: "bg-accent-purple/10 text-[#d8b4fe]",
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                ),
              },
              {
                name: "Social Media Posts",
                time: "Yesterday",
                meta: "5 images",
                type: "Image",
                typeClass: "bg-[#f97316]/10 text-[#fdba74]",
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ),
              },
              {
                name: "Blog Post Outline",
                time: "2 days ago",
                meta: "850 words",
                type: "Script",
                typeClass: "bg-accent-emerald/10 text-[#6ee7b7]",
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                ),
              },
            ].map((project, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-bg-tertiary transition-colors cursor-pointer group"
              >
                <div className="w-16 h-12 rounded-lg bg-bg-tertiary group-hover:bg-bg-primary flex items-center justify-center flex-shrink-0 text-text-muted transition-colors">
                  <div className="w-6 h-6">{project.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 truncate">
                    {project.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-3.5 h-3.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {project.time}
                    </span>
                    <span>{project.meta}</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${project.typeClass}`}
                >
                  {project.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-bg-secondary border border-border-color rounded-[20px] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border-color">
            <h3 className="font-semibold">Activity</h3>
          </div>
          <div className="p-3 space-y-2">
            {[
              {
                text: "Sarah created a new video",
                time: "10 mins ago",
                iconClass: "bg-accent-indigo/10 text-accent-indigo",
                icon: (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                     <polygon points="23 7 16 12 23 17 23 7" />
                     <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                ),
              },
              {
                 text: "Mike invited 2 team members",
                 time: "1 hour ago",
                 iconClass: "bg-accent-blue/10 text-accent-blue",
                 icon: (
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                 )
              },
              {
                text: "David exported 5 images",
                time: "3 hours ago",
                iconClass: "bg-[#f97316]/10 text-[#f97316]",
                icon: (
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                )
              },
               {
                text: "Project X script updated",
                time: "5 hours ago",
                iconClass: "bg-accent-emerald/10 text-accent-emerald",
                icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                )
              }
            ].map((activity, i) => (
              <div key={i} className="flex gap-3 p-3">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${activity.iconClass}`}>
                  <div className="w-4.5 h-4.5">{activity.icon}</div>
                </div>
                <div>
                   <p className="text-[13px] mb-0.5">
                       {activity.text.split(' ').map((word, idx) => {
                           if (['Sarah', 'Mike', 'David'].includes(word) || word === 'video' || word.includes('images') || word.includes('script') || word.includes('members')) {
                               return <strong key={idx} className="font-semibold">{word} </strong>
                           }
                           return word + ' ';
                       })}
                   </p>
                   <p className="text-xs text-text-muted">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
