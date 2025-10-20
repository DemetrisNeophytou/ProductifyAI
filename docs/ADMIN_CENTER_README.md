# Admin Control Center

## Overview

The **Admin Control Center** is a unified internal dashboard for managing, monitoring, and optimizing ProductifyAI's AI systems, knowledge base, and infrastructure. It consolidates all admin tools into a single, professional interface.

---

## 🎯 Key Features

### 1. **Unified Navigation**
- Single entry point for all admin functions
- Sidebar navigation with persistent state
- Breadcrumb trail for context
- Theme-aware (light/dark mode)

### 2. **System Overview**
- Real-time health monitoring
- Key metrics dashboard
- Quick action shortcuts
- Recent activity feed

### 3. **AI Evaluation Suite**
- Automated quality testing
- Benchmark question scoring
- Performance tracking over time
- Export capabilities

### 4. **Knowledge Base Editor**
- CRUD operations for KB documents
- Semantic search
- Embedding management
- Topic/tag filtering

### 5. **Analytics Dashboard**
- API usage metrics
- Performance monitoring
- Token cost tracking
- User plan distribution

### 6. **System Settings**
- Environment configuration
- Admin utilities
- Health checks
- Security controls

---

## 🔐 Access Control

### Requirements
To access the Admin Control Center:

1. **Environment Variable**: Set `VITE_EVAL_MODE=true` in `.env`
2. **Admin Role** (future): User must have `role='admin'` in database

### Security Middleware
All `/api/admin/*` routes are protected by the `requireAdmin` middleware:

```typescript
export function requireAdmin(req, res, next) {
  const evalMode = process.env.EVAL_MODE === 'true';
  
  if (!evalMode) {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }
  
  // TODO: Add user role check
  // if (req.user?.role !== 'admin') { ... }
  
  next();
}
```

---

## 📁 File Structure

```
ProductifyAI/
├── client/src/
│   ├── components/admin/
│   │   ├── AdminLayout.tsx          # Main layout with sidebar
│   │   ├── KBTable.tsx               # KB document table
│   │   └── KBEditorModal.tsx         # KB document editor
│   └── pages/
│       ├── AdminOverview.tsx         # Dashboard homepage
│       ├── AdminEvaluation.tsx       # AI quality testing
│       ├── AdminKB.tsx               # Knowledge base manager
│       ├── AdminAnalytics.tsx        # Usage analytics
│       └── AdminSettings.tsx         # System configuration
├── server/routes/
│   ├── admin.ts                      # Admin API endpoints
│   └── kb.ts                         # KB management API
└── docs/
    └── ADMIN_CENTER_README.md        # This file
```

---

## 🚀 Getting Started

### 1. Enable Admin Mode

Add to your `.env` file:
```bash
VITE_EVAL_MODE=true
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Admin Center
Navigate to: `http://localhost:5173/admin`

You'll see the sidebar navigation automatically appear in your regular sidebar under "Admin" section.

---

## 📊 Features by Tab

### Overview Tab (`/admin`)

**Purpose**: System health dashboard and quick actions

**Displays**:
- System Health status (healthy/warning/critical)
- Uptime, latency, error rate
- Total users, projects, KB documents
- AI requests today
- Quick action buttons
- Recent activity feed
- External resource links (Supabase, OpenAI, Vercel)

**Actions**:
- Refresh stats
- Navigate to other tabs
- View system activity

---

### Evaluation Tab (`/admin/evaluation`)

**Purpose**: Test and improve AI quality

**Features**:
- Run all benchmarks
- View evaluation results table
- Score breakdown (Grounding, Structure, Completeness, Length)
- Overall AI Quality Score
- Last run timestamp
- Color-coded scores (red <60%, yellow <80%, green ≥80%)

**Workflow**:
1. Click "Run All Benchmarks"
2. Wait for evaluation (runs sequentially through `goldenQuestions.json`)
3. View scores in table
4. Identify weak areas
5. Improve KB content or prompts
6. Re-run to measure improvement

