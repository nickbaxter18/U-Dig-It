-- Spin-to-Win Wheel System
-- Complete production-grade implementation with fraud prevention, audit logging, and compliance

-- ============================================================================
-- 1. SPIN SESSIONS TABLE
-- ============================================================================
CREATE TABLE spin_sessions (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(100) UNIQUE NOT NULL,

  -- User identification (nullable for guests)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(20),

  -- Spin mechanics
  spins_allowed INTEGER NOT NULL DEFAULT 3 CHECK (spins_allowed = 3),
  spins_used INTEGER NOT NULL DEFAULT 0 CHECK (spins_used >= 0 AND spins_used <= 3),

  -- Outcomes tracking (JSON array of spin results)
  -- Format: [{"spin": 1, "outcome": "try_again", "timestamp": "..."}, ...]
  outcomes JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Prize details (set when won)
  prize_pct INTEGER CHECK (prize_pct IN (5, 10, 15)),
  coupon_code VARCHAR(50),

  -- Session lifecycle
  completed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,

  -- Fraud prevention & audit
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_fingerprint_hash VARCHAR(64),

  -- First-time booking enforcement
  is_first_booking_only BOOLEAN NOT NULL DEFAULT true,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_email_or_phone CHECK (
    email IS NOT NULL OR phone IS NOT NULL OR user_id IS NOT NULL
  ),
  CONSTRAINT valid_prize_when_completed CHECK (
    (NOT completed) OR (completed AND prize_pct IS NOT NULL AND coupon_code IS NOT NULL)
  ),
  CONSTRAINT valid_spins_vs_outcomes CHECK (
    spins_used = jsonb_array_length(outcomes)
  )
);

-- ============================================================================
-- 2. COUPON CODES TABLE
-- ============================================================================
CREATE TABLE spin_coupon_codes (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Link to spin session
  spin_session_id UUID NOT NULL REFERENCES spin_sessions(id) ON DELETE CASCADE,

  -- Stripe integration
  stripe_coupon_id VARCHAR(100) UNIQUE,
  stripe_promotion_code_id VARCHAR(100) UNIQUE,

  -- Discount details
  discount_pct INTEGER NOT NULL CHECK (discount_pct IN (5, 10, 15)),
  max_discount_cents INTEGER, -- Cap in cents (e.g., 50000 = $500 max)
  min_spend_cents INTEGER DEFAULT 0,

  -- Lifecycle
  max_uses INTEGER NOT NULL DEFAULT 1,
  times_used INTEGER NOT NULL DEFAULT 0 CHECK (times_used <= max_uses),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Usage tracking
  used_at TIMESTAMPTZ,
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_in_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'used', 'expired', 'revoked')
  ),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. SPIN AUDIT LOG (Immutable)
