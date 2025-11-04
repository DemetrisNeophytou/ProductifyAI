# 🛡️ Supabase Security Implementation

## Overview

This document describes the comprehensive security measures implemented for ProductifyAI's database layer, including Row Level Security (RLS), authentication event logging, and brute-force attack detection.

---

## 🎯 Phase 3: Security Features

### 1. **Row Level Security (RLS)**
   - ✅ Enabled on all user-facing tables
   - ✅ Users can only access their own data
   - ✅ Admin users can access all data for support
   - ✅ Secure helper functions for auth context

### 2. **Authentication Event Logging**
   - ✅ Comprehensive auth_events table
   - ✅ Tracks all login/signup/password events
   - ✅ Stores IP addresses and user agents
   - ✅ 90-day retention policy

### 3. **Brute-Force Detection**
   - ✅ Real-time detection (≥5 failed attempts/minute)
   - ✅ Auto-locks accounts after 10 failed attempts
   - ✅ IP-based and email-based tracking
   - ✅ Failed login statistics dashboard

---

## 📋 Migration Files

### `005_enable_row_level_security.sql`
**Purpose:** Enable RLS on all tables with `auth.uid()` policies

**Tables Secured:**
- ✅ `users` - Self-access only
- ✅ `brand_kits` - Owner-access only
- ✅ `projects` - Owner-access only
- ✅ `pages` - Via project ownership
- ✅ `blocks` - Via page/project ownership
- ✅ `user_niches` - Owner-access only
- ✅ `orders` - Buyer or seller access
- ✅ `usage_credits` - Owner-access only
- ✅ `media` - Owner or project owner access
- ✅ `social_packs` - Via project ownership
- ✅ `metrics_events` - Owner or project owner access
- ✅ `kb_documents` - All can read, admin modify
- ✅ `kb_chunks` - All can read, admin modify
- ✅ `subscriptions` - Owner-access only

**Helper Functions:**
```sql
-- Get current user ID (Supabase auth or custom setting)
SELECT get_current_user_id();

-- Check if current user is admin
SELECT is_admin();
```

**Policy Examples:**
```sql
-- Users can only see their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (id = get_current_user_id() OR is_admin());

-- Projects owned by user
CREATE POLICY "projects_all" ON projects
  FOR ALL
  USING (user_id = get_current_user_id() OR is_admin());
```

---

### `006_auth_events_logging.sql`
**Purpose:** Log authentication events and detect brute-force attacks

**auth_events Table Schema:**
```sql
CREATE TABLE auth_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  email VARCHAR,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Event Types:**
- `login_success`
- `login_failed`
- `signup_success`
- `signup_failed`
- `password_reset_requested`
- `password_reset_completed`
- `email_verification_sent`
- `email_verification_completed`
- `account_locked`
- `account_unlocked`
- `session_expired`
- `logout`

**Functions:**

#### `log_auth_event()`
Log an authentication event:
```sql
SELECT log_auth_event(
  'user-id',                  -- user_id (or NULL)
  'login_failed',             -- event_type
  '192.168.1.1',              -- ip_address
  'Mozilla/5.0...',           -- user_agent
  '{"reason": "invalid_password"}'::jsonb  -- metadata
);
```

#### `detect_brute_force()`
Check for brute-force attack:
```sql
SELECT * FROM detect_brute_force('user@example.com', 'email');

-- Returns:
-- is_brute_force | failed_attempts | first_attempt | last_attempt | should_lock
-- true          | 7               | 2025-11-04... | 2025-11-04...| false
```

#### `is_rate_limited()`
Simple boolean check:
```sql
SELECT is_rate_limited('user@example.com', 'email');
-- Returns: true/false
```

#### `get_failed_login_stats()`
Get failed login statistics:
```sql
SELECT * FROM get_failed_login_stats('1 hour');

-- Returns:
-- email           | ip_address    | failed_attempts | last_attempt
-- user@email.com  | 192.168.1.1  | 5               | 2025-11-04...
```

**Auto-Lock Trigger:**
- Automatically locks accounts after **10 failed attempts in 1 minute**
- Sets `subscription_status = 'locked'`
- Logs `account_locked` event
- Sends NOTICE alert

**Cleanup:**
```sql
-- Remove auth events older than 90 days
SELECT cleanup_old_auth_events();
```

---

### `007_rls_rollback.sql`
**Purpose:** Emergency rollback script to disable RLS

⚠️ **WARNING:** Only use in emergencies! This removes all data access restrictions.

```bash
# Run rollback
psql -d your_database -f server/migrations/007_rls_rollback.sql