**Related Files**:
- `/eval/goldenQuestions.json` - Benchmark questions
- `/eval/evalRunner.ts` - Evaluation logic
- `/eval/evalReport.json` - Results output

---

### Knowledge Base Tab (`/admin/kb`)

**Purpose**: Manage AI's memory and expert content

**Features**:
- List all KB documents
- Search documents (semantic + full-text)
- Create new documents
- Edit existing documents
- Delete documents
- Recompute embeddings
- Filter by topic/tags
- View chunk counts

**Document Editor Fields**:
- Title (required)
- Topic (required)
- Tags (multi-select)
- Content (Markdown)

**Actions**:
1. **Create Document**:
   - Click "New Document"
   - Fill in title, topic, tags
   - Write Markdown content
   - Click "Create Document"

2. **Edit Document**:
   - Click ⋮ menu → "Edit"
   - Modify fields
   - Click "Update Document"

3. **Recompute Embeddings**:
   - Click ⋮ menu → "Recompute Embeddings"
   - Confirms regeneration
   - Waits for OpenAI embedding generation

4. **Delete Document**:
   - Click ⋮ menu → "Delete"
   - Confirm deletion
   - Cascade deletes chunks + embeddings

---

### Analytics Tab (`/admin/analytics`)

**Purpose**: Monitor usage, performance, and costs

**Sections**:

#### 1. **Key Metrics** (Top Cards)
- AI Requests (today + trend)
- Avg Latency (with P95/P99)
- KB Lookups
- Token Cost

#### 2. **Requests Tab**
- Request volume (today, week, month)
- Breakdown by endpoint
- Visual progress bars

#### 3. **Performance Tab**
- Latency distribution (avg, P95, P99)
- KB performance metrics
- Cache hit rate

#### 4. **Token Usage Tab**
- Usage by model (gpt-4o, gpt-4o-mini)
- Cost per model
- Total cost summary

#### 5. **User Plans Tab**
- Distribution (Free, Plus, Pro)
- User counts + percentages
- Revenue metrics (MRR, ARR)

**Controls**:
- Time range selector (24h, 7d, 30d, 90d)
- Export button (JSON download)

---

### Settings Tab (`/admin/settings`)

**Purpose**: View configuration and run utilities

**Sections**:

#### 1. **Current Admin User**
- Email
- User ID
- Admin badge

#### 2. **System Configuration** (Read-Only)
- **Database**:
  - Connection URL (masked)
  - Pool size
  - Connection status
- **OpenAI**:
  - Chat model
  - Embedding model
  - API key status
- **Environment**:
  - Node environment
  - Server port
  - CORS origins
- **Feature Flags**:
  - Evaluation Mode
  - Mock Database

**Show/Hide Secrets**: Toggle to reveal full connection strings

#### 3. **Admin Actions**
- **Restart Evaluation**: Clear eval cache
- **Clear Logs**: Delete logs >7 days old
- **Recompute All Embeddings**: (Coming Soon)
- **System Health Check**: (Coming Soon)

#### 4. **System Health** (Last 24h)
- Uptime percentage
- Error count
- Avg response time
- Last backup timestamp

#### 5. **Security Notice**
Warning card about admin privileges

---

## 🛠️ API Endpoints

### Admin Stats
```
GET /api/admin/stats
```
Returns system health, user counts, and performance metrics.

**Response**:
```json
{
  "ok": true,
  "data": {
    "uptime": "2d 14h 32m",
    "totalUsers": 1248,
    "totalProjects": 3542,
    "totalKBDocs": 15,
    "aiRequestsToday": 892,
    "avgLatency": 234,
    "errorRate": 0.02,
    "systemHealth": "healthy"
  }
}
```

---

### Analytics
```
GET /api/admin/analytics?range=7d
```
Returns usage analytics for the specified time range.

**Query Parameters**:
- `range`: `24h`, `7d`, `30d`, `90d`

