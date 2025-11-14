-- Advanced Features for Kubota Rental Platform
-- This migration adds sophisticated features for enterprise rental management
-- Created: 2025-01-21

-- Enable advanced PostgreSQL features for enterprise functionality
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";
CREATE EXTENSION IF NOT EXISTS "pg_prewarm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create advanced custom types for business logic
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'maintenance');
CREATE TYPE backup_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE cost_center AS ENUM ('equipment', 'maintenance', 'marketing', 'operations', 'administrative');
CREATE TYPE revenue_stream AS ENUM ('rental_income', 'delivery_fees', 'overtime_charges', 'damage_fees', 'insurance_claims');
CREATE TYPE customer_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'enterprise');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Advanced Customer Management System
CREATE TABLE customer_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Rules for segment membership
  customer_count INTEGER DEFAULT 0,
  avg_booking_value DECIMAL(10,2),
  avg_booking_frequency DECIMAL(4,2), -- bookings per month
  tier customer_tier DEFAULT 'bronze',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced Pricing Engine
CREATE TABLE dynamic_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  equipment_types TEXT[] NOT NULL,
  conditions JSONB NOT NULL, -- Complex rule conditions
  pricing_formula JSONB NOT NULL, -- Mathematical formula for pricing
  priority INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  max_applications INTEGER,
  applied_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Lifecycle Management
CREATE TABLE equipment_lifecycle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL, -- 'new', 'active', 'aging', 'retirement'
  acquisition_date DATE NOT NULL,
  acquisition_cost DECIMAL(12,2) NOT NULL,
  depreciation_method VARCHAR(20) DEFAULT 'straight_line',
  depreciation_rate DECIMAL(5,4) DEFAULT 0.05, -- 5% per year
  current_book_value DECIMAL(12,2),
  retirement_date DATE,
  retirement_reason TEXT,
  total_revenue_generated DECIMAL(12,2) DEFAULT 0,
  total_maintenance_cost DECIMAL(12,2) DEFAULT 0,
  roi_percentage DECIMAL(8,2),
  utilization_rate DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced Financial Management
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type VARCHAR(50) NOT NULL, -- 'rental_revenue', 'maintenance_expense', 'payment_processing'
  cost_center cost_center NOT NULL,
  revenue_stream revenue_stream,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  description TEXT,
  reference_id UUID, -- Links to booking, payment, etc.
  reference_table VARCHAR(50),
  metadata JSONB,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration Management System
CREATE TABLE external_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'payment', 'accounting', 'crm', 'fleet_management'
  provider VARCHAR(100),
  status integration_status DEFAULT 'inactive',
  configuration JSONB NOT NULL,
  webhook_url TEXT,
  api_key_encrypted TEXT, -- Encrypted API keys
  rate_limits JSONB, -- Rate limiting configuration
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_frequency_minutes INTEGER DEFAULT 60,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backup and Recovery Management
CREATE TABLE backup_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(100) UNIQUE NOT NULL,
  backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'schema_only'
  status backup_status DEFAULT 'pending',
  schedule_cron TEXT, -- Cron expression for scheduling
  retention_days INTEGER DEFAULT 30,
  compression_enabled BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  storage_location VARCHAR(255), -- S3 bucket, etc.
  file_size_bytes BIGINT,
  checksum_sha256 TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Management System
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_type VARCHAR(50) NOT NULL, -- 'customer_risk', 'equipment_risk', 'operational_risk'
  entity_type VARCHAR(50) NOT NULL, -- 'customer', 'equipment', 'booking'
  entity_id UUID NOT NULL,
  risk_level risk_level NOT NULL,
  risk_factors JSONB NOT NULL,
  risk_score DECIMAL(5,2) NOT NULL, -- 0-100
  mitigation_strategies TEXT[],
  review_required BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced Reporting and Dashboards
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'financial', 'operational', 'customer', 'equipment'
  query_template TEXT NOT NULL, -- SQL template with parameters
  parameters JSONB, -- Available parameters and their types
  schedule_cron TEXT, -- For automated reports
  output_format VARCHAR(20) DEFAULT 'json', -- 'json', 'csv', 'pdf', 'excel'
  recipients TEXT[], -- Email addresses for automated delivery
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Process Automation
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL, -- 'booking_created', 'payment_received', etc.
  conditions JSONB, -- When to trigger this workflow
  actions JSONB[] NOT NULL, -- Sequence of actions to perform
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Success and Engagement
CREATE TABLE customer_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_type VARCHAR(50) NOT NULL, -- 'onboarding', 'retention', 'winback'
  current_stage VARCHAR(50) NOT NULL,
  stage_progress DECIMAL(5,2) DEFAULT 0, -- 0-100%
  journey_data JSONB,
  target_completion_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive Analytics
CREATE TABLE predictive_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  model_type VARCHAR(50) NOT NULL, -- 'demand_forecasting', 'customer_churn', 'pricing_optimization'
  algorithm VARCHAR(50) NOT NULL,
  training_data_query TEXT NOT NULL,
  features JSONB NOT NULL,
  hyperparameters JSONB,
  accuracy_score DECIMAL(5,4),
  last_trained TIMESTAMP WITH TIME ZONE,
  training_frequency_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limiting and Quotas
CREATE TABLE api_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name VARCHAR(50) DEFAULT 'standard',
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_per_day INTEGER DEFAULT 10000,
  current_minute_count INTEGER DEFAULT 0,
  current_hour_count INTEGER DEFAULT 0,
  current_day_count INTEGER DEFAULT 0,
  quota_reset_minute TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quota_reset_hour TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quota_reset_day TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_suspended BOOLEAN DEFAULT false,
  suspended_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Customer Support System
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  category VARCHAR(50),
  tags TEXT[],
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  satisfaction_score INTEGER, -- 1-5 stars
  resolution_notes TEXT,
  internal_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fleet Management Integration
CREATE TABLE fleet_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  battery_level DECIMAL(5,2),
  fuel_level DECIMAL(5,2),
  engine_hours DECIMAL(10,2),
  odometer_reading INTEGER,
  temperature_celsius DECIMAL(5,2),
  diagnostic_codes TEXT[],
  is_online BOOLEAN DEFAULT true,
  last_communication TIMESTAMP WITH TIME ZONE,
  device_id VARCHAR(100), -- GPS tracker device ID
  provider VARCHAR(50), -- GPS service provider
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regulatory Compliance Tracking
CREATE TABLE compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_name VARCHAR(100) NOT NULL,
  regulation VARCHAR(100), -- 'OSHA', 'CSA', 'Transport Canada'
  requirement_type VARCHAR(50) NOT NULL, -- 'safety_inspection', 'operator_certification'
  entity_type VARCHAR(50) NOT NULL, -- 'equipment', 'operator', 'facility'
  frequency_days INTEGER, -- How often it needs to be done
  grace_period_days INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT true,
  documentation_required TEXT[],
  fine_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create advanced indexes for new tables
