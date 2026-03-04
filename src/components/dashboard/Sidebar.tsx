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


  // ── Nav helper ──
  const navItem = (item: { name: string; href: string; icon: string; badge?: string }) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.name}
        href={item.href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          padding: collapsed ? "8px 0" : "8px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          fontSize: "11.5px",
          fontWeight: 500,
          color: active ? "var(--color-acc)" : "var(--color-t-3)",
          background: active ? "var(--color-acc-glow)" : "transparent",
          borderLeft: `2px solid ${active ? "var(--color-acc)" : "transparent"}`,
          cursor: "pointer",
          transition: "all 150ms",
          textDecoration: "none",
        }}
        title={collapsed ? item.name : undefined}
      >
        <span style={{ fontStyle: "normal", fontSize: 13, width: 18, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
        {!collapsed && <span>{item.name}</span>}
        {!collapsed && item.badge && (
          <span style={{
            marginLeft: "auto", fontSize: 8, padding: "1px 5px", borderRadius: 4, fontWeight: 700,
            background: "rgba(0,136,255,0.12)", color: "var(--color-blu)",
          }}>{item.badge}</span>
        )}
      </Link>
    );
  };

  const sectionLabel = (label: string) => {
    if (collapsed) return null;
    return (
      <div style={{ padding: "14px 16px 4px", fontSize: "7.5px", fontWeight: 700, color: "var(--color-t-4)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
        {label}
      </div>
    );
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
        className={`fixed top-0 left-0 bottom-0 flex flex-col z-50 transition-all duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: collapsed ? 48 : 220,
          minWidth: collapsed ? 48 : 220,
          background: "var(--color-bg-1)",
          borderRight: "1px solid var(--color-bdr)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5" style={{ padding: collapsed ? "12px 8px" : "16px", borderBottom: "1px solid var(--color-bdr)" }}>
          <div
            className="flex-shrink-0 grid place-items-center font-black"
            style={{
              width: 28, height: 28, borderRadius: 8, fontSize: 11,
              background: "linear-gradient(135deg, var(--color-acc), var(--color-blu))",
              color: "#000",
            }}
          >▶</div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.3px" }}>StreamsAI</div>
              <div style={{ fontSize: 8, fontWeight: 500, color: "var(--color-t-3)", letterSpacing: "0.03em" }}>VIDEO ENGINE</div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block"
              title="Collapse sidebar"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-t-3)", fontSize: 11, padding: 0 }}
            >{"\u00AB"}</button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center py-2"
            title="Expand sidebar"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-t-3)", fontSize: 11 }}
          >{"\u00BB"}</button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: collapsed ? "4px 0" : "8px 0" }}>
          {sectionLabel("Create")}
          {navItem({ name: "AI Media Studio", href: "/dashboard/generate", icon: "✦", badge: "10 tools" })}
          {navItem({ name: "Composition Studio", href: "/dashboard/compose", icon: "🎬" })}
          {navItem({ name: "Preview", href: "/dashboard/preview", icon: "👁" })}
          {navItem({ name: "Video Editor", href: "/dashboard/editor", icon: "✂️" })}
          {navItem({ name: "Script Editor", href: "/dashboard/script", icon: "📝" })}
          {navItem({ name: "Characters", href: "/dashboard/characters", icon: "👤" })}

          {sectionLabel("Pipeline")}
          {navItem({ name: "Pipelines", href: "/pipelines", icon: "⬡" })}

          {sectionLabel("Dashboard")}
          {navItem({ name: "Renders", href: "/dashboard/renders", icon: "◫", badge: "3 active" })}
          {navItem({ name: "Library", href: "/dashboard/library", icon: "📁" })}

          {sectionLabel("Connect")}
          {navItem({ name: "Integrations", href: "/dashboard/integrations", icon: "🔌" })}
          {navItem({ name: "Social Posting", href: "/dashboard/social", icon: "📤" })}

          {sectionLabel("System")}
          {navItem({ name: "System Status", href: "/system-status", icon: "🩺" })}
          {navItem({ name: "Settings", href: "/dashboard/settings", icon: "⚙️" })}
          {navItem({ name: "AI Copilot", href: "/dashboard/copilot", icon: "🤖" })}
        </nav>

        {/* Footer — Credits */}
        <div style={{ padding: collapsed ? "8px 6px" : "12px 16px", borderTop: "1px solid var(--color-bdr)" }}>
          {!collapsed ? (
            <>
              <div style={{ fontSize: 8, fontWeight: 600, color: "var(--color-t-3)", marginBottom: 4 }}>CREDITS</div>
              <div style={{ height: 3, background: "var(--color-bg-5)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, var(--color-acc), var(--color-blu))", borderRadius: 2, width: `${usagePercent}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--color-t-3)", fontWeight: 600 }}>
                <span>{generationsUsed.toLocaleString()}</span>
                <span>{typeof generationLimit === "number" ? generationLimit.toLocaleString() : generationLimit}</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", fontSize: 8, fontWeight: 700, color: "var(--color-t-3)" }} title={`${generationsUsed} / ${generationLimit}`}>
              {generationsUsed}
            </div>
          )}
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
