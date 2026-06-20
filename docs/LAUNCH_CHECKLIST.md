# ZenPro Launch Checklist

## Pre-Deployment

### Build Verification
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` passes with zero TypeScript/ESLint errors
- [ ] No hydration warnings in development mode

### Environment
- [ ] All required env vars set in Vercel (see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md))
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`
- [ ] `CRON_SECRET` is a random 32+ character string
- [ ] `.env.local` is NOT committed to the repository

### Supabase
- [ ] All tables created and migrated
- [ ] RLS enabled on all user-data tables (see [RLS_AUDIT.md](./RLS_AUDIT.md))
- [ ] RLS policies verified for each table
- [ ] Auth redirect URLs configured for production domain

### Cron Jobs
- [ ] `vercel.json` cron schedule matches expected times
- [ ] `CRON_SECRET` env var set in Vercel project settings
- [ ] Manual test: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/morning`

### Analytics
- [ ] Vercel Analytics enabled in dashboard (Settings > Analytics)
- [ ] Speed Insights enabled in dashboard

---

## Post-Deployment Verification

### Core Pages
- [ ] Homepage (`/`) loads and displays intelligence briefing
- [ ] Timeline (`/timeline`) renders snapshots
- [ ] Weekly Review (`/review`) shows weekly summary
- [ ] Learning Feed (`/learning`) displays articles
- [ ] Tool Spotlight (`/tools`) shows tools
- [ ] Placement Tracker (`/placement`) renders table

### User Features
- [ ] Search (`Cmd+K`) returns results
- [ ] Notes — create, edit, delete
- [ ] Saved Items — save, unsave, filter by collection
- [ ] Collections — create, rename, delete
- [ ] Knowledge Workspace (`/knowledge`) loads tags and links

### Auth Flows
- [ ] Login page loads
- [ ] Registration works
- [ ] Onboarding flow completes
- [ ] Logout works
- [ ] Protected routes redirect to login when unauthenticated

### Mobile
- [ ] Navigation hamburger menu works
- [ ] All pages are scrollable and readable on mobile
- [ ] Touch targets are accessible (44px minimum)

### Error Handling
- [ ] 404 page renders for unknown routes
- [ ] Error boundary catches and displays runtime errors
- [ ] API errors return generic messages (no stack traces)

---

## Rollback Procedure

### Application Rollback
1. Open Vercel dashboard > Deployments
2. Find the last known-good deployment
3. Click "..." > "Promote to Production"
4. Verify the rollback deployment is serving correctly

### Environment Rollback
1. Revert any changed environment variables in Vercel project settings
2. Trigger a redeployment

### Database Rollback
- **Pro plan**: Use Supabase point-in-time recovery
- **Free tier**: Restore from last daily backup (Supabase dashboard > Database > Backups)
- **Manual**: If you ran migrations, reverse them manually

---

## Post-Launch Monitoring

- [ ] Check Sentry for new errors (if configured)
- [ ] Check Vercel Analytics for traffic patterns
- [ ] Verify cron jobs are running (Vercel dashboard > Settings > Cron Jobs)
- [ ] Monitor Supabase usage (dashboard > Reports)
