# Environment Variables for Vercel Deployment

Configure these environment variables in your Vercel project settings (Settings → Environment Variables).

## Required Variables

### Database
- **`DATABASE_URL`** (Required)
  - PostgreSQL connection string
  - Example: `postgresql://user:pass@host:5432/dbname`
  - Needed at: Runtime

### Authentication & Security
- **`SESSION_SECRET`** (Required)
  - Secret key for session encryption
  - Example: Generate with `openssl rand -base64 32`
  - Needed at: Runtime

- **`JWT_SECRET`** (Required)
  - Secret key for JWT token signing
  - Example: Generate with `openssl rand -base64 32`
  - Needed at: Runtime

- **`ISSUER_URL`** (Required)
  - Replit Auth issuer URL
  - Example: `https://replit.com/oidc`
  - Needed at: Runtime

- **`REPLIT_DOMAINS`** (Required)
  - Comma-separated list of allowed domains
  - Example: `your-app.vercel.app,localhost:5173`
  - Needed at: Runtime

- **`REPL_ID`** (Required)
  - Your Replit OAuth client ID
  - Get from: Replit Auth configuration
  - Needed at: Runtime

- **`GOOGLE_CLIENT_ID`** (Optional)
  - Google OAuth client ID
  - Get from: Google Cloud Console
  - Needed at: Runtime
  - For Google Sign-In feature

- **`GOOGLE_CLIENT_SECRET`** (Optional)
  - Google OAuth client secret
  - Get from: Google Cloud Console
  - Needed at: Runtime
  - For Google Sign-In feature

### AI Services
- **`OPENAI_API_KEY`** (Required)
  - OpenAI API key for GPT-5 and DALL-E
  - Example: `sk-...`
  - Needed at: Runtime

### Payment Processing
- **`STRIPE_SECRET_KEY`** (Required)
  - Stripe secret API key
  - Example: `sk_live_...` or `sk_test_...`
  - Needed at: Runtime

- **`STRIPE_WEBHOOK_SECRET`** (Required)
  - Stripe webhook signing secret
  - Example: `whsec_...`
  - Needed at: Runtime

- **`STRIPE_PRICE_ID_PLUS`** (Required)
  - Stripe price ID for Plus plan
  - Example: `price_...`
  - Get from: Stripe Dashboard → Products
  - Needed at: Runtime

- **`STRIPE_PRICE_ID_PRO`** (Required)
  - Stripe price ID for Pro plan
  - Example: `price_...`
  - Get from: Stripe Dashboard → Products
  - Needed at: Runtime

### Media Services
- **`PEXELS_API_KEY`** (Required)
  - Pexels API key for stock photos
  - Example: Get from https://www.pexels.com/api/
  - Needed at: Runtime

- **`PIXABAY_API_KEY`** (Required)
  - Pixabay API key for stock photos
  - Example: Get from https://pixabay.com/api/docs/
  - Needed at: Runtime

## Frontend Variables (Vercel Only)

- **`VITE_API_URL`** (Required for frontend build)
  - Backend API URL
  - Example: `https://your-backend.onrender.com`
  - Needed at: Build time & Runtime
  - Points to your Render backend

- **`VITE_STRIPE_PUBLIC_KEY`** (Required)
  - Stripe publishable key for frontend checkout
  - Example: `pk_live_...` or `pk_test_...`
  - Needed at: Build time & Runtime
  - Used in: Pricing page checkout

- **`VITE_SUPABASE_URL`** (Optional)
  - Supabase project URL
  - Example: `https://xxxxx.supabase.co`
  - Needed at: Build time & Runtime
  - Only if using Supabase client-side features

- **`VITE_SUPABASE_ANON_KEY`** (Optional)
  - Supabase anonymous key
  - Get from: Supabase Dashboard → Settings → API
  - Needed at: Build time & Runtime
  - Only if using Supabase client-side features

## Optional Variables

- **`GOOGLE_FONTS_API_KEY`** (Optional)
  - Google Fonts API key
  - Falls back to curated font list if not provided
  - Example: Get from Google Cloud Console
  - Needed at: Runtime

- **`OPENAI_MODEL`** (Optional)
  - Override default OpenAI model
  - Default: `gpt-5`
  - Example: `gpt-5`
  - Needed at: Runtime

## Vercel-Managed Variables (Auto-set)

These are automatically set by Vercel - **DO NOT** configure manually:
- `PORT` - Automatically set by Vercel
- `NODE_ENV` - Set to `production` in production, `preview` in preview deployments
- `VERCEL` - Set to `1` when running on Vercel

## Setting Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each variable with:
   - **Key**: Variable name (e.g., `OPENAI_API_KEY`)
   - **Value**: The actual value
   - **Environment**: Select Production, Preview, and/or Development
4. Save and redeploy

## Security Notes

- Never commit API keys or secrets to Git
- Use different keys for production vs. preview environments
- Rotate keys regularly
- Use Stripe test keys for preview deployments
