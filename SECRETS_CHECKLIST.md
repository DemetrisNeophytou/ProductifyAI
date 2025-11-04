# 🔐 GitHub Secrets Checklist

**⚠️ REQUIRED - Add these secrets before pushing to GitHub!**

## How to Add Secrets

1. Go to: `https://github.com/<YOUR-USERNAME>/<YOUR-REPO>/settings/secrets/actions`
2. Click "New repository secret"
3. Copy the secret name EXACTLY as shown below
4. Paste your value
5. Click "Add secret"

---

## ✅ Required Secrets (MUST HAVE)

### 1. BACKEND_HEALTH_URL
```
Name: BACKEND_HEALTH_URL
Example Value: https://api.productifyai.com/api/health
Description: Your backend API health check endpoint
```

### 2. FRONTEND_URL
```
Name: FRONTEND_URL
Example Value: https://productifyai.com
Description: Your frontend application URL
```

### 3. ALERT_EMAIL_TO
```
Name: ALERT_EMAIL_TO
Example Value: admin@productifyai.com,ops@productifyai.com
Description: Comma-separated email addresses for alerts
```

### 4. RESEND_API_KEY
```
Name: RESEND_API_KEY
Example Value: re_xxxxxxxxxxxxxxxxxxxxx
Description: Your Resend API key for email alerts
Get it from: https://resend.com/api-keys
```

---

## ⚪ Optional Secrets (Nice to Have)

### 5. SLACK_WEBHOOK_URL (Optional)
```
Name: SLACK_WEBHOOK_URL
Example Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
Description: Slack webhook for alerts (alternative/additional to email)
```

### 6. RENDER_API_KEY (Optional)
```
Name: RENDER_API_KEY
Description: Render API key for auto-restart feature
```

### 7. RENDER_SERVICE_ID (Optional)
```
Name: RENDER_SERVICE_ID
Description: Render service ID for auto-restart feature
```

### 8. ENABLE_AUTO_RESTART (Optional)
```
Name: ENABLE_AUTO_RESTART
Example Value: true
Description: Enable automatic service restart on failure
```

---

## 🧪 Test Your Configuration

After adding secrets, test locally:

```bash
# Set environment variables (use your actual values)
export BACKEND_HEALTH_URL="https://your-api.com/health"
export FRONTEND_URL="https://your-app.com"
export RESEND_API_KEY="your-resend-key"
export ALERT_EMAIL_TO="your-email@example.com"

# Test health check
node scripts/healthcheck.mjs

# Test alert system
node scripts/alert.mjs test "Testing configuration"
```

---

## ✅ Verification Checklist

Before pushing to GitHub, verify:

- [ ] All 4 required secrets added in GitHub
- [ ] Secret names match EXACTLY (case-sensitive)
- [ ] URLs are accessible from public internet
- [ ] Resend API key is valid and active
- [ ] Email addresses are correct
- [ ] Tested locally (optional but recommended)

---

## 🚨 What Happens if Secrets are Missing?

- ❌ Health check workflow will fail
- ❌ Alerts won't be sent
- ❌ Build workflow will succeed (secrets only needed for monitoring)

---

## 📝 Quick Copy-Paste Names

```
BACKEND_HEALTH_URL
FRONTEND_URL
ALERT_EMAIL_TO
RESEND_API_KEY
SLACK_WEBHOOK_URL
RENDER_API_KEY
RENDER_SERVICE_ID
ENABLE_AUTO_RESTART
```

---

**Need Help?**
- Resend Setup: https://resend.com/docs/send-with-nodejs
- GitHub Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Slack Webhooks: https://api.slack.com/messaging/webhooks

