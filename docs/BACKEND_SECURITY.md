# Backend Security Hardening

**Phase:** 2 - Backend Security (Express/Node)  
**Status:** 🔒 Implementation Complete

---

## 🛡️ Security Features Implemented

### **1. Helmet.js Security Headers**

**File:** `server/middleware/security.ts`

**Headers Configured:**
- **Content-Security-Policy** - Prevents XSS and code injection
- **X-Frame-Options** - Prevents clickjacking (DENY)
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Referrer-Policy** - Controls referrer information
- **HSTS** - Forces HTTPS (1 year, including subdomains)
- **X-XSS-Protection** - Legacy XSS protection for older browsers

**Configuration:**
```typescript
import { securityHeaders } from './middleware/security';
app.use(securityHeaders);
```

---

### **2. Strict CORS with Whitelist**

**Environment Variable:** `CORS_ORIGIN`

**Configuration:**
```bash
CORS_ORIGIN=https://productifyai.com,https://www.productifyai.com
```

**Features:**
- Only allows requests from whitelisted origins
- Supports credentials (cookies, auth headers)
- Logs blocked requests
- Warns if localhost detected in production
- 24-hour preflight cache

**Usage:**
```typescript
import { strictCors } from './middleware/security';
app.use(strictCors());
```

---

### **3. Rate Limiting**

**Global API Rate Limit:**
- **Window:** 15 minutes
- **Max Requests:** 1,000 per IP
- **Applies to:** All `/api` routes
- **Excludes:** Health check endpoints

**Auth Route Rate Limit:**
- **Window:** 15 minutes
- **Max Attempts:** 5 per IP
- **Applies to:** `/api/auth/*` routes
- **Prevents:** Brute-force login attacks

**Existing Specific Limits:**
- AI Chat: 30/minute
- AI Generation: 10/minute
- Community Posts: 5/minute
- Checkout: 3 per 5 minutes

**Usage:**
```typescript
import { globalApiRateLimiter, authRateLimiter } from './middleware/security';
app.use('/api', globalApiRateLimiter);
app.use('/api/auth', authRateLimiter);
```

---

### **4. Input Validation (Zod)**

**File:** `server/middleware/validation.ts`

**Features:**
- Schema-based validation
- Automatic error formatting
- Type-safe validated data
- Sanitizes inputs

**Common Schemas Provided:**
- `registerUserSchema` - User registration
- `loginSchema` - User login
- `createProjectSchema` - Project creation
- `aiGenerationSchema` - AI generation requests
- `fileUploadSchema` - File uploads
- `searchSchema` - Search queries

**Usage Example:**
```typescript
import { validate, createProjectSchema } from './middleware/validation';

router.post('/projects',
  validate(createProjectSchema, 'body'),
  async (req, res) => {
    // req.body is now validated and typed
    const { title, description, type } = req.body;
    // ...
  }
);
```

**Custom Validation:**
```typescript
import { z } from 'zod';
import { validate } from './middleware/validation';

const mySchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive(),
});

router.post('/endpoint', validate(mySchema, 'body'), handler);
```

---

### **5. Enhanced Health Endpoints**

**File:** `server/routes/health-secure.ts`

#### **Endpoints:**

##### **GET /healthz** (Liveness Probe)
- Basic health check
- Returns 200 if server is running
- Used by Kubernetes/Docker to restart unhealthy containers
- Fast response (< 10ms)

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "uptime": 3600,
  "service": "ProductifyAI API",
  "version": "1.0.0"
}
```

##### **GET /readyz** (Readiness Probe)
- Checks if server is ready to handle requests
- Checks database connectivity
- Checks environment configuration
- Monitors memory usage
- Returns 503 if not ready

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "responseTime": 45,
  "checks": {
    "database": {
      "status": "ok",
      "type": "postgresql",
      "responseTime": 23
    },
    "environment": {
      "status": "ok",
      "nodeEnv": "production"
    },
    "memory": {
      "status": "ok",
      "heapUsed": 256,
      "heapTotal": 512
    }
  }
}
```

##### **GET /api/health** (Comprehensive)
- Detailed health information
- All service statuses
- System metrics
- Response times

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": { "status": "connected", "type": "postgresql" },
    "stripe": { "status": "configured" },
    "openai": { "status": "configured" },
    "email": { "status": "configured", "provider": "resend" }
  },
  "system": {
    "memory": {
      "heapUsed": 256,
      "heapTotal": 512,
      "external": 10,
      "rss": 300
    },
    "cpu": {
      "user": 1234567,
      "system": 234567
    },
    "uptime": 3600
  },
  "responseTime": 67
}
```

##### **GET /api/health/ping**
- Minimal ping endpoint
- Fast response check

##### **GET /api/health/version**
- Version and build information

---

### **6. Request Sanitization**

**Features:**
- Removes `<script>` tags
- Strips `javascript:` URIs
- Removes inline event handlers (`onclick=`, etc.)
- Applies to body, query, and params

**Automatic:**
```typescript
import { sanitizeRequest } from './middleware/security';
app.use(sanitizeRequest);
```

---

### **7. Security Logging**

**Features:**
- Logs suspicious patterns:
  - Path traversal attempts (`../`)
  - XSS attempts (`<script`)
  - SQL injection (`UNION SELECT`)
  - File access attempts (`/etc/passwd`)
- Logs IP and User-Agent
- Warns on suspicious activity

**Automatic:**
```typescript
import { securityLogger } from './middleware/security';
app.use(securityLogger);
```

---

## 📦 Integration Guide

### **Step 1: Install Dependencies**

```bash
npm install helmet
```

Or wait for automated install on next `npm install`.

### **Step 2: Update Server File**

**Option A: Use New Secure Server (Recommended)**

Replace `server/index.ts` with `server/index-secure.ts`:

```bash
# Backup original
mv server/index.ts server/index-original.ts