**Response**:
```json
{
  "ok": true,
  "data": {
    "aiRequests": { "today": 892, "week": 6234, "month": 24891, "trend": 12.3 },
    "latency": { "avg": 234, "p95": 450, "p99": 680 },
    "kbLookups": { "today": 7136, "avgPerRequest": 8 },
    "tokenUsage": {
      "total": 1245890,
      "cost": 24.92,
      "byModel": [
        { "model": "gpt-4o", "tokens": 523400, "cost": 15.7 }
      ]
    },
    "usersByPlan": { "free": 980, "plus": 198, "pro": 70 }
  }
}
```

---

### System Config
```
GET /api/admin/config
```
Returns environment configuration.

**Response**:
```json
{
  "ok": true,
  "data": {
    "database": {
      "url": "postgresql://...",
      "connected": true,
      "poolSize": 10
    },
    "openai": {
      "configured": true,
      "model": "gpt-4o",
      "embeddingModel": "text-embedding-3-large"
    },
    "environment": {
      "nodeEnv": "development",
      "port": 5050,
      "corsOrigin": ["http://localhost:5173"]
    },
    "features": {
      "evalMode": true,
      "mockDb": false
    }
  }
}
```

---

### Logs
```
GET /api/admin/logs?limit=50
```
Returns recent system logs.

---

### Clear Logs
```
POST /api/admin/logs/clear
```
Deletes old system logs.

---

### Restart Evaluation
```
POST /api/admin/evaluation/restart
```
Resets evaluation cache.

---

## 🎨 UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header: Admin Control Center | Mode Badge | ← │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Sidebar     │  Main Content Area              │
│              │                                  │
│  - Overview  │  (Tab-specific content)         │
│  - Eval      │                                  │
│  - KB        │                                  │
│  - Analytics │                                  │
│  - Settings  │                                  │
│              │                                  │
│  [Warning]   │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

### Navigation Flow
1. **Entry**: Click "Admin" in main app sidebar → `/admin`
2. **Tab Navigation**: Click sidebar items → No page reload (SPA)
3. **Breadcrumbs**: Auto-updates based on current route
4. **Back Button**: Returns to main app (`/dashboard`)

### Visual Hierarchy
- **Primary**: System health, key metrics (cards)
- **Secondary**: Detailed tables, charts (tabs)
- **Tertiary**: Actions, filters (buttons, dropdowns)

### Color Coding
- **Green**: Healthy, good performance
- **Yellow**: Warning, needs attention
- **Red**: Critical, error state
- **Blue**: Informational
- **Purple**: Premium/Pro features

---

## 🔧 Development

### Adding a New Tab

1. **Create Page Component**:
```tsx
// client/src/pages/AdminMyTab.tsx
export default function AdminMyTab() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">My Tab</h2>
      {/* Content */}
    </div>
  );
}
```

2. **Add to AdminLayout Navigation**:
```tsx
// client/src/components/admin/AdminLayout.tsx
const adminNavItems = [
  // ... existing items
  {
    title: 'My Tab',
    href: '/admin/my-tab',
    icon: Icon,
    description: 'Tab description',
  },
];
```

3. **Register Route**:
```tsx
// client/src/App.tsx
const AdminMyTab = lazy(() => import("@/pages/AdminMyTab"));

// In routes:
<Route path="/admin/my-tab">
  <AdminLayout>
    <AdminMyTab />
  </AdminLayout>
</Route>
```

4. **Add API Endpoint** (if needed):
```typescript
// server/routes/admin.ts
router.get('/my-tab/data', async (req, res) => {
  // Implementation
});
```

---

### Customizing Colors/Themes

All components use Tailwind classes and shadcn/ui primitives. To customize:

1. **Update Theme Variables**:
```css
/* client/src/index.css */
:root {
  --primary: /* your color */;
  --secondary: /* your color */;
}
```

2. **Component Overrides**:
```tsx
<Card className="border-2 border-primary">
  {/* Custom styled card */}
</Card>
```

---

