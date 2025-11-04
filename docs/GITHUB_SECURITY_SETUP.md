# GitHub Security Features Setup

**Status:** 🔒 Required Configuration  
**Phase:** 1 - GitHub Security Workflows

---

## 📋 Required GitHub Security Settings

### **1. Enable Secret Scanning**

**Navigate to:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/settings/security_analysis
```

**Steps:**
1. Go to Repository Settings → Security & analysis
2. Enable **"Secret scanning"**
3. Enable **"Push protection"** (prevents accidental secret commits)
4. Click **"Enable"** for both features

**What it does:**
- Automatically scans for exposed secrets (API keys, tokens, passwords)
- Blocks pushes containing secrets
- Alerts you when secrets are detected

---

### **2. Enable Dependabot Security Updates**

**Navigate to:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/settings/security_analysis
```

**Steps:**
1. Enable **"Dependabot alerts"**
2. Enable **"Dependabot security updates"**
3. Review `.github/dependabot.yml` configuration

**What it does:**
- Automatically detects vulnerable dependencies
- Creates PRs to update vulnerable packages
- Weekly schedule for non-security updates

---

### **3. Enable Code Scanning (CodeQL)**

**Navigate to:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/settings/security_analysis
```

**Steps:**
1. Enable **"Code scanning"**
2. Select **"CodeQL analysis"**
3. The workflow is already configured in `.github/workflows/codeql-analysis.yml`

**What it does:**
- Static analysis for security vulnerabilities
- Detects SQL injection, XSS, authentication issues
- Runs on every push and weekly

---

### **4. Configure Branch Protection Rules**

**Navigate to:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/settings/branches
```

**For `main` branch:**
1. Click "Add rule"
2. Branch name pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (at least 1)
   - ✅ Require status checks to pass before merging
     - CodeQL Analysis
     - Gitleaks Secret Scanning
     - Build & Test
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
4. Save changes

**For `replit-agent` branch (if used for development):**
- Same rules as main
- Consider allowing direct commits for development velocity

---

## 🔐 Required GitHub Secrets

Add these secrets in: `Settings → Secrets and variables → Actions → New repository secret`

### **Uptime Monitoring Secrets**

| Secret Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| `HEALTHCHECK_URL` | Backend health endpoint | `https://api.productifyai.com/api/health` | ✅ Yes |
| `FRONTEND_URL` | Frontend application URL | `https://productifyai.com` | ✅ Yes |
| `RESEND_API_KEY` | Resend API key for email alerts | `re_xxxxxxxxxxxxx` | ✅ Yes |
| `ALERT_EMAIL_TO` | Alert recipient emails | `security@productifyai.com` | ✅ Yes |
| `UPTIME_WEBHOOK_URL` | Webhook for custom alerts (Slack, etc.) | `https://hooks.slack.com/...` | ⚪ Optional |

### **Optional Secrets**

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `GITLEAKS_LICENSE` | Gitleaks Pro license (if using) | ⚪ Optional |

---

## 🧪 Testing Security Workflows

### **Test CodeQL Analysis**
```bash
# Trigger manually
gh workflow run codeql-analysis.yml

# Or push to trigger automatically
git push origin auto/security-phase1-workflows
```

### **Test Gitleaks Scanning**
```bash
# Trigger manually
gh workflow run gitleaks.yml

# View results
gh run list --workflow=gitleaks.yml
```

### **Test Uptime Monitoring**
```bash
# Trigger manually
gh workflow run security-uptime.yml

# Check if alert was sent
gh run view --log
```

---

## 📊 Security Dashboard

**View all security findings:**
```
https://github.com/DemetrisNeophytou/ProductifyAI/security
```

**Tabs:**
- **Security Overview** - Summary of all security features
- **Dependabot** - Dependency vulnerabilities and PRs
- **Code scanning** - CodeQL and Gitleaks findings
- **Secret scanning** - Exposed secrets

---

## 🚨 Alert Configuration

### **Email Alerts (Resend)**

Configured in: `.github/workflows/security-uptime.yml`

**Triggers:**
- Backend returns non-200 status
- Frontend returns non-200 status

**Format:**
```
Subject: 🚨 SECURITY ALERT: Service Down - ProductifyAI

Body:
  Backend: HTTP XXX
  Frontend: HTTP XXX
  Timestamp: 2025-11-04T12:00:00Z
  
  Please investigate immediately.
```

### **Webhook Alerts**

JSON payload sent to `UPTIME_WEBHOOK_URL`:
```json
{
  "alert_type": "service_down",
  "timestamp": "2025-11-04T12:00:00Z",
  "backend": {
    "status": "500",
    "url": "https://api.productifyai.com/api/health"
  },
  "frontend": {
    "status": "200",
    "url": "https://productifyai.com"
  },
  "severity": "critical"
}
```

---

## ✅ Verification Checklist

Before enabling in production:

- [ ] Secret scanning enabled
- [ ] Push protection enabled
- [ ] Dependabot alerts enabled
- [ ] CodeQL enabled
- [ ] Branch protection rules configured
- [ ] All required secrets added
- [ ] Email alerts tested
- [ ] Webhook alerts tested (if configured)
- [ ] CodeQL scan completed successfully
- [ ] Gitleaks scan completed successfully
- [ ] Uptime check running every 5 minutes

---

## 📚 Additional Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitHub Code Scanning](https://docs.github.com/en/code-security/code-scanning)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [CodeQL Documentation](https://codeql.github.com/docs/)

---

**Last Updated:** November 4, 2025  
**Phase:** 1 - GitHub Security Workflows  
**Next Phase:** Backend Hardening (Express/Node)

