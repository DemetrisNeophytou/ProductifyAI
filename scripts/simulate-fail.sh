#!/bin/bash

###############################################################################
# Simulate Failed Health Check for Testing
###############################################################################
#
# Purpose:
# --------
# This script simulates various failure scenarios to test alert systems,
# monitoring workflows, and incident response procedures.
#
# Usage:
# ------
# chmod +x scripts/simulate-fail.sh
# ./scripts/simulate-fail.sh [scenario]
#
# Scenarios:
# ----------
# 1. backend-down   - Simulate backend health check failure
# 2. frontend-down  - Simulate frontend unavailability  
# 3. database-down  - Simulate database connection failure
# 4. slow-response  - Simulate slow API response times
# 5. auth-failure   - Simulate authentication service failure
# 6. all            - Run all failure scenarios
#
# Examples:
# ---------
# ./scripts/simulate-fail.sh backend-down
# ./scripts/simulate-fail.sh all
#
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_HEALTH_URL:-http://localhost:5050}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-$BACKEND_URL/healthz}"
READINESS_URL="${BACKEND_URL}/readyz"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# Scenario 1: Backend Down
# ============================================================================

simulate_backend_down() {
    print_header "Scenario 1: Backend Health Check Failure"
    
    print_info "Attempting to reach backend at: $HEALTHCHECK_URL"
    
    # Simulate backend down by hitting non-existent endpoint
    FAKE_URL="$BACKEND_URL/this-endpoint-does-not-exist-simulate-404"
    
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FAKE_URL" 2>/dev/null || echo "000")
    
    if [ "$STATUS_CODE" != "200" ]; then
        print_error "Backend health check failed with status: $STATUS_CODE"
        print_warning "This would trigger alerts in production!"
        return 1
    else
        print_success "Backend is healthy (cannot simulate failure)"
        return 0
    fi
}

# ============================================================================
# Scenario 2: Frontend Down
# ============================================================================

simulate_frontend_down() {
    print_header "Scenario 2: Frontend Unavailability"
    
    print_info "Attempting to reach frontend at: $FRONTEND_URL"
    
    # Try to reach frontend (if it's down, this will fail)
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
    
    if [ "$STATUS_CODE" != "200" ]; then
        print_error "Frontend is unreachable (status: $STATUS_CODE)"
        print_warning "This would trigger frontend downtime alerts!"
        return 1
    else
        print_success "Frontend is healthy"
        print_info "To simulate failure, stop the frontend dev server"
        return 0
    fi
}

# ============================================================================
# Scenario 3: Database Connection Failure
# ============================================================================

simulate_database_down() {
    print_header "Scenario 3: Database Connection Failure"
    
    print_info "Checking readiness endpoint: $READINESS_URL"
    
    # Readiness endpoint checks database connectivity
    RESPONSE=$(curl -s "$READINESS_URL" 2>/dev/null || echo '{"status":"unavailable"}')
    
    DB_STATUS=$(echo "$RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$DB_STATUS" != "connected" ]; then
        print_error "Database is not connected: $DB_STATUS"
        print_warning "This would trigger database connectivity alerts!"
        return 1
    else
        print_success "Database is connected"
        print_info "To simulate failure, stop the PostgreSQL service"
        return 0
    fi
}

# ============================================================================
# Scenario 4: Slow Response Times
# ============================================================================

simulate_slow_response() {
    print_header "Scenario 4: Slow API Response Times"
    
    print_info "Measuring response time for: $HEALTHCHECK_URL"
    
    START=$(date +%s%N)
    curl -s -o /dev/null "$HEALTHCHECK_URL" 2>/dev/null || true
    END=$(date +%s%N)
    
    DURATION=$(( (END - START) / 1000000 ))
    THRESHOLD=2000 # 2 seconds
    
    echo "Response time: ${DURATION}ms (threshold: ${THRESHOLD}ms)"
    
    if [ "$DURATION" -gt "$THRESHOLD" ]; then
        print_error "Response time exceeded threshold!"
        print_warning "This would trigger slow response alerts!"
        return 1
    else
        print_success "Response time is acceptable"
        return 0
    fi
}

# ============================================================================
# Scenario 5: Authentication Service Failure
# ============================================================================

