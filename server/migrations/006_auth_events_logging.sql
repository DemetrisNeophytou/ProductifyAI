/**
 * ============================================================================
 * MIGRATION 006: Authentication Events Logging & Brute-Force Detection
 * ============================================================================
 * 
 * Purpose:
 * --------
 * Creates infrastructure for logging authentication events (especially failed
 * login attempts) and detecting brute-force attacks in real-time.
 * 
 * Features:
 * ---------
 * 1. auth_events table - Logs all authentication events
 * 2. Brute-force detection function - Detects ≥5 failed logins per minute
 * 3. Rate limiting helper - Checks if user is currently rate-limited
 * 4. Auto-cleanup - Removes old auth events after 90 days
 * 
 * Integration:
 * ------------
 * Call log_auth_event() from your authentication middleware:
 * 
 *   SELECT log_auth_event(
 *     'user-id-or-email',
 *     'login_failed',
 *     '192.168.1.1',
 *     'Mozilla/5.0...',
 *     '{"reason": "invalid_password"}'::jsonb
 *   );
 * 
 * Event Types:
 * ------------
 * - login_success
 * - login_failed
 * - signup_success
 * - signup_failed
 * - password_reset_requested
 * - password_reset_completed
 * - email_verification_sent
 * - email_verification_completed
 * - account_locked
 * - account_unlocked
 * 
 * ============================================================================
 */

-- ============================================================================
-- AUTH_EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR, -- Can be NULL for failed login attempts
  email VARCHAR, -- Store email for failed attempts when user_id unknown
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45), -- IPv4 (15) or IPv6 (45)
  user_agent TEXT,
  metadata JSONB, -- Additional context (e.g., {"reason": "invalid_password"})
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'login_success',
      'login_failed',
      'signup_success',
      'signup_failed',
      'password_reset_requested',
      'password_reset_completed',
      'email_verification_sent',
      'email_verification_completed',
      'account_locked',
      'account_unlocked',
      'session_expired',
      'logout'
    )
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_email ON auth_events(email);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_ip ON auth_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_user_time ON auth_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_email_time ON auth_events(email, created_at DESC);