## 📈 Performance Optimization

### Best Practices
1. **React Query Caching**: All API calls cached for 30s-5min
2. **Lazy Loading**: All admin pages lazy-loaded
3. **Skeleton States**: Loading indicators for better UX
4. **Debounced Search**: Search inputs debounced (300ms)
5. **Pagination** (future): For large datasets

### Monitoring
Check performance via:
- Browser DevTools → Performance tab
- React DevTools → Profiler
- Network tab → API call times

---

## 🐛 Troubleshooting

### Admin Section Not Visible
**Problem**: "Admin" section missing from sidebar

**Solutions**:
1. Check `.env` has `VITE_EVAL_MODE=true`
2. Restart dev server (`npm run dev`)
3. Clear browser cache
4. Verify `AppSidebar.tsx` has `isAdminEnabled` check

---

### 403 Forbidden on API Calls
**Problem**: `/api/admin/*` returns 403

**Solutions**:
1. Verify `.env` has `EVAL_MODE=true` (backend)
2. Check `requireAdmin` middleware is applied
3. Ensure you're logged in (future auth check)

---

### Mock Data Not Updating
**Problem**: Stats/analytics show outdated mock data

**Solutions**:
1. Currently using mock responses in `server/routes/admin.ts`
2. To get real data, uncomment DB queries
3. Connect to Supabase DB with real data

---

### Sidebar Navigation Not Persisting
**Problem**: Loses active state on refresh

**Solutions**:
1. Check Wouter `useLocation` is working
2. Verify route paths match exactly
3. Ensure `AdminLayout` is wrapping all admin pages

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time WebSocket updates
- [ ] Advanced charting (Recharts/Chart.js integration)
- [ ] Custom dashboard builder (drag-and-drop widgets)
- [ ] Multi-user admin (role hierarchy)
- [ ] Audit log viewer (all admin actions tracked)
- [ ] Automated alerts (email/Slack notifications)
- [ ] Export all data (CSV, PDF reports)
- [ ] A/B testing dashboard
- [ ] User impersonation (support tool)
- [ ] Performance profiling tools

### Integrations
- [ ] Sentry (error tracking)
- [ ] Datadog/New Relic (APM)
- [ ] Stripe Dashboard embed
- [ ] Google Analytics admin view
- [ ] Slack bot for alerts

---

## 🛡️ Security Best Practices

### Recommendations
1. **Never commit `.env` files** with real credentials
2. **Use environment-specific configs** (dev/staging/prod)
3. **Rotate admin passwords** regularly
4. **Enable 2FA** for admin accounts (future)
5. **Audit admin actions** (log all changes)
6. **Restrict admin IPs** (firewall rules)
7. **Use HTTPS only** in production
8. **Monitor for suspicious activity**

### Compliance
- **GDPR**: Don't expose user PII without consent
- **SOC 2**: Log all admin access
- **HIPAA** (if applicable): Encrypt all sensitive data

---

## 📚 Related Documentation

- [KB Admin README](./KB_ADMIN_README.md) - Knowledge Base management
- [Evaluation README](./EVALUATION_README.md) - AI quality testing
- [API Docs](../API_DOCS.md) - Full API reference
- [Deployment Guide](../VERCEL_DEPLOYMENT_GUIDE.md) - Production setup

---

## 🤝 Contributing

### Adding New Features
1. Create feature branch: `git checkout -b feature/admin-my-feature`
2. Implement feature + tests
3. Update this README
4. Submit PR with screenshots

### Code Style
- Use TypeScript strict mode
- Follow existing component patterns
- Add JSDoc comments for complex logic
- Use semantic HTML
- Ensure mobile responsiveness

---

## 📞 Support

### Get Help
- **Documentation**: Check this README first
- **GitHub Issues**: For bugs/feature requests
- **Slack Channel**: `#admin-tools` (internal)
- **Email**: admin@productifyai.com

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Maintainer**: ProductifyAI Engineering Team  
**License**: Internal Use Only