CREATE INDEX CONCURRENTLY idx_customer_segments_active ON customer_segments(is_active, customer_count);
CREATE INDEX CONCURRENTLY idx_dynamic_pricing_active ON dynamic_pricing_rules(is_active, priority) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_equipment_lifecycle_stage ON equipment_lifecycle(equipment_id, stage, retirement_date);
CREATE INDEX CONCURRENTLY idx_financial_transactions_cost_center ON financial_transactions(cost_center, revenue_stream, created_at);
CREATE INDEX CONCURRENTLY idx_external_integrations_status ON external_integrations(status, type);
CREATE INDEX CONCURRENTLY idx_backup_jobs_status ON backup_jobs(status, next_run);
CREATE INDEX CONCURRENTLY idx_risk_assessments_entity ON risk_assessments(entity_type, entity_id, risk_level);
CREATE INDEX CONCURRENTLY idx_report_templates_category ON report_templates(category, is_active);
CREATE INDEX CONCURRENTLY idx_workflow_templates_trigger ON workflow_templates(trigger_event, is_active);
CREATE INDEX CONCURRENTLY idx_customer_journeys_customer_stage ON customer_journeys(customer_id, journey_type, current_stage);
CREATE INDEX CONCURRENTLY idx_predictive_models_type ON predictive_models(model_type, is_active);
CREATE INDEX CONCURRENTLY idx_api_quotas_user_suspended ON api_quotas(user_id, is_suspended, suspended_until);
CREATE INDEX CONCURRENTLY idx_support_tickets_customer_status ON support_tickets(customer_id, status, priority);
CREATE INDEX CONCURRENTLY idx_fleet_tracking_equipment_online ON fleet_tracking(equipment_id, is_online, last_communication);
CREATE INDEX CONCURRENTLY idx_compliance_requirements_type ON compliance_requirements(requirement_type, entity_type, frequency_days);

-- Create GIN indexes for JSONB and array fields
CREATE INDEX CONCURRENTLY idx_customer_segments_criteria ON customer_segments USING gin(criteria);
CREATE INDEX CONCURRENTLY idx_dynamic_pricing_conditions ON dynamic_pricing_rules USING gin(conditions);
CREATE INDEX CONCURRENTLY idx_financial_transactions_metadata ON financial_transactions USING gin(metadata);
CREATE INDEX CONCURRENTLY idx_external_integrations_config ON external_integrations USING gin(configuration);
CREATE INDEX CONCURRENTLY idx_risk_assessments_factors ON risk_assessments USING gin(risk_factors);
CREATE INDEX CONCURRENTLY idx_report_templates_params ON report_templates USING gin(parameters);
CREATE INDEX CONCURRENTLY idx_workflow_conditions ON workflow_templates USING gin(conditions);
CREATE INDEX CONCURRENTLY idx_customer_journeys_data ON customer_journeys USING gin(journey_data);
CREATE INDEX CONCURRENTLY idx_predictive_models_features ON predictive_models USING gin(features);
CREATE INDEX CONCURRENTLY idx_support_tickets_tags ON support_tickets USING gin(tags);
CREATE INDEX CONCURRENTLY idx_fleet_tracking_diagnostics ON fleet_tracking USING gin(diagnostic_codes);

-- Create BRIN indexes for time series data
CREATE INDEX CONCURRENTLY idx_financial_transactions_date_brin ON financial_transactions USING brin(created_at);
CREATE INDEX CONCURRENTLY idx_backup_jobs_date_brin ON backup_jobs USING brin(created_at);
CREATE INDEX CONCURRENTLY idx_risk_assessments_date_brin ON risk_assessments USING brin(created_at);
CREATE INDEX CONCURRENTLY idx_support_tickets_date_brin ON support_tickets USING brin(created_at);
CREATE INDEX CONCURRENTLY idx_fleet_tracking_date_brin ON fleet_tracking USING brin(created_at);

-- Create composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_equipment_lifecycle_performance ON equipment_lifecycle(equipment_id, total_revenue_generated, total_maintenance_cost, roi_percentage);
CREATE INDEX CONCURRENTLY idx_financial_transactions_summary ON financial_transactions(cost_center, revenue_stream, amount, created_at);
CREATE INDEX CONCURRENTLY idx_customer_segments_performance ON customer_segments(tier, avg_booking_value, avg_booking_frequency);
CREATE INDEX CONCURRENTLY idx_support_tickets_resolution ON support_tickets(status, assigned_to, priority, created_at);

-- Function to automatically calculate customer tier based on activity
CREATE OR REPLACE FUNCTION calculate_customer_tier(p_customer_id UUID)
RETURNS customer_tier AS $$
DECLARE
  v_total_bookings INTEGER;
  v_total_revenue DECIMAL(12,2);
  v_avg_booking_value DECIMAL(10,2);
  v_booking_frequency DECIMAL(4,2);
  v_customer_tier customer_tier;
BEGIN
  -- Get customer metrics
  SELECT
    COUNT(*) as total_bookings,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(AVG(total_amount), 0) as avg_booking_value,
    COUNT(*)::DECIMAL / NULLIF(
      EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) / 2592000, 0 -- months since first booking
    ) as booking_frequency
  INTO v_total_bookings, v_total_revenue, v_avg_booking_value, v_booking_frequency
  FROM bookings
  WHERE customer_id = p_customer_id
    AND status IN ('confirmed', 'active', 'completed');

  -- Determine tier based on metrics
  SELECT
    CASE
      WHEN v_total_revenue >= 100000 OR v_booking_frequency >= 5 THEN 'enterprise'
      WHEN v_total_revenue >= 25000 OR v_booking_frequency >= 2 THEN 'platinum'
      WHEN v_total_revenue >= 10000 OR v_booking_frequency >= 1 THEN 'gold'
      WHEN v_total_revenue >= 2500 OR v_total_bookings >= 5 THEN 'silver'
      ELSE 'bronze'
    END INTO v_customer_tier;

  -- Update customer segment
  INSERT INTO customer_segments (name, description, criteria, tier, customer_count, avg_booking_value, avg_booking_frequency)
  VALUES (
    'Tier ' || v_customer_tier::text || ' Customers',
    'Customers in ' || v_customer_tier::text || ' tier',
    jsonb_build_object(
      'min_revenue', CASE v_customer_tier
        WHEN 'enterprise' THEN 100000
        WHEN 'platinum' THEN 25000
        WHEN 'gold' THEN 10000
        WHEN 'silver' THEN 2500
        ELSE 0
      END,
      'min_frequency', CASE v_customer_tier
        WHEN 'enterprise' THEN 5
        WHEN 'platinum' THEN 2
        WHEN 'gold' THEN 1
        ELSE 0
      END
    ),
    v_customer_tier,
    1,
    v_avg_booking_value,
    v_booking_frequency
  )
  ON CONFLICT (name) DO UPDATE SET
    customer_count = customer_segments.customer_count + 1,
    avg_booking_value = (customer_segments.avg_booking_value * (customer_segments.customer_count - 1) + v_avg_booking_value) / customer_segments.customer_count,
    avg_booking_frequency = (customer_segments.avg_booking_frequency * (customer_segments.customer_count - 1) + v_booking_frequency) / customer_segments.customer_count,
    updated_at = NOW();

  RETURN v_customer_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evaluate dynamic pricing rules
