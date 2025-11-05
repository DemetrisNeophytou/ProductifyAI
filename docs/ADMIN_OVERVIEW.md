# ProductifyAI Admin Control Center - Complete Guide

## 🎯 Overview

The Admin Control Center is a comprehensive internal dashboard for managing ProductifyAI's users, subscriptions, AI usage, marketplace commissions, and community engagement. Access is restricted to users with `role='admin'` in the database.

---

## 🔐 Access Control

### Granting Admin Access

**Method 1: Database Update (Recommended)**
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Method 2: Development Mode**
Set environment variable for development:
```bash
EVAL_MODE=true
```

### Security Implementation

All `/api/admin/*` routes are protected by the `isAdmin` middleware:

```typescript
// server/middleware/isAdmin.ts
export function isAdmin(req, res, next) {
  const role = req.user?.role;
  
  if (role !== 'admin') {
    return res.status(403).json({
      ok: false,
      error: 'Admin access required'
    });
  }
  
  next();
}
```

**Frontend Protection:**
- Admin routes only accessible via `/admin/*`
- Sidebar shows admin section only for admin users
- 403 errors redirect to dashboard

---

## 📊 Admin Dashboard Sections

### 1. Overview (`/admin`)

**Purpose:** System health at a glance

**Displays:**
- System Health Card (uptime, latency, error rate)
- Quick Stats:
  - Total Users (by plan: Free/Plus/Pro)
  - Total Projects
  - KB Documents
  - AI Requests Today
- Quick Actions (links to other tabs)
- Recent Activity Feed
- External Resources (Supabase, OpenAI, Vercel)

**API:** `GET /api/admin/stats`

---

### 2. Users (`/admin/users`)

**Purpose:** User management and plan administration

**Features:**
- **User List Table:**
  - Name (first + last)
  - Email (masked: `u***@example.com`)
  - Plan badge (Free/Plus/Pro with icons)
  - Role badge (User/Admin)
  - Subscription status
  - Commission rate
  - AI tokens used
  - Created date

- **Filters:**
  - Search by email/name
  - Filter by plan (All/Free/Plus/Pro)
  - Pagination (50 per page)

- **User Details Drawer:**
  - Full email (with copy button)
  - User ID (with copy button)
  - Plan selector (change plan manually)
  - Role selector (promote to admin)
  - AI Usage last 30 days (requests, tokens, history)
  - Community activity (recent messages)
  - Orders (as buyer and seller)

**API Endpoints:**
- `GET /api/admin/users?page=1&limit=50&plan=all&search=`
- `GET /api/admin/users/:id` (full details)
- `PATCH /api/admin/users/:id/plan` (change plan)
- `PATCH /api/admin/users/:id/role` (change role)

**Privacy:**
- Emails masked in list view (`u***@example.com`)
- Full email only in detail drawer
- Copy buttons for IDs (easy support)

---

### 3. Revenue (`/admin/revenue`)

**Purpose:** Stripe subscriptions and marketplace commission analytics

**Displays:**

**Stripe Metrics:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Run Rate = MRR × 12)
- Active Subscriptions count
- Plan Splits (Plus vs Pro counts)

**Marketplace Commissions:**
- Total GMV (Gross Merchandise Value)
- Total Platform Commission
- Total Seller Payouts
- Order Count
- Average Commission Rate

**Commission Tiers Reference:**
- Free: 7% commission
- Plus: 4% commission
- Pro: 1% commission

**Top Sellers Table:**
- Seller ID
- Order count
- Total revenue (after commission)

**API Endpoints:**
- `GET /api/admin/revenue/stripe-summary?range=30d`
  - Cached for 60 seconds
  - Falls back to mock data if Stripe unavailable
- `GET /api/admin/revenue/commissions?range=30d`

**Notes:**
- Stripe data cached for 60s to avoid rate limits
- Shows mock data warning if Stripe not configured
- All amounts in EUR cents, converted for display

---

### 4. AI Usage (`/admin/usage`)

