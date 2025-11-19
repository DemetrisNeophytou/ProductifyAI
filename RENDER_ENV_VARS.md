# Environment Variables for Render Deployment (Backend)

Configure these environment variables in your Render Web Service settings.

## Required Variables

### Core Application
- **`NODE_ENV`**
  - Value: `production`
  - Enables production mode and strict validation

- **`PORT`**
  - Value: `5050` (or leave blank for Render's auto-assigned port)
  - Server port (Render auto-assigns if not set)

### Database
- **`DATABASE_URL`** (Required)
  - PostgreSQL connection string
  - Example: `postgresql://user:pass@host:5432/dbname`
  - Get from: Your PostgreSQL provider (Supabase, Render, etc.)
  - **Important**: Must use `?sslmode=require` for production databases

### Authentication & Security
- **`SESSION_SECRET`** (Required)
  - Secret key for session encryption
  - Minimum 32 characters
  - Generate with: `openssl rand -base64 32`

- **`JWT_SECRET`** (Required)
  - Secret key for JWT token signing
  - Minimum 32 characters
  - Generate with: `openssl rand -base64 32`

- **`ISSUER_URL`** (Required)
  - Replit Auth issuer URL
  - Value: `https://replit.com/oidc`

- **`REPLIT_DOMAINS`** (Required)
  - Comma-separated list of allowed domains
  - Example: `your-frontend.vercel.app,localhost:5173`
  - Include your production Vercel domain

- **`REPL_ID`** (Required)
  - Your Replit OAuth client ID
  - Get from: Replit Auth configuration

### Google OAuth (Optional)
- **`GOOGLE_CLIENT_ID`** (Optional)
  - Google OAuth client ID
  - Get from: Google Cloud Console
  - For Google Sign-In feature

- **`GOOGLE_CLIENT_SECRET`** (Optional)
  - Google OAuth client secret
  - Get from: Google Cloud Console
  - For Google Sign-In feature

### AI Services
- **`OPENAI_API_KEY`** (Required)
  - OpenAI API key for GPT and DALL-E
  - Example: `sk-proj-...`
  - Get from: OpenAI Platform

- **`OPENAI_MODEL`** (Optional)
  - Override default OpenAI model
  - Default: `gpt-4o`
  - Example: `gpt-4o`, `gpt-4o-mini`

### Payment Processing
- **`STRIPE_SECRET_KEY`** (Required)
  - Stripe secret API key
  - Example: `sk_live_...` or `sk_test_...`
  - Get from: Stripe Dashboard

- **`STRIPE_WEBHOOK_SECRET`** (Required)
  - Stripe webhook signing secret
  - Example: `whsec_...`
  - Get from: Stripe Dashboard → Webhooks
  - **Important**: Create webhook endpoint at `https://your-backend.onrender.com/api/stripe/webhook`

- **`STRIPE_PRICE_ID_PLUS`** (Required)
  - Stripe price ID for Plus plan (€24/month)
  - Example: `price_...`
  - Get from: Stripe Dashboard → Products

- **`STRIPE_PRICE_ID_PRO`** (Required)
  - Stripe price ID for Pro plan (€49/month)
  - Example: `price_...`
  - Get from: Stripe Dashboard → Products

- **`STRIPE_CREDITS_100_PRICE_ID`** (Optional)
  - Stripe price ID for 100 credits package
  - Example: `price_...`

- **`STRIPE_CREDITS_500_PRICE_ID`** (Optional)
  - Stripe price ID for 500 credits package
  - Example: `price_...`

- **`STRIPE_CREDITS_1000_PRICE_ID`** (Optional)
  - Stripe price ID for 1000 credits package
  - Example: `price_...`

- **`MOCK_STRIPE`** (Optional)
  - Force mock Stripe mode (for testing)
  - Value: `true` or `false`
  - Default: `false`

### Media Services
- **`PEXELS_API_KEY`** (Required)
  - Pexels API key for stock photos
  - Get from: https://www.pexels.com/api/
  - Free tier available

- **`PIXABAY_API_KEY`** (Optional)
  - Pixabay API key for stock photos
  - Get from: https://pixabay.com/api/docs/
  - Fallback for Pexels

- **`GOOGLE_FONTS_API_KEY`** (Optional)
  - Google Fonts API key
  - Get from: Google Cloud Console
  - Has fallback to curated font list

### Email Service (Optional)
- **`RESEND_API_KEY`** (Optional)
  - Resend API key for transactional emails
  - Get from: https://resend.com
  - Falls back to console logging if not set

- **`EMAIL_FROM`** (Optional)
  - Email sender address
  - Example: `ProductifyAI <noreply@yourdomain.com>`
  - Default: `ProductifyAI <noreply@productifyai.com>`

### CORS Configuration
- **`CORS_ORIGIN`** (Required)
  - Comma-separated list of allowed frontend origins
  - Example: `https://your-app.vercel.app,http://localhost:5173`
  - **Important**: Include your production Vercel URL

### Supabase (Optional - if using)
- **`SUPABASE_URL`** (Optional)
  - Supabase project URL
  - Example: `https://xxxxx.supabase.co`
  - Only if using Supabase-specific features

- **`SUPABASE_SERVICE_ROLE_KEY`** (Optional)
  - Supabase service role key (full admin access)
  - Get from: Supabase Dashboard → Settings → API
  - **Warning**: Keep this secret, never expose to frontend

## Setting Variables in Render

1. Go to your Render Dashboard
2. Select your Web Service
3. Navigate to **Environment** tab
4. Add each variable:
   - Click **Add Environment Variable**
   - Enter **Key** and **Value**
   - Click **Save**
5. Render will automatically redeploy after saving

## Environment Variable Groups

For easier management, consider creating Environment Groups in Render:

1. **Core**: NODE_ENV, PORT, DATABASE_URL
2. **Auth**: All session, JWT, and OAuth keys
3. **Payments**: All Stripe-related keys
4. **Media**: Pexels, Pixabay, Google Fonts
5. **Email**: Resend configuration

## Security Best Practices

- ✅ Use different secrets for production vs. staging
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use Stripe test keys for staging environments
- ✅ Never commit secrets to Git
- ✅ Use Render's secret management (values are encrypted)
- ✅ Enable 2FA on all third-party service accounts
- ✅ Set minimum 32-character length for JWT_SECRET and SESSION_SECRET

## Validation

The backend will validate critical environment variables on startup:

```
✅ Production environment validation passed
```

If validation fails, check Render logs for missing variables.

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` includes `?sslmode=require`
- Check if database allows connections from Render IPs
- Verify database credentials

### CORS Errors
- Add your Vercel domain to `CORS_ORIGIN`
- Include both production and preview URLs if needed

### Stripe Webhook Failures
- Create webhook endpoint in Stripe Dashboard
- URL: `https://your-backend.onrender.com/api/stripe/webhook`
- Events to subscribe: `customer.subscription.*`, `checkout.session.completed`, `invoice.*`
- Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Authentication Issues
- Verify `REPLIT_DOMAINS` includes your frontend domain
- Check `ISSUER_URL` is exactly `https://replit.com/oidc`
- Ensure `REPL_ID` matches your Replit OAuth app

## Links

- [Render Environment Variables Docs](https://render.com/docs/environment-variables)
- [Render Secret Management](https://render.com/docs/environment-variables#secret-files)

