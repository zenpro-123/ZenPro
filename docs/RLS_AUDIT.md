# ZenPro Row Level Security (RLS) Audit

**Date**: 2026-06-20
**Auditor**: Automated code-level review

## Summary

All API routes that access user-scoped data filter by `user_id` (or `id` for profiles). No route returns data belonging to other users. Database-level RLS policies must be verified separately in the Supabase dashboard.

## Tables Audited

### User-Scoped Tables (require RLS)

| Table | Expected Policy | Code-Level Verification |
|-------|----------------|------------------------|
| `notes` | `auth.uid() = user_id` for all operations | All queries in `api/notes/` filter by `.eq("user_id", user.id)` |
| `saved_items` | `auth.uid() = user_id` for all operations | All queries in `api/saved-items/` filter by `.eq("user_id", user.id)` |
| `user_preferences` | `auth.uid() = user_id` for read/write | Queries in `api/user/preferences/` filter by `.eq("user_id", user.id)` |
| `profiles` | `auth.uid() = id` for read/update | Queries in `api/user/profile/` filter by `.eq("id", user.id)` |
| `opportunity_tracker` | `auth.uid() = user_id` for all operations | All queries in `api/placement/` filter by `.eq("user_id", user.id)` |
| `collections` | `auth.uid() = user_id` for all operations | All queries in `api/collections/` filter by `.eq("user_id", user.id)` |
| `events` | `auth.uid() = user_id` for insert | Insert in `api/events/` sets `user_id: user.id` |

### Shared/System Tables (read-only for users)

| Table | Expected Policy | Code-Level Verification |
|-------|----------------|------------------------|
| `content_items` | Read-only for authenticated users; write via service role only | User-facing queries are SELECT only. Writes happen in `api/cron/` and `api/content/` using service client |
| `daily_snapshots` | Read-only for authenticated users | Only read in `api/intelligence/` routes |
| `weekly_reviews` | Read-only for authenticated users | Only read in `api/intelligence/weekly/` |
| `cache_entries` | Service role only | Accessed only via `lib/cache/supabase-cache.ts` using `createServiceClient()` |

## Service Role Usage

The `createServiceClient()` function (using `SUPABASE_SERVICE_ROLE_KEY`) is used only in:
- `lib/cache/supabase-cache.ts` — cache read/write
- `app/api/cron/morning/route.ts` — daily snapshot ingestion
- `app/api/cron/evening/route.ts` — evening snapshot ingestion
- `app/api/content/*/route.ts` — content provider ingestion

All service role usage is server-only. The service role key is never exposed to client code (no `NEXT_PUBLIC_` prefix).

## Verification Checklist

- [x] All user-data API routes authenticate via `supabase.auth.getUser()`
- [x] All user-data queries include `user_id` / `id` filter
- [x] Service role key is server-only (not prefixed with `NEXT_PUBLIC_`)
- [x] No API route returns data from other users
- [ ] **Manual**: Verify RLS is ENABLED on all tables in Supabase dashboard
- [ ] **Manual**: Verify RLS policies match the expected policies above
- [ ] **Manual**: Test: authenticated user A cannot read user B's notes/saved items

## Potential Concerns

1. **RLS must be enabled at the database level** — code-level filtering is defense-in-depth, not a replacement for RLS policies. If RLS is not enabled, a compromised or misconfigured API route could leak data.

2. **Service role bypasses RLS** — this is by design, but the service role key must remain strictly server-side. Verify it is not in any client bundle.

3. **Cron routes** — protected by `CRON_SECRET` bearer token, with an explicit guard when the env var is unset. These use the service role client to write shared data.
