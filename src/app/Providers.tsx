"use client";

import React from "react";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * Client-only global providers.
 *
 * Next.js can prerender /dashboard/* pages at build time. Those pages use the
 * Dashboard layout which calls useAuth(). If AuthProvider is not mounted above
 * the route tree, builds will fail with:
 *   "useAuth must be used within an AuthProvider"
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
