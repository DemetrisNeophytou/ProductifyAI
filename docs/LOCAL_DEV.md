# Local Development Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp env.example .env

# Edit .env and set required values (or leave defaults for mock mode)
```

### 3. Start Development Server

```bash
npm run dev
```

This starts both the API server and client in development mode:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5050

---

## 🔧 Environment Variables

### Required for Development

```bash
# Application
NODE_ENV=development
PORT=5050
VITE_API_URL=http://localhost:5050
FRONTEND_URL=http://localhost:5173

# Mock Mode (no external services needed)
MOCK_DB=true
MOCK_STRIPE=true

# Admin Features
EVAL_MODE=true
VITE_EVAL_MODE=true
VITE_SHOW_DEV_BANNER=true
```

### Optional (for full functionality)

```bash
# OpenAI (for AI features)
OPENAI_API_KEY=sk-proj-...

# Supabase (for real database)
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (for real payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS=price_...
STRIPE_PRICE_ID_PRO=price_...
```

---

## 🧪 Mock Mode

### What is Mock Mode?

When `MOCK_DB=true` and `MOCK_STRIPE=true`, ProductifyAI runs entirely in-memory without external dependencies.

**Benefits:**
- ✅ No Docker required
- ✅ No database setup needed
- ✅ No Stripe account required
- ✅ Instant startup
- ✅ Perfect for frontend development

**Limitations:**
- ⚠️ Data resets on server restart
- ⚠️ No real payments
- ⚠️ No real AI responses (mock data)

### MOCK_DB Mode

**When enabled:**
- Uses in-memory data structures
- Pre-seeded with sample users and products
- All CRUD operations work (but don't persist)

**Server log:**
```
🧪 Using MOCK_DB in-memory database (no Docker required)
```

### MOCK_STRIPE Mode

**When enabled:**
- Checkout sessions return mock URLs
- Webhooks not required
- Subscription changes simulated

**Server log:**
```
⚠️  STRIPE_SECRET_KEY not configured - using mock mode
```

**Automatically enabled when:**
- `STRIPE_SECRET_KEY` is not set in .env
- `MOCK_STRIPE=true` in .env

---

## 🔐 Admin Access

### Promote User to Admin

**Method 1: SQL Migration (Recommended)**

Run the admin migration:
```bash
npm run migrate:admin
```

This will:
1. Add `role` column to `users` table (if missing)
2. Create index on `role`
3. Set `dneophytou27@gmail.com` to `role='admin'`

**Method 2: Manual SQL (Supabase SQL Editor)**

```sql
-- Add role column if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Promote your email to admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'dneophytou27@gmail.com';

-- Verify
SELECT email, role FROM public.users WHERE role = 'admin';
```

**Method 3: Via Admin API (if already admin)**

```bash
curl -X PATCH http://localhost:5050/api/admin/users/{userId}/role \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Access Admin Panel

1. Login with admin email: `dneophytou27@gmail.com`
2. Navigate to: http://localhost:5173/admin
3. You should see the Admin Control Center with 8 tabs

**If you see 403 Forbidden:**
- Check `EVAL_MODE=true` in .env (development fallback)
- Verify your user has `role='admin'` in database
- Check server logs for auth errors

---

## 📁 Project Structure

```
ProductifyAI/
├── client/               # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/       # All pages including admin
│   │   ├── components/  # Reusable components
│   │   └── hooks/       # Custom React hooks
│   └── index.html
├── server/              # Backend (Express + TypeScript)
│   ├── routes/         # API endpoints
│   ├── middleware/     # Auth, plan gating, admin
│   ├── config/         # Stripe, database config
│   ├── utils/          # Helpers (logger, payments)
│   └── server.ts       # Main server file
├── shared/             # Shared types and schema
│   └── schema.ts       # Drizzle schema (database)
├── docs/               # Documentation
│   └── knowledge/      # RAG knowledge base
├── scripts/            # Utility scripts
│   └── ingest-knowledge-base.ts
└── eval/               # AI evaluation suite
```

---

## 🐛 Troubleshooting

### Issue: "Vite failed to scan dependencies"

**Symptoms:**
```
[vite] Failed to scan for dependencies
X [ERROR] Unexpected ")"
```

**Solutions:**
1. Check for syntax errors in TypeScript files
2. Look for unmatched braces `{`, `(`, `[`
3. Run: `npm run check` to see TypeScript errors
4. Common culprits: `client/src/pages/*.tsx`

**Fix:**
```bash
# Find syntax errors
npm run check

# If VisualEditor.tsx has issues:
# Check closing braces match opening braces
# Verify JSX is properly nested
```

---

### Issue: "Stripe API key not provided"

**Symptoms:**
```
Error: Neither apiKey nor config.authenticator provided
    at Stripe._setAuthenticator
```

**Solutions:**
1. **Option A: Enable Mock Mode (Recommended for Dev)**
   ```bash
   # In .env
   MOCK_STRIPE=true
   # OR leave STRIPE_SECRET_KEY empty
   ```

2. **Option B: Add Stripe Key**
   ```bash
   # Get test key from https://dashboard.stripe.com/test/apikeys
   STRIPE_SECRET_KEY=sk_test_...
   ```

**Verify Fix:**
```bash
# Server should log:
⚠️  STRIPE_SECRET_KEY not configured - using mock mode
```

---

### Issue: "Cannot access /admin (403 Forbidden)"

**Symptoms:**
- Navigate to http://localhost:5173/admin
- Get 403 error or redirected

**Solutions:**

**1. Enable Development Mode:**
```bash
# In .env
EVAL_MODE=true
VITE_EVAL_MODE=true
```

**2. Set Admin Role:**
```bash
# Run migration
npm run migrate:admin

# OR manually in Supabase
UPDATE users SET role = 'admin' WHERE email = 'dneophytou27@gmail.com';
```

**3. Check You're Logged In:**
- Must be authenticated
- Email must match admin user

**Verify Fix:**
```bash
# Check server logs for:
[INFO] Admin access granted: dneophytou27@gmail.com
```

---

### Issue: "EADDRINUSE: port 5050 already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5050
```

**Solutions:**

**Windows:**
```powershell
# Find process using port 5050
netstat -ano | findstr :5050

# Kill process (replace PID)
taskkill /PID <PID> /F

# OR change port in .env
PORT=5051
```

**Alternative:**
```bash
# Just restart npm run dev
# Concurrently will kill old processes
```

---

### Issue: "Database connection failed"

**Symptoms:**
```
Error connecting to database
```

**Solutions:**

**Development Mode (Recommended):**
```bash
# In .env
MOCK_DB=true
```

**Real Database:**
```bash
# Verify connection string
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Test connection
npm run db:push
```

---

## 🧪 Testing Your Setup

### 1. Basic Startup Test

```bash
npm run dev
```

**Expected Output:**
```
[dev:api] 🧪 Using MOCK_DB in-memory database
[dev:api] ⚠️  STRIPE_SECRET_KEY not configured - using mock mode
[dev:api] [INFO] 🚀 Starting ProductifyAI server...
[dev:api] [INFO] 🌐 Server running on port 5050
[dev:client] VITE v7.1.10  ready in 1117 ms
[dev:client] ➜  Local:   http://localhost:5173/
```

**No errors about:**
- Stripe API key
- Database connection (if MOCK_DB=true)
- TypeScript compilation
- Missing dependencies

### 2. Frontend Accessibility Test

Open in browser:

**Public Pages:**
- http://localhost:5173 → Landing page loads
- http://localhost:5173/pricing → Pricing page shows 3 tiers
- http://localhost:5173/login → Login page

**Authenticated Pages (after login):**
- http://localhost:5173/dashboard → Dashboard loads
- http://localhost:5173/marketplace → Marketplace visible

**Admin Pages (admin role required):**
- http://localhost:5173/admin → Admin Control Center
- http://localhost:5173/admin/users → User management
- http://localhost:5173/admin/revenue → Revenue analytics

**Development Banner:**
- Yellow banner in bottom-right corner showing:
  - ENV: development
  - MOCK_DB: ON
  - MOCK_STRIPE: ON

### 3. API Health Test

```bash
# Test health endpoint
curl http://localhost:5050/health/db

# Expected: {"ok": true, ...}
```

### 4. Admin Access Test

```bash
# Login and get session cookie, then:
curl http://localhost:5050/api/admin/stats

# If 403: Not admin
# If 200: Admin access working
```

---

## 🔨 Common Commands

### Development

```bash
npm run dev          # Start both frontend + API
npm run dev:client   # Start frontend only
npm run dev:api      # Start API only
npm run check        # TypeScript type check
```

### Database

```bash
npm run db:gen       # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run migrate:admin # Run admin role migration
```

### AI & Knowledge Base

```bash
npm run ingest:kb    # Ingest knowledge base documents
npm run eval         # Run AI evaluation suite
```

### Testing

```bash
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:ci      # Run tests in CI mode
```

---

## 📊 Development Workflow

### Typical Day

**1. Start Development:**
```bash
npm run dev
```

**2. Make Changes:**
- Edit files in `client/src/` or `server/`
- Hot reload automatically applies changes

**3. Test Changes:**
- Frontend: Instant HMR (Hot Module Replacement)
- Backend: Restart on file save

**4. Check for Errors:**
```bash
npm run check  # TypeScript
# Watch terminal for runtime errors
```

**5. Commit:**
```bash
git add .
git commit -m "feat: your changes"
```

### When Adding New Features

**1. Backend First:**
- Add route in `server/routes/`
- Update schema in `shared/schema.ts` if needed
- Add middleware if needed
- Test with curl or Postman

**2. Frontend Second:**
- Create page in `client/src/pages/`
- Add route in `client/src/App.tsx`
- Use React Query for API calls
- Add to navigation if needed

**3. Documentation:**
- Update relevant docs in `docs/`
- Add API endpoint to API_DOCS.md
- Update this guide if workflow changes

---

## 🎯 Development Checklist

Before starting work:
- [ ] `.env` file configured
- [ ] `npm install` completed
- [ ] Admin role set for your email
- [ ] `npm run dev` starts without errors

During development:
- [ ] Hot reload working
- [ ] No TypeScript errors (`npm run check`)
- [ ] No console errors in browser
- [ ] API endpoints respond correctly

Before committing:
- [ ] Code formatted (Prettier)
- [ ] No linter warnings
- [ ] Types are correct
- [ ] Documentation updated

---

## 🐳 Docker-Free Development

ProductifyAI is designed to run **without Docker** in development:

**Instead of:**
- ❌ Docker Compose
- ❌ Kubernetes
- ❌ VM environments

**We use:**
- ✅ `MOCK_DB=true` - In-memory database
- ✅ `MOCK_STRIPE=true` - Mock payment processor
- ✅ Local Node.js process
- ✅ Vite dev server with HMR

**Why?**
- Faster startup (< 10 seconds vs minutes)
- No Docker daemon required
- Easier debugging
- Works on any OS
- No port conflicts

---

## 🔍 Debugging Tips

### Enable Debug Logging

```bash
# In .env
DEBUG=true

# Server will log:
# - All API requests
# - Database queries
# - Auth checks
# - Plan gating decisions
```

### Check What's Running

```bash
# Windows
netstat -ano | findstr :5050
netstat -ano | findstr :5173

# Kill if needed
taskkill /PID <PID> /F
```

### View Live Logs

**Terminal Output:**
- API logs: Tagged with `[dev:api]`
- Client logs: Tagged with `[dev:client]`

**Filter Logs:**
```bash
# In separate terminal while npm run dev is running
# Watch API logs only
npm run dev 2>&1 | findstr "\[dev:api\]"
```

### Common Error Patterns

**"Cannot find module"**
→ Run `npm install`

**"Port in use"**
→ Kill process or change PORT in .env

**"Database connection failed"**
→ Set `MOCK_DB=true` or check DATABASE_URL

**"Stripe error"**
→ Set `MOCK_STRIPE=true` or add STRIPE_SECRET_KEY

**"403 on /admin"**
→ Set `EVAL_MODE=true` or promote user to admin

---

## 🎨 Frontend Development

### Hot Module Replacement (HMR)

Vite provides instant updates:
- Edit `.tsx` file → Page updates in <1s
- Edit `.css` file → Styles update instantly
- No page refresh needed

### Component Development

**1. Create Component:**
```tsx
// client/src/components/MyComponent.tsx
export function MyComponent() {
  return <div>Hello</div>;
}
```

**2. Use Component:**
```tsx
import { MyComponent } from '@/components/MyComponent';
```

**3. See Changes:**
- Save file
- Browser updates automatically

### Styling with Tailwind

```tsx
<div className="bg-primary text-white p-4 rounded-lg">
  Styled with Tailwind
</div>
```

**Design Tokens:**
- `bg-background`, `text-foreground` - Theme colors
- `text-muted-foreground` - Secondary text
- `border` - Default border
- `rounded-lg` - Border radius

---

## 🗄️ Database Development

### Using MOCK_DB (Default)

**Pros:**
- No setup required
- Fast development
- No migrations needed

**Cons:**
- Data resets on restart
- Can't test real database features

### Using Real Supabase

**1. Create Supabase Project:**
- Go to https://supabase.com
- Create new project
- Copy connection string

**2. Configure .env:**
```bash
MOCK_DB=false
DATABASE_URL=postgresql://postgres:password@....supabase.co:5432/postgres
```

**3. Run Migrations:**
```bash
npm run db:push
npm run migrate:admin
```

**4. Seed Data (Optional):**
```bash
# TODO: Add seed script
# For now, use Supabase SQL editor
```

---

## 🧩 Adding New Admin Features

### Example: Add "Refunds" Admin Page

**1. Create API Route:**
```typescript
// server/routes/admin.ts
router.get('/refunds', async (req, res) => {
  const refunds = await db.select().from(refunds);
  res.json({ ok: true, data: refunds });
});
```

**2. Create Page Component:**
```tsx
// client/src/pages/AdminRefunds.tsx
export default function AdminRefunds() {
  const { data } = useQuery({
    queryKey: ['/api/admin/refunds'],
    queryFn: async () => { /* fetch */ },
  });
  
  return <div>Refunds table</div>;
}
```

**3. Add to AdminLayout:**
```tsx
// client/src/components/admin/AdminLayout.tsx
{
  title: 'Refunds',
  href: '/admin/refunds',
  icon: DollarSign,
  description: 'Manage refunds',
}
```

**4. Register Route:**
```tsx
// client/src/App.tsx
<Route path="/admin/refunds">
  <AdminLayout><AdminRefunds /></AdminLayout>
</Route>
```

---

## 📚 Resources

### Internal Docs
- [Admin Overview](./ADMIN_OVERVIEW.md) - Complete admin guide
- [Stripe Integration](./STRIPE_INTEGRATION.md) - Subscription setup
- [Commission Rules](./COMMISSION_RULES.md) - Marketplace fees
- [Plan Rules](./PLAN_RULES.md) - Permission matrix
- [KB Admin](./KB_ADMIN_README.md) - Knowledge base
- [Evaluation](./EVALUATION_README.md) - AI testing

### External Docs
- [Vite](https://vitejs.dev) - Frontend tooling
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [Stripe](https://stripe.com/docs) - Payments
- [Supabase](https://supabase.com/docs) - Backend
- [shadcn/ui](https://ui.shadcn.com) - UI components

---

## ⚡ Performance Tips

### Faster Development

**1. Selective Hot Reload:**
- Only edit files you need
- Vite only rebuilds changed modules

**2. TypeScript Performance:**
```bash
# Use tsx instead of ts-node (faster)
tsx server/server.ts
```

**3. Mock Mode:**
- Use MOCK_DB for frontend work
- Connect real DB only when testing backend

### Production Build

```bash
# Build for production
npm run build

# Test production build
npm start
```

---

## 🔒 Security in Development

### Safe Practices

✅ **Never commit .env:**
- .env is in .gitignore
- Always use env.example as template

✅ **Use test keys:**
- Stripe: Use test mode keys (`sk_test_...`)
- OpenAI: Use separate dev API key

✅ **Mock sensitive operations:**
- Payments
- Email sending
- External API calls

### What's Safe to Commit

✅ Safe:
- Code files
- Documentation
- env.example (no secrets)
- Package.json

❌ Never commit:
- .env (has secrets)
- node_modules
- Database backups with user data
- API keys or tokens

---

## 🎓 Next Steps

### After Setup

1. **Explore Admin Panel:**
   - http://localhost:5173/admin
   - Try each of the 8 tabs
   - Create test users, view analytics

2. **Test Plan Features:**
   - Create Free, Plus, Pro test users
   - Verify access restrictions
   - Test commission calculations

3. **Customize Knowledge Base:**
   - Add docs to `docs/knowledge/`
   - Run `npm run ingest:kb`
   - Test AI Expert with RAG

4. **Connect Real Services:**
   - Set up Supabase project
   - Add Stripe test account
   - Get OpenAI API key
   - Update .env with real credentials

---

## 📞 Getting Help

### If Something's Not Working

**1. Check Logs:**
- Terminal output shows all errors
- Look for `[ERROR]` tags
- Read full stack traces

**2. Verify .env:**
```bash
# Print current environment (safe values only)
echo "NODE_ENV: $NODE_ENV"
echo "MOCK_DB: $MOCK_DB"
echo "PORT: $PORT"
```

**3. Test Individual Parts:**
```bash
# Test API only
npm run dev:api

# Test client only
npm run dev:client

# Check types
npm run check
```

**4. Clean Install:**
```bash
# Delete node_modules
rm -rf node_modules

# Reinstall
npm install

# Try again
npm run dev
```

---

**Version:** 1.0  
**Last Updated:** October 20, 2025  
**For:** Local development setup  
**Status:** Ready for development 🚀

