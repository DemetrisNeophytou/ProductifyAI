# Supabase Environment Setup

## ⚠️ Action Required

Your `.env` file currently has placeholder values. You need to update it with your real Supabase credentials.

## 📋 Quick Setup

### Option 1: Run the Update Script (Recommended)

```powershell
.\update-supabase-env.ps1
```

This will prompt you for your keys and automatically update `.env`.

### Option 2: Manual Update

Edit `.env` and replace these lines:

```bash
# Change these lines:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# To:
VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
VITE_SUPABASE_ANON_KEY=<paste your anon key here>

# Also update:
SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste your service role key here>

# And:
DATABASE_URL=postgresql://postgres:Dn17107...@db.dfqssnvqsxjjtyhylzen.supabase.co:5432/postgres
```

## 🔑 Where to Get Your Keys

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/dfqssnvqsxjjtyhylzen/settings/api

2. **Copy these values:**
   - **anon public** → `VITE_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

3. **Your database password** (from when you created the project):
   - Starts with `Dn17107...`
   - Use it in the `DATABASE_URL`

## ✅ Verification

After updating `.env`, verify with:

```powershell
# Check the values (passwords will be hidden)
Get-Content .env | Select-String "VITE_SUPABASE|DATABASE_URL"

# Should show:
# VITE_SUPABASE_URL=https://dfqssnvqsxjjtyhylzen.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# DATABASE_URL=postgresql://postgres:Dn17107...@db.dfqssnvqsxjjtyhylzen...
```

## 🚀 Next Steps

```bash
# Restart the server
npm run dev:force

# Test authentication
# Open: http://localhost:5173/login
# Try: Email magic link or Google OAuth
```

## 🔍 Troubleshooting

If auth still doesn't work:
- Make sure you copied the FULL keys (they're very long)
- Check for extra spaces or line breaks
- Restart the dev server after changing .env
- Clear browser cache and localStorage

