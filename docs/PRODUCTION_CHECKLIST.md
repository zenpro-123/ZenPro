# ZenPro Production Deployment Checklist

## Environment Variables

### Required
| Variable | Context | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key (never expose to client) |
| `CRON_SECRET` | Server only | Bearer token for cron endpoint auth |

### Optional
| Variable | Context | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | Server only | Google Gemini API key for AI summaries |
| `SENTRY_DSN` | Client + Server | Sentry error tracking DSN |
| `NEXT_PUBLIC_APP_URL` | Client | Public app URL for OpenGraph metadata |
| `REDIS_URL` | Server only | Redis connection for caching layer (falls back to Supabase cache) |

### Verification
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `GEMINI_API_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `CRON_SECRET` is a cryptographically random string (32+ chars)
- [ ] `.env.local` is in `.gitignore` and NOT committed to the repository

## Supabase Setup

### Tables
- `content_items` — ingested content from all providers
- `daily_snapshots` — daily intelligence snapshots
- `weekly_reviews` — weekly review aggregations
- `profiles` — user profiles
- `user_preferences` — onboarding preferences and interest vectors
- `saved_items` — user bookmarks
- `notes` — user annotations
- `opportunity_tracker` — placement CRM entries
- `collections` — saved item collections
- `events` — user activity events
- `cache` — server-side cache store (fallback for Redis)

### Row Level Security (RLS)
- [ ] RLS enabled on all user-data tables
- [ ] `saved_items`: users can only CRUD their own rows (`auth.uid() = user_id`)
- [ ] `notes`: users can only CRUD their own rows
- [ ] `opportunity_tracker`: users can only CRUD their own rows
- [ ] `collections`: users can only CRUD their own rows
- [ ] `events`: users can only insert their own events
- [ ] `user_preferences`: users can only read/write their own preferences
- [ ] `profiles`: users can only read/update their own profile
- [ ] `content_items`: read-only for authenticated users (write via service role only)
- [ ] `daily_snapshots`: read-only for authenticated users

### Auth
- [ ] Email/password auth enabled
- [ ] Auth redirect URLs configured for production domain
- [ ] Email templates customized

## Cron Setup

Configured in `vercel.json`:
- **Morning snapshot**: `0 30 0 * * *` (00:30 UTC daily)
- **Evening snapshot**: `0 30 12 * * *` (12:30 UTC daily)

Both endpoints require `Authorization: Bearer {CRON_SECRET}` header.

### Verification
- [ ] `CRON_SECRET` env var is set in Vercel project settings
- [ ] Cron jobs appear in Vercel dashboard under Settings > Cron Jobs
- [ ] Test manually: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/morning`

## Deployment Steps

1. Push code to `main` branch
2. Verify Vercel build succeeds (zero TypeScript/ESLint errors)
3. Set all required environment variables in Vercel project settings
4. Verify Supabase RLS policies are active
5. Run first cron manually to seed initial snapshot
6. Verify all pages load correctly

## Rate Limiting

In-memory sliding-window rate limiter applied to all user-facing API routes.

| Limiter | Limit | Scope |
|---------|-------|-------|
| Default | 120 requests/minute | All API routes |
| Search | 30 requests/minute | `/api/search` |

Cron endpoints are exempt (protected by `CRON_SECRET`).

Returns `429 Too Many Requests` with `Retry-After` header when exceeded.

Note: On Vercel serverless, rate limits are per-instance (approximate). For strict enforcement, add an external rate limiter (e.g., Vercel Edge Middleware with KV).

## Analytics

- `@vercel/analytics` — Page view and event tracking (free tier)
- `@vercel/speed-insights` — Core Web Vitals monitoring (free tier)

Both are added to the root layout and auto-enable on Vercel. No-ops in local development.

Enable in Vercel dashboard:
1. Go to your project > Analytics tab > Enable
2. Go to your project > Speed Insights tab > Enable

## Security Verification

- [ ] No `error.message` leaked to clients (all API routes return generic errors)
- [ ] Proxy (`proxy.ts`) refreshes auth sessions on every request
- [ ] Error boundaries catch React crashes (app/error.tsx, app/global-error.tsx)
- [ ] CRON endpoints reject requests when `CRON_SECRET` is unset
- [ ] Search inputs are bounded (max 200 chars) and sanitized
- [ ] Timeline pagination is clamped (max 50 per request)
- [ ] All user-data queries filter by `user_id`

## Performance Verification

- [ ] Build output shows no warnings
- [ ] All pages render skeleton loaders during data fetch
- [ ] All pages show helpful empty states when no data exists
- [ ] Cache layer (memory → Redis → Supabase) is operational
- [ ] Images use `next/image` with proper sizing

## Monitoring Setup

### Sentry (optional)
Set `SENTRY_DSN` environment variable. Configuration files:
- `sentry.client.config.ts` — client-side error tracking
- `sentry.server.config.ts` — server-side error tracking

Auto-enabled when DSN is present, gracefully disabled when absent.

### Vercel Analytics (optional)
Enable in Vercel dashboard under Analytics tab.

## Rollback Procedure

1. In Vercel dashboard, go to Deployments
2. Find the last known-good deployment
3. Click "..." menu > "Promote to Production"
4. Verify the rollback deployment is serving correctly
5. Investigate the issue on the failed deployment

For database rollbacks:
1. Supabase dashboard > Database > Backups
2. Point-in-time recovery available for Pro plans
3. For Free tier: restore from last daily backup