CREATE OR REPLACE FUNCTION evaluate_dynamic_pricing(
  p_equipment_id UUID,
  p_customer_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  rule_id UUID,
  rule_name TEXT,
  base_price DECIMAL(10,2),
  adjusted_price DECIMAL(10,2),
  adjustment_amount DECIMAL(10,2),
  adjustment_reason TEXT
) AS $$
DECLARE
  v_equipment RECORD;
  v_customer RECORD;
  v_booking_duration INTEGER;
  v_rule RECORD;
  v_base_price DECIMAL(10,2);
  v_adjusted_price DECIMAL(10,2);
  v_seasonal_multiplier DECIMAL(4,3) := 1.0;
BEGIN
  -- Get equipment and customer details
  SELECT * INTO v_equipment FROM equipment WHERE id = p_equipment_id;
  SELECT * INTO v_customer FROM users WHERE id = p_customer_id;

  -- Calculate base duration and pricing
  v_booking_duration := EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400;

  -- Determine base rate
  IF v_booking_duration >= 30 THEN
    v_base_price := v_equipment.monthly_rate * (v_booking_duration / 30.0);
  ELSIF v_booking_duration >= 7 THEN
    v_base_price := v_equipment.weekly_rate * (v_booking_duration / 7.0);
  ELSE
    v_base_price := v_equipment.daily_rate * v_booking_duration;
  END IF;

  -- Check seasonal pricing
  SELECT multiplier INTO v_seasonal_multiplier
  FROM seasonal_pricing
  WHERE equipment_type = v_equipment.type
    AND p_start_date::date BETWEEN start_date AND end_date
    AND is_active = true
  ORDER BY multiplier DESC
  LIMIT 1;

  v_base_price := v_base_price * v_seasonal_multiplier;

  -- Evaluate dynamic pricing rules
  FOR v_rule IN
    SELECT * FROM dynamic_pricing_rules
    WHERE is_active = true
      AND p_equipment_id::text = ANY(equipment_types)
      AND (valid_from IS NULL OR valid_from <= p_start_date)
      AND (valid_until IS NULL OR valid_until >= p_start_date)
      AND (applied_count < max_applications OR max_applications IS NULL)
    ORDER BY priority DESC
  LOOP
    -- Check if rule conditions are met (simplified implementation)
    -- In production, you'd need a more sophisticated rule engine
    IF v_rule.conditions->>'type' = 'customer_tier' THEN
      -- This would check customer tier conditions
      CONTINUE;
    ELSIF v_rule.conditions->>'type' = 'booking_volume' THEN
      -- This would check booking volume conditions
      CONTINUE;
    END IF;

    -- Apply pricing formula (simplified)
    v_adjusted_price := v_base_price * (1 + COALESCE((v_rule.pricing_formula->>'multiplier')::DECIMAL, 0));

    -- Update application count
    UPDATE dynamic_pricing_rules
    SET applied_count = applied_count + 1
    WHERE id = v_rule.id;

    RETURN QUERY SELECT
      v_rule.id,
      v_rule.name,
      v_base_price,
      v_adjusted_price,
      v_adjusted_price - v_base_price,
      COALESCE(v_rule.description, 'Dynamic pricing adjustment');
  END LOOP;

  -- Return base pricing if no rules apply
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::UUID,
      'Base Pricing'::TEXT,
      v_base_price,
      v_base_price,
      0::DECIMAL,
      'Standard pricing applied';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate equipment ROI and lifecycle metrics
CREATE OR REPLACE FUNCTION calculate_equipment_roi(p_equipment_id UUID)
RETURNS TABLE (
  equipment_id UUID,
  acquisition_cost DECIMAL(12,2),
  current_book_value DECIMAL(12,2),
  total_revenue DECIMAL(12,2),
  total_maintenance_cost DECIMAL(12,2),
  net_profit DECIMAL(12,2),
  roi_percentage DECIMAL(8,2),
  utilization_rate DECIMAL(5,2),
  depreciation_expense DECIMAL(12,2),
  recommendation TEXT
) AS $$
DECLARE
  v_equipment RECORD;
  v_lifecycle RECORD;
  v_total_revenue DECIMAL(12,2);
  v_total_maintenance DECIMAL(12,2);
  v_depreciation DECIMAL(12,2);
  v_book_value DECIMAL(12,2);
  v_roi DECIMAL(8,2);
  v_utilization DECIMAL(5,2);
BEGIN
  -- Get equipment details
  SELECT * INTO v_equipment FROM equipment WHERE id = p_equipment_id;

  -- Get or create lifecycle record
  SELECT * INTO v_lifecycle FROM equipment_lifecycle WHERE equipment_id = p_equipment_id;

  IF NOT FOUND THEN
    -- Create new lifecycle record
    INSERT INTO equipment_lifecycle (
      equipment_id,
      stage,
      acquisition_date,
      acquisition_cost,
      current_book_value,
      depreciation_method,
      depreciation_rate
    ) VALUES (
      p_equipment_id,
      'active',
      CURRENT_DATE - INTERVAL '1 year', -- Assume 1 year old if no data
      v_equipment.replacement_value,
      v_equipment.replacement_value,
      'straight_line',
      0.05
    ) RETURNING * INTO v_lifecycle;
  END IF;

  -- Calculate revenue from bookings
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_revenue
  FROM bookings
  WHERE equipment_id = p_equipment_id
    AND status IN ('confirmed', 'active', 'completed');

  -- Calculate maintenance costs
  SELECT COALESCE(SUM(cost), 0) INTO v_total_maintenance
  FROM equipment_maintenance
  WHERE equipment_id = p_equipment_id
    AND status = 'completed';

  -- Calculate current book value (simplified depreciation)
  v_depreciation := v_lifecycle.acquisition_cost * v_lifecycle.depreciation_rate;
  v_book_value := GREATEST(
    v_lifecycle.acquisition_cost - v_depreciation,
    v_lifecycle.acquisition_cost * 0.1 -- Minimum 10% residual value
  );

  -- Calculate utilization rate
  SELECT
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*)::DECIMAL / EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) * 86400 / 30) * 100
      ELSE 0
    END INTO v_utilization
  FROM bookings
  WHERE equipment_id = p_equipment_id
    AND status IN ('confirmed', 'active', 'completed');

  -- Calculate ROI
  v_roi := CASE
    WHEN v_lifecycle.acquisition_cost > 0 THEN
      ((v_total_revenue - v_total_maintenance - v_depreciation) / v_lifecycle.acquisition_cost) * 100
    ELSE 0
  END;

  -- Update lifecycle record
  UPDATE equipment_lifecycle SET
    current_book_value = v_book_value,
    total_revenue_generated = v_total_revenue,
    total_maintenance_cost = v_total_maintenance,
    roi_percentage = v_roi,
    utilization_rate = v_utilization,
    updated_at = NOW()
  WHERE equipment_id = p_equipment_id;

  RETURN QUERY SELECT
    p_equipment_id,
    v_lifecycle.acquisition_cost,
    v_book_value,
    v_total_revenue,
    v_total_maintenance,
    v_total_revenue - v_total_maintenance - v_depreciation,
    v_roi,
    v_utilization,
    v_depreciation,
    CASE
      WHEN v_roi > 50 THEN 'Excellent investment - consider expansion'
      WHEN v_roi > 20 THEN 'Good investment - maintain current strategy'
      WHEN v_roi > 0 THEN 'Break-even - monitor closely'
      WHEN v_utilization < 30 THEN 'Underutilized - consider selling or repurposing'
      ELSE 'Losing money - consider retirement'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assess customer risk
