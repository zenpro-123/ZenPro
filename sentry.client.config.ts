import * as Sentry from "@sentry/nextjs";

// DSN is optional in local dev — Sentry.init() with an empty DSN is a no-op,
// so this is safe to leave unconfigured until deployment.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