**Purpose:** Monitor AI token consumption and feature usage

**Displays:**

**Key Metrics:**
- Total Requests
- Total Tokens (In + Out)
- Average Latency
- Estimated Cost (based on OpenAI pricing)

**Usage by Feature:**
- Breakdown by feature type (chat, builder, video, rag, etc.)
- Request count per feature
- Token count per feature
- Visual progress bars

**Top 10 Users:**
- User ID
- Tokens consumed
- Estimated cost
- Ranked by total usage

**API Endpoints:**
- `GET /api/admin/usage/aggregate?range=30d`
- `GET /api/admin/usage/by-user/:userId?range=30d`

**Cost Calculation:**
- Estimated at $0.002 per 1K tokens (OpenAI gpt-4o-mini average)
- Actual costs may vary by model

---

### 5. Community (`/admin/community`)

**Purpose:** Community engagement and channel analytics

**Displays:**

**Key Metrics:**
- Total Messages
- Active Users (unique contributors)
- Bot Responses count and percentage
- Top Channel (most active)

**Messages by Channel:**
- Distribution across channels:
  - Marketplace Public
  - Creators Hub
  - Pro Founders Lounge
- Visual progress bars
- Message count and percentage

**Top Contributors:**
- Ranked table (top 10)
- User ID
- Message count
- Percentage of total

**API Endpoints:**
- `GET /api/admin/community/insights?range=30d`

**Channel Access Levels:**
- `marketplace_public`: All users (Free/Plus/Pro)
- `creators_hub`: Plus and Pro only
- `pro_founders_lounge`: Pro only

---

### 6. Evaluation (`/admin/evaluation`)

**Purpose:** AI quality testing with benchmark questions

**Features:**
- Run all benchmarks button
- Evaluation results table
- Score breakdown (Grounding, Structure, Completeness, Length)
- Overall AI Quality Score
- Last run timestamp
- Color-coded scores (green ≥80%, yellow ≥60%, red <60%)

**Related Files:**
- `/eval/goldenQuestions.json` - 30 benchmark questions
- `/eval/evalRunner.ts` - Evaluation logic
- `/eval/evalReport.json` - Results output

**Command:** `npm run eval`

---

### 7. Knowledge Base (`/admin/kb`)

**Purpose:** Manage AI's knowledge base documents

**Features:**
- List all KB documents
- Create/Edit/Delete documents
- Recompute embeddings
- Semantic search
- Topic/tag filtering
- Stats (total docs, chunks, topics)

**Document Editor:**
- Title, Topic, Tags
- Markdown content editor
- Save triggers embedding regeneration

**API Endpoints:**
- `GET /api/kb` - List documents
- `GET /api/kb/:id` - Get document
- `POST /api/kb` - Create document
- `PUT /api/kb/:id` - Update document
- `DELETE /api/kb/:id` - Delete document
- `POST /api/kb/recompute` - Recompute embeddings

**Ingestion Command:** `npm run ingest:kb`

---

### 8. Settings (`/admin/settings`)

**Purpose:** System configuration and admin utilities

**Displays:**
- Current admin user info
- System configuration (read-only):
  - Database connection
  - OpenAI configuration
  - Environment variables
  - Feature flags
- Admin actions:
  - Restart evaluation
  - Clear logs
  - System health check
- System health metrics (uptime, errors, response time)
- Security notice

**Show/Hide Secrets:** Toggle to reveal full connection strings

---

## 🗄️ Database Schema

### Admin-Specific Tables

**subscriptions**
```sql
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  plan varchar(20) NOT NULL, -- free, plus, pro
  status varchar(20) NOT NULL, -- active, past_due, canceled, trialing
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**orders** (marketplace)
```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  product_id varchar,
  product_title varchar(255),
  amount int NOT NULL, -- Total in cents
  subtotal int NOT NULL,
  commission int NOT NULL, -- Platform commission in cents
  commission_rate int NOT NULL, -- Percentage (7, 4, or 1)
  seller_payout int NOT NULL,
  buyer_plan varchar(20),
  stripe_payment_intent_id varchar,
  status varchar(20) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_created ON orders(created_at);
