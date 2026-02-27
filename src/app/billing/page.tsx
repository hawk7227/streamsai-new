"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_CONFIGS, type PlanKey } from "@/lib/plans";
import type { BillingInterval } from "@/lib/stripe/prices";

export default function BillingPage() {
  const { user, profile, plan, limits, workspaceLoading } = useAuth();
  const [billing, setBilling] = useState<BillingInterval>("monthly");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ current_month: number } | null>(null);

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (e) {
      console.error("[Billing] Usage fetch failed:", e);
    }
  }, []);

  useEffect(() => { loadUsage(); }, [loadUsage]);

  const handleSubscribe = async (planKey: PlanKey) => {
    if (planKey === "free" || planKey === "enterprise") return;
    setSubscribing(planKey);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "No checkout URL returned");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      console.error("[Billing] Checkout error:", e);
    } finally {
      setSubscribing(null);
    }
  };

  const handleManagePortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || "No portal URL");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Portal failed");
      console.error("[Billing] Portal error:", e);
    }
  };

  if (workspaceLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const currentPlan = plan?.key || "free";
  const monthlyGens = usage?.current_month ?? 0;
  const limit = limits?.generationsPerMonth;
  const limitNum = typeof limit === "number" ? limit : null;
  const usagePct = limitNum ? Math.min(100, (monthlyGens / limitNum) * 100) : 0;

  const planOrder: PlanKey[] = ["free", "starter", "professional", "enterprise"];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 4 }}>Billing</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage your plan and usage</p>
      </div>

      {error && (
        <div style={{ background: "#ef444420", border: "1px solid #ef4444", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: "0.8rem", color: "#ef4444" }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: "right", background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Usage */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Usage This Month</h2>
          {currentPlan !== "free" && (
            <button onClick={handleManagePortal} style={{ fontSize: "0.8rem", color: "var(--accent)", background: "transparent", border: "none", cursor: "pointer" }}>
              Manage Subscription →
            </button>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 6 }}>
          <span style={{ color: "var(--text-secondary)" }}>Generations</span>
          <span style={{ fontWeight: 600 }}>{monthlyGens}{limitNum ? ` / ${limitNum}` : " (unlimited)"}</span>
        </div>
        {limitNum && (
          <div style={{ height: 8, background: "var(--bg-tertiary)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${usagePct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: 4, transition: "width 0.3s" }} />
          </div>
        )}
      </div>

      {/* Billing toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-secondary)", borderRadius: 8, padding: 3 }}>
          {(["monthly", "yearly"] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)} style={{
              padding: "8px 20px", borderRadius: 6, fontSize: "0.85rem", fontWeight: 500, border: "none",
              background: billing === b ? "var(--accent)" : "transparent",
              color: billing === b ? "white" : "var(--text-secondary)", cursor: "pointer",
            }}>
              {b === "monthly" ? "Monthly" : "Yearly (save 17%)"}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {planOrder.map((key) => {
          const plan = PLAN_CONFIGS[key];
          const isCurrent = key === currentPlan;
          const price = billing === "monthly" ? plan.prices.monthly : plan.prices.yearly;
          return (
            <div key={key} style={{
              background: "var(--bg-secondary)", borderRadius: 12, padding: 24, position: "relative",
              border: plan.isPopular ? "2px solid var(--accent)" : "1px solid var(--border)",
            }}>
              {plan.isPopular && (
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "white", fontSize: "0.65rem", fontWeight: 600, padding: "3px 12px", borderRadius: 10 }}>POPULAR</div>
              )}
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 12, minHeight: 36 }}>{plan.description}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 16 }}>
                {price === null ? "Custom" : price === 0 ? "Free" : `$${price}`}
                {price !== null && price > 0 && <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>/{billing === "monthly" ? "mo" : "yr"}</span>}
              </div>
              <div style={{ marginBottom: 20 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ fontSize: "0.75rem", color: "var(--text-secondary)", padding: "3px 0" }}>✓ {f}</div>
                ))}
              </div>
              {isCurrent ? (
                <div style={{ padding: "10px 20px", borderRadius: 8, background: "var(--bg-tertiary)", textAlign: "center", fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>Current Plan</div>
              ) : key === "enterprise" ? (
                <button onClick={() => window.open("mailto:sales@streamsai.com")} style={{ width: "100%", padding: "10px 20px", borderRadius: 8, background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", border: "none" }}>Contact Sales</button>
              ) : key === "free" ? null : (
                <button onClick={() => handleSubscribe(key)} disabled={!!subscribing} style={{
                  width: "100%", padding: "10px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", border: "none",
                  background: plan.isPopular ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--bg-tertiary)",
                  color: plan.isPopular ? "white" : "var(--text-primary)", opacity: subscribing ? 0.7 : 1,
                }}>
                  {subscribing === key ? "Redirecting..." : plan.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