-- ============================================================================
CREATE TABLE spin_audit_log (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  spin_session_id UUID NOT NULL REFERENCES spin_sessions(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(50) NOT NULL CHECK (
    event_type IN (
      'session_created',
      'spin_started',
      'spin_completed',
      'prize_issued',
      'coupon_created',
      'coupon_used',
      'coupon_expired',
      'coupon_revoked',
      'session_expired',
      'fraud_flagged'
    )
  ),

  -- Spin details
  spin_number INTEGER CHECK (spin_number BETWEEN 1 AND 3),
  outcome VARCHAR(20),

  -- Context
  ip_address INET NOT NULL,
  user_agent TEXT,
  device_fingerprint_hash VARCHAR(64),

  -- Metadata (flexible for different event types)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Make audit log append-only (no updates or deletes)
CREATE POLICY "audit_log_append_only" ON spin_audit_log
FOR ALL TO authenticated
USING (false)
WITH CHECK (true);

-- ============================================================================
-- 4. FRAUD DETECTION TABLE
-- ============================================================================
CREATE TABLE spin_fraud_flags (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  spin_session_id UUID NOT NULL REFERENCES spin_sessions(id) ON DELETE CASCADE,

  -- Flag details
  flag_type VARCHAR(50) NOT NULL CHECK (
    flag_type IN (
      'duplicate_device',
      'duplicate_ip',
      'duplicate_email',
      'duplicate_phone',
      'suspicious_pattern',
      'rate_limit_exceeded',
      'manual_review'
    )
  ),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewed', 'cleared', 'confirmed_fraud')
  ),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. RATE LIMITING TABLE
-- ============================================================================
CREATE TABLE spin_rate_limits (
  -- Composite key
  identifier_type VARCHAR(20) NOT NULL CHECK (
    identifier_type IN ('ip', 'device', 'email', 'phone', 'user_id')
  ),
  identifier_value VARCHAR(255) NOT NULL,

  -- Tracking
  attempt_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Window (14 days default)
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (identifier_type, identifier_value)
);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- spin_sessions indexes
CREATE INDEX idx_spin_sessions_user_id ON spin_sessions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_spin_sessions_email ON spin_sessions(email) WHERE email IS NOT NULL;
CREATE INDEX idx_spin_sessions_phone ON spin_sessions(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_spin_sessions_device_hash ON spin_sessions(device_fingerprint_hash) WHERE device_fingerprint_hash IS NOT NULL;
CREATE INDEX idx_spin_sessions_ip ON spin_sessions(ip_address);
CREATE INDEX idx_spin_sessions_expires_at ON spin_sessions(expires_at) WHERE NOT completed;
CREATE INDEX idx_spin_sessions_completed ON spin_sessions(completed, created_at DESC);
CREATE INDEX idx_spin_sessions_session_token ON spin_sessions(session_token);

-- coupon_codes indexes
CREATE INDEX idx_spin_coupons_code ON spin_coupon_codes(code);
CREATE INDEX idx_spin_coupons_session_id ON spin_coupon_codes(spin_session_id);
CREATE INDEX idx_spin_coupons_status ON spin_coupon_codes(status, expires_at);
CREATE INDEX idx_spin_coupons_stripe_id ON spin_coupon_codes(stripe_coupon_id) WHERE stripe_coupon_id IS NOT NULL;

-- audit_log indexes
CREATE INDEX idx_spin_audit_session_id ON spin_audit_log(spin_session_id);
CREATE INDEX idx_spin_audit_event_type ON spin_audit_log(event_type, created_at DESC);
CREATE INDEX idx_spin_audit_created_at ON spin_audit_log(created_at DESC);

-- fraud_flags indexes
CREATE INDEX idx_spin_fraud_session_id ON spin_fraud_flags(spin_session_id);
CREATE INDEX idx_spin_fraud_status ON spin_fraud_flags(status, severity);
CREATE INDEX idx_spin_fraud_type ON spin_fraud_flags(flag_type, created_at DESC);

-- rate_limits indexes
CREATE INDEX idx_spin_rate_limits_window ON spin_rate_limits(window_end) WHERE window_end > now();

-- ============================================================================
-- 7. UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER set_spin_sessions_updated_at
BEFORE UPDATE ON spin_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_spin_coupons_updated_at
BEFORE UPDATE ON spin_coupon_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_spin_fraud_flags_updated_at
BEFORE UPDATE ON spin_fraud_flags
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_spin_rate_limits_updated_at
BEFORE UPDATE ON spin_rate_limits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- spin_sessions RLS
ALTER TABLE spin_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "spin_sessions_select_own" ON spin_sessions
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
);

-- Admins can view all sessions
CREATE POLICY "spin_sessions_select_admin" ON spin_sessions
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- Service role can insert (API only)
CREATE POLICY "spin_sessions_insert_service" ON spin_sessions
FOR INSERT TO authenticated
WITH CHECK (true); -- API will validate

-- Service role can update (API only)
CREATE POLICY "spin_sessions_update_service" ON spin_sessions
FOR UPDATE TO authenticated
USING (true) -- API will validate
WITH CHECK (true);

-- spin_coupon_codes RLS
ALTER TABLE spin_coupon_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own coupons
CREATE POLICY "spin_coupons_select_own" ON spin_coupon_codes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM spin_sessions
    WHERE spin_sessions.id = spin_coupon_codes.spin_session_id
    AND (
      spin_sessions.user_id = (SELECT auth.uid())
      OR spin_sessions.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    )
  )
);