```

**ai_usage** (granular tracking)
```sql
CREATE TABLE ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  feature varchar(50) NOT NULL, -- chat, builder, video, rag, admin_view
  model varchar(50),
  tokens_in int DEFAULT 0,
  tokens_out int DEFAULT 0,
  latency_ms int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_usage_user ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_feature ON ai_usage(feature);
CREATE INDEX idx_ai_usage_created ON ai_usage(created_at);
```

**ai_feedback** (quality ratings)
```sql
CREATE TABLE ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_id varchar,
  message_id varchar,
  rating int CHECK (rating >= 1 AND rating <= 5),
  helpful int, -- 0 or 1
  notes text,
  citation_count int DEFAULT 0,
  hallucination_flag int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_created ON ai_feedback(created_at);
```

### Users Table Extensions

**Required columns in `users` table:**
```sql
ALTER TABLE users ADD COLUMN role varchar(20) DEFAULT 'user'; -- user, admin
ALTER TABLE users ADD COLUMN plan varchar(20) DEFAULT 'free'; -- free, plus, pro
ALTER TABLE users ADD COLUMN commission_rate int DEFAULT 7; -- 7%, 4%, or 1%
ALTER TABLE users ADD COLUMN stripe_customer_id varchar UNIQUE;
ALTER TABLE users ADD COLUMN stripe_subscription_id varchar;
```

---

## 🔧 API Reference

### User Management

**GET /api/admin/users**
```
Query params:
  ?page=1&limit=50&plan=all&search=

Response:
{
  "ok": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "emailMasked": "u***@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "plan": "plus",
        "subscriptionStatus": "active",
        "commissionRate": 4,
        "aiTokensUsed": 15234,
        "credits": 450,
        "createdAt": "2025-10-20T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1248,
      "totalPages": 25
    }
  }
}
```

**GET /api/admin/users/:id**
```
Response:
{
  "ok": true,
  "data": {
    "user": { /* full user object */ },
    "subscription": { /* subscription details */ },
    "usage": {
      "last30Days": [ /* usage records */ ],
      "totalTokens": 45890,
      "totalRequests": 234
    },
    "community": {
      "recentMessages": [ /* messages */ ],
      "messageCount": 12
    },
    "orders": {
      "asBuyer": [ /* orders */ ],
      "asSeller": [ /* orders */ ]
    }
  }
}
```

**PATCH /api/admin/users/:id/plan**
```
Body: { "plan": "plus" }
Response: { "ok": true, "message": "Plan updated successfully" }
```

**PATCH /api/admin/users/:id/role**
```
Body: { "role": "admin" }
Response: { "ok": true, "message": "Role updated successfully" }
```

---

### Revenue Analytics

**GET /api/admin/revenue/stripe-summary**
```
Query: ?range=30d

Response:
{
  "ok": true,
  "data": {
    "mrr": 4752, // in euros
    "arr": 57024,
    "activeSubscriptions": 268,
    "canceledSubscriptions": 12,
    "planSplits": { "plus": 198, "pro": 70 },
    "revenueSeriesLast12Weeks": []
  },
  "cached": true // if from cache
}
```

**GET /api/admin/revenue/commissions**
```
Query: ?range=30d

Response:
{
  "ok": true,
  "data": {
    "totalGMV": 145000, // cents
    "totalCommission": 5800,
    "totalPayout": 139200,
    "orderCount": 42,
    "avgCommissionRate": 4.0,
    "topSellers": [
      {
        "sellerId": "uuid",
        "revenue": 25000,
        "count": 8
      }
    ],
    "dailySeries": []
  }
}
```

---

### AI Usage Analytics

**GET /api/admin/usage/aggregate**
```
Query: ?range=30d

