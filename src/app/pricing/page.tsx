"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CTA from "@/components/home/CTA";
import { useState } from "react";

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const prices = {
    starter: { monthly: 29, yearly: 24 },
    pro: { monthly: 99, yearly: 82 },
  };

  return (
    <>
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 text-center">
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-[clamp(36px,5vw,56px)] font-extrabold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-text-secondary mb-10">
              Start free, scale as you grow. No hidden fees.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-bg-secondary border border-border-color rounded-2xl p-2 mb-16">
              <button
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  billing === "monthly"
                    ? "bg-white text-black"
                    : "text-text-secondary hover:text-white"
                }`}
                onClick={() => setBilling("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  billing === "yearly"
                    ? "bg-white text-black"
                    : "text-text-secondary hover:text-white"
                }`}
                onClick={() => setBilling("yearly")}
              >
                Yearly
                <span className="bg-[#10b9811a] text-accent-emerald text-xs font-bold px-2.5 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
              {/* Free */}
              <div className="bg-bg-secondary border border-border-color rounded-3xl p-8 transition-all hover:border-border-hover hover:-translate-y-1 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center mb-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-6 h-6 text-white"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-text-secondary text-sm mb-5">
                  Try the platform
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold">$0</span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
                <a
                  href="/signup"
                  className="block w-full py-3.5 rounded-xl font-bold text-center bg-bg-tertiary border border-border-color text-white mb-6 transition-all hover:bg-white/5"
                >
                  Get Started
                </a>
                <ul className="space-y-3">
                  {[
                    "10 generations/month",
                    "720p resolution",
                    "5 second max duration",
                    "Community support",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-text-secondary"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4 text-accent-emerald flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Starter */}
              <div className="bg-bg-secondary border border-border-color rounded-3xl p-8 transition-all hover:border-border-hover hover:-translate-y-1 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-6 h-6 text-white"
                  >
                    <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <p className="text-text-secondary text-sm mb-5">
                  For individuals
                </p>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold">
                    ${billing === "monthly" ? prices.starter.monthly : prices.starter.yearly}
                  </span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
                <a
                  href="/signup"
                  className="block w-full py-3.5 rounded-xl font-bold text-center bg-bg-tertiary border border-border-color text-white mb-6 transition-all hover:bg-white/5"
                >
                  Start Free Trial
                </a>
                <ul className="space-y-3">
                  {[
                    "100 generations/month",
                    "1080p resolution",
                    "15 second max duration",
                    "3 team members",
                    "Email support",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-text-secondary"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4 text-accent-emerald flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Professional */}
              <div className="bg-bg-secondary border border-accent-indigo rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] text-left relative transform scale-105">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  Most Popular
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center mb-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-6 h-6 text-white"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <p className="text-text-secondary text-sm mb-5">For teams</p>
                <div className="mb-6">
                  <span className="text-5xl font-extrabold">
                    ${billing === "monthly" ? prices.pro.monthly : prices.pro.yearly}
                  </span>
                  <span className="text-text-muted text-sm">/month</span>
                </div>
                <a
                  href="/signup"
                  className="block w-full py-3.5 rounded-xl font-bold text-center bg-gradient-to-r from-accent-indigo to-accent-purple text-white mb-6 transition-all hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)]"
                >
                  Start Free Trial
                </a>
                <ul className="space-y-3">
                  {[
                    "500 generations/month",
                    "4K resolution",
                    "60 second max duration",
                    "10 team members",
                    "API access",
                    "Priority support",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-text-secondary"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4 text-accent-emerald flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Enterprise */}
              <div className="bg-bg-secondary border border-border-color rounded-3xl p-8 transition-all hover:border-border-hover hover:-translate-y-1 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-6 h-6 text-white"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-text-secondary text-sm mb-5">
                  For organizations
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-secondary">
                    Custom
                  </span>
                </div>
                <a
                  href="#"
                  className="block w-full py-3.5 rounded-xl font-bold text-center bg-bg-tertiary border border-border-color text-white mb-6 transition-all hover:bg-white/5"
                >
                  Contact Sales
                </a>
                <ul className="space-y-3">
                  {[
                    "Unlimited generations",
                    "4K resolution",
                    "5 minute max duration",
                    "Unlimited team members",
                    "Custom branding",
                    "SSO & dedicated support",
                  ].map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-sm text-text-secondary"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4 text-accent-emerald flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-text-secondary mb-12">
              Everything you need to know about our pricing
            </p>

            <div className="space-y-4 text-left">
              {[
                {
                  q: "Can I try before I buy?",
                  a: "Yes! Our free tier gives you 10 generations per month to try the platform. All paid plans also include a 14-day free trial with full access to all features.",
                },
                {
                  q: "What counts as a generation?",
                  a: "One generation equals one output from any of our AI tools. This could be a video, an image, a voiceover, or a script. Each time you create something new, it counts as one generation.",
                },
                {
                  q: "Can I change plans anytime?",
                  a: "Absolutely! You can upgrade, downgrade, or cancel your plan at any time. When you upgrade, you get immediate access to new features. When you downgrade, changes take effect at the end of your billing cycle.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group bg-bg-secondary border border-border-color rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold group-hover:text-accent-indigo transition-colors">
                    {faq.q}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-text-secondary leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