# Then re-enable as soon as possible
psql -d your_database -f server/migrations/005_enable_row_level_security.sql
```

---

## 🔧 Integration Guide

### Backend Integration

#### 1. Set User Context Before Queries

**Option A: Supabase Auth (Recommended)**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// User context is automatically set via JWT
const { data, error } = await supabase
  .from('projects')
  .select('*');
```

**Option B: Custom Postgres with app.current_user_id**
```typescript
import { db } from './db';
import { sql } from 'drizzle-orm';

// Set user context before queries
await db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);

// Now queries respect RLS
const projects = await db.select().from(projectsTable);
```

#### 2. Log Authentication Events

**In your authentication middleware:**
```typescript
import { db } from './db';
import { sql } from 'drizzle-orm';

// Failed login attempt
async function onLoginFailed(email: string, req: Request) {
  await db.execute(sql`
    SELECT log_auth_event(
      NULL,
      'login_failed',
      ${req.ip},
      ${req.headers['user-agent']},
      ${{ reason: 'invalid_password' }}::jsonb
    )
  `);
}

// Successful login
async function onLoginSuccess(userId: string, req: Request) {
  await db.execute(sql`
    SELECT log_auth_event(
      ${userId},
      'login_success',
      ${req.ip},
      ${req.headers['user-agent']},
      '{}'::jsonb
    )
  `);
}
```

#### 3. Check for Brute-Force Before Login

```typescript
async function checkBruteForce(email: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT is_rate_limited(${email}, 'email')
  `);
  
  return result.rows[0]?.is_rate_limited || false;
}

// In login handler
if (await checkBruteForce(email)) {
  return res.status(429).json({
    error: 'Too many failed login attempts. Please try again later.'
  });
}
```

#### 4. Admin Dashboard: View Failed Logins

```typescript
async function getFailedLoginStats(hours: number = 1) {
  const result = await db.execute(sql`
    SELECT * FROM get_failed_login_stats(${hours}::interval)
  `);
  
  return result.rows;
}
```

---

## 🧪 Testing

### Test RLS Policies

```sql
-- Test as regular user
SET LOCAL app.current_user_id = 'user-123';

-- Should only return user's own projects
SELECT * FROM projects;

