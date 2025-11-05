# ProductifyAI - System Overview

**Version:** 1.0  
**Last Updated:** November 4, 2025  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Key Features](#key-features)
7. [Development Workflow](#development-workflow)
8. [Deployment Process](#deployment-process)
9. [Documentation Index](#documentation-index)
10. [Quick Reference](#quick-reference)

---

## 🏗️ System Architecture

ProductifyAI is a full-stack AI-powered product creation platform built with modern web technologies.

### **Architecture Components**

```
┌─────────────────────────────────────────────────────────────┐
│                     ProductifyAI Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Frontend   │◄───────►│   Backend    │                 │
│  │   (Vite +    │         │  (Express +  │                 │
│  │    React)    │         │   Node 22)   │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                         │                          │
│         │                         │                          │
│  ┌──────▼─────────────────────────▼──────┐                 │
│  │         Database (PostgreSQL)          │                 │
│  │         (Drizzle ORM)                  │                 │
│  └────────────────────────────────────────┘                 │
│                                                               │
│  ┌─────────────────────────────────────────┐                │
│  │      External Services & APIs            │                │
│  ├─────────────────────────────────────────┤                │
│  │  • OpenAI API (AI Content)              │                │
│  │  • Stripe (Payments)                    │                │
│  │  • Resend (Email)                       │                │
│  │  • Render (Hosting)                     │                │
│  │  • GitHub Actions (CI/CD)               │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow**

1. **User Request** → Frontend (React/Vite)
2. **API Call** → Backend (Express/Node 22)
3. **Data Processing** → Business Logic Layer
4. **AI Processing** → OpenAI API Integration
5. **Data Storage** → PostgreSQL Database
6. **Response** → JSON API Response
7. **Render** → Frontend UI Update

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** React 18+
- **Build Tool:** Vite 5+
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **UI Components:** Shadcn/ui
- **State Management:** Zustand
- **Routing:** React Router 6+
- **Forms:** React Hook Form
- **API Client:** TanStack Query (React Query)

### **Backend**
- **Runtime:** Node.js 22.x
- **Framework:** Express.js 4+
- **Language:** TypeScript 5+
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL 15+
- **Authentication:** JWT + Passport.js
- **Validation:** Zod
- **API Documentation:** OpenAPI/Swagger

### **DevOps & Infrastructure**
- **CI/CD:** GitHub Actions
- **Hosting:** Render.com
- **Monitoring:** Custom health checks (every 5 min)
- **Alerts:** Resend (Email) + Slack (Optional)
- **Version Control:** Git + GitHub
- **Package Manager:** npm 10+

### **AI & External Services**
- **AI Provider:** OpenAI GPT-4
- **Payments:** Stripe
- **Email:** Resend
- **Storage:** Local filesystem / Cloud storage

---

## 📁 Project Structure

```
ProductifyAI/
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── build.yml           # Build & deploy pipeline
│       └── uptime.yml          # Health monitoring
│
├── client/                     # Frontend application
│   ├── src/
│   │   ├── components/         # React components (116 files)
│   │   ├── pages/              # Page components (51 files)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # State management (Zustand)
│   │   ├── lib/                # Utility libraries
│   │   └── styles/             # Theme & styling
│   └── index.html              # Entry HTML
│
├── server/                     # Backend application
│   ├── routes/                 # API route handlers
│   ├── services/               # Business logic services
│   │   ├── ai-builder/         # AI content generation
│   │   └── video-builder/      # Video generation
│   ├── middleware/             # Express middleware
│   ├── lib/                    # Server utilities
│   └── db/                     # Database configuration
│
├── shared/                     # Shared types & schemas
│   ├── schema.ts               # Database schema
│   ├── ai-builder-contracts.ts # AI service contracts
│   └── video-builder-contracts.ts
│
├── scripts/                    # Operational scripts
│   ├── healthcheck.mjs         # Health monitoring
│   ├── daily-summary.mjs       # Uptime reports
│   ├── alert.mjs               # Alert system
│   └── check-secrets.mjs       # Config audit
│
├── ops/                        # Operations & monitoring
│   ├── README.md               # Ops documentation
│   ├── uptime/                 # Health check logs
│   │   ├── YYYY/MM/DD/         # Daily health logs
│   │   ├── REPORTS/            # Daily summaries
│   │   └── latest/             # Latest report
│   └── clean-worktrees.ps1     # Git cleanup utility
│
├── docs/                       # Project documentation
│   ├── ADMIN_CENTER_README.md  # Admin features
│   ├── EDITOR_README.md        # Editor documentation
│   ├── STRIPE_INTEGRATION.md   # Payment setup
│   ├── LOCAL_DEV.md            # Development guide
│   └── knowledge/              # Knowledge base
│
├── data/                       # Static data & templates
│   └── rag/                    # RAG templates
│       ├── recipes/            # Content recipes (9 files)
│       └── design/             # Design guidelines (4 files)
│
├── dist/                       # Build output
├── node_modules/               # Dependencies
├── package.json                # NPM configuration
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind config
├── drizzle.config.ts           # Database config
├── .editorconfig               # Editor settings
└── .vscode/                    # VSCode settings
    └── settings.json

Key Documentation Files:
├── DEPLOYMENT_FINAL_STATUS.md       # Deployment guide
├── SECRETS_CHECKLIST.md             # Secrets setup
├── DEPLOYMENT_READINESS_CHECKLIST.md # Pre-deploy checklist
├── CI_CD_REBUILD_COMPLETE.md        # CI/CD setup report
└── SYSTEM_OVERVIEW.md               # This file
```

---

## 🔄 CI/CD Pipeline

### **Build & Deploy Workflow** (`.github/workflows/build.yml`)

**Triggers:**
- Push to `replit-agent` branch
- Pull requests to `replit-agent`
- Manual workflow dispatch

**Pipeline Steps:**
1. **Checkout** - Fetch repository code
2. **Setup Node.js 22** - Configure Node environment
3. **Install Dependencies** - `npm ci`
4. **Lint** - Code quality checks (if configured)
5. **Type Check** - TypeScript validation (if configured)
6. **Test** - Run test suite (allows empty)
7. **Build** - `npm run build`
8. **Upload Artifacts** - Store build output

**Artifacts:**
- `dist/**` - Built files
- `client/dist/**` - Frontend build
- `server/dist/**` - Backend build

### **Uptime & Health Monitoring** (`.github/workflows/uptime.yml`)

**Two Jobs:**

#### 1. Health Check Job
**Schedule:** Every 5 minutes (`*/5 * * * *`)

**Steps:**
1. Checkout repository
2. Setup Node 22
3. Install runtime dependencies
4. Run `scripts/healthcheck.mjs`
5. Commit logs to repository
6. Upload JSON report as artifact
7. Send alerts on failure (via `scripts/alert.mjs`)

**Output:** `ops/uptime/YYYY/MM/DD/*.json`

#### 2. Daily Summary Job
**Schedule:** Daily at 23:55 UTC (`55 23 * * *`)

**Steps:**
1. Checkout repository
2. Setup Node 22
3. Run `scripts/daily-summary.mjs`
4. Commit daily report
5. Upload markdown report as artifact

**Output:** `ops/uptime/REPORTS/YYYY-MM-DD.md`

---

## 📊 Monitoring & Alerting

### **Health Check System**

**Script:** `scripts/healthcheck.mjs`

**Monitors:**
- Backend API health endpoint
- Frontend application availability
- Response times (latency)
- HTTP status codes

**Check Frequency:** Every 5 minutes (automated via GitHub Actions)

**Data Storage:**
```
ops/uptime/
├── 2025/
│   └── 11/
│       └── 04/
│           ├── 2025-11-04T00-00-00-000Z.json
│           ├── 2025-11-04T00-05-00-000Z.json
│           └── ... (every 5 minutes)
└── latest/
    └── report.json (most recent check)
```

**Report Format:**
```json
{
  "timestamp": "2025-11-04T12:00:00.000Z",
  "backend": {
    "url": "https://api.productifyai.com/api/health",
    "status": "ok",
    "statusCode": 200,
    "latency_ms": 123,
    "ok": true
  },
  "frontend": {
    "url": "https://productifyai.com",
    "status": "ok",
    "statusCode": 200,
    "latency_ms": 87,
    "ok": true
  },
  "overall": "healthy"
}
```

### **Daily Summary Reports**

**Script:** `scripts/daily-summary.mjs`

**Generates:**
- Uptime percentage
- Average latency (backend & frontend)
- Incident count and timeline
- Performance statistics

**Location:** `ops/uptime/REPORTS/YYYY-MM-DD.md`

**Metrics:**
- Total health checks
- Healthy vs unhealthy checks
- Uptime percentage
- Latency statistics (avg, max)
- Incident timeline

### **Alert System**

**Script:** `scripts/alert.mjs`

**Alert Channels:**
1. **Email** (via Resend API)
   - Recipient: `ALERT_EMAIL_TO` (comma-separated)
   - Trigger: Health check failure
   - Format: HTML + Plain text

2. **Slack** (optional, via webhook)
   - Channel: Configured webhook URL
   - Trigger: Health check failure
   - Format: Slack blocks with formatting

**Alert Triggers:**
- Backend API down (non-200 status)
- Frontend unavailable
- High latency (configurable threshold)
- Workflow failures

---

## 🎯 Key Features

### **AI Builder**
- AI-powered content generation
- Multiple content types (ebooks, landing pages, social posts, etc.)
- Template-based generation
- RAG (Retrieval-Augmented Generation) support
- Custom knowledge base integration

### **Editor**
- Rich text editor
- Real-time collaboration (planned)
- Auto-save functionality
- Export to multiple formats
- Template library

### **Admin Center**
- User management
- Analytics dashboard
- Content management
- Knowledge base admin
- System monitoring

### **Commerce**
- Stripe payment integration
- Subscription management
- Commission tracking
- Plan-based access control
- Webhook handling

### **Analytics**
- User activity tracking
- Content performance metrics
- Revenue analytics
- Engagement statistics

### **Multilingual Support**
- Multi-language content generation
- Translation capabilities
- Locale management

---

## 💻 Development Workflow

### **Local Development Setup**

1. **Prerequisites:**
   ```bash
   Node.js 22.x
   PostgreSQL 15+
   npm 10+
   ```

2. **Clone & Install:**
   ```bash
   git clone https://github.com/DemetrisNeophytou/ProductifyAI.git
   cd ProductifyAI
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup:**
   ```bash
   npm run db:push      # Push schema to database
   npm run db:migrate   # Run migrations
   ```

5. **Start Development Servers:**
   ```bash
   npm run dev          # Start both frontend & backend
   ```

   **Ports:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5050`

### **Development Commands**

```bash
npm run dev           # Start dev servers
npm run build         # Build for production
npm run lint          # Lint code
npm run typecheck     # Check TypeScript types
npm test              # Run tests
npm run db:push       # Update database schema
npm run db:studio     # Open Drizzle Studio
```

### **Git Workflow**

1. Create feature branch from `replit-agent`
2. Make changes with small, reviewable commits
3. Push to GitHub
4. Create Pull Request
5. CI/CD runs automatically
6. Merge after approval

**Branch Strategy:**
- `main` - Production-ready code
- `replit-agent` - Active development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

---

## 🚀 Deployment Process

### **Deployment Flow**

```
1. Code Commit → GitHub
2. CI/CD Trigger (GitHub Actions)
3. Build & Test
4. Deploy to Render
5. Health Checks
6. Monitoring Active
```

### **Deployment Steps**

1. **Pre-Deployment:**
   - Run `node scripts/check-secrets.mjs`
   - Verify all tests pass
   - Check linter output
   - Review `DEPLOYMENT_READINESS_CHECKLIST.md`

2. **Push to GitHub:**
   ```bash
   git push origin replit-agent
   ```

3. **Monitor Build:**
   - Go to: https://github.com/DemetrisNeophytou/ProductifyAI/actions
   - Verify "Build & Deploy" completes successfully
   - Check artifacts are uploaded

4. **Verify Deployment:**
   - Check health endpoints
   - Test critical user flows
   - Monitor error logs

5. **Post-Deployment:**
   - Verify health checks running
   - Check daily summary generation
   - Confirm alerts working

### **Rollback Procedure**

If deployment fails:
1. Revert last commit
2. Push rollback
3. Monitor health checks
4. Investigate issues
5. Fix and redeploy

---

## 📚 Documentation Index

### **Deployment & Operations**
- `DEPLOYMENT_FINAL_STATUS.md` - Complete deployment guide
- `DEPLOYMENT_READINESS_CHECKLIST.md` - Pre-deploy checklist
- `SECRETS_CHECKLIST.md` - GitHub secrets setup
- `CI_CD_REBUILD_COMPLETE.md` - CI/CD setup report
- `ops/README.md` - Operations documentation

### **Development Guides**
- `docs/LOCAL_DEV.md` - Local development setup
- `docs/EDITOR_README.md` - Editor documentation
- `docs/ADMIN_CENTER_README.md` - Admin features
- `SERVER_STRUCTURE_SUMMARY.md` - Backend structure

### **Feature Documentation**
- `docs/STRIPE_INTEGRATION.md` - Payment integration
- `docs/AI_CANVAS_FEATURES.md` - AI features
- `docs/ANALYTICS_README.md` - Analytics system
- `docs/COMMERCE_README.md` - E-commerce features
- `docs/MULTILINGUAL_README.md` - i18n support

### **Technical Guides**
- `API_DOCS.md` - API documentation
- `docs/DESIGN_SYSTEM.md` - UI/UX guidelines
- `docs/RAG_AND_GATING_IMPLEMENTATION.md` - RAG system
- `DOCKER_README.md` - Docker setup

### **Project History**
- `COMPLETE_IMPLEMENTATION_SUMMARY.md` - Full implementation summary
- `PRODUCTIFYAI_COMPLETE_SUMMARY.md` - Project overview
- `TASK_COMPLETION_REPORT.md` - Task tracking

---

## 🔍 Quick Reference

### **Important URLs**

| Resource | URL |
|----------|-----|
| **GitHub Repository** | https://github.com/DemetrisNeophytou/ProductifyAI |
| **GitHub Actions** | https://github.com/DemetrisNeophytou/ProductifyAI/actions |
| **GitHub Secrets** | https://github.com/DemetrisNeophytou/ProductifyAI/settings/secrets/actions |

### **Required Environment Variables**

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | AI content generation | `sk-...` |
| `STRIPE_SECRET_KEY` | Payment processing | `sk_test_...` |
| `RESEND_API_KEY` | Email sending | `re_...` |
| `JWT_SECRET` | Authentication | Random secure string |

### **GitHub Secrets (Required for CI/CD)**

| Secret | Purpose | Example |
|--------|---------|---------|
| `BACKEND_HEALTH_URL` | Health check endpoint | `https://api.productifyai.com/api/health` |
| `FRONTEND_URL` | Frontend URL | `https://productifyai.com` |
| `ALERT_EMAIL_TO` | Alert recipients | `admin@productifyai.com` |
| `RESEND_API_KEY` | Email alerts | `re_...` |

### **Port Configuration**

| Service | Development | Production |
|---------|------------|------------|
| Frontend | 5173 | 443 (HTTPS) |
| Backend | 5050 | 443 (HTTPS) |
| Database | 5432 | 5432 |

### **Key Scripts**

| Script | Command | Purpose |
|--------|---------|---------|
| Health Check | `node scripts/healthcheck.mjs` | Check service health |
| Daily Summary | `node scripts/daily-summary.mjs` | Generate uptime report |
| Send Alert | `node scripts/alert.mjs <type> <msg>` | Send alert notification |
| Check Secrets | `node scripts/check-secrets.mjs` | Verify configuration |
| Clean Worktrees | `pwsh ops/clean-worktrees.ps1` | Remove orphaned worktrees |

---

## 🎯 Success Metrics

### **System Health**
- **Uptime Target:** 99.9% (allows ~43 minutes downtime/month)
- **Backend Latency:** < 200ms average
- **Frontend Latency:** < 500ms average
- **Alert Response:** < 5 minutes from failure

### **CI/CD Performance**
- **Build Time:** < 5 minutes
- **Deployment Frequency:** On every push
- **Workflow Success Rate:** > 95%
- **Test Coverage:** Increasing (TBD)

### **Monitoring Coverage**
- **Health Checks:** Every 5 minutes (288/day)
- **Daily Reports:** 1 per day at 23:55 UTC
- **Alert Channels:** Email + Slack (optional)
- **Log Retention:** Indefinite (via Git)

---

## 🔐 Security Considerations

### **Secret Management**
- All secrets stored in GitHub Secrets
- Never commit secrets to repository
- Regular secret rotation recommended
- Use environment-specific secrets

### **Authentication**
- JWT-based authentication
- Secure password hashing
- Session management
- CORS configuration

### **API Security**
- Rate limiting (recommended)
- Input validation (Zod)
- SQL injection prevention (ORM)
- XSS protection

---

## 🤝 Contributing

### **Code Standards**
- TypeScript for all code
- ESLint for linting
- Prettier for formatting (via .editorconfig)
- Small, reviewable commits
- Clear commit messages

### **Testing Requirements**
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows (planned)
- Manual testing before deployment

### **Review Process**
1. Create Pull Request
2. CI/CD runs automatically
3. Code review by team
4. Address feedback
5. Merge after approval

---

## 📞 Support & Contact

### **Documentation Issues**
- Check existing documentation first
- Search GitHub issues
- Create new issue if needed

### **System Issues**
- Check health check logs: `ops/uptime/latest/report.json`
- Review daily summaries: `ops/uptime/REPORTS/`
- Check GitHub Actions logs
- Contact DevOps team

### **Emergency Contacts**
- Alerts sent to `ALERT_EMAIL_TO`
- Slack notifications (if configured)
- GitHub notifications

---

## 📅 Maintenance Schedule

### **Daily**
- Automated health checks (every 5 minutes)
- Daily summary reports (23:55 UTC)
- Automated log commits

### **Weekly**
- Review daily summaries
- Check for performance degradation
- Update dependencies (security patches)

### **Monthly**
- Review uptime statistics
- Archive old logs (optional)
- Update documentation
- Secret rotation review

### **Quarterly**
- Major dependency updates
- Performance optimization
- Security audit
- Documentation review

---

## 🏆 Project Status

**Current Version:** 1.0  
**Status:** ✅ Production Ready  
**Last Major Update:** November 4, 2025

### **Completed:**
- ✅ Full-stack application built
- ✅ CI/CD pipeline configured
- ✅ Health monitoring active
- ✅ Documentation complete
- ✅ Deployment automated

### **In Progress:**
- 🔄 Test coverage expansion
- 🔄 Performance optimization
- 🔄 Feature enhancements

### **Planned:**
- 📋 Real-time collaboration
- 📋 Advanced analytics
- 📋 Mobile application
- 📋 API v2

---

## 📖 Additional Resources

- **Vite Documentation:** https://vitejs.dev
- **React Documentation:** https://react.dev
- **Express Documentation:** https://expressjs.com
- **Drizzle ORM:** https://orm.drizzle.team
- **GitHub Actions:** https://docs.github.com/actions
- **Render Documentation:** https://render.com/docs
- **Resend API:** https://resend.com/docs

---

**Last Updated:** November 4, 2025  
**Maintained By:** DevOps Team  
**Repository:** https://github.com/DemetrisNeophytou/ProductifyAI