Response:
{
  "ok": true,
  "data": {
    "totalRequests": 8923,
    "totalTokens": 1245890,
    "totalTokensIn": 523400,
    "totalTokensOut": 722490,
    "avgLatency": 234,
    "byFeature": {
      "chat": { "count": 4523, "tokens": 623400 },
      "builder": { "count": 2156, "tokens": 422490 },
      "rag": { "count": 1789, "tokens": 180000 }
    },
    "topUsers": [
      { "userId": "uuid", "tokens": 89234 }
    ]
  }
}
```

**GET /api/admin/usage/by-user/:userId**
```
Query: ?range=30d

Response:
{
  "ok": true,
  "data": {
    "usage": [ /* detailed usage records */ ],
    "totalRequests": 234,
    "totalTokens": 45890
  }
}
```

---

### Community Insights

**GET /api/admin/community/insights**
```
Query: ?range=30d

Response:
{
  "ok": true,
  "data": {
    "totalMessages": 3456,
    "byChannel": {
      "marketplace_public": 2100,
      "creators_hub": 890,
      "pro_founders_lounge": 466
    },
    "topContributors": [
      { "userId": "uuid", "messageCount": 234 }
    ],
    "botMessages": 145
  }
}
```

---

### AI Quality

**GET /api/admin/ai/quality**
```
Query: ?range=30d

Response:
{
  "ok": true,
  "data": {
    "totalFeedback": 156,
    "avgRating": 4.3,
    "helpfulRate": 87.5, // percentage
    "hallucinationRate": 2.1,
    "avgCitations": 3.2
  }
}
```

**POST /api/admin/ai/feedback**
```
Body:
{
  "userId": "uuid",
  "sessionId": "session-uuid",
  "messageId": "message-uuid",
  "rating": 5,
  "helpful": true,
  "notes": "Very accurate pricing advice",
  "citationCount": 3,
  "hallucinationFlag": false
}

Response: { "ok": true, "message": "Feedback submitted" }
```

---

## 💼 Common Admin Tasks

### Task 1: Promote User to Admin

**Via UI:**
1. Go to `/admin/users`
2. Search for user
3. Click on user row to open drawer
4. Change "Role" dropdown to "Admin"
5. Confirm change

**Via Database:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

**Via API:**
```bash
curl -X PATCH http://localhost:5050/api/admin/users/{userId}/role \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

---

### Task 2: Manually Change User Plan

**Use Cases:**
- Testing plan features
- Upgrading power users
- Resolving billing issues

**Steps:**
1. `/admin/users` → Find user
2. Open drawer → Change "Plan" dropdown
3. Select Free/Plus/Pro
4. Automatically updates:
   - Commission rate (7%/4%/1%)
   - AI token limits
   - Project limits
   - Credits

**Note:** Manual plan changes bypass Stripe. For production billing, use Stripe Dashboard.

---

### Task 3: Monitor High Token Users

**Purpose:** Identify usage anomalies or abuse

**Steps:**
1. Go to `/admin/usage`
2. View "Top 10 Users by Token Usage" table
3. Click user ID to see details
4. Check AI usage history for patterns
5. If abuse detected, downgrade plan or contact user

---

### Task 4: Track Marketplace Performance

**Steps:**
1. Go to `/admin/revenue`
2. View "Marketplace Commissions" card
3. Check Total GMV and Commission
4. Review "Top Sellers" table
5. Identify successful sellers for case studies

**Commission Calculation:**
- Sale of €100 product:
  - Free seller: €7 commission → €93 payout
  - Plus seller: €4 commission → €96 payout
  - Pro seller: €1 commission → €99 payout

---

### Task 5: Review Community Engagement

**Steps:**
1. Go to `/admin/community`
2. View messages by channel
3. Identify top contributors
4. Check bot response rate
5. Plan community events or features

---

### Task 6: Rate AI Response Quality

**Future Feature (via Evaluation tab):**
1. Go to `/admin/evaluation`
2. Click "Rate Answer" on any test result
3. Submit rating (1-5 stars)
4. Add notes about accuracy
5. Flag hallucinations if found

**Stores in:** `ai_feedback` table

---

## 🚀 Deployment Checklist

