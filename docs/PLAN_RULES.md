# ProductifyAI Plan Rules & Permissions

## 📋 Plan Comparison Matrix

| Feature | Free | Plus (€24/mo) | Pro (€49/mo) |
|---------|------|---------------|--------------|
| **Creation Tools** | ❌ Blocked | ✅ Full Access | ✅ Full Access |
| **Editor/Canvas** | ❌ Blocked | ✅ Enabled | ✅ Enabled |
| **AI Builder** | ❌ Blocked | ✅ Enabled | ✅ Enabled |
| **Media Library** | ❌ Blocked | ✅ Enabled | ✅ Enabled |
| **AI Expert (RAG)** | ❌ Blocked | ✅ 50 queries/month | ✅ Unlimited |
| **Projects** | ❌ 0 (view only) | ✅ 10 projects | ✅ Unlimited |
| **AI Tokens** | 0 | 20,000/month | Unlimited |
| **AI Credits** | 0 | 500 | 2,000 |
| **Marketplace - Buy** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Marketplace - Sell (Upload)** | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| **Marketplace Commission** | 7% | 4% | 1% |
| **Community - Read** | ✅ Public channel only | ✅ All accessible channels | ✅ All channels |
| **Community - Post** | ❌ Read-only | ✅ Public + Creators Hub | ✅ All channels |
| **Analytics** | ❌ Basic only | ✅ Full | ✅ Advanced |
| **Support** | Email (48h) | Email (24h) | Priority 24/7 |
| **Trial** | 3-day Plus trial | Included | No trial |

---

## 🚫 Free Plan Restrictions

### What Free Users **CANNOT** Do

**1. Creation Tools (Blocked at API)**
- ❌ `/api/editor/**` - Visual editor
- ❌ `/api/canvas/**` - Canvas designer
- ❌ `/api/ai/**` - AI content generation
- ❌ `/api/media/**` - Media library and generation
- ❌ `/api/products/**` (POST/PUT/DELETE) - Product CRUD
- ❌ `/api/builders/**` - AI builders

**Returns:** `403 Forbidden` with upgrade message

**2. Community Posting (Read-Only)**
- ❌ `POST /api/community/:channelId/message` - Post message
- ❌ `PUT/PATCH/DELETE` - Edit/delete messages
- ✅ `GET /api/community/:channelId/messages` - Read messages (allowed)

**Returns:** `403 Forbidden` with message:
```json
{
  "error": "Community posting requires Plus or Pro plan",
  "message": "Free users can read messages. Upgrade to Plus to post."
}
```

**3. AI Expert**
- ❌ `POST /api/ai/expert` - AI chat queries

**Returns:** `403 Forbidden` with upgrade URL

**4. Advanced Features**
- ❌ Analytics dashboard
- ❌ Brand kit customization
- ❌ Video builder
- ❌ Translation tools

### What Free Users **CAN** Do

**1. Marketplace - Full Access ✅**
- ✅ Browse all listings
- ✅ Buy products (via Stripe checkout)
- ✅ Create listings (upload pre-made products)
- ✅ Edit/delete their own listings
- ✅ View their sales and purchases

**Routes Allowed:**
- `GET /api/marketplace/listings` - Browse
- `POST /api/marketplace/listings` - Create listing
- `PUT /api/marketplace/listings/:id` - Update own listing
- `DELETE /api/marketplace/listings/:id` - Delete own listing
- `GET /api/marketplace/listings/my` - View my listings
- `POST /api/marketplace/orders` - Purchase (as buyer)
- `POST /api/checkout/**` - Stripe checkout

**2. Community - Read-Only ✅**
- ✅ Read all messages in Public channel
- ❌ Cannot post, reply, react

**3. Profile & Settings ✅**
- ✅ Update profile
- ✅ View account settings
- ✅ Activate 3-day Plus trial

---

## 🔓 Plus Plan Access

### What Plus Users Get (Beyond Free)

**Creation Tools:**
- ✅ Editor and Canvas (visual design)
- ✅ AI Content Builder
- ✅ Media Library and AI generation
- ✅ 10 projects
- ✅ 20,000 AI tokens/month
- ✅ 500 AI credits

**AI Expert:**
- ✅ 50 queries/month
- ✅ RAG-powered answers with citations
- ✅ Conversation history

**Community:**
- ✅ Post in Public channel
- ✅ Post in Creators Hub
- ✅ Full participation (replies, reactions)

