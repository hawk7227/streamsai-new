"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0fa0] backdrop-blur-[20px] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-indigo to-accent-purple rounded-xl flex items-center justify-center text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">StreamsAI</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/features"
            className="text-text-secondary font-medium hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-text-secondary font-medium hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/products"
            className="text-text-secondary font-medium hover:text-white transition-colors"
          >
            Products
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-text-secondary hover:text-text-primary px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-gradient-to-r from-accent-indigo to-accent-purple text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 flex items-center gap-2"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex w-10 h-10 items-center justify-center text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-bg-secondary border-t border-border-color absolute top-full left-0 right-0 p-4 flex flex-col gap-4 shadow-2xl">
          <Link
            href="/features"
            className="text-text-secondary font-medium hover:text-white py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-text-secondary font-medium hover:text-white py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/products"
            className="text-text-secondary font-medium hover:text-white py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Products
          </Link>
          <hr className="border-border-color my-2" />
          <Link
            href="/login"
            className="text-text-secondary hover:text-white py-2 font-semibold"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-gradient-to-r from-accent-indigo to-accent-purple text-white px-6 py-3 rounded-xl font-semibold text-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