### Environment Variables

**Required:**
```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS=price_...
STRIPE_PRICE_ID_PRO=price_...

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Admin Access (development only)
EVAL_MODE=true
```

### Database Setup

**1. Run Migrations:**
```bash
npm run db:push
```

**2. Create Admin User:**
```sql
INSERT INTO users (email, role, plan) 
VALUES ('admin@productifyai.com', 'admin', 'pro')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
```

**3. Initialize Community Channels:**
```bash
curl -X POST http://localhost:5050/api/community/init
```

**4. Ingest Knowledge Base:**
```bash
npm run ingest:kb
```

### Stripe Setup

**1. Create Products:**
- ProductifyAI Plus: €24/month
- ProductifyAI Pro: €49/month

**2. Configure Webhook:**
- URL: `https://api.productifyai.com/api/stripe/webhook`
- Events: All `customer.subscription.*` and `invoice.*` events

**3. Test Integration:**
```bash
tsx server/test-stripe.ts
```

---

## 🐛 Troubleshooting

### Admin Section Not Visible

**Problem:** Admin menu items don't show in sidebar

**Solutions:**
1. Check user has `role='admin'` in database
2. Verify `EVAL_MODE=true` in .env (development)
3. Clear browser cache and reload
4. Check console for auth errors

**Verify:**
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```

---

### 403 Forbidden on Admin Routes

**Problem:** All `/api/admin/*` routes return 403

**Solutions:**
1. Confirm user is logged in
2. Verify role is 'admin' in database
3. Check `isAdmin` middleware is applied
4. Review server logs for auth errors

**Debug:**
```bash
# Check server logs
tail -f logs/server.log | grep admin
```

---

### Stripe Data Not Loading

**Problem:** Revenue tab shows mock data

**Solutions:**
1. Verify `STRIPE_SECRET_KEY` in .env
2. Check Stripe API key is valid (test vs live)
3. Review Stripe Dashboard for API status
4. Check server logs for Stripe errors

**Test:**
```bash
tsx server/test-stripe.ts
```

---

### Empty Data in Admin Pages

**Problem:** All metrics show 0

**Solutions:**
1. **Expected:** New installation with no data
2. Seed test data:
   ```sql
   -- Create test orders
   INSERT INTO orders (buyer_id, seller_id, amount, commission, commission_rate, seller_payout, buyer_plan, status)
   VALUES ('user-1', 'user-2', 10000, 400, 4, 9600, 'plus', 'completed');
   
   -- Create test AI usage
   INSERT INTO ai_usage (user_id, feature, model, tokens_in, tokens_out, latency_ms)
   VALUES ('user-1', 'chat', 'gpt-4o-mini', 450, 320, 234);
   ```

---

## 📈 Performance Considerations

### Caching Strategy

**Stripe Revenue:**
- Cached for 60 seconds
- Avoids rate limits (100 req/s limit)
- Automatic refresh on cache miss

**Database Queries:**
- Indexed on common filter fields
- Pagination to limit result sets
- Aggregations computed server-side

### Optimization Tips

1. **Pagination:** Always use `limit` and `offset`
2. **Date Ranges:** Filter by `created_at` with indexes
3. **Aggregations:** Use SQL `COUNT`, `SUM`, `AVG` instead of client-side
4. **Realtime:** Consider WebSocket for live updates (future)

---

## 🔒 Security Best Practices

### Data Protection

✅ **Email Masking:** List views show `u***@example.com`  
✅ **Full Access:** Detail drawers show complete info  
✅ **Role-Based:** All routes check `role='admin'`  
✅ **Audit Logging:** Admin actions logged to `ai_usage` with feature='admin_view'  
✅ **HTTPS Only:** Production requires SSL  

### Compliance

- **GDPR:** PII masked in lists, accessible only to admins
- **Audit Trail:** All admin actions logged with timestamps
- **Access Control:** Role-based, not just environment variables

---

## 📚 Related Documentation

- [KB Admin README](./KB_ADMIN_README.md) - Knowledge base management
- [Evaluation README](./EVALUATION_README.md) - AI quality testing
- [Admin Center README](./ADMIN_CENTER_README.md) - General admin features
- [Stripe Integration](./STRIPE_INTEGRATION.md) - Subscription setup
- [Commission Rules](./COMMISSION_RULES.md) - Marketplace fees

---

## 🎓 Adding New Admin Features

### Example: Add New Metric

**1. Create API Endpoint:**
```typescript
// server/routes/admin.ts
router.get('/my-metric', isAdmin, async (req, res) => {
  const data = await db.select()... // Query
  res.json({ ok: true, data });
});
```

**2. Create Frontend Page:**
```tsx
// client/src/pages/AdminMyMetric.tsx
export default function AdminMyMetric() {
  const { data } = useQuery({
    queryKey: ['/api/admin/my-metric'],
    queryFn: async () => { /* fetch */ },
  });
  
  return <div>{ /* UI */ }</div>;
}
```

**3. Add to AdminLayout:**
```tsx
{
  title: 'My Metric',
  href: '/admin/my-metric',
  icon: Icon,
  description: 'Description',
}
```

**4. Register Route:**
```tsx
// App.tsx
<Route path="/admin/my-metric">
  <AdminLayout><AdminMyMetric /></AdminLayout>
