import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // §5: NO ignoreDuringBuilds. NO ignoreBuildErrors.
  // Lint and typecheck are enforced. Build fails on error.
  typescript: { ignoreBuildErrors: false },
};

// ESLint enforcement — ignoreDuringBuilds: false is the default in Next 15
// Explicit setting not needed in typed config; Next runs lint during build by default.

export default nextConfig;
