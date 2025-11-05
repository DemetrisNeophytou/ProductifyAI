# Supabase Migration Guide

## Why Migrate to Supabase?

### Current Setup (Neon via Replit)
- ✅ Easy development setup
- ✅ Integrated with Replit
- ⚠️ Development-focused
- ⚠️ Limited production features

### After Supabase Migration
- ✅ Production-grade reliability (99.9% SLA)
- ✅ Automatic daily backups
- ✅ Point-in-time recovery (up to 7 days)
- ✅ Built-in database browser UI
- ✅ Connection pooling (handles high traffic)
- ✅ Global CDN for faster access
- ✅ Direct database access tools
- ✅ Rollback support (pairs with Replit checkpoints)

## Pre-Migration Checklist

- [ ] GitHub backup completed (code safe)
- [ ] Stripe Price IDs configured
- [ ] All features tested and working
- [ ] Replit checkpoint created (can rollback)

## Migration Steps

### 1. Export Current Database Schema

```bash
# View current schema
npm run db:push

# Generate SQL schema
npx drizzle-kit push:pg
```

### 2. Create Supabase Project

1. **Go to Supabase:**
   - https://supabase.com/dashboard
   - Sign up/Login

2. **Create New Project:**
   - Organization: Select or create
   - Name: `productify-ai-production`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users
   - Pricing: Start with Free tier

3. **Wait for Provisioning:**
   - Takes 1-2 minutes
   - Don't close the page

### 3. Get Connection Details

1. **Find Database Settings:**
   - Project Settings → Database
   - Connection String tab
   - Select "URI" mode

2. **Copy Connection String:**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
   ```

3. **Save These Values:**
   ```
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_ANON_KEY=[anon-key]
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

### 4. Configure Connection Pooling (Important!)

1. **In Supabase Dashboard:**
   - Settings → Database
   - Connection Pooling section
   - Mode: "Transaction" (best for serverless)

2. **Copy Pooler Connection String:**
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
   ```
   Note: Port is 6543 (pooler), not 5432

3. **For Production, Use Pooler:**
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres
   ```

### 5. Migrate Database Schema

**Option A: Using Drizzle (Recommended)**

```bash
# Update DATABASE_URL to Supabase in Replit Secrets
# Then run:
npm run db:push
```

**Option B: Manual SQL Export/Import**

```bash
# Export from current DB
pg_dump $DATABASE_URL > productify_schema.sql

# Import to Supabase
psql [SUPABASE_CONNECTION_STRING] < productify_schema.sql
```

### 6. Migrate Data (If Any Exists)

```bash
# Export data only
pg_dump --data-only $DATABASE_URL > productify_data.sql

# Import to Supabase
psql [SUPABASE_CONNECTION_STRING] < productify_data.sql
```

### 7. Update Replit Environment

1. **Go to Replit Secrets:**
   - Update `DATABASE_URL` with Supabase pooler URL
   - Keep old URL as `OLD_DATABASE_URL` (backup)

2. **Test Connection:**
   ```bash
   # In Replit Shell
   echo $DATABASE_URL
   # Should show Supabase URL
   ```

3. **Restart Application:**
   - Workflow will auto-restart
   - Check logs for successful connection

### 8. Verify Migration

1. **Check Database in Supabase:**
   - Table Editor → View all tables
   - Should see: users, projects, sections, etc.

2. **Test Application:**
   - Login → Create project → Test AI features
   - Check community posts
   - Verify subscriptions work

3. **Run Test Query:**
   ```sql
   -- In Supabase SQL Editor
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM projects;
   SELECT COUNT(*) FROM community_posts;
   ```

## Post-Migration Tasks

### 1. Enable Row Level Security (RLS)

**Important:** By default, Supabase enables RLS. Since we use server-side auth, we need to disable it:

```sql
-- In Supabase SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE brand_kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes DISABLE ROW LEVEL SECURITY;
```

Note: We disable RLS because we handle auth in Node.js with Replit Auth.

### 2. Setup Backups

1. **Automatic Backups:**
   - Settings → Database → Backups
   - Free tier: Daily backups (7 days retention)
   - Pro tier: Point-in-time recovery

2. **Manual Backup:**
   ```bash
   # Backup command (save for emergencies)
   pg_dump [SUPABASE_URL] > backup_$(date +%Y%m%d).sql
   ```

### 3. Monitor Performance

1. **Database Dashboard:**
   - Monitor tab → View connections, queries
   - Set up alerts (optional)

2. **Query Performance:**
   - Check slow queries
   - Add indexes if needed

### 4. Setup Production Environment

```bash
# Add to Replit Secrets (Production)
PRODUCTION_DATABASE_URL=[SUPABASE_POOLER_URL]
NODE_ENV=production
```

## Rollback Plan (If Needed)

**If migration fails:**

1. **Restore Replit Database:**
   ```bash
   # Update DATABASE_URL back to old value
   # Use OLD_DATABASE_URL from Secrets
   ```

2. **Restart Application:**
   - Workflow auto-restarts
   - Should connect to old DB

3. **Use Replit Checkpoint:**
   - Tools → Checkpoints
   - Rollback to pre-migration state

## Database Connection Best Practices

### Development vs Production

**Development (Replit):**
```
DATABASE_URL=postgresql://[neon-connection]
```

**Production (Supabase):**
```
DATABASE_URL=postgresql://[supabase-pooler]:6543/postgres
```

### Connection Pooling

**Why it matters:**
- Replit = Serverless (connections close often)
- Supabase Pooler = Reuses connections
- Result: Faster, more reliable

**Configure in code:**
```typescript
// Already configured in your codebase
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);
```

## Troubleshooting

### Connection Fails
1. Check DATABASE_URL is correct (port 6543 for pooler)
2. Verify password has no special characters breaking URL
3. Test with direct connection (port 5432) first

### Tables Not Created
1. Run `npm run db:push --force`
2. Check Supabase logs in Dashboard
3. Verify Drizzle schema matches old DB

### Data Missing
1. Export old DB again: `pg_dump --data-only`
2. Check for conflicts (duplicate IDs)
3. Import with `--clean` flag

### Performance Issues
1. Add indexes to frequently queried columns
2. Enable connection pooling
3. Check slow query logs in Supabase

## Cost Estimate

### Supabase Pricing

**Free Tier (Good for MVP):**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- 7-day backup retention

**Pro Tier ($25/month when needed):**
- 8 GB database
- 100 GB file storage
- 50 GB bandwidth
- No user limits
- Point-in-time recovery

### When to Upgrade

- 📊 >100 concurrent users
- 💾 >400 MB data stored
- 🚀 Need longer backup retention
- 🔒 Need advanced security features

## Success Checklist

After migration, verify:
- [ ] Application connects successfully
- [ ] All tables exist in Supabase
- [ ] Existing data migrated correctly
- [ ] New records save properly
- [ ] Stripe webhooks still work
- [ ] Community posts/comments work
- [ ] AI generation works
- [ ] Backups configured
- [ ] Performance acceptable
- [ ] Old DATABASE_URL saved as backup

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Migration Guide: https://supabase.com/docs/guides/database/migrating
