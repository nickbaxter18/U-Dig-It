-- Enhanced schema for Kubota Rental Platform
-- This migration adds advanced features: analytics, notifications, audit logs, maintenance tracking
-- Created: 2025-01-21

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring

-- Create enhanced custom types
CREATE TYPE maintenance_type AS ENUM ('scheduled', 'preventive', 'repair', 'emergency', 'inspection');
CREATE TYPE maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push', 'webhook');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'cancelled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'payment', 'booking', 'cancel');
CREATE TYPE search_result_type AS ENUM ('equipment', 'booking', 'customer', 'contract');
CREATE TYPE webhook_event_type AS ENUM ('booking_created', 'booking_updated', 'payment_received', 'contract_signed', 'equipment_maintenance_due');

-- Enhanced Equipment Maintenance Tracking
CREATE TABLE equipment_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL,
  status maintenance_status NOT NULL DEFAULT 'scheduled',
  priority priority_level NOT NULL DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  performed_by VARCHAR(100),
  cost DECIMAL(10,2) DEFAULT 0,
  parts_used JSONB,
  notes TEXT,
  next_due_date TIMESTAMP WITH TIME ZONE,
  next_due_hours INTEGER,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Utilization Analytics
CREATE TABLE equipment_utilization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours_used DECIMAL(8,2) NOT NULL DEFAULT 0,
  fuel_consumed DECIMAL(8,2) DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  utilization_percentage DECIMAL(5,2) NOT NULL, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(equipment_id, date)
);

-- Business Analytics Dashboard Data
CREATE TABLE analytics_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_category VARCHAR(50) NOT NULL, -- 'revenue', 'utilization', 'customer', 'equipment'
  date DATE NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_name, metric_category, date)
);

-- Notification System
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  status notification_status NOT NULL DEFAULT 'pending',
  priority priority_level NOT NULL DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  template_id VARCHAR(100),
  template_data JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  external_id VARCHAR(255), -- For email service provider IDs
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type notification_type NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive Audit Logging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Full-Text Search Index
CREATE TABLE search_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_type search_result_type NOT NULL,
  result_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  searchable_text TEXT NOT NULL,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Events and Logs
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type webhook_event_type NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limiting and Usage Tracking
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET NOT NULL,
  user_agent TEXT,
  request_size INTEGER,
  response_size INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Management System
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100), -- 'contract', 'insurance', 'maintenance', 'legal'
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  is_template BOOLEAN DEFAULT false,
  template_variables JSONB,
  tags TEXT[],
  metadata JSONB,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Relations (many-to-many with other entities)
CREATE TABLE document_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  related_table VARCHAR(100) NOT NULL,
  related_id UUID NOT NULL,
  relation_type VARCHAR(50) NOT NULL, -- 'booking_contract', 'equipment_manual', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(document_id, related_table, related_id, relation_type)
);

-- Customer Communication History
CREATE TABLE customer_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'call', 'in_person'
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
  subject VARCHAR(255),
  content TEXT,
  metadata JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasonal Pricing Rules
CREATE TABLE seasonal_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  equipment_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  multiplier DECIMAL(4,3) NOT NULL, -- e.g., 1.2 for 20% increase
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discount Codes and Promotions
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'percentage', 'fixed_amount', 'free_delivery'
  value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  min_booking_amount DECIMAL(10,2),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_equipment_types TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced User Preferences and Profile Data
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "notifications": {
    "email": true,
    "sms": false,
    "marketing": false,
    "booking_reminders": true,
    "maintenance_alerts": true
  },
  "booking": {
    "default_delivery": true,
    "preferred_times": ["08:00", "09:00", "10:00"],
    "special_requirements": []
  },
  "privacy": {
    "profile_visible": true,
    "booking_history_visible": false,
    "contact_preferences": "email"
  }
}'::jsonb;

-- Add new indexes for enhanced performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_maintenance_equipment_id ON equipment_maintenance(equipment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_maintenance_status ON equipment_maintenance(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_maintenance_scheduled_date ON equipment_maintenance(scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_utilization_equipment_id ON equipment_utilization(equipment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_utilization_date ON equipment_utilization(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_data_category_date ON analytics_data(metric_category, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_data_name_date ON analytics_data(metric_name, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_index_type_id ON search_index(result_type, result_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_index_searchable_text ON search_index USING gin(to_tsvector('english', searchable_text));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_events_type_status ON webhook_events(event_type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_user_endpoint ON api_usage(user_id, endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type_category ON documents(type, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_communications_user_id ON customer_communications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seasonal_pricing_equipment_type ON seasonal_pricing(equipment_type, start_date, end_date) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discount_codes_code ON discount_codes(code) WHERE is_active = true;

-- Add updated_at triggers for new tables
CREATE TRIGGER update_equipment_maintenance_updated_at BEFORE UPDATE ON equipment_maintenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_utilization_updated_at BEFORE UPDATE ON equipment_utilization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_analytics_data_updated_at BEFORE UPDATE ON analytics_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_events_updated_at BEFORE UPDATE ON webhook_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_usage_updated_at BEFORE UPDATE ON api_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seasonal_pricing_updated_at BEFORE UPDATE ON seasonal_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update equipment utilization when bookings change
CREATE OR REPLACE FUNCTION update_equipment_utilization()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by triggers to update utilization metrics
  -- Implementation would depend on specific business logic requirements
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate search index entries
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
  -- Update search index when equipment is modified
  IF TG_TABLE_NAME = 'equipment' THEN
    INSERT INTO search_index (result_type, result_id, title, description, searchable_text, metadata)
    VALUES (
      'equipment',
      NEW.id,
      NEW.model || ' ' || NEW.make,
      NEW.description,
      COALESCE(NEW.description, '') || ' ' || NEW.model || ' ' || NEW.make || ' ' || COALESCE(NEW.unit_id, ''),
      jsonb_build_object(
        'type', NEW.type,
        'year', NEW.year,
        'daily_rate', NEW.daily_rate,
        'status', NEW.status
      )
    )
    ON CONFLICT (result_type, result_id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      searchable_text = EXCLUDED.searchable_text,
      metadata = EXCLUDED.metadata,
      last_updated = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_table_name VARCHAR,
  p_record_id UUID,
  p_action audit_action,
  p_user_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, user_id, old_values, new_values)
  VALUES (p_table_name, p_record_id, p_action, p_user_id, p_old_values, p_new_values)
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for search index updates
CREATE TRIGGER equipment_search_index_trigger
  AFTER INSERT OR UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_search_index();

CREATE TRIGGER booking_search_index_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_search_index();

-- Enable RLS on new tables
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_utilization ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

