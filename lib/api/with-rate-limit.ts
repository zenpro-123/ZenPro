import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

const defaultLimiter = rateLimit({ interval: 60_000, limit: 120 });
const searchLimiter = rateLimit({ interval: 60_000, limit: 30 });

type Limiter = "default" | "search";

export async function checkRateLimit(
  limiter: Limiter = "default"
): Promise<NextResponse | null> {
  const headerStore = await headers();
  const key = headerStore.get("x-forwarded-for") ?? "unknown";
  const rl = limiter === "search" ? searchLimiter : defaultLimiter;
  const result = rl.check(key);

  if (!result.success) {
    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  return null;
}
