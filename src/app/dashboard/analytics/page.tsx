"use client";

import { useState, useEffect } from "react";

export default function AnalyticsPage() {
  const [animatedValues, setAnimatedValues] = useState({
    generations: 0,
    timeSaved: 0,
    projects: 0,
    teamMembers: 0,
  });

  useEffect(() => {
    // Animate numbers on mount
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const animate = (key: keyof typeof animatedValues, target: number) => {
      let current = 0;
      const increment = target / steps;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedValues((prev) => ({ ...prev, [key]: Math.floor(current) }));
      }, interval);
    };

    animate("generations", 1247);
    animate("timeSaved", 156);
    animate("projects", 89);
    animate("teamMembers", 12);
  }, []);

  const chartData = {
    generations: [42, 58, 45, 67, 89, 102, 124],
    timeSaved: [12, 18, 15, 22, 28, 35, 42],
    projects: [8, 12, 15, 18, 22, 28, 35],
  };

  const maxValue = Math.max(...chartData.generations);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Analytics</h1>
          <p className="text-text-secondary text-sm">
            Track your content creation performance
          </p>
        </div>
        <div className="flex gap-3">
          <select className="px-4 py-2 rounded-xl border border-border-color bg-bg-secondary text-white text-sm focus:outline-none focus:border-accent-indigo">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Generations",
            value: animatedValues.generations.toLocaleString(),
            change: "+24%",
            trend: "up",
            icon: "⚡",
            bgClass: "bg-accent-indigo/10",
          },
          {
            label: "Time Saved (hours)",
            value: animatedValues.timeSaved,
            change: "+18%",
            trend: "up",
            icon: "⏱️",
            bgClass: "bg-accent-emerald/10",
          },
          {
            label: "Projects Created",
            value: animatedValues.projects,
            change: "+12%",
            trend: "up",
            icon: "📁",
            bgClass: "bg-accent-amber/10",
          },
          {
            label: "Team Members",
            value: animatedValues.teamMembers,
            change: "+2",
            trend: "up",
            icon: "👥",
            bgClass: "bg-accent-purple/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-bg-secondary border border-border-color rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgClass} flex items-center justify-center text-2xl`}
              >
                {stat.icon}
              </div>
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  stat.trend === "up" ? "text-accent-emerald" : "text-accent-red"
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
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generations Chart */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Generations Over Time</h3>
              <p className="text-sm text-text-muted">Last 7 days</p>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.generations.map((value, i) => {
              const height = (value / maxValue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-accent-indigo to-accent-purple rounded-t-lg transition-all duration-1000 ease-out hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        animation: `growUp 1s ease-out ${i * 0.1}s both`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-muted">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Saved Chart */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Time Saved</h3>
              <p className="text-sm text-text-muted">Hours per day</p>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.timeSaved.map((value, i) => {
              const maxTime = Math.max(...chartData.timeSaved);
              const height = (value / maxTime) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-accent-emerald to-accent-blue rounded-t-lg transition-all duration-1000 ease-out hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        animation: `growUp 1s ease-out ${i * 0.1}s both`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-muted">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Content Type Distribution</h3>
          <div className="space-y-4">
            {[
              { type: "Videos", percentage: 45, gradient: "from-accent-indigo to-accent-purple" },
              { type: "Images", percentage: 28, gradient: "from-accent-orange to-accent-red" },
              { type: "Voice", percentage: 15, gradient: "from-accent-purple to-accent-pink" },
              { type: "Scripts", percentage: 12, gradient: "from-accent-emerald to-accent-blue" },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.type}</span>
                  <span className="text-sm text-text-muted">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${item.gradient} rounded-full transition-all duration-1000 ease-out`}
                    style={{
                      width: `${item.percentage}%`,
                      animation: `slideIn 1s ease-out ${i * 0.2}s both`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-bg-secondary border border-border-color rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: "Video generated", user: "You", time: "2 min ago", icon: "🎬" },
              { action: "Image created", user: "Sarah", time: "15 min ago", icon: "🖼️" },
              { action: "Script written", user: "Mike", time: "1 hour ago", icon: "📝" },
              { action: "Voice generated", user: "You", time: "2 hours ago", icon: "🎙️" },
              { action: "Project shared", user: "David", time: "3 hours ago", icon: "📤" },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary hover:bg-bg-primary transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-indigo/10 flex items-center justify-center text-xl">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {activity.action} by {activity.user}
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