-- Should fail (no access to other user's data)
SELECT * FROM projects WHERE user_id = 'other-user';

-- Reset
RESET app.current_user_id;
```

### Test Brute-Force Detection

```sql
-- Simulate 5 failed logins
DO $$
BEGIN
  FOR i IN 1..5 LOOP
    PERFORM log_auth_event(
      NULL,
      'login_failed',
      '192.168.1.1',
      'test-agent',
      '{"test": true}'::jsonb
    );
  END LOOP;
END $$;

-- Check if rate limited
SELECT is_rate_limited('192.168.1.1', 'ip');
-- Should return: true
```

### Test Auto-Lock

```sql
-- Simulate 10 failed logins
DO $$
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM log_auth_event(
      NULL,
      'login_failed',
      '192.168.1.1',
      'test-agent',
      jsonb_build_object('email', 'test@example.com')
    );
  END LOOP;
END $$;

-- Check if account locked event exists
SELECT * FROM auth_events WHERE event_type = 'account_locked';
```

---

## 🚀 Deployment

### Step 1: Backup Database
```bash
pg_dump your_database > backup_before_rls_$(date +%Y%m%d).sql
```

### Step 2: Run Migrations
```bash
# Enable RLS
psql -d your_database -f server/migrations/005_enable_row_level_security.sql

# Enable auth logging
psql -d your_database -f server/migrations/006_auth_events_logging.sql
```

### Step 3: Update Application Code

**Update database service to set user context:**
```typescript
// server/services/database-service.ts

export class DatabaseService {
  async setUserContext(userId: string) {
    await this.db.execute(sql`SET LOCAL app.current_user_id = ${userId}`);
  }
  
  async clearUserContext() {
    await this.db.execute(sql`RESET app.current_user_id`);
  }
}
```

**Update authentication routes:**
```typescript
// server/routes/auth.ts
import { log_auth_event, is_rate_limited } from '../services/auth-logging';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // 1. Check rate limiting
  if (await is_rate_limited(email)) {
    return res.status(429).json({ 
      error: 'Too many failed attempts' 
    });
  }
  
  // 2. Attempt login
  const user = await authenticateUser(email, password);
  
  if (!user) {
    // 3. Log failed attempt
    await log_auth_event(null, 'login_failed', req.ip, req.headers['user-agent']);
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // 4. Log success
  await log_auth_event(user.id, 'login_success', req.ip, req.headers['user-agent']);
  
  // 5. Set user context for subsequent queries
  await dbService.setUserContext(user.id);
  
  res.json({ user });
});
```

### Step 4: Test Thoroughly

**Test Checklist:**
- [ ] Users can log in successfully
- [ ] Users can only see their own data
- [ ] Admin users can see all data
- [ ] Failed logins are logged
- [ ] Brute-force detection triggers at 5 attempts
- [ ] Accounts auto-lock at 10 attempts
- [ ] Old auth events are cleaned up

---

## 📊 Monitoring

### Create Scheduled Job for Cleanup

```sql
-- Run daily at 2am
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'cleanup-auth-events',
  '0 2 * * *',
  'SELECT cleanup_old_auth_events()'
);
```

### Alert on Suspicious Activity

```sql
-- Get accounts with multiple failed logins in last hour
CREATE OR REPLACE FUNCTION get_suspicious_activity()
RETURNS TABLE(email VARCHAR, failed_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT ae.email, COUNT(*) as failed_count
  FROM auth_events ae
  WHERE ae.event_type = 'login_failed'
    AND ae.created_at > NOW() - INTERVAL '1 hour'
  GROUP BY ae.email
  HAVING COUNT(*) >= 3
  ORDER BY failed_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Run every 15 minutes
SELECT cron.schedule(
  'alert-suspicious-activity',
  '*/15 * * * *',
  $$ 
    SELECT email, failed_count 
    FROM get_suspicious_activity() 
    WHERE failed_count >= 5
  $$
);
```

---

## 🔐 Best Practices

1. **Always Set User Context**
   - Set `app.current_user_id` before queries
   - Or use Supabase auth JWT

2. **Log All Auth Events**
   - Login success/failure
   - Password resets
   - Email verifications
   - Account locks/unlocks

3. **Monitor Failed Logins**
   - Set up alerts for ≥5 failures
   - Review auth_events daily

4. **Regular Cleanup**
   - Run `cleanup_old_auth_events()` daily
   - Keep 90 days of history

5. **Test RLS Policies**
   - Test as regular user
   - Test as admin
   - Test cross-user access attempts

6. **Backup Before Changes**
   - Always backup before enabling RLS
   - Keep rollback script ready

---

## 🆘 Troubleshooting

### RLS Blocking Legitimate Queries

**Problem:** Queries return empty results even for valid users.

**Solution:**
```sql
-- Check if user context is set
SELECT current_setting('app.current_user_id', true);

-- If NULL, set it
SET LOCAL app.current_user_id = 'user-id';
```

### Too Many False Positives

**Problem:** Users getting rate-limited too easily.

**Solution:** Adjust thresholds in `detect_brute_force()`:
```sql
-- Change from 5 to 10 attempts
WHERE created_at > NOW() - INTERVAL '1 minute'
AND COUNT(*) >= 10  -- Changed from 5
```

### Need to Disable RLS Temporarily

**Emergency:**
```bash
psql -d your_database -f server/migrations/007_rls_rollback.sql
```

**Then re-enable ASAP:**
```bash
psql -d your_database -f server/migrations/005_enable_row_level_security.sql
```

---

## 📖 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Brute Force Prevention](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)

---

## ✅ Success Criteria

After implementing Phase 3:

- ✅ All user data is isolated by RLS
- ✅ Failed login attempts are logged
- ✅ Brute-force attacks are detected
- ✅ Accounts auto-lock after 10 failures
- ✅ Admin can monitor suspicious activity
- ✅ 90-day auth event retention
- ✅ Rollback script available

---

**Security Engineer AI** 🛡️  
Phase 3 of 5 - Supabase Security & RLS

