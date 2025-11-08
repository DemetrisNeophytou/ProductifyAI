# Render Deployment Configuration

## Service Settings

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Name** | productifyai-api |
| **Region** | Oregon (US West) |
| **Branch** | main |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/healthz` |

## Build Process

The build command installs all dependencies (including devDependencies for build tools) and runs the build script which:

1. **Frontend**: Vite builds the client to `dist/` (produces `dist/index.html` + assets)
2. **Backend**: esbuild bundles `server/server.ts` to `dist/server.js`

## Start Process

The start command runs `node dist/server.js` which:
- Listens on `process.env.PORT` (provided by Render, typically 10000)
- Serves static files from `dist/` (frontend)
- Handles API routes on `/api/*` and `/products/*`

## Required Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Node Environment
NODE_ENV=production
PORT=10000

# Database (Supabase)
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Authentication
JWT_SECRET=<generate-32-char-random-string>
SESSION_SECRET=<generate-32-char-random-string>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# CORS & Frontend
CORS_ORIGIN=http://localhost:5173,https://productifyai.vercel.app
FRONTEND_URL=https://productifyai.vercel.app

# AI Services
OPENAI_API_KEY=<your-openai-api-key>
```

## Health Check Endpoints

### `/healthz` (Liveness Probe)
```bash
curl https://productifyai-api.onrender.com/healthz
```
Returns: `{"status":"ok"}`

### `/api/health` (Detailed Status)
```bash
curl https://productifyai-api.onrender.com/api/health
```
Returns: JSON with all service statuses (database, Stripe, Supabase, OpenAI, email)

## Verification

After deployment, verify:

1. **Build succeeded**: Check Render logs for "Build succeeded"
2. **Server started**: Logs show "Server running on port 10000"
3. **Health checks passing**: Both endpoints return 200 OK
4. **CORS working**: Frontend can reach API

## Troubleshooting

### Build Fails
- Check Render logs for specific error
- Verify all dependencies in `package.json`
- Ensure Node 22 is set

### Server Won't Start
- Check `dist/server.js` was created during build
- Verify all required environment variables are set
- Check logs for missing dependencies

### Health Check Fails
- Verify `/healthz` endpoint returns within 30 seconds
- Check server is listening on correct PORT
- Review server logs for errors