# Use secure version
mv server/index-secure.ts server/index.ts
```

**Option B: Manual Integration**

Add to existing `server/index.ts`:

```typescript
import {
  securityHeaders,
  strictCors,
  globalApiRateLimiter,
  sanitizeRequest,
  securityLogger,
  validateSecurityConfig,
} from "./middleware/security";

// Validate config on startup
validateSecurityConfig();

// Apply middleware (order matters!)
app.use(securityHeaders);
app.use(strictCors());
app.use(express.json({ limit: '10mb' }));
app.use(securityLogger);
app.use(sanitizeRequest);
app.use('/api', globalApiRateLimiter);
```

### **Step 3: Update Environment Variables**

Add to `.env`:

```bash
# CORS Configuration
CORS_ORIGIN=https://productifyai.com,https://www.productifyai.com

# JWT/Session Secrets (minimum 32 characters)
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
SESSION_SECRET=your_session_secret_minimum_32_characters_long
```

### **Step 4: Update Health Endpoints**

Replace `server/routes/health.ts` with `server/routes/health-secure.ts`:

```bash
mv server/routes/health.ts server/routes/health-backup.ts
mv server/routes/health-secure.ts server/routes/health.ts
```

Or manually integrate the new endpoints.

---

## 🧪 Testing

### **Run Tests**

```bash
npm test test/health.test.ts
```

### **Manual Testing**

```bash
# Test liveness
curl http://localhost:5050/healthz

# Test readiness
curl http://localhost:5050/readyz

# Test comprehensive health
curl http://localhost:5050/api/health

# Test ping
curl http://localhost:5050/api/health/ping

# Test version
curl http://localhost:5050/api/health/version

# Test rate limiting (should return 429 after 1000 requests in 15 min)
for i in {1..1001}; do curl http://localhost:5050/api/health; done

# Test CORS (should be blocked if origin not whitelisted)
curl -H "Origin: https://evil.com" http://localhost:5050/api/health
```

---

## 🚨 Security Checklist

Before deploying to production:

- [ ] `CORS_ORIGIN` set to production domains (no localhost)
- [ ] `JWT_SECRET` is at least 32 characters
- [ ] `SESSION_SECRET` is at least 32 characters
- [ ] Helmet.js enabled
- [ ] Rate limiting configured
- [ ] All `/api` routes protected
- [ ] Health checks working
- [ ] Tests passing
- [ ] No secrets in code
- [ ] HTTPS enforced (via HSTS header)

---

## 📊 Monitoring

### **Health Check Endpoints for Monitoring Tools**

- **Uptime Robot:** Use `/healthz`
- **Kubernetes Liveness:** Use `/healthz`
- **Kubernetes Readiness:** Use `/readyz`
- **Detailed Monitoring:** Use `/api/health`
- **Quick Ping:** Use `/api/health/ping`

### **Rate Limit Headers**

All rate-limited responses include:

```
RateLimit-Limit: 1000
RateLimit-Remaining: 999
RateLimit-Reset: 1699012345
```

### **Security Headers Response**

Check security headers with:

```bash
curl -I http://localhost:5050/

# Should include:
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-XSS-Protection: 1; mode=block
```

---

## 🔒 Production Deployment

### **Render Configuration**

Add environment variables in Render dashboard:

```
CORS_ORIGIN=https://productifyai.com,https://www.productifyai.com
JWT_SECRET=<generate 32+ character secret>
SESSION_SECRET=<generate 32+ character secret>
NODE_ENV=production
```

### **Vercel Configuration**

Add in Vercel dashboard or `vercel.json`:

```json
{
  "env": {
    "CORS_ORIGIN": "https://productifyai.com",
    "JWT_SECRET": "@jwt-secret",
    "SESSION_SECRET": "@session-secret",
    "NODE_ENV": "production"
  }
}
```

---

## 📚 Additional Resources

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#rate-limiting)
- [Zod Documentation](https://zod.dev/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** November 4, 2025  
**Phase:** 2 - Backend Security Hardening  
**Next Phase:** Supabase Security (RLS)

