-- Local ID Verification Core Schema
-- Introduces application-managed ID verification tables, indexes, and policies

-- Create enumerations for consistent status handling
DO $$ BEGIN
  CREATE TYPE id_verification_request_status AS ENUM (
    'submitted',
    'processing',
    'approved',
    'manual_review',
    'rejected',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE id_verification_document_status AS ENUM (
    'passed',
    'failed',
    'suspected',
    'not_applicable'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Core request record
CREATE TABLE IF NOT EXISTS id_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status id_verification_request_status NOT NULL DEFAULT 'submitted',
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  idkit_session_id TEXT,
  consent_method TEXT,
  consent_recorded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, attempt_number)
);

-- Automated / manual review results
CREATE TABLE IF NOT EXISTS id_verification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES id_verification_requests(id) ON DELETE CASCADE,
  document_status id_verification_document_status,
  document_liveness_score NUMERIC(5,2),
  face_liveness_score NUMERIC(5,2),
  face_match_score NUMERIC(5,2),
  failure_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
  extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id)
);

-- Full audit trail for verification decisions
CREATE TABLE IF NOT EXISTS id_verification_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES id_verification_requests(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES users(id),
  action TEXT NOT NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes for queue processing and reporting
CREATE INDEX IF NOT EXISTS idx_id_verification_requests_booking_status
  ON id_verification_requests (booking_id, status);

CREATE INDEX IF NOT EXISTS idx_id_verification_requests_user_created
  ON id_verification_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_id_verification_requests_status_created
  ON id_verification_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_id_verification_results_processed
  ON id_verification_results (processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_id_verification_audits_request_created
  ON id_verification_audits (request_id, created_at DESC);

-- updated_at maintenance
DROP TRIGGER IF EXISTS set_id_verification_requests_updated_at ON id_verification_requests;
CREATE TRIGGER set_id_verification_requests_updated_at
  BEFORE UPDATE ON id_verification_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_id_verification_results_updated_at ON id_verification_results;
CREATE TRIGGER set_id_verification_results_updated_at
  BEFORE UPDATE ON id_verification_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE id_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verification_audits ENABLE ROW LEVEL SECURITY;

-- Helper predicate for admin checks
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- RLS Policies: Requests
DROP POLICY IF EXISTS "Users can view own id verification requests" ON id_verification_requests;
CREATE POLICY "Users can view own id verification requests"
  ON id_verification_requests
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own id verification requests" ON id_verification_requests;
CREATE POLICY "Users can insert own id verification requests"
  ON id_verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own id verification requests" ON id_verification_requests;
CREATE POLICY "Users can update own id verification requests"
  ON id_verification_requests
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage id verification requests" ON id_verification_requests;
CREATE POLICY "Admins can manage id verification requests"
  ON id_verification_requests
  FOR ALL
  USING (is_admin_user());

-- RLS Policies: Results
DROP POLICY IF EXISTS "Users can view own id verification results" ON id_verification_results;
CREATE POLICY "Users can view own id verification results"
  ON id_verification_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM id_verification_requests r
      WHERE r.id = id_verification_results.request_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage id verification results" ON id_verification_results;
CREATE POLICY "Admins can manage id verification results"
  ON id_verification_results
  FOR ALL
  USING (is_admin_user());

-- RLS Policies: Audits
DROP POLICY IF EXISTS "Admins can view id verification audits" ON id_verification_audits;
CREATE POLICY "Admins can view id verification audits"
  ON id_verification_audits
  FOR SELECT
  USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can manage id verification audits" ON id_verification_audits;
CREATE POLICY "Admins can manage id verification audits"
  ON id_verification_audits
  FOR ALL
  USING (is_admin_user());

-- Allow background automation (service role bypasses RLS) to write audits/results
GRANT ALL ON id_verification_requests TO service_role;
GRANT ALL ON id_verification_results TO service_role;
GRANT ALL ON id_verification_audits TO service_role;

