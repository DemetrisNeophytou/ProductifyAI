# 🛡️ Security Policy & Incident Response Runbooks

## Overview

This document provides security policies, incident response procedures, and detailed runbooks for handling security events in ProductifyAI.

---

## 🚨 Reporting Security Vulnerabilities

### How to Report

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead, please report security vulnerabilities to:
- **Email:** security@productifyai.com
- **Subject:** [SECURITY] Brief description

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

### Response Timeline

- **Initial Response:** Within 24 hours
- **Status Update:** Within 48 hours
- **Fix Timeline:** Based on severity (see below)

### Severity Levels

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **Critical** | Immediate threat to user data or system availability | 24 hours |
| **High** | Significant security risk | 7 days |
| **Medium** | Moderate security issue | 30 days |
| **Low** | Minor security concern | 90 days |

---

## 🔐 Security Incidents & Runbooks

### Incident 1: Leaked Secrets / API Keys

**Detection:**
- Gitleaks workflow alert
- Secret scanning alert from GitHub
- Manual discovery

**Immediate Actions:**

1. **Rotate the compromised secret immediately:**
   ```bash
   # For Supabase
   # Go to: https://app.supabase.com/project/_/settings/api
   # Generate new service role key
   
   # For OpenAI
   # Go to: https://platform.openai.com/api-keys
   # Revoke old key, generate new key
   
   # For Stripe
   # Go to: https://dashboard.stripe.com/apikeys
   # Roll keys (both secret and webhook secret)
   ```

2. **Update secrets in all environments:**
   ```bash
   # GitHub Secrets
   # Go to: https://github.com/DemetrisNeophytou/ProductifyAI/settings/secrets/actions
   
   # Render Environment Variables
   # Dashboard → Service → Environment → Edit
   
   # Vercel Environment Variables
   # Project Settings → Environment Variables
   ```

3. **Update local .env files:**
   ```bash
   # Update .env with new secrets
   nano .env
   
   # Restart services
   npm run dev
   ```

4. **Verify services are working:**
   ```bash
   # Test backend
   curl http://localhost:5050/healthz
   
   # Test auth
   curl http://localhost:5050/api/auth/session
   ```

5. **Review git history for exposure:**
   ```bash
   # Check if secret was committed
   git log -p -S "your_old_secret_here"
   
   # If found, consider squashing/rewriting history
   # (only if not pushed to public repo)
   ```

6. **Post-Incident Actions:**
   - [ ] Review all recent commits for other secrets
   - [ ] Enable GitHub secret scanning (if not already)
   - [ ] Enable GitHub push protection
   - [ ] Update team on new secrets
   - [ ] Document incident in security log

**Prevention:**
- Use `.env` files (never commit them)
- Use GitHub Secrets for CI/CD
- Run Gitleaks locally before commits: `gitleaks detect`
- Enable pre-commit hooks

---

### Incident 2: Failed Uptime Check / Service Downtime

**Detection:**
- GitHub Actions uptime workflow failure
- Manual report
- Monitoring alerts

**Immediate Actions:**

1. **Check service status:**
   ```bash
   # Backend health
   curl https://api.productifyai.com/healthz
   curl https://api.productifyai.com/readyz
   
   # Frontend
   curl https://productifyai.com
   ```

2. **Check service logs:**
   ```bash
   # Render
   # Dashboard → Service → Logs tab
   
   # Or via CLI
   render logs -s srv-your-service-id -t -f
   ```