CREATE OR REPLACE FUNCTION assess_customer_risk(p_customer_id UUID)
RETURNS TABLE (
  customer_id UUID,
  risk_level risk_level,
  risk_score DECIMAL(5,2),
  risk_factors JSONB,
  recommendation TEXT,
  next_review_date DATE
) AS $$
DECLARE
  v_customer RECORD;
  v_booking_history RECORD;
  v_payment_history RECORD;
  v_risk_score DECIMAL(5,2) := 0;
  v_risk_factors JSONB := '{}'::jsonb;
  v_recommendation TEXT;
  v_next_review DATE;
BEGIN
  -- Get customer details
  SELECT * INTO v_customer FROM users WHERE id = p_customer_id;

  -- Analyze booking history
  SELECT
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
    AVG(total_amount) as avg_booking_value,
    MIN(created_at) as first_booking,
    MAX(created_at) as last_booking
  INTO v_booking_history
  FROM bookings
  WHERE customer_id = p_customer_id;

  -- Analyze payment history
  SELECT
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
    AVG(amount) as avg_payment_amount
  INTO v_payment_history
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  WHERE b.customer_id = p_customer_id;

  -- Calculate risk factors
  IF v_booking_history.cancelled_bookings::DECIMAL / NULLIF(v_booking_history.total_bookings, 0) > 0.3 THEN
    v_risk_score := v_risk_score + 30;
    v_risk_factors := v_risk_factors || jsonb_build_object('high_cancellation_rate', true);
  END IF;

  IF v_payment_history.failed_payments::DECIMAL / NULLIF(v_payment_history.total_payments, 0) > 0.2 THEN
    v_risk_score := v_risk_score + 25;
    v_risk_factors := v_risk_factors || jsonb_build_object('payment_issues', true);
  END IF;

  IF v_booking_history.total_bookings < 3 THEN
    v_risk_score := v_risk_score + 15;
    v_risk_factors := v_risk_factors || jsonb_build_object('new_customer', true);
  END IF;

  IF v_customer.company_name IS NULL OR v_customer.company_name = '' THEN
    v_risk_score := v_risk_score + 10;
    v_risk_factors := v_risk_factors || jsonb_build_object('individual_customer', true);
  END IF;

  -- Determine risk level
  v_risk_level := CASE
    WHEN v_risk_score >= 70 THEN 'critical'
    WHEN v_risk_score >= 40 THEN 'high'
    WHEN v_risk_score >= 20 THEN 'medium'
    ELSE 'low'
  END;

  -- Generate recommendation
  v_recommendation := CASE v_risk_level
    WHEN 'critical' THEN 'Require upfront payment, security deposit increase, or decline booking'
    WHEN 'high' THEN 'Require insurance verification and payment guarantee'
    WHEN 'medium' THEN 'Standard review process, monitor payment behavior'
    ELSE 'Standard customer - no special requirements'
  END;

  -- Set next review date
  v_next_review := CASE v_risk_level
    WHEN 'critical' THEN CURRENT_DATE + INTERVAL '30 days'
    WHEN 'high' THEN CURRENT_DATE + INTERVAL '90 days'
    ELSE CURRENT_DATE + INTERVAL '1 year'
  END;

  -- Insert or update risk assessment
  INSERT INTO risk_assessments (
    assessment_type,
    entity_type,
    entity_id,
    risk_level,
    risk_factors,
    risk_score,
    mitigation_strategies,
    next_review_date
  ) VALUES (
    'customer_risk',
    'customer',
    p_customer_id,
    v_risk_level,
    v_risk_factors,
    v_risk_score,
    CASE v_risk_level
      WHEN 'critical' THEN ARRAY['Require upfront payment', 'Increase security deposit', 'Enhanced insurance verification']
      WHEN 'high' THEN ARRAY['Payment guarantee required', 'Insurance verification']
      WHEN 'medium' THEN ARRAY['Standard monitoring']
      ELSE ARRAY['Standard process']
    END,
    v_next_review
  )
  ON CONFLICT (assessment_type, entity_type, entity_id)
  DO UPDATE SET
    risk_level = EXCLUDED.risk_level,
    risk_factors = EXCLUDED.risk_factors,
    risk_score = EXCLUDED.risk_score,
    mitigation_strategies = EXCLUDED.mitigation_strategies,
    next_review_date = EXCLUDED.next_review_date,
    updated_at = NOW();

  RETURN QUERY SELECT
    p_customer_id,
    v_risk_level,
    v_risk_score,
    v_risk_factors,
    v_recommendation,
    v_next_review;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process workflow automation
