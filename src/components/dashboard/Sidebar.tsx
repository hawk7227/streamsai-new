"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ALL_PLANS, PLAN_ORDER, type PlanKey } from "@/lib/plans";

export default function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { user, signOut, plan, limits, usage, usageLoading, membershipRole } =
    useAuth();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutError, setCheckoutError] = useState("");
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const isActive = (path: string) => pathname === path;
  const currentPlanKey = plan?.key ?? "free";
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlanKey);

  const availablePlans = useMemo(() => ALL_PLANS, []);
  const generationLimit = usage?.limit ?? limits?.generationsPerMonth ?? 0;
  const isSettingsLocked = membershipRole === "member";
  const generationsUsed = usage?.used ?? 0;
  const isUnlimited = generationLimit === "unlimited";
  const displayLimit = isUnlimited ? "Unlimited" : generationLimit;
  const usagePercent = isUnlimited
    ? 100
    : typeof generationLimit === "number" && generationLimit > 0
    ? Math.min(100, (generationsUsed / generationLimit) * 100)
    : 0;
  const usageText = usageLoading
    ? "..."
    : `${generationsUsed} / ${displayLimit}`;

  const handleCheckout = async (planKey: PlanKey) => {
    setCheckoutError("");
    setPendingPlan(planKey);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billing }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to start checkout");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Missing checkout session URL");
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Unable to start checkout"
      );
      setPendingPlan(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to open billing portal");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Missing portal URL");
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Unable to open billing portal"
      );
      setPortalLoading(false);
    }
  };

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
        className={`fixed top-0 left-0 bottom-0 ${collapsed ? "w-[48px]" : "w-[260px]"} bg-bg-secondary border-r border-border-color flex flex-col z-50 transition-all duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className={`${collapsed ? "p-2" : "p-5"} border-b border-border-color flex items-center justify-between`}>
          <Link href="/" className={`flex items-center ${collapsed ? "justify-center w-full" : "gap-3"}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-accent-indigo to-accent-purple rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" />
              </svg>
            </div>
            {!collapsed && <span className="text-xl font-bold">StreamsAI</span>}
          </Link>
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-6 h-6 items-center justify-center rounded-md hover:bg-bg-tertiary text-text-muted transition-colors"
              title="Collapse sidebar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full py-2 items-center justify-center hover:bg-bg-tertiary text-text-muted transition-colors"
            title="Expand sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        )}

        <nav className={`flex-1 ${collapsed ? "p-1" : "p-3"} overflow-y-auto space-y-5 ${collapsed ? "overflow-x-hidden" : ""}`}>
          {/* Top links */}
          <div className="space-y-1">
            {[
              { name: "Dashboard", href: "/dashboard", icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></> },
              { name: "Generate", href: "/dashboard/generate", icon: <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" /> },
              { name: "Pipelines", href: "/pipelines", icon: <><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></> },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] overflow-hidden font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-accent/10 text-accent"
                    : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</svg>
                {item.name}
              </Link>
            ))}
          </div>

          {/* Content Generation */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted overflow-hidden whitespace-nowrap">
              Content Generation
            </div>
            <div className="space-y-0.5">
              {[
                { name: "Script Writer", desc: "Claude, GPT-4", href: "/dashboard/script", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></> },
                { name: "Voice Generator", desc: "ElevenLabs, OpenAI TTS", href: "/dashboard/voice", icon: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></> },
                { name: "Image Generator", desc: "DALL-E 3, FLUX, Stability", href: "/dashboard/image", icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></> },
                { name: "Video Generator", desc: "Veo 3, Sora, Runway", href: "/dashboard/video", icon: <><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></> },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[8px] transition-colors overflow-hidden ${
                    isActive(item.href)
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</svg>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium leading-tight">{item.name}</div>
                    <div className="text-[10px] text-text-muted leading-tight truncate">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted overflow-hidden whitespace-nowrap">
              Content
            </div>
            <div className="space-y-0.5">
              {[
                { name: "History", href: "/dashboard/renders", icon: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> },
                { name: "Library", href: "/dashboard/library", icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /> },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] overflow-hidden font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</svg>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Post-Processing */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted overflow-hidden whitespace-nowrap">
              Post-Processing
            </div>
            <div className="space-y-0.5">
              {[
                { name: "Video Editor", desc: "JSON2Video, Shotstack", href: "/dashboard/editor", icon: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></> },
                { name: "Image Editor", desc: "Resize, filter, watermark", href: "/dashboard/compose", icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></> },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[8px] transition-colors overflow-hidden ${
                    isActive(item.href)
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</svg>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium leading-tight">{item.name}</div>
                    <div className="text-[10px] text-text-muted leading-tight truncate">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted overflow-hidden whitespace-nowrap">
              Actions
            </div>
            <div className="space-y-0.5">
              {[
                { name: "Export", desc: "Save to library / download", href: "/dashboard/preview", icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></> },
                { name: "Webhook", desc: "Send to external service", href: "/dashboard/settings", icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></> },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[8px] transition-colors overflow-hidden ${
                    isActive(item.href)
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</svg>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium leading-tight">{item.name}</div>
                    <div className="text-[10px] text-text-muted leading-tight truncate">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* System */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted overflow-hidden whitespace-nowrap">
              System
            </div>
            <div className="space-y-0.5">
              {[
                { name: "Integrations", href: "/dashboard/analytics" },
                { name: "Settings", href: "/dashboard/settings" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-[13px] overflow-hidden font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-white"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] flex-shrink-0">
                    {item.name === "Integrations" && <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>}
                    {item.name === "Settings" && <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></>}
                  </svg>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className={`${collapsed ? "p-1" : "p-3"} border-t border-border-color overflow-hidden`}>
          {!collapsed && (
            <div className="bg-bg-tertiary rounded-lg p-3 mb-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">
                Credits
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[18px] font-bold">{generationsUsed}</span>
                <span className="text-[13px] text-text-muted">{typeof generationLimit === 'number' ? generationLimit.toLocaleString() : generationLimit}</span>
              </div>
              <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-indigo to-accent-purple"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center py-1 text-[10px] font-bold text-text-muted" title={`${generationsUsed} / ${generationLimit}`}>
              {generationsUsed}
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsPlanModalOpen(true)}
            className={`w-full flex items-center justify-center ${collapsed ? "p-2" : "gap-2 p-2.5"} bg-gradient-to-r from-accent-indigo to-accent-purple text-white rounded-[10px] text-[13px] font-semibold transition-all hover:shadow-[0_4px_15px_rgba(99,102,241,0.3)]`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4 flex-shrink-0"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {!collapsed && "View Plans"}
          </button>
        </div>
      </aside>

      {isPlanModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsPlanModalOpen(false)}
            className="absolute inset-0 bg-black/60"
            aria-label="Close plan dialog"
          />
          <div className="relative w-full max-w-4xl mx-4 bg-bg-secondary border border-border-color rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-color">
              <div>
                <h2 className="text-xl font-semibold">Plans & Billing</h2>
                <p className="text-sm text-text-secondary">
                  Choose a plan to upgrade your account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="text-text-muted hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-bg-tertiary border border-border-color rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    billing === "monthly"
                      ? "bg-white text-black"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("yearly")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${
                    billing === "yearly"
                      ? "bg-white text-black"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  Yearly
                </button>
              </div>
              {user && currentPlanKey !== "free" && (
                <button
                  type="button"
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="px-4 py-2 rounded-lg border border-border-color text-sm font-medium text-text-secondary hover:text-white hover:border-border-hover disabled:opacity-60"
                >
                  {portalLoading ? "Opening..." : "Manage Billing"}
                </button>
              )}
            </div>

            {checkoutError && (
              <p className="px-6 text-sm text-accent-red mb-4">{checkoutError}</p>
            )}

            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availablePlans.map((planOption) => {
                const price = planOption.prices[billing];
                const isCustom = price === null;
                const isCurrent = planOption.key === currentPlanKey;
                const isUpgrade =
                  PLAN_ORDER.indexOf(planOption.key) > currentPlanIndex;
                const isPending = pendingPlan === planOption.key;
                const canCheckout =
                  !!user && isUpgrade && !isCustom && planOption.key !== "enterprise";

                return (
                  <div
                    key={planOption.key}
                    className={`border rounded-2xl p-4 ${
                      isCurrent
                        ? "border-accent-indigo bg-bg-tertiary"
                        : "border-border-color bg-bg-tertiary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{planOption.name}</h3>
                      {isCurrent && (
                        <span className="text-[11px] font-semibold text-accent-indigo">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mb-3">
                      {planOption.description}
                    </p>
                    <div className="mb-3">
                      {isCustom ? (
                        <span className="text-sm text-text-muted">Custom pricing</span>
                      ) : (
                        <span className="text-2xl font-bold">${price}</span>
                      )}
                      {!isCustom && (
                        <span className="text-xs text-text-muted">/mo</span>
                      )}
                    </div>
                    <ul className="space-y-1.5 text-xs text-text-secondary mb-4">
                      {planOption.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <span className="text-accent-emerald">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2 rounded-lg bg-bg-primary text-xs font-semibold text-text-muted cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : planOption.key === "enterprise" ? (
                      <a
                        href={planOption.ctaHref}
                        className="w-full block text-center py-2 rounded-lg border border-border-color text-xs font-semibold text-text-secondary hover:text-white hover:border-border-hover"
                      >
                        Contact Sales
                      </a>
                    ) : canCheckout ? (
                      <button
                        type="button"
                        onClick={() => handleCheckout(planOption.key)}
                        disabled={isPending}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-accent-indigo to-accent-purple text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {isPending ? "Redirecting..." : "Upgrade"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePortal}
                        className="w-full py-2 rounded-lg border border-border-color text-xs font-semibold text-text-secondary hover:text-white hover:border-border-hover"
                      >
                        Manage Billing
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