**Marketplace:**
- ✅ 4% commission (vs 7% on Free)
- ✅ All Free marketplace features

**Analytics:**
- ✅ Full analytics dashboard
- ✅ Sales tracking
- ✅ Traffic insights

---

## 👑 Pro Plan Access (Unlimited)

### What Pro Users Get (Beyond Plus)

**No Limits:**
- ✅ Unlimited projects
- ✅ Unlimited AI tokens
- ✅ Unlimited AI Expert queries
- ✅ 2,000 AI credits

**Exclusive Features:**
- ✅ Pro Founders Lounge (community)
- ✅ 1% marketplace commission (lowest)
- ✅ White-label options
- ✅ API access
- ✅ Priority 24/7 support
- ✅ Custom integrations

---

## 🛣️ Route Permission Matrix

### API Routes by Plan

| Route Pattern | Free | Plus | Pro | Notes |
|---------------|------|------|-----|-------|
| `/api/marketplace/listings` (GET) | ✅ | ✅ | ✅ | Browse |
| `/api/marketplace/listings` (POST) | ✅ | ✅ | ✅ | Create listing |
| `/api/marketplace/listings/:id` (PUT/DELETE) | ✅ Own only | ✅ Own only | ✅ Own only | Ownership validated |
| `/api/marketplace/orders` | ✅ | ✅ | ✅ | Buy/sell |
| `/api/checkout/**` | ✅ | ✅ | ✅ | Payments |
| `/api/editor/**` | ❌ 403 | ✅ | ✅ | Blocked by middleware |
| `/api/canvas/**` | ❌ 403 | ✅ | ✅ | Blocked by middleware |
| `/api/media/**` | ❌ 403 | ✅ | ✅ | Blocked by middleware |
| `/api/ai/expert` | ❌ 403 | ✅ 50/mo | ✅ Unlimited | Checked in route |
| `/api/builders/**` | ❌ 403 | ✅ | ✅ | Plan gated |
| `/api/products/**` (GET) | ✅ Read | ✅ | ✅ | View only |
| `/api/products/**` (POST/PUT/DELETE) | ❌ 403 | ✅ | ✅ | Blocked by middleware |
| `/api/community/:id/messages` (GET) | ✅ Public only | ✅ Public + Creators | ✅ All | Read access |
| `/api/community/:id/message` (POST) | ❌ 403 | ✅ | ✅ | Write blocked for Free |
| `/api/analytics/**` | ❌ 403 | ✅ Basic | ✅ Advanced | Plan gated |
| `/api/subscription/**` | ✅ | ✅ | ✅ | Manage own subscription |
| `/api/admin/**` | ❌ | ❌ | ❌ (unless role=admin) | Admin only |

### Frontend Routes by Plan

| Page Route | Free | Plus | Pro | Behavior |
|------------|------|------|-----|----------|
| `/dashboard` | ✅ Limited | ✅ Full | ✅ Full | Show upsell banners for Free |
| `/marketplace` | ✅ | ✅ | ✅ | Full access all plans |
| `/create` | ❌ Locked | ✅ | ✅ | Show paywall modal for Free |
| `/editor/:id` | ❌ Locked | ✅ | ✅ | Redirect Free to upgrade |
| `/canvas/:id` | ❌ Locked | ✅ | ✅ | Redirect Free to upgrade |
| `/media` | ❌ Locked | ✅ | ✅ | Show locked state for Free |
| `/ai-expert` | ❌ Locked | ✅ | ✅ | Paywall modal for Free |
| `/ai-agents` | ❌ Locked | ✅ | ✅ | Paywall modal for Free |
| `/community` | ✅ Read-only | ✅ Full | ✅ Full | Disable input for Free |
| `/analytics` | ❌ Basic | ✅ Full | ✅ Advanced | Limited for Free |
| `/pricing` | ✅ | ✅ | ✅ | All can view and upgrade |
| `/settings` | ✅ | ✅ | ✅ | All can manage account |

---

## 🔐 Middleware Implementation

### 1. Block Creation Tools (`blockFreeCreation`)

**Applied to:**
- `/api/editor/**`
- `/api/canvas/**`
- `/api/media/**`

**Logic:**
```typescript
if (user.plan === 'free') {
  return res.status(403).json({
    error: 'This feature requires Plus or Pro plan',
    upgradeUrl: '/upgrade?feature=creation'
  });
}
```

### 2. Community Write Block (`blockFreeCommunityWrite`)

**Applied to:**
- `POST /api/community/:channelId/message`