-- ============================================================================
-- FUNCTION: Log Authentication Event
-- ============================================================================
CREATE OR REPLACE FUNCTION log_auth_event(
  p_user_id VARCHAR,
  p_event_type VARCHAR,
  p_ip_address VARCHAR,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
DECLARE
  user_email VARCHAR;
BEGIN
  -- Try to get email if user_id provided
  IF p_user_id IS NOT NULL THEN
    SELECT email INTO user_email FROM users WHERE id = p_user_id;
  END IF;

  -- Insert event
  INSERT INTO auth_events (user_id, email, event_type, ip_address, user_agent, metadata)
  VALUES (p_user_id, user_email, p_event_type, p_ip_address, p_user_agent, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Detect Brute-Force Attack
-- ============================================================================
-- Returns TRUE if user/IP has ≥5 failed login attempts in the last minute
CREATE OR REPLACE FUNCTION detect_brute_force(
  p_identifier VARCHAR, -- Can be user_id, email, or ip_address
  p_check_type VARCHAR DEFAULT 'email' -- 'user_id', 'email', or 'ip'
) RETURNS TABLE(
  is_brute_force BOOLEAN,
  failed_attempts INTEGER,
  first_attempt TIMESTAMP,
  last_attempt TIMESTAMP,
  should_lock BOOLEAN
) AS $$
DECLARE
  v_failed_count INTEGER;
  v_first_attempt TIMESTAMP;
  v_last_attempt TIMESTAMP;
BEGIN
  -- Count failed login attempts in the last minute
  IF p_check_type = 'user_id' THEN
    SELECT COUNT(*), MIN(created_at), MAX(created_at)
    INTO v_failed_count, v_first_attempt, v_last_attempt
    FROM auth_events
    WHERE user_id = p_identifier
      AND event_type = 'login_failed'
      AND created_at > NOW() - INTERVAL '1 minute';
  
  ELSIF p_check_type = 'email' THEN
    SELECT COUNT(*), MIN(created_at), MAX(created_at)
    INTO v_failed_count, v_first_attempt, v_last_attempt
    FROM auth_events
    WHERE email = p_identifier
      AND event_type = 'login_failed'
      AND created_at > NOW() - INTERVAL '1 minute';
  
  ELSIF p_check_type = 'ip' THEN
    SELECT COUNT(*), MIN(created_at), MAX(created_at)
    INTO v_failed_count, v_first_attempt, v_last_attempt
    FROM auth_events
    WHERE ip_address = p_identifier
      AND event_type = 'login_failed'
      AND created_at > NOW() - INTERVAL '1 minute';
  END IF;

  RETURN QUERY SELECT
    v_failed_count >= 5, -- is_brute_force
    v_failed_count, -- failed_attempts
    v_first_attempt, -- first_attempt
    v_last_attempt, -- last_attempt
    v_failed_count >= 10; -- should_lock (10 attempts = account lock)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Check if User/IP is Rate Limited
-- ============================================================================
CREATE OR REPLACE FUNCTION is_rate_limited(
  p_identifier VARCHAR,
  p_check_type VARCHAR DEFAULT 'email'
) RETURNS BOOLEAN AS $$
DECLARE
  is_brute BOOLEAN;
BEGIN
  SELECT detect_brute_force.is_brute_force INTO is_brute
  FROM detect_brute_force(p_identifier, p_check_type);
  
  RETURN COALESCE(is_brute, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-Lock Account After 10 Failed Attempts
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_auto_lock_account() RETURNS TRIGGER AS $$
DECLARE
  v_should_lock BOOLEAN;
  v_user_id VARCHAR;
  v_email VARCHAR;
BEGIN
  -- Only process failed login events
  IF NEW.event_type != 'login_failed' THEN
    RETURN NEW;
  END IF;

  -- Determine identifier
  v_user_id := NEW.user_id;
  v_email := NEW.email;

  -- Check if should lock by email
  IF v_email IS NOT NULL THEN
    SELECT should_lock INTO v_should_lock
    FROM detect_brute_force(v_email, 'email');

    IF v_should_lock THEN
      -- Log account lock event
      INSERT INTO auth_events (user_id, email, event_type, ip_address, user_agent, metadata)
      VALUES (
        v_user_id,
        v_email,
        'account_locked',
        NEW.ip_address,
        NEW.user_agent,
        jsonb_build_object(
          'reason', 'brute_force_detected',
          'failed_attempts', 10,
          'locked_at', NOW()
        )
      );

      -- Update user account status (if user exists)
      IF v_user_id IS NOT NULL THEN
        UPDATE users
        SET 
          subscription_status = 'locked',
          updated_at = NOW()
        WHERE id = v_user_id;
      END IF;

      RAISE NOTICE 'SECURITY ALERT: Account locked due to brute-force attack. Email: %, IP: %', v_email, NEW.ip_address;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trg_auto_lock_account ON auth_events;
CREATE TRIGGER trg_auto_lock_account
  AFTER INSERT ON auth_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_lock_account();

-- ============================================================================
-- FUNCTION: Get Failed Login Stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_failed_login_stats(
  p_time_window INTERVAL DEFAULT '1 hour'
) RETURNS TABLE(
  email VARCHAR,
  ip_address VARCHAR,
  failed_attempts BIGINT,
  last_attempt TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.email,
    ae.ip_address,
    COUNT(*) as failed_attempts,
    MAX(ae.created_at) as last_attempt
  FROM auth_events ae
  WHERE ae.event_type = 'login_failed'
    AND ae.created_at > NOW() - p_time_window
  GROUP BY ae.email, ae.ip_address
  HAVING COUNT(*) >= 3
  ORDER BY failed_attempts DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Auto-Cleanup Old Auth Events (90 days retention)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_auth_events() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM auth_events
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING *
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RAISE NOTICE 'Cleaned up % old auth events', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY for auth_events
-- ============================================================================
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view all auth events
CREATE POLICY "auth_events_admin_only" ON auth_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (
        CASE 
          WHEN current_setting('app.current_user_id', true) IS NOT NULL 
          THEN current_setting('app.current_user_id', true)::varchar
          ELSE NULL
        END
      )
      AND users.role = 'admin'
    )
  );

-- Service role can insert events
-- No INSERT policy = only service/function can insert

-- ============================================================================
-- COMPLETION LOG
-- ============================================================================
DO $$ 
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Authentication Events Logging & Brute-Force Detection has been ENABLED.';
  RAISE NOTICE '';
  RAISE NOTICE 'Features Created:';
  RAISE NOTICE '  ✓ auth_events table';
  RAISE NOTICE '  ✓ log_auth_event() function';
  RAISE NOTICE '  ✓ detect_brute_force() function';
  RAISE NOTICE '  ✓ is_rate_limited() function';
  RAISE NOTICE '  ✓ Auto-lock trigger (10 failed attempts)';
  RAISE NOTICE '  ✓ get_failed_login_stats() function';
  RAISE NOTICE '  ✓ cleanup_old_auth_events() function';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage Examples:';
  RAISE NOTICE '  -- Log failed login:';
  RAISE NOTICE '  SELECT log_auth_event(NULL, ''login_failed'', ''192.168.1.1'', ''user-agent'');';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Check for brute-force:';
  RAISE NOTICE '  SELECT * FROM detect_brute_force(''user@example.com'', ''email'');';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Get failed login stats:';
  RAISE NOTICE '  SELECT * FROM get_failed_login_stats(''1 hour'');';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features:';
  RAISE NOTICE '  • Auto-locks account after 10 failed attempts in 1 minute';
  RAISE NOTICE '  • Rate limits after 5 failed attempts in 1 minute';
  RAISE NOTICE '  • Tracks IP addresses and user agents';
  RAISE NOTICE '  • 90-day retention policy';
  RAISE NOTICE '============================================================================';
END $$;

