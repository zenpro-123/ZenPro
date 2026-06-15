import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// No-ops when SENTRY_DSN is unset since Sentry.init() above runs with enabled: false.
export const onRequestError = Sentry.captureRequestError;