**Logic:**
```typescript
if (user.plan === 'free' && req.method !== 'GET') {
  return res.status(403).json({
    error: 'Community posting requires Plus or Pro plan',
    message: 'Free users can read messages. Upgrade to post.'
  });
}
```

### 3. AI Expert Gate (in route handler)

**Applied to:**
- `POST /api/ai/expert`

**Logic:**
```typescript
if (user.plan === 'free') {
  return res.status(403).json({
    error: 'AI Expert requires Plus or Pro plan',
    upgradeUrl: '/upgrade?feature=ai'
  });
}

// Plus: Check monthly limit (50 queries)
if (user.plan === 'plus' && queryCount >= 50) {
  return res.status(429).json({
    error: 'Monthly query limit reached',
    upgradeUrl: '/upgrade?plan=pro'
  });
}
```

---

## 🛒 Marketplace Listing Flow (Free Users)

### Free User Journey

**Step 1: Prepare Product**
- Create product externally (Canva, Figma, etc.)
- Export files (PDF, ZIP, etc.)

**Step 2: Create Listing**
1. Go to `/marketplace/sell`
2. Click "Create Listing"
3. Upload files (product files)
4. Fill in metadata:
   - Title
   - Description
   - Category
   - Tags
   - Price (in EUR)
   - License type
5. Click "Publish Listing"

**Step 3: Manage Sales**
- View in "My Listings"
- Edit price, description
- Pause/unpause listing
- View sales and earnings (minus 7% commission)

### API Flow

**Create Listing:**
```http
POST /api/marketplace/listings
Content-Type: application/json

{
  "userId": "user-uuid",
  "title": "Premium Notion Templates Bundle",
  "description": "50 productivity templates...",
  "price": 2700, // €27.00 in cents
  "category": "templates",
  "tags": ["notion", "productivity"],
  "fileUrl": "https://storage.../file.zip",
  "thumbnailUrl": "https://storage.../thumb.jpg",
  "license": "single-user"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "listing": {
      "id": "listing-uuid",
      "userId": "user-uuid",
      "title": "Premium Notion Templates Bundle",
      "price": 2700,
      "commissionRate": 7,
      "status": "published"
    }
  }
}
```

---

## 💰 Commission Application by Plan

### On Purchase

**Buyer purchases €100 product:**

**Seller's Plan Matters:**
```
Free Seller:
- Sale amount: €100.00
- Platform commission (7%): €7.00
- Seller receives: €93.00

Plus Seller:
- Sale amount: €100.00
- Platform commission (4%): €4.00
- Seller receives: €96.00

Pro Seller:
- Sale amount: €100.00
- Platform commission (1%): €1.00
- Seller receives: €99.00
```

**Implementation:**
```typescript
const sellerPlan = seller.plan; // from database
const commission = calculateCommission(amount, sellerPlan);
const sellerPayout = amount - commission;

// Create order record
await db.insert(orders).values({
  buyerId,
  sellerId,
  amount,
  commission,
  commissionRate: seller.commissionRate, // 7, 4, or 1
  sellerPayout,
  buyerPlan: buyer.plan, // Track buyer's plan too
});
```

---

## 🎨 Frontend Gating

### UI Patterns for Free Plan

**1. Hidden Elements**
```tsx
{user?.plan !== 'free' && (
  <Button onClick={handleCreate}>
    <Plus className="mr-2 h-4 w-4" />
    New Product
  </Button>
)}
```

**2. Disabled with Tooltip**
```tsx
<Button 
  disabled={user?.plan === 'free'}
  onClick={handleCreate}
  title={user?.plan === 'free' ? 'Upgrade to Plus to create products' : ''}
>
  Create
</Button>
```

**3. Locked State with Modal**
```tsx
{user?.plan === 'free' ? (
  <>
    <LockedFeature icon={Lock} text="Editor" />
    <PaywallModal 
      open={showPaywall}
      feature="creation"
    />
  </>
) : (
  <Editor />
)}
```

**4. Banner Upsell**
```tsx
{user?.plan === 'free' && (
  <Alert variant="info">
    <Sparkles className="h-4 w-4" />
    <AlertDescription>
      Unlock creation tools with Plus! 
      <Link href="/pricing">Start 3-day trial →</Link>
    </AlertDescription>
  </Alert>
)}
```

### Navigation Changes for Free

**Hidden Menu Items:**
- "Create" (main CTA)
- "New Product"
- "AI Agents"
- "Video Builder"
- "AI Coach"
- "Media"