simulate_auth_failure() {
    print_header "Scenario 5: Authentication Service Failure"
    
    print_info "Testing authentication endpoint: $BACKEND_URL/api/auth/session"
    
    # Try to get session without credentials (should fail)
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/session" 2>/dev/null || echo "000")
    
    if [ "$STATUS_CODE" == "401" ] || [ "$STATUS_CODE" == "403" ]; then
        print_success "Auth service is responding correctly (unauthorized)"
    elif [ "$STATUS_CODE" == "000" ] || [ "$STATUS_CODE" == "500" ]; then
        print_error "Auth service is down or erroring!"
        print_warning "This would trigger auth service alerts!"
        return 1
    else
        print_info "Auth service returned: $STATUS_CODE"
    fi
    
    return 0
}

# ============================================================================
# Run All Scenarios
# ============================================================================

run_all_scenarios() {
    print_header "Running All Failure Scenarios"
    
    FAILED=0
    
    simulate_backend_down || ((FAILED++))
    echo ""
    
    simulate_frontend_down || ((FAILED++))
    echo ""
    
    simulate_database_down || ((FAILED++))
    echo ""
    
    simulate_slow_response || ((FAILED++))
    echo ""
    
    simulate_auth_failure || ((FAILED++))
    echo ""
    
    print_header "Summary"
    
    if [ "$FAILED" -gt 0 ]; then
        print_warning "$FAILED scenario(s) detected failures or issues"
        print_info "These would trigger alerts in production environment"
    else
        print_success "All services are healthy"
        print_info "No alerts would be triggered"
    fi
    
    return "$FAILED"
}

# ============================================================================
# Test Alert System
# ============================================================================

test_alert_system() {
    print_header "Testing Alert System"
    
    if [ -z "$RESEND_API_KEY" ]; then
        print_warning "RESEND_API_KEY not set, cannot test email alerts"
    else
        print_info "Sending test email alert..."
        
        # Use Node.js to send test email
        node -e "
        const fetch = require('node-fetch');
        const payload = {
          from: 'alerts@productifyai.com',
          to: process.env.ALERT_EMAIL_TO || 'admin@productifyai.com',
          subject: '[TEST] ProductifyAI Alert System',
          html: '<h1>Test Alert</h1><p>This is a test email from the alert system.</p><p>Timestamp: $(date)</p>'
        };
        
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ${RESEND_API_KEY}',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(d => {
          if (d.id) {
            console.log('✓ Test email sent successfully:', d.id);
          } else {
            console.error('✗ Failed to send test email:', d);
          }
        })
        .catch(e => console.error('✗ Error sending email:', e));
        " 2>/dev/null || print_error "Failed to send test email"
    fi
    
    if [ -n "$UPTIME_WEBHOOK_URL" ]; then
        print_info "Sending test webhook..."
        
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"[TEST] ProductifyAI Alert - $(date)\"}" \
          "$UPTIME_WEBHOOK_URL" 2>/dev/null || print_error "Failed to send webhook"
        
        print_success "Test webhook sent"
    else
        print_warning "UPTIME_WEBHOOK_URL not set, cannot test webhooks"
    fi
}

# ============================================================================
# Main Script
# ============================================================================

SCENARIO="${1:-all}"

case "$SCENARIO" in
    backend-down)
        simulate_backend_down
        ;;
    frontend-down)
        simulate_frontend_down
        ;;
    database-down)
        simulate_database_down
        ;;
    slow-response)
        simulate_slow_response
        ;;
    auth-failure)
        simulate_auth_failure
        ;;
    test-alerts)
        test_alert_system
        ;;
    all)
        run_all_scenarios
        ;;
    *)
        echo "Usage: $0 {backend-down|frontend-down|database-down|slow-response|auth-failure|test-alerts|all}"
        echo ""
        echo "Scenarios:"
        echo "  backend-down   - Simulate backend health check failure"
        echo "  frontend-down  - Simulate frontend unavailability"
        echo "  database-down  - Simulate database connection failure"
        echo "  slow-response  - Simulate slow API response times"
        echo "  auth-failure   - Simulate authentication service failure"
        echo "  test-alerts    - Test alert system (email & webhook)"
        echo "  all            - Run all failure scenarios"
        exit 1
        ;;
esac

echo ""
print_info "Simulation complete!"