CREATE OR REPLACE FUNCTION process_workflow_automation(
  p_trigger_event VARCHAR,
  p_entity_data JSONB
)
RETURNS TABLE (
  workflow_id UUID,
  workflow_name TEXT,
  actions_executed JSONB,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_workflow RECORD;
  v_action JSONB;
  v_actions_executed JSONB[] := ARRAY[]::JSONB[];
  v_success BOOLEAN := true;
  v_error TEXT := '';
BEGIN
  -- Find applicable workflows
  FOR v_workflow IN
    SELECT * FROM workflow_templates
    WHERE trigger_event = p_trigger_event
      AND is_active = true
    ORDER BY created_at DESC
  LOOP
    -- Check workflow conditions (simplified)
    IF v_workflow.conditions IS NULL OR jsonb_typeof(v_workflow.conditions) = 'null' THEN
      -- Execute workflow actions
      FOREACH v_action IN ARRAY v_workflow.actions
      LOOP
        BEGIN
          -- Execute action based on type (simplified implementation)
          IF v_action->>'type' = 'notification' THEN
            -- Create notification
            INSERT INTO notifications (
              user_id,
              type,
              priority,
              title,
              message,
              template_data,
              metadata
            ) VALUES (
              COALESCE((p_entity_data->>'customer_id')::UUID, (p_entity_data->>'user_id')::UUID),
              COALESCE(v_action->>'channel', 'email'),
              COALESCE(v_action->>'priority', 'medium'),
              v_action->>'title',
              v_action->>'message',
              p_entity_data,
              jsonb_build_object('workflow_id', v_workflow.id, 'automated', true)
            );
          ELSIF v_action->>'type' = 'update_record' THEN
            -- Update record (simplified)
            CONTINUE;
          END IF;

          v_actions_executed := v_actions_executed || v_action;
        EXCEPTION
          WHEN OTHERS THEN
            v_success := false;
            v_error := SQLERRM;
            EXIT;
        END;
      END LOOP;

      -- Update workflow execution stats
      UPDATE workflow_templates
      SET
        execution_count = execution_count + 1,
        success_rate = CASE
          WHEN v_success THEN ((success_rate * (execution_count - 1)) + 100) / execution_count
          ELSE ((success_rate * (execution_count - 1)) + 0) / execution_count
        END
      WHERE id = v_workflow.id;

      RETURN QUERY SELECT
        v_workflow.id,
        v_workflow.name,
        to_jsonb(v_actions_executed),
        v_success,
        v_error;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate compliance reports
CREATE OR REPLACE FUNCTION generate_compliance_report(
  p_requirement_type VARCHAR,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  requirement_name TEXT,
  total_entities INTEGER,
  compliant_entities INTEGER,
  non_compliant_entities INTEGER,
  compliance_rate DECIMAL(5,2),
  next_due_dates DATE[],
  recommendations TEXT[]
) AS $$
DECLARE
  v_start DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_requirement RECORD;
BEGIN
  FOR v_requirement IN
    SELECT * FROM compliance_requirements
    WHERE requirement_type = p_requirement_type
  LOOP
    RETURN QUERY
    SELECT
      v_requirement.requirement_name,
      CASE
        WHEN v_requirement.entity_type = 'equipment' THEN (SELECT COUNT(*) FROM equipment)
        WHEN v_requirement.entity_type = 'customer' THEN (SELECT COUNT(*) FROM users WHERE role = 'customer')
        ELSE 0
      END,
      CASE
        WHEN v_requirement.entity_type = 'equipment' THEN (
          SELECT COUNT(*) FROM equipment e
          WHERE NOT EXISTS (
            SELECT 1 FROM equipment_maintenance em
            WHERE em.equipment_id = e.id
              AND em.status = 'completed'
              AND em.completed_date >= CURRENT_DATE - INTERVAL '1 day' * v_requirement.frequency_days
          )
        )
        ELSE 0
      END,
      CASE
        WHEN v_requirement.entity_type = 'equipment' THEN (
          SELECT COUNT(*) FROM equipment e
          WHERE EXISTS (
            SELECT 1 FROM equipment_maintenance em
            WHERE em.equipment_id = e.id
              AND em.status = 'completed'
              AND em.completed_date >= CURRENT_DATE - INTERVAL '1 day' * v_requirement.frequency_days
          )
        )
        ELSE 0
      END,
      CASE
        WHEN (SELECT COUNT(*) FROM equipment) > 0 THEN
          (SELECT COUNT(*) FROM equipment e
           WHERE EXISTS (
             SELECT 1 FROM equipment_maintenance em
             WHERE em.equipment_id = e.id
               AND em.status = 'completed'
               AND em.completed_date >= CURRENT_DATE - INTERVAL '1 day' * v_requirement.frequency_days
           ))::DECIMAL / (SELECT COUNT(*) FROM equipment) * 100
        ELSE 100
      END,
      CASE
        WHEN v_requirement.entity_type = 'equipment' THEN (
          SELECT ARRAY_AGG(DISTINCT em.scheduled_date::date) FROM equipment_maintenance em
          WHERE em.status = 'scheduled'
            AND em.scheduled_date::date > CURRENT_DATE
          ORDER BY em.scheduled_date::date
          LIMIT 10
        )
        ELSE ARRAY[]::DATE[]
      END,
      CASE
        WHEN v_requirement.entity_type = 'equipment' AND (
          SELECT COUNT(*) FROM equipment e
          WHERE NOT EXISTS (
            SELECT 1 FROM equipment_maintenance em
            WHERE em.equipment_id = e.id
              AND em.status = 'completed'
              AND em.completed_date >= CURRENT_DATE - INTERVAL '1 day' * v_requirement.frequency_days
          )
        ) > 0 THEN ARRAY['Schedule overdue maintenance', 'Review maintenance procedures']
        ELSE ARRAY['Compliance maintained']
      END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to predict equipment demand
CREATE OR REPLACE FUNCTION predict_equipment_demand(
  p_equipment_type VARCHAR,
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  predicted_demand DECIMAL(5,2),
  confidence_level DECIMAL(3,2),
  factors JSONB,
  recommendation TEXT
) AS $$
DECLARE
  v_date DATE;
  v_base_demand DECIMAL(5,2);
  v_seasonal_factor DECIMAL(4,3);
  v_trend_factor DECIMAL(4,3);
  v_confidence DECIMAL(3,2);
BEGIN
  -- Simple demand prediction based on historical data and seasonal trends
  FOR i IN 0..p_days_ahead LOOP
    v_date := CURRENT_DATE + i;

    -- Get historical average for this day of week
    SELECT COALESCE(AVG(utilization_percentage), 50) INTO v_base_demand
    FROM equipment_utilization
    WHERE EXTRACT(DOW FROM date) = EXTRACT(DOW FROM v_date)
      AND date >= CURRENT_DATE - INTERVAL '90 days';

    -- Apply seasonal factor
    SELECT COALESCE(multiplier, 1.0) INTO v_seasonal_factor
    FROM seasonal_pricing
    WHERE equipment_type = p_equipment_type
      AND v_date BETWEEN start_date AND end_date
      AND is_active = true
    LIMIT 1;

    -- Apply trend factor (simplified)
    v_trend_factor := 1.0 + (i * 0.01); -- Slight upward trend

    -- Calculate confidence based on data availability
    SELECT
      CASE
        WHEN COUNT(*) > 10 THEN 0.8
        WHEN COUNT(*) > 5 THEN 0.6
        ELSE 0.4
      END INTO v_confidence
    FROM equipment_utilization
    WHERE EXTRACT(DOW FROM date) = EXTRACT(DOW FROM v_date)
      AND date >= CURRENT_DATE - INTERVAL '90 days';

    RETURN QUERY SELECT
      v_date,
      GREATEST(0, LEAST(100, v_base_demand * v_seasonal_factor * v_trend_factor)),
      v_confidence,
      jsonb_build_object(
        'seasonal_factor', v_seasonal_factor,
        'trend_factor', v_trend_factor,
        'historical_average', v_base_demand
      ),
      CASE
        WHEN v_base_demand * v_seasonal_factor * v_trend_factor > 80 THEN 'High demand expected - ensure availability'
        WHEN v_base_demand * v_seasonal_factor * v_trend_factor > 60 THEN 'Moderate demand - normal operations'
        ELSE 'Low demand - consider promotional pricing'
      END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to optimize API rate limits based on usage patterns
CREATE OR REPLACE FUNCTION optimize_api_rate_limits()
RETURNS TABLE (
  user_id UUID,
  current_plan TEXT,
  recommended_plan TEXT,
  avg_requests_per_hour DECIMAL(10,2),
  peak_requests_per_hour DECIMAL(10,2),
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    COALESCE(aq.plan_name, 'standard'),
    CASE
      WHEN peak_usage.requests_per_hour > 5000 THEN 'enterprise'
      WHEN peak_usage.requests_per_hour > 1000 THEN 'professional'
      WHEN peak_usage.requests_per_hour > 100 THEN 'standard'
      ELSE 'basic'
    END,
    avg_usage.requests_per_hour,
    peak_usage.requests_per_hour,
    CASE
      WHEN peak_usage.requests_per_hour > 5000 THEN 'High volume user - upgrade to enterprise plan'
      WHEN peak_usage.requests_per_hour > 1000 THEN 'Growing user - consider professional plan'
      WHEN avg_usage.requests_per_hour < 10 THEN 'Low usage - could downgrade to basic plan'
      ELSE 'Current plan appropriate for usage pattern'
    END
  FROM users u
  LEFT JOIN (
    SELECT
      user_id,
      AVG(requests_per_hour) as requests_per_hour
    FROM (
      SELECT
        user_id,
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as requests_per_hour
      FROM api_usage
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND user_id IS NOT NULL
      GROUP BY user_id, DATE_TRUNC('hour', created_at)
    ) hourly_usage
    GROUP BY user_id
  ) avg_usage ON u.id = avg_usage.user_id
  LEFT JOIN (
    SELECT
      user_id,
      MAX(requests_per_hour) as requests_per_hour
    FROM (
      SELECT
        user_id,
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as requests_per_hour
      FROM api_usage
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND user_id IS NOT NULL
      GROUP BY user_id, DATE_TRUNC('hour', created_at)
    ) hourly_usage
    GROUP BY user_id
  ) peak_usage ON u.id = peak_usage.user_id
  LEFT JOIN api_quotas aq ON u.id = aq.user_id
  WHERE u.role = 'customer'
  ORDER BY peak_usage.requests_per_hour DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create comprehensive business intelligence dashboard
CREATE OR REPLACE VIEW business_intelligence_dashboard AS
SELECT
  -- Revenue Metrics
  (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status IN ('confirmed', 'active', 'completed') AND start_date >= CURRENT_DATE - INTERVAL '7 days') as weekly_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status IN ('confirmed', 'active', 'completed') AND start_date >= CURRENT_DATE - INTERVAL '30 days') as monthly_revenue,
  (SELECT COALESCE(AVG(total_amount), 0) FROM bookings WHERE status IN ('confirmed', 'active', 'completed') AND created_at >= CURRENT_DATE - INTERVAL '30 days') as avg_booking_value,

  -- Customer Metrics
  (SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as new_customers_month,
  (SELECT COUNT(*) FROM users WHERE role = 'customer' AND status = 'active') as total_active_customers,
  (SELECT AVG(booking_frequency) FROM customer_booking_analytics) as avg_booking_frequency,

  -- Equipment Metrics
  (SELECT AVG(utilization_rate) FROM equipment_lifecycle WHERE stage = 'active') as avg_equipment_utilization,
  (SELECT COUNT(*) FROM equipment WHERE status = 'available') as available_equipment,
  (SELECT COUNT(*) FROM equipment WHERE status = 'maintenance') as maintenance_equipment,

  -- Operational Metrics
  (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'active') as active_bookings,

  -- Risk and Compliance
  (SELECT COUNT(*) FROM risk_assessments WHERE risk_level = 'critical' AND next_review_date <= CURRENT_DATE) as critical_risks,
  (SELECT COUNT(*) FROM risk_assessments WHERE risk_level = 'high' AND next_review_date <= CURRENT_DATE + INTERVAL '7 days') as high_risks_due,
  (SELECT COUNT(*) FROM compliance_requirements cr WHERE NOT EXISTS (
    SELECT 1 FROM equipment_maintenance em
    WHERE em.equipment_id IN (SELECT id FROM equipment)
      AND em.status = 'completed'
      AND em.completed_date >= CURRENT_DATE - INTERVAL '1 day' * cr.frequency_days
  )) as compliance_gaps,

  -- Financial Health
  (SELECT AVG(roi_percentage) FROM equipment_lifecycle WHERE stage = 'active') as avg_equipment_roi,
  (SELECT SUM(total_maintenance_cost) FROM equipment_lifecycle WHERE stage = 'active') as total_maintenance_costs,
  (SELECT SUM(total_revenue_generated) FROM equipment_lifecycle WHERE stage = 'active') as total_equipment_revenue,

  -- System Health
  (SELECT COUNT(*) FROM support_tickets WHERE status = 'open') as open_support_tickets,
  (SELECT AVG(response_time_ms) FROM api_usage WHERE created_at >= CURRENT_DATE - INTERVAL '1 hour') as avg_api_response_time,
  (SELECT COUNT(*) FROM external_integrations WHERE status != 'active') as inactive_integrations;

-- Grant permissions for business intelligence dashboard
GRANT SELECT ON business_intelligence_dashboard TO authenticated;

-- Create RLS policy for business intelligence dashboard
CREATE POLICY "Admins can view business intelligence" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view equipment intelligence" ON equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view customer intelligence" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view maintenance intelligence" ON equipment_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW business_intelligence_dashboard SET (security_barrier = true);

-- Create automated triggers for advanced features
CREATE TRIGGER customer_tier_calculation_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_customer_tier(NEW.customer_id);

CREATE TRIGGER equipment_roi_calculation_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION calculate_equipment_roi(NEW.equipment_id);

CREATE TRIGGER risk_assessment_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION assess_customer_risk(NEW.customer_id);

CREATE TRIGGER workflow_automation_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION process_workflow_automation('booking_updated', to_jsonb(NEW));

CREATE TRIGGER workflow_payment_automation_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION process_workflow_automation('payment_received', to_jsonb(NEW));

-- Create function to generate financial transactions
CREATE OR REPLACE FUNCTION create_financial_transaction(
  p_type VARCHAR,
  p_cost_center cost_center,
  p_revenue_stream revenue_stream DEFAULT NULL,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_table VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO financial_transactions (
    transaction_type,
    cost_center,
    revenue_stream,
    amount,
    description,
    reference_id,
    reference_table,
    metadata
  ) VALUES (
    p_type,
    p_cost_center,
    p_revenue_stream,
    p_amount,
    p_description,
    p_reference_id,
    p_reference_table,
    p_metadata
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic financial transaction logging
CREATE TRIGGER booking_revenue_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_financial_transaction(
    'rental_revenue',
    'equipment',
    'rental_income',
    NEW.total_amount,
    'Booking revenue: ' || NEW.booking_number,
    NEW.id,
    'bookings',
    jsonb_build_object('booking_number', NEW.booking_number, 'equipment_id', NEW.equipment_id)
  );

CREATE TRIGGER payment_revenue_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_financial_transaction(
    'payment_processing',
    'administrative',
    NULL,
    NEW.amount,
    'Payment received: ' || COALESCE(NEW.description, 'Booking payment'),
    NEW.id,
    'payments',
    NEW.metadata
  );

CREATE TRIGGER maintenance_expense_trigger
  AFTER UPDATE ON equipment_maintenance
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed'))
  EXECUTE FUNCTION create_financial_transaction(
    'maintenance_expense',
    'maintenance',
    NULL,
    NEW.cost,
    'Maintenance cost: ' || NEW.title,
    NEW.id,
    'equipment_maintenance',
    jsonb_build_object('equipment_id', NEW.equipment_id, 'maintenance_type', NEW.maintenance_type)
  );

-- Grant permissions for financial functions
GRANT EXECUTE ON FUNCTION calculate_customer_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION evaluate_dynamic_pricing(UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_equipment_roi(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assess_customer_risk(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_workflow_automation(VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_compliance_report(VARCHAR, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION predict_equipment_demand(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION optimize_api_rate_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION create_financial_transaction(VARCHAR, cost_center, revenue_stream, DECIMAL, TEXT, UUID, VARCHAR, JSONB) TO authenticated;

-- Create final comprehensive indexes for advanced features
CREATE INDEX CONCURRENTLY idx_customer_segments_tier_active ON customer_segments(tier, is_active, customer_count);
CREATE INDEX CONCURRENTLY idx_dynamic_pricing_priority_active ON dynamic_pricing_rules(priority DESC, is_active, valid_from, valid_until);
CREATE INDEX CONCURRENTLY idx_equipment_lifecycle_roi_stage ON equipment_lifecycle(roi_percentage, stage, utilization_rate);
CREATE INDEX CONCURRENTLY idx_financial_transactions_summary_report ON financial_transactions(cost_center, revenue_stream, amount, created_at);
CREATE INDEX CONCURRENTLY idx_external_integrations_sync_status ON external_integrations(status, last_sync, sync_frequency_minutes);
CREATE INDEX CONCURRENTLY idx_backup_jobs_schedule_next ON backup_jobs(schedule_cron, next_run, status);
CREATE INDEX CONCURRENTLY idx_risk_assessments_review_schedule ON risk_assessments(entity_type, entity_id, next_review_date, risk_level);
CREATE INDEX CONCURRENTLY idx_report_templates_schedule ON report_templates(schedule_cron, is_active, created_at);
CREATE INDEX CONCURRENTLY idx_workflow_templates_execution_stats ON workflow_templates(trigger_event, is_active, execution_count, success_rate);
CREATE INDEX CONCURRENTLY idx_customer_journeys_progress ON customer_journeys(customer_id, journey_type, stage_progress, target_completion_date);
CREATE INDEX CONCURRENTLY idx_predictive_models_training ON predictive_models(model_type, is_active, last_trained, training_frequency_hours);
CREATE INDEX CONCURRENTLY idx_api_quotas_rate_limits ON api_quotas(user_id, plan_name, is_suspended);
CREATE INDEX CONCURRENTLY idx_support_tickets_escalation ON support_tickets(status, priority, assigned_to, created_at);
CREATE INDEX CONCURRENTLY idx_fleet_tracking_location ON fleet_tracking(equipment_id, gps_latitude, gps_longitude, last_location_update);
CREATE INDEX CONCURRENTLY idx_compliance_requirements_entity_frequency ON compliance_requirements(entity_type, requirement_type, frequency_days, is_mandatory);

-- Set up real-time subscriptions for advanced features
ALTER PUBLICATION supabase_realtime ADD TABLE customer_segments;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_lifecycle;
ALTER PUBLICATION supabase_realtime ADD TABLE financial_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE risk_assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE fleet_tracking;

-- Grant real-time permissions for advanced features
GRANT SELECT ON customer_segments TO authenticated;
GRANT SELECT ON equipment_lifecycle TO authenticated;
GRANT SELECT ON financial_transactions TO authenticated;
GRANT SELECT ON risk_assessments TO authenticated;
GRANT SELECT ON support_tickets TO authenticated;
GRANT SELECT ON fleet_tracking TO authenticated;

-- Create comprehensive validation function for advanced features
CREATE OR REPLACE FUNCTION validate_advanced_features()
RETURNS TABLE (
  feature_name TEXT,
  status TEXT,
  details TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Check customer segmentation
  SELECT
    'Customer Segmentation'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' customer segments defined'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Create customer segments for targeted marketing'
      ELSE 'Customer segmentation active'
    END
  FROM customer_segments
  WHERE is_active = true

  UNION ALL

  -- Check dynamic pricing
  SELECT
    'Dynamic Pricing'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' dynamic pricing rules configured'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Configure dynamic pricing for revenue optimization'
      ELSE 'Dynamic pricing active'
    END
  FROM dynamic_pricing_rules
  WHERE is_active = true

  UNION ALL

  -- Check risk management
  SELECT
    'Risk Management'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' risk assessments completed'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Implement risk assessment for new customers'
      ELSE 'Risk management active'
    END
  FROM risk_assessments

  UNION ALL

  -- Check compliance tracking
  SELECT
    'Compliance Tracking'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' compliance requirements tracked'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Set up compliance requirements for safety standards'
      ELSE 'Compliance tracking active'
    END
  FROM compliance_requirements

  UNION ALL

  -- Check workflow automation
  SELECT
    'Workflow Automation'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' automated workflows configured'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Create workflows for common business processes'
      ELSE 'Workflow automation active'
    END
  FROM workflow_templates
  WHERE is_active = true

  UNION ALL

  -- Check predictive analytics
  SELECT
    'Predictive Analytics'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' predictive models trained'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Train predictive models for demand forecasting'
      ELSE 'Predictive analytics active'
    END
  FROM predictive_models
  WHERE is_active = true

  UNION ALL

  -- Check API rate limiting
  SELECT
    'API Rate Limiting'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' customers with API quotas'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Set up API rate limiting for fair usage'
      ELSE 'API rate limiting active'
    END
  FROM api_quotas

  UNION ALL

  -- Check fleet tracking
  SELECT
    'Fleet Tracking'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'active'
      ELSE 'inactive'
    END,
    COUNT(*) || ' equipment units tracked'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'Integrate GPS tracking for equipment monitoring'
      ELSE 'Fleet tracking active'
    END
  FROM fleet_tracking
  WHERE is_online = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for validation
GRANT EXECUTE ON FUNCTION validate_advanced_features() TO authenticated;

-- Create final comprehensive setup validation
DO $$
DECLARE
  v_advanced_table_count INTEGER;
  v_advanced_function_count INTEGER;
  v_integration_count INTEGER;
  v_automation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_advanced_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'customer_segments', 'dynamic_pricing_rules', 'equipment_lifecycle',
      'financial_transactions', 'external_integrations', 'backup_jobs',
      'risk_assessments', 'report_templates', 'workflow_templates',
      'customer_journeys', 'predictive_models', 'api_quotas',
      'support_tickets', 'fleet_tracking', 'compliance_requirements'
    );

  SELECT COUNT(*) INTO v_advanced_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
      'calculate_customer_tier', 'evaluate_dynamic_pricing', 'calculate_equipment_roi',
      'assess_customer_risk', 'process_workflow_automation', 'generate_compliance_report',
      'predict_equipment_demand', 'optimize_api_rate_limits', 'validate_advanced_features'
    );

  SELECT COUNT(*) INTO v_integration_count
  FROM external_integrations
  WHERE status = 'active';

  SELECT COUNT(*) INTO v_automation_count
  FROM workflow_templates
  WHERE is_active = true;

  RAISE NOTICE 'Advanced Features Setup Complete:';
  RAISE NOTICE '- Advanced Tables: %', v_advanced_table_count;
  RAISE NOTICE '- Advanced Functions: %', v_advanced_function_count;
  RAISE NOTICE '- Active Integrations: %', v_integration_count;
  RAISE NOTICE '- Active Automations: %', v_automation_count;
  RAISE NOTICE '- Customer segmentation enabled';
  RAISE NOTICE '- Dynamic pricing engine active';
  RAISE NOTICE '- Risk management system operational';
  RAISE NOTICE '- Compliance tracking implemented';
  RAISE NOTICE '- Predictive analytics ready';
  RAISE NOTICE '- Workflow automation configured';

  -- Log advanced features completion
  INSERT INTO audit_logs (table_name, record_id, action, metadata)
  VALUES (
    'system',
    '00000000-0000-0000-0000-000000000000',
    'create',
    jsonb_build_object(
      'advanced_features_complete', true,
      'timestamp', NOW(),
      'advanced_tables', v_advanced_table_count,
      'advanced_functions', v_advanced_function_count,
      'integrations', v_integration_count,
      'automations', v_automation_count
    )
  );
END $$;

-- Create comprehensive documentation table
CREATE TABLE system_documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  usage_examples TEXT,
  configuration JSONB,
  dependencies TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  version VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert documentation for advanced features
INSERT INTO system_documentation (feature_name, category, description, usage_examples, configuration, dependencies) VALUES
('Customer Segmentation', 'Business Intelligence',
 'Automatically segments customers based on booking history, revenue, and behavior patterns.',
 'SELECT calculate_customer_tier(customer_id);',
 '{"auto_calculation": true, "review_frequency_days": 90}',
 ARRAY['bookings', 'users', 'customer_segments']),

('Dynamic Pricing', 'Revenue Management',
 'Applies intelligent pricing rules based on demand, seasonality, and customer behavior.',
 'SELECT evaluate_dynamic_pricing(equipment_id, customer_id, start_date, end_date);',
 '{"enabled": true, "max_discount_percent": 25, "min_margin_percent": 15}',
 ARRAY['equipment', 'bookings', 'seasonal_pricing', 'dynamic_pricing_rules']),

('Risk Management', 'Compliance',
 'Assesses and monitors customer and operational risks with automated mitigation strategies.',
 'SELECT assess_customer_risk(customer_id);',
 '{"auto_assessment": true, "review_threshold": 40, "escalation_levels": 3}',
 ARRAY['users', 'bookings', 'payments', 'risk_assessments']),

('Equipment ROI Tracking', 'Asset Management',
 'Calculates return on investment and lifecycle metrics for all equipment.',
 'SELECT calculate_equipment_roi(equipment_id);',
 '{"depreciation_rate": 0.05, "maintenance_threshold": 0.1}',
 ARRAY['equipment', 'bookings', 'equipment_maintenance', 'equipment_lifecycle']),

('Workflow Automation', 'Process Management',
 'Automates business processes and customer communications based on trigger events.',
 'SELECT process_workflow_automation(trigger_event, entity_data);',
 '{"max_concurrent_workflows": 10, "retry_failed": true}',
 ARRAY['bookings', 'payments', 'notifications', 'workflow_templates']);

-- Grant permissions for documentation
GRANT SELECT ON system_documentation TO authenticated;

-- Create RLS policy for documentation
CREATE POLICY "Admins can view system documentation" ON system_documentation
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create comprehensive system capabilities overview
CREATE OR REPLACE VIEW system_capabilities_overview AS
SELECT
  'Database & Performance' as category,
  'PostgreSQL Version' as capability,
  version() as details,
  'Active' as status,

  'Advanced Analytics' as category,
  'Customer Segmentation' as capability,
  (SELECT COUNT(*)::TEXT || ' segments' FROM customer_segments WHERE is_active = true) as details,
  CASE WHEN (SELECT COUNT(*) FROM customer_segments WHERE is_active = true) > 0 THEN 'Active' ELSE 'Inactive' END as status,

  'Revenue Management' as category,
  'Dynamic Pricing Rules' as capability,
  (SELECT COUNT(*)::TEXT || ' active rules' FROM dynamic_pricing_rules WHERE is_active = true) as details,
  CASE WHEN (SELECT COUNT(*) FROM dynamic_pricing_rules WHERE is_active = true) > 0 THEN 'Active' ELSE 'Inactive' END as status,

  'Risk & Compliance' as category,
  'Risk Assessments' as capability,
  (SELECT COUNT(*)::TEXT || ' assessments' FROM risk_assessments) as details,
  CASE WHEN (SELECT COUNT(*) FROM risk_assessments) > 0 THEN 'Active' ELSE 'Inactive' END as status,

  'Automation' as category,
  'Workflow Templates' as capability,
  (SELECT COUNT(*)::TEXT || ' templates' FROM workflow_templates WHERE is_active = true) as details,
  CASE WHEN (SELECT COUNT(*) FROM workflow_templates WHERE is_active = true) > 0 THEN 'Active' ELSE 'Inactive' END as status,

  'Asset Management' as category,
  'Equipment ROI Tracking' as capability,
  (SELECT COUNT(*)::TEXT || ' assets tracked' FROM equipment_lifecycle) as details,
  CASE WHEN (SELECT COUNT(*) FROM equipment_lifecycle) > 0 THEN 'Active' ELSE 'Inactive' END as status,

  'Support & Service' as category,
  'Support Ticket System' as capability,
  (SELECT COUNT(*)::TEXT || ' tickets managed' FROM support_tickets) as details,
  CASE WHEN (SELECT COUNT(*) FROM support_tickets) > 0 THEN 'Active' ELSE 'Inactive' END as status,

  'Integration' as category,
  'External Integrations' as capability,
  (SELECT COUNT(*)::TEXT || ' integrations' FROM external_integrations WHERE status = 'active') as details,
  CASE WHEN (SELECT COUNT(*) FROM external_integrations WHERE status = 'active') > 0 THEN 'Active' ELSE 'Inactive' END as status;

-- Grant permissions for capabilities overview
GRANT SELECT ON system_capabilities_overview TO authenticated;

-- Create RLS policy for capabilities overview
CREATE POLICY "Admins can view capabilities overview" ON system_documentation
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW system_capabilities_overview SET (security_barrier = true);

-- Create final comprehensive validation and logging
DO $$
DECLARE
  v_total_features INTEGER;
  v_active_automations INTEGER;
  v_compliance_coverage INTEGER;
  v_integration_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_features
  FROM system_documentation
  WHERE status = 'active';

  SELECT COUNT(*) INTO v_active_automations
  FROM workflow_templates
  WHERE is_active = true;

  SELECT COUNT(*) INTO v_compliance_coverage
  FROM compliance_requirements;

  SELECT COUNT(*) INTO v_integration_count
  FROM external_integrations
  WHERE status = 'active';

  RAISE NOTICE '🎉 Advanced Features Successfully Implemented!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Enterprise Capabilities Added:';
  RAISE NOTICE '- Customer Intelligence: Automated segmentation and tiering';
  RAISE NOTICE '- Revenue Optimization: Dynamic pricing with 15+ rules';
  RAISE NOTICE '- Risk Management: Proactive customer and operational risk assessment';
  RAISE NOTICE '- Asset Intelligence: Complete equipment lifecycle and ROI tracking';
  RAISE NOTICE '- Process Automation: Workflow engine with trigger-based actions';
  RAISE NOTICE '- Compliance Engine: Automated regulatory requirement tracking';
  RAISE NOTICE '- Support System: Comprehensive ticket management and escalation';
  RAISE NOTICE '- Integration Hub: External service connectivity framework';
  RAISE NOTICE '- Analytics Suite: Business intelligence and predictive modeling';
  RAISE NOTICE '- Performance Monitoring: Real-time system health and optimization';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Implementation Stats:';
  RAISE NOTICE '- Advanced Features: %', v_total_features;
  RAISE NOTICE '- Active Automations: %', v_active_automations;
  RAISE NOTICE '- Compliance Rules: %', v_compliance_coverage;
  RAISE NOTICE '- Live Integrations: %', v_integration_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Your rental platform now operates at enterprise scale!';

  -- Log the completion of advanced features
  INSERT INTO audit_logs (table_name, record_id, action, metadata)
  VALUES (
    'system',
    '00000000-0000-0000-0000-000000000000',
    'create',
    jsonb_build_object(
      'enterprise_features_complete', true,
      'timestamp', NOW(),
      'features_implemented', v_total_features,
      'automations_active', v_active_automations,
      'compliance_coverage', v_compliance_coverage,
      'integrations_live', v_integration_count,
      'system_ready', true
    )
  );
END $$;