**Visible Menu Items:**
- "Dashboard" (with upsell banners)
- "Marketplace" (full access)
- "Community" (read-only indicator)
- "Settings"
- "Pricing" (upgrade CTA)

---

## 🔄 Plan Transitions

### Downgrade: Plus/Pro → Free

**Immediate Effects:**
1. **Access Revoked:**
   - Editor/Canvas/AI tools locked
   - Community becomes read-only
   - AI Expert blocked
   - Analytics disabled

2. **Data Preserved:**
   - Existing projects become view-only
   - Marketplace listings remain active
   - Order history intact
   - Community messages visible (can't add new)

3. **Commission Updated:**
   - New sales: 7% commission (from 4% or 1%)
   - Existing pending payouts unaffected

**Database Changes:**
```sql
UPDATE users SET
  plan = 'free',
  commission_rate = 7,
  ai_tokens_limit = 0,
  credits = 0,
  projects_limit = 0
WHERE id = 'user-uuid';
```

### Upgrade: Free → Plus

**Immediate Effects:**
1. **Access Granted:**
   - Editor/Canvas/AI unlocked
   - Community posting enabled
   - AI Expert: 50 queries/month
   - 10 projects allowed

2. **Commission Reduced:**
   - 7% → 4% on new sales

**Database Changes:**
```sql
UPDATE users SET
  plan = 'plus',
  commission_rate = 4,
  ai_tokens_limit = 20000,
  credits = 500,
  projects_limit = 10
WHERE id = 'user-uuid';
```

### Trial: Free → Plus Trial (3 days)

**How It Works:**
1. User clicks "Start Free Trial" on pricing page
2. Stripe checkout created with `trial_period_days: 3`
3. User gets immediate Plus access (no payment yet)
4. After 3 days:
   - If payment method added → Converts to paid Plus
   - If no payment → Downgrades to Free

**Database:**
```sql
UPDATE users SET
  plan = 'plus',
  subscription_status = 'trialing',
  trial_end_date = NOW() + INTERVAL '3 days',
  commission_rate = 4,
  ai_tokens_limit = 20000,
  credits = 500,
  projects_limit = 10
WHERE id = 'user-uuid';
```

---

## 🧪 Testing Scenarios

### Test 1: Free User Tries to Create Product

**Steps:**
1. Login as Free user
2. Try to access `/editor/new`
3. **Expected:** Paywall modal appears
4. Click "Upgrade to Plus"
5. **Expected:** Redirects to `/pricing`

**API Test:**
```bash
curl -X POST http://localhost:5050/api/editor/new \
  -H "Content-Type: application/json" \
  -d '{"userId": "free-user-id", "title": "Test"}'

# Expected: 403 Forbidden
{
  "ok": false,
  "error": "This feature requires Plus or Pro plan",
  "upgradeUrl": "/upgrade?feature=creation"
}
```

### Test 2: Free User Creates Marketplace Listing

**Steps:**
1. Login as Free user
2. Go to `/marketplace/sell`
3. Click "Create Listing"
4. Upload file (PDF/ZIP)
5. Fill in title, description, price
6. Click "Publish"
7. **Expected:** Listing created successfully

**API Test:**
```bash
curl -X POST http://localhost:5050/api/marketplace/listings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "free-user-id",
    "title": "My Template Pack",
    "price": 2700,
    "fileUrl": "https://..."
  }'

# Expected: 200 OK
{
  "ok": true,
  "data": {
    "listing": { "id": "...", "commissionRate": 7 }
  }
}
```

### Test 3: Free User Tries to Post in Community

**Steps:**
1. Login as Free user
2. Go to `/community`
3. Try to type in message box
4. **Expected:** Input disabled with tooltip "Upgrade to post"

**API Test:**
```bash
curl -X POST http://localhost:5050/api/community/channel-id/message \
  -H "Content-Type: application/json" \
  -d '{"userId": "free-user-id", "content": "Hello"}'

# Expected: 403 Forbidden
{
  "ok": false,
  "error": "Community posting requires Plus or Pro plan",
  "message": "Free users can read messages. Upgrade to Plus to post."
}
```

### Test 4: Commission Rates by Plan

**Create 3 test users (Free/Plus/Pro) and test order creation:**

```bash
# Free seller (7% commission)
POST /api/marketplace/orders
{"sellerId": "free-user", "amount": 10000}
# Expected: commission = 700 (7%)

# Plus seller (4% commission)
POST /api/marketplace/orders
{"sellerId": "plus-user", "amount": 10000}
# Expected: commission = 400 (4%)

# Pro seller (1% commission)
POST /api/marketplace/orders
{"sellerId": "pro-user", "amount": 10000}
# Expected: commission = 100 (1%)
```

### Test 5: Plan Downgrade

**Steps:**
1. User on Plus plan
2. Cancel subscription in Stripe
3. Stripe webhook: `customer.subscription.deleted`
4. **Expected:** User downgraded to Free
5. Verify:
   - Cannot access `/editor`
   - Cannot post in community
   - Commission rate = 7%
   - Existing projects view-only

---

## 🎯 Enforcement Summary

### Backend (API Level)

✅ **Middleware Blocks:**
- `blockFreeCreation` → Blocks editor/canvas/media
- `blockFreeCommunityWrite` → Blocks community posting
- `requirePlan('plus')` → Blocks AI Expert for Free

✅ **Route-Level Checks:**
- AI Expert checks plan + monthly limit
- Marketplace listings validate ownership
- Orders calculate commission by seller's plan

✅ **Database Triggers:**
- Webhook updates immediately apply restrictions
- Plan changes update commission_rate atomically

### Frontend (UI Level)

✅ **Conditional Rendering:**
- Hide creation buttons for Free
- Show "locked" overlays on restricted pages
- Display upgrade CTAs

✅ **Disabled States:**
- Community input disabled for Free
- Create buttons grayed out with tooltips

✅ **Redirect Guards:**
- Protected routes redirect Free to `/upgrade`
- Paywall modals explain required plan

---

## 📊 Analytics & Monitoring

### Admin Dashboard Queries

**Track Free User Behavior:**
```sql
-- Free users who tried creation tools (from error logs)
SELECT COUNT(*) FROM api_logs 
WHERE user_plan = 'free' 
AND endpoint LIKE '/api/editor%' 
AND status = 403;

-- Free users who created listings
SELECT COUNT(*) FROM listings 
WHERE user_plan = 'free';

-- Free → Plus conversion rate
SELECT 
  COUNT(CASE WHEN previous_plan = 'free' THEN 1 END) as upgrades,
  COUNT(*) as total_free
FROM plan_changes 
WHERE created_at > NOW() - INTERVAL '30 days';
```

**Available in:** `/admin/users` and `/admin/analytics`

---

## 💡 Upsell Opportunities

### Where to Show Upgrade CTAs

**High-Intent Locations:**
1. **Editor route** → "Unlock visual design tools"
2. **AI Builder** → "Create with AI in seconds"
3. **Community input** → "Join the conversation"
4. **Dashboard banner** → "Lower your commissions to 4%"
5. **After 3rd listing** → "Create unlimited products with Plus"

**Messaging Examples:**
- "Create products 10x faster with AI Builder"
- "Pay only 4% commission (save 3% on every sale)"
- "Get unlimited AI assistance with Pro"
- "Join Creators Hub to network with top sellers"

---

## ⚠️ Important Notes

### Data Integrity

✅ **User Data Protected:**
- Downgrading to Free doesn't delete projects
- Projects become view-only (read-only mode)
- Marketplace listings remain active
- Order history preserved

✅ **Graceful Degradation:**
- API returns helpful error messages
- Frontend shows locked states, not errors
- Users always know how to upgrade

### Testing Best Practices

1. **Test with 3 Users:**
   - One Free, one Plus, one Pro
   - Verify each has correct access

2. **Test Transitions:**
   - Free → Plus (trial and paid)
   - Plus → Pro (upgrade)
   - Plus → Free (downgrade/cancel)

3. **Test Edge Cases:**
   - Free user with existing projects (from before downgrade)
   - Free user trying to edit old projects
   - Free user trying to use Direct message (if added)

---

## 🚀 Go-Live Checklist

### Before Production

- [ ] All middleware applied to correct routes
- [ ] Frontend shows/hides elements correctly
- [ ] Paywall modals have correct copy
- [ ] Commission rates verified in database
- [ ] Stripe webhooks update plans immediately
- [ ] Free users can browse and buy
- [ ] Free users can create listings
- [ ] Free users CANNOT access creation tools
- [ ] Free users CANNOT post in community
- [ ] All tests pass (see scenarios above)

---

**Version:** 1.0  
**Last Updated:** October 20, 2025  
**Status:** ✅ Enforced & Documented  
**Enforcement:** API + UI + Database

