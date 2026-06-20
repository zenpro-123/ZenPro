# ZenPro Environment Setup

## Required Variables

| Variable | Context | Description | Example |
|----------|---------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Your Supabase project URL | `https://abcdefg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anon/public key (safe to expose) | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key. **Never prefix with `NEXT_PUBLIC_`** | `eyJhbGciOi...` |
| `CRON_SECRET` | Server only | Bearer token for cron endpoint authentication. Use a cryptographically random string (32+ characters) | `openssl rand -hex 32` |

## Optional Variables

| Variable | Context | Description | Default Behavior |
|----------|---------|-------------|-----------------|
| `GEMINI_API_KEY` | Server only | Google Gemini API key for AI-powered summaries | AI summaries disabled; raw content served |
| `SENTRY_DSN` | Client + Server | Sentry error tracking DSN | Error tracking disabled |
| `NEXT_PUBLIC_APP_URL` | Client | Public app URL for OpenGraph metadata and sharing | Falls back to `https://localhost:3000` |
| `REDIS_URL` | Server only | Redis connection URL for caching layer | Falls back to Supabase-based cache |

## Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required variables from your Supabase project dashboard (Settings > API).

3. Generate a CRON_SECRET for local testing:
   ```bash
   openssl rand -hex 32
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Vercel Deployment

1. Go to your Vercel project > Settings > Environment Variables
2. Add all required variables
3. Add optional variables as needed
4. Redeploy for changes to take effect

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security — it must never be exposed to the client
- `GEMINI_API_KEY` should remain server-only to prevent unauthorized API usage
- `CRON_SECRET` should be rotated periodically; update in both Vercel and any external cron services
- `.env.local` is in `.gitignore` — never commit it to the repository
