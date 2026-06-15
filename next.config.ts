import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // A stray package-lock.json in the home directory makes Turbopack infer
  // the wrong workspace root; pin it to this project explicitly.
  turbopack: {
    root: __dirname,
  },
};

// Sentry wrapper is a no-op build-time enhancer when SENTRY_AUTH_TOKEN /
// SENTRY_ORG / SENTRY_PROJECT aren't set — source map upload is simply skipped.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