3. **Check database connectivity:**
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # Check connections
   SELECT count(*) FROM pg_stat_activity;
   ```

4. **Common Fixes:**

   **If backend is down:**
   ```bash
   # Restart service (Render)
   curl -X POST \
     -H "Authorization: Bearer $RENDER_API_KEY" \
     "https://api.render.com/v1/services/srv-your-service-id/restarts"
   
   # Or via dashboard: Service → Manual Deploy → Clear build cache & deploy
   ```

   **If database connection pool exhausted:**
   ```sql
   -- Kill long-running queries
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';
   ```

   **If out of memory:**
   - Scale up service tier in Render
   - Or optimize memory usage in code

5. **Post-Incident Actions:**
   - [ ] Identify root cause
   - [ ] Document in incident log
   - [ ] Create GitHub issue if code fix needed
   - [ ] Update runbook with new learnings
   - [ ] Review and improve monitoring

**Prevention:**
- Set up proper health checks
- Configure auto-restart on Render
- Use database connection pooling
- Monitor memory/CPU usage
- Set up alerts before limits reached

---

### Incident 3: Brute-Force Login Attempts

**Detection:**
- `auth_events` table showing ≥5 failed attempts
- Account auto-lock trigger
- Sentry alert

**Immediate Actions:**

1. **Check failed login stats:**
   ```sql
   -- Recent failed attempts
   SELECT * FROM get_failed_login_stats('1 hour');
   
   -- Specific user
   SELECT * FROM detect_brute_force('user@example.com', 'email');
   ```

2. **Review suspicious activity:**
   ```sql
   -- Failed logins by IP
   SELECT ip_address, COUNT(*) as attempts
   FROM auth_events
   WHERE event_type = 'login_failed'
     AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY ip_address
   HAVING COUNT(*) >= 5
   ORDER BY attempts DESC;
   ```

3. **Block malicious IP addresses:**
   ```bash
   # If using Cloudflare
   # Dashboard → Security → WAF → IP Access Rules → Block
   
   # Or add to firewall rules
   # Render: Dashboard → Service → Settings → IP Allowlist
   ```

4. **Unlock legitimate user accounts:**
   ```sql
   -- Unlock user account
   UPDATE users
   SET subscription_status = 'active'
   WHERE email = 'legitimate@user.com';
   
   -- Log unlock event
   SELECT log_auth_event(
     (SELECT id FROM users WHERE email = 'legitimate@user.com'),
     'account_unlocked',
     NULL,
     NULL,
     '{"reason": "admin_unlock", "by": "security_team"}'::jsonb
   );
   ```

5. **Notify affected users:**
   ```typescript
   // Send email notification
   await resend.emails.send({
     from: 'security@productifyai.com',
     to: 'user@example.com',
     subject: 'Security Alert: Suspicious Login Attempts',
     html: `
       <h1>Security Alert</h1>
       <p>We detected multiple failed login attempts on your account.</p>
       <p>If this was you, please reset your password. If not, your account has been secured.</p>
     `
   });
   ```

6. **Post-Incident Actions:**
   - [ ] Analyze attack patterns
   - [ ] Adjust rate limiting thresholds if needed
   - [ ] Consider implementing CAPTCHA
   - [ ] Document IPs in threat intelligence
   - [ ] Review auth logs for compromised accounts

**Prevention:**
- Rate limiting (5 attempts/minute)
- Account auto-lock (10 attempts/minute)
- IP-based rate limiting
- CAPTCHA after 3 failed attempts
- 2FA for sensitive accounts
- Monitor `auth_events` table regularly

---

### Incident 4: Dependency Vulnerability Alert

**Detection:**
- Dependabot security alert
- `npm audit` findings
- GitHub Security Advisory

**Immediate Actions:**

1. **Review the vulnerability:**
   ```bash
   # Check npm audit
   npm audit
   
   # Check specific package
   npm audit --package=package-name
   ```

2. **Assess severity and impact:**
   - **Critical/High:** Update immediately
   - **Medium:** Update within 7 days
   - **Low:** Update in next sprint

3. **Update the dependency:**
   ```bash
   # Update specific package
   npm update package-name
   
   # Or update to specific version
   npm install package-name@^version
   
   # Update all dependencies
   npm update
   ```

4. **Test thoroughly:**
   ```bash
   # Run tests
   npm test
   
   # Run linting
   npm run lint
   
   # Test locally
   npm run dev
   ```

5. **Deploy fix:**
   ```bash
   # Commit changes
   git add package.json package-lock.json
   git commit -m "security: update package-name to fix CVE-XXXX-XXXXX"
   git push
   
   # Deploy to production
   # (CI/CD should handle this automatically)
   ```

6. **Verify fix:**
   ```bash
   # Re-run audit
   npm audit
   
   # Should show 0 vulnerabilities (for that package)
   ```

7. **Post-Incident Actions:**
   - [ ] Review other dependencies
   - [ ] Enable Dependabot auto-updates
   - [ ] Update dependency management policy
   - [ ] Document in security changelog

**Prevention:**
- Enable Dependabot
- Run `npm audit` in CI/CD
- Regular dependency updates (weekly)
- Lock file integrity checks
- Use `npm ci` in production

---

### Incident 5: SQL Injection Attempt

**Detection:**
- Security logging detects SQL patterns
- WAF alert
- Abnormal database queries

**Immediate Actions:**

1. **Check security logs:**
   ```bash
   # Check Sentry for security events
   # Or check application logs
   grep -i "sql injection" logs/*.log
   ```

2. **Identify affected endpoint:**
   ```sql
   -- Check recent queries
   SELECT query, state, query_start
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY query_start DESC;
   ```

3. **Block attacker IP:**
   ```bash
   # Add to firewall rules (see Incident 3)
   ```

4. **Review code for vulnerability:**
   ```typescript
   // BAD - Vulnerable to SQL injection
   db.query(`SELECT * FROM users WHERE email = '${email}'`);
   
   // GOOD - Use parameterized queries
   db.query('SELECT * FROM users WHERE email = $1', [email]);
   
   // BETTER - Use ORM (Drizzle)
   db.select().from(users).where(eq(users.email, email));
   ```

5. **Fix the vulnerability:**
   ```bash
   # Update code to use parameterized queries
   # Commit and deploy fix
   git add .
   git commit -m "security: fix SQL injection in auth endpoint"
   git push
   ```

6. **Post-Incident Actions:**
   - [ ] Audit all database queries for injection risks
   - [ ] Enable query logging
   - [ ] Add input validation
   - [ ] Conduct security code review
   - [ ] Add automated security tests

**Prevention:**
- Always use parameterized queries
- Use ORMs (Drizzle, Prisma)
- Input validation (Zod)
- Request sanitization
- WAF rules for SQL patterns
- Regular security audits

---

### Incident 6: DDoS Attack

**Detection:**
- Sudden spike in traffic
- Rate limit alerts
- Service degradation

**Immediate Actions:**

1. **Enable DDoS protection:**
   ```bash
   # Cloudflare: Enable "Under Attack Mode"
   # Dashboard → Security → Settings → Security Level → Under Attack
   ```

2. **Check traffic patterns:**
   ```bash
   # Check access logs
   tail -f /var/log/nginx/access.log | grep -v "200"
   
   # Or in Render dashboard → Logs
   ```

3. **Identify attack vectors:**
   ```sql
   -- Most frequent IPs
   SELECT ip_address, COUNT(*) as requests
   FROM metrics_events
   WHERE created_at > NOW() - INTERVAL '5 minutes'
   GROUP BY ip_address
   ORDER BY requests DESC
   LIMIT 20;
   ```

4. **Block attacking IPs:**
   ```bash
   # Block IPs in Cloudflare
   # Or add to rate limiting rules
   ```

5. **Scale infrastructure:**
   ```bash
   # Render: Upgrade service tier temporarily
   # Dashboard → Service → Settings → Instance Type
   ```

6. **Post-Incident Actions:**
   - [ ] Analyze attack patterns
   - [ ] Improve rate limiting
   - [ ] Enable CDN caching
   - [ ] Configure auto-scaling
   - [ ] Document attacker IPs

**Prevention:**
- Rate limiting (implemented)
- CDN/WAF (Cloudflare)
- Auto-scaling
- Connection limits
- Bot detection

---

## 📊 Security Monitoring Dashboard

### Daily Checks

```bash
# Run daily security checks
./scripts/security-check.sh
```

**Check List:**
- [ ] Review auth_events for suspicious activity
- [ ] Check failed login stats
- [ ] Review Sentry errors
- [ ] Check GitHub security alerts
- [ ] Verify all services are healthy
- [ ] Review recent deployments

### Weekly Review

- [ ] Run full security audit
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Check Stripe disputes/chargebacks
- [ ] Review user reports
- [ ] Update security documentation

### Monthly Tasks

- [ ] Rotate database credentials
- [ ] Review and update IAM policies
- [ ] Security training for team
- [ ] Penetration testing
- [ ] Backup verification
- [ ] Disaster recovery drill

---

## 🔧 Security Tools

### Local Development

```bash
# Run Gitleaks
gitleaks detect --source . --verbose

# Run npm audit
npm audit --audit-level=moderate

# Run security linter
npm run lint:security

# Check for outdated packages
npm outdated
```

### CI/CD

- **CodeQL:** Static analysis for code vulnerabilities
- **Dependabot:** Automated dependency updates
- **Gitleaks:** Secret scanning
- **Uptime Monitoring:** Health check every 5 minutes

### Production Monitoring

- **Sentry:** Error tracking and performance monitoring
- **Render Logs:** Application logs
- **Supabase Logs:** Database query logs
- **Cloudflare Analytics:** Traffic and threat analytics

---

## 📞 Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Security Lead | security@productifyai.com | 24/7 |
| DevOps | ops@productifyai.com | 24/7 |
| Database Admin | dba@productifyai.com | 24/7 |
| Support | support@productifyai.com | 9am-5pm EST |

---

## 📝 Incident Log Template

```markdown
## Incident: [Brief Description]

**Date:** YYYY-MM-DD HH:MM UTC
**Severity:** Critical/High/Medium/Low
**Status:** Investigating/Mitigating/Resolved

### Timeline

- **HH:MM** - Incident detected
- **HH:MM** - Team notified
- **HH:MM** - Mitigation started
- **HH:MM** - Incident resolved

### Impact

- Affected users: X
- Downtime: X minutes
- Data exposure: Yes/No

### Root Cause

[Detailed explanation]

### Resolution

[Steps taken to resolve]

### Prevention

- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3

### Lessons Learned

[Key takeaways]
```

---

## ✅ Security Checklist

### Before Deployment

- [ ] All secrets in environment variables
- [ ] No hardcoded credentials
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection protections
- [ ] XSS protections
- [ ] CSRF protections
- [ ] Authentication working
- [ ] Authorization rules tested
- [ ] RLS policies enabled
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Alerts set up

### After Deployment

- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Alerts working
- [ ] Logs being collected
- [ ] Error tracking working
- [ ] Performance acceptable
- [ ] Security scans clean
- [ ] Team notified
- [ ] Documentation updated

---

**Last Updated:** 2025-11-04  
**Version:** 1.0.0  
**Maintained By:** Security Engineer AI <security@productifyai.com>

