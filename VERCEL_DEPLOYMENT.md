# Deploying Productify AI on Vercel

This guide walks you through deploying the Productify AI Vite + Express application to Vercel.

## Architecture

The application is deployed as:
- **Frontend (SPA)**: Static files served from Vercel CDN (`dist/public/`)
- **Backend (API)**: Express app running as Vercel serverless function (`api/index.ts`)

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Code must be in a GitHub repo
3. **Environment Variables**: Gather all required API keys (see `VERCEL_ENV_VARS.md`)

## Deployment Steps

### 1. Build Locally (Optional but Recommended)

Test the build before deploying:

```bash
npm install
npm run build
```

Verify output:
- `dist/public/index.html` exists (frontend)
- `dist/index.js` exists (backend bundle)

### 2. Push to GitHub

Ensure all changes are committed:

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 3. Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `DemetrisNeophytou/ProductifyAI`
3. Configure project:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave blank (uses `vercel.json` config)
   - **Install Command**: `npm install`

### 4. Add Environment Variables

In Vercel project settings (Settings → Environment Variables), add:

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `SESSION_SECRET` - Session encryption key
- `ISSUER_URL` - Replit Auth issuer URL
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `PEXELS_API_KEY` - Pexels API key
- `PIXABAY_API_KEY` - Pixabay API key

**Optional Variables:**
- `GOOGLE_FONTS_API_KEY` - Google Fonts API key (optional)

See `VERCEL_ENV_VARS.md` for detailed descriptions.

### 5. Deploy

Click **Deploy** and Vercel will:
1. Install dependencies
2. Build the frontend (`vite build`)
3. Bundle the backend (`esbuild`)
4. Deploy static assets to CDN
5. Deploy API as serverless function

### 6. Verify Deployment

After deployment:

1. **Test API**: Check health endpoint
   ```bash
   curl https://your-app.vercel.app/api/auth/user
   ```

2. **Test SPA**: Visit root URL
   ```
   https://your-app.vercel.app
   ```

3. **Test Client Routing**: Navigate to `/dashboard` directly
   - Should load the SPA (not 404)

4. **Test Key Features**:
   - User authentication
   - Project creation
   - AI features
   - Image uploads
   - Export functionality

## Configuration Files

### `vercel.json`
Routes configuration:
- `/api/*` → Serverless function
- All other routes → SPA (index.html)

### `api/index.ts`
Serverless wrapper that initializes and exports the Express app.

### `server/app.ts`
Core Express application (exported for both Replit and Vercel).

### `server/index.ts`
Replit development entry point (calls `app.listen()`).

## Troubleshooting

### Build Fails

**PostCSS Warning**: This is just a warning, not an error. Build will succeed.

**Missing Dependencies**: Run `npm install` before building.

**Environment Variables in Build**: Ensure no required env vars are accessed at build time.

### Deployment Fails

**API Routes 404**: Check `vercel.json` routes configuration.

**Static Assets 404**: Verify `dist/public/` contains built files.

**500 Errors**: Check Vercel function logs for runtime errors.

### Runtime Issues

**Database Connection**: Ensure `DATABASE_URL` is set correctly.

**API Errors**: Check Vercel function logs (Deployments → Functions).

**CORS Issues**: Express should include proper CORS headers for frontend.

## Local Development vs Vercel

| Feature | Replit/Local | Vercel |
|---------|--------------|--------|
| Entry Point | `server/index.ts` | `api/index.ts` |
| Server Listen | ✅ Yes | ❌ No (serverless) |
| Static Files | Vite dev server | CDN |
| Environment | Development | Production |
| Port | 5000 | Managed by Vercel |

## Continuous Deployment

Once configured, Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On pull requests

## Custom Domain

To add a custom domain:
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

## API Examples

### Health Check
```bash
curl https://your-app.vercel.app/api/auth/user
```

### Expected Response
Production deployment should respond with either:
- Authenticated user data
- 401 Unauthorized (if not logged in)

Not a 404 or 500 error.

## Support

For issues specific to:
- **Vercel**: Check [Vercel Docs](https://vercel.com/docs)
- **Build Errors**: Review build logs in Vercel dashboard
- **Runtime Errors**: Check function logs in Vercel dashboard