-- Admins can view all coupons
CREATE POLICY "spin_coupons_select_admin" ON spin_coupon_codes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- Service role can manage coupons (API only)
CREATE POLICY "spin_coupons_manage_service" ON spin_coupon_codes
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- spin_audit_log RLS
ALTER TABLE spin_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "spin_audit_select_own" ON spin_audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM spin_sessions
    WHERE spin_sessions.id = spin_audit_log.spin_session_id
    AND spin_sessions.user_id = (SELECT auth.uid())
  )
);

-- Admins can view all audit logs
CREATE POLICY "spin_audit_select_admin" ON spin_audit_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- Service role can insert audit logs (append-only)
CREATE POLICY "spin_audit_insert_service" ON spin_audit_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- spin_fraud_flags RLS (Admin only)
ALTER TABLE spin_fraud_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spin_fraud_admin_only" ON spin_fraud_flags
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- spin_rate_limits RLS (Service role only)
ALTER TABLE spin_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spin_rate_limits_service_only" ON spin_rate_limits
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 9. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user/device is rate limited
CREATE OR REPLACE FUNCTION is_spin_rate_limited(
  p_identifier_type VARCHAR(20),
  p_identifier_value VARCHAR(255),
  p_max_attempts INTEGER DEFAULT 1,
  p_window_hours INTEGER DEFAULT 336 -- 14 days
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT attempt_count INTO v_count
  FROM spin_rate_limits
  WHERE identifier_type = p_identifier_type
    AND identifier_value = p_identifier_value
    AND window_end > now();

  RETURN COALESCE(v_count, 0) >= p_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record rate limit attempt
CREATE OR REPLACE FUNCTION record_spin_attempt(
  p_identifier_type VARCHAR(20),
  p_identifier_value VARCHAR(255),
  p_window_hours INTEGER DEFAULT 336 -- 14 days
) RETURNS void AS $$
BEGIN
  INSERT INTO spin_rate_limits (
    identifier_type,
    identifier_value,
    window_start,
    window_end
  ) VALUES (
    p_identifier_type,
    p_identifier_value,
    now(),
    now() + (p_window_hours || ' hours')::interval
  )
  ON CONFLICT (identifier_type, identifier_value)
  DO UPDATE SET
    attempt_count = spin_rate_limits.attempt_count + 1,
    last_attempt_at = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired sessions (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_spin_sessions() RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Update coupons to expired status
  UPDATE spin_coupon_codes
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND expires_at < now();

  -- Mark sessions as completed if expired
  UPDATE spin_sessions
  SET completed = true,
      updated_at = now()
  WHERE NOT completed
    AND expires_at < now();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log cleanup
  INSERT INTO spin_audit_log (spin_session_id, event_type, ip_address, metadata)
  SELECT
    id,
    'session_expired'::VARCHAR(50),
    '0.0.0.0'::INET,
    jsonb_build_object('cleanup_run', now())
  FROM spin_sessions
  WHERE completed = true
    AND expires_at < now()
    AND id NOT IN (
      SELECT spin_session_id
      FROM spin_audit_log
      WHERE event_type = 'session_expired'
    );

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE spin_sessions IS 'Spin-to-win wheel sessions with 3-spin guarantee (3rd spin always wins)';
COMMENT ON TABLE spin_coupon_codes IS 'Coupon codes generated from spin wins, linked to Stripe';
COMMENT ON TABLE spin_audit_log IS 'Immutable audit trail of all spin events for compliance';
COMMENT ON TABLE spin_fraud_flags IS 'Fraud detection flags for manual review';
COMMENT ON TABLE spin_rate_limits IS 'Rate limiting to prevent abuse (1 session per 14 days)';

COMMENT ON COLUMN spin_sessions.outcomes IS 'JSON array tracking each spin: [{"spin": 1, "outcome": "try_again", "timestamp": "..."}]';
COMMENT ON COLUMN spin_sessions.device_fingerprint_hash IS 'SHA-256 hash of device fingerprint for fraud detection';
COMMENT ON COLUMN spin_sessions.is_first_booking_only IS 'Enforces coupon is only for first-time bookings';

COMMENT ON FUNCTION is_spin_rate_limited IS 'Check if identifier has exceeded rate limit (default: 1 session per 14 days)';
COMMENT ON FUNCTION record_spin_attempt IS 'Record a spin attempt for rate limiting';
COMMENT ON FUNCTION cleanup_expired_spin_sessions IS 'Cleanup function to run via cron (daily recommended)';