</Route>
```

---

## ✅ Testing Checklist

### Before Production

- [ ] Set admin role for at least one user
- [ ] Verify all admin routes return 403 for non-admins
- [ ] Test user search and filtering
- [ ] Confirm Stripe data loads (or shows mock warning)
- [ ] Verify commission calculations are correct
- [ ] Test plan and role changes
- [ ] Check all pagination works
- [ ] Verify email masking in lists
- [ ] Test copy-to-clipboard functions
- [ ] Confirm no PII leaks in logs

### Manual Test Plan

```bash
# 1. Start server
npm run dev

# 2. Set yourself as admin
# (In Supabase SQL editor)
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';

# 3. Access admin
# Open: http://localhost:5173/admin

# 4. Test each tab
# - Overview: Check stats load
# - Users: Search, open drawer, change plan
# - Revenue: View Stripe data (or mock warning)
# - AI Usage: View aggregates and top users
# - Community: View channel breakdown
# - Evaluation: Run benchmarks
# - KB: Create/edit documents
# - Settings: View config, test actions

# 5. Test security
# - Logout, login as regular user
# - Try accessing /admin (should be denied or hidden)
# - Verify API returns 403 for non-admins
```

---

## 📊 Screenshots (Textual)

### Users Page
```
┌─────────────────────────────────────────────────────┐
│ Users                            [Search] [Filter]  │
├─────────────────────────────────────────────────────┤
│ Name/Email     │ Plan  │ Role  │ Status │ Comm.   │
│ John Doe       │ PLUS  │ User  │ Active │ 4%      │
│ u***@ex.com    │       │       │        │         │
│ Jane Smith     │ PRO   │ Admin │ Active │ 1%      │
│ j***@ex.com    │       │       │        │         │
│ ...                                                 │
├─────────────────────────────────────────────────────┤
│ Page 1 of 25                   [< Prev] [Next >]  │
└─────────────────────────────────────────────────────┘
```

### Revenue Page
```
┌──────────┬──────────┬──────────┬──────────┐
│ MRR      │ ARR      │ Active   │ Avg Comm │
│ €4,752   │ €57,024  │ 268      │ 4.0%     │
└──────────┴──────────┴──────────┴──────────┘

┌─ Marketplace Commissions ─────────────────┐
│ GMV: €1,450  Commission: €58  Payout: €1,392 │
│                                             │
│ Commission Tiers:                           │
│ [Free: 7%] [Plus: 4%] [Pro: 1%]            │
└─────────────────────────────────────────────┘
```

---

**Version:** 2.0  
**Last Updated:** October 20, 2025  
**Maintainer:** ProductifyAI Engineering  
**Status:** Production Ready 🚀

