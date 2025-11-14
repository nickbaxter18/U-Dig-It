-- Enhanced RLS Policies for Kubota Rental Platform
-- This migration adds comprehensive security policies for all new tables
-- Created: 2025-01-21

-- Equipment Maintenance Policies
-- Users can view maintenance for their own bookings' equipment
CREATE POLICY "Users can view maintenance for own bookings" ON equipment_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN equipment e ON e.id = equipment_maintenance.equipmentId
      WHERE b.equipmentId = e.id
      AND b.customerId = auth.uid()
      AND b.status NOT IN ('cancelled', 'rejected')
    )
  );

-- Admins can manage all maintenance records
CREATE POLICY "Admins can manage maintenance" ON equipment_maintenance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Equipment Utilization Policies
-- Users can view utilization for their own bookings' equipment
CREATE POLICY "Users can view utilization for own bookings" ON equipment_utilization
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN equipment e ON e.id = equipment_utilization.equipmentId
      WHERE b.equipmentId = e.id
      AND b.customerId = auth.uid()
      AND b.status NOT IN ('cancelled', 'rejected')
    )
  );

-- Admins can view all utilization data
CREATE POLICY "Admins can view all utilization" ON equipment_utilization
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage utilization data
CREATE POLICY "Admins can manage utilization" ON equipment_utilization
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Analytics Data Policies
-- Only admins can view analytics data (sensitive business metrics)
CREATE POLICY "Only admins can view analytics" ON analytics_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Only admins can manage analytics data
CREATE POLICY "Only admins can manage analytics" ON analytics_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Notification System Policies
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can create notifications for users (via service role)
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- System can update notification status (via service role)
CREATE POLICY "System can update notifications" ON notifications
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Notification Templates Policies
-- Only admins can manage notification templates
CREATE POLICY "Admins can manage notification templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Audit Logs Policies
-- Users can view audit logs for their own actions
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- System can create audit logs (via service role)
CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Search Index Policies
-- Everyone can search (public read access)
CREATE POLICY "Everyone can search" ON search_index
  FOR SELECT USING (is_active = true);

-- Only admins can manage search index
CREATE POLICY "Admins can manage search index" ON search_index
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Webhook Events Policies
-- Only admins can view webhook events (system integration logs)
CREATE POLICY "Admins can view webhook events" ON webhook_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- System can manage webhook events (via service role)
CREATE POLICY "System can manage webhook events" ON webhook_events
  FOR ALL USING (true)
  WITH CHECK (true);

-- API Usage Policies
-- Users can view their own API usage
CREATE POLICY "Users can view own API usage" ON api_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all API usage
CREATE POLICY "Admins can view all API usage" ON api_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- System can create API usage logs (via service role)
CREATE POLICY "System can create API usage logs" ON api_usage
  FOR INSERT WITH CHECK (true);

-- Document Management Policies
-- Users can view documents related to their bookings
CREATE POLICY "Users can view booking documents" ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_relations dr
      JOIN bookings b ON dr.related_table = 'bookings' AND dr.related_id = b.id
      WHERE dr.document_id = documents.id
      AND b.customerId = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM document_relations dr
      WHERE dr.related_table = 'users' AND dr.related_id = auth.uid()
      AND dr.document_id = documents.id
    )
  );

-- Users can upload documents for their bookings
CREATE POLICY "Users can upload booking documents" ON documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.customerId = auth.uid()
      AND (
        -- Allow document upload if user has an active booking
        b.status NOT IN ('cancelled', 'rejected', 'completed')
      )
    )
  );

-- Users can update their own uploaded documents
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Admins can manage all documents
CREATE POLICY "Admins can manage all documents" ON documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Document Relations Policies
-- Users can view relations for their own documents
CREATE POLICY "Users can view own document relations" ON document_relations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_relations.document_id
      AND d.uploaded_by = auth.uid()
    )
  );

-- System can manage document relations (via service role)
CREATE POLICY "System can manage document relations" ON document_relations
  FOR ALL USING (true)
  WITH CHECK (true);

-- Customer Communications Policies
-- Users can view their own communication history
CREATE POLICY "Users can view own communications" ON customer_communications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create communication records for themselves
CREATE POLICY "Users can create own communications" ON customer_communications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all communications
CREATE POLICY "Admins can view all communications" ON customer_communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage all communications
CREATE POLICY "Admins can manage all communications" ON customer_communications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Seasonal Pricing Policies
-- Everyone can view active seasonal pricing (needed for booking calculations)
CREATE POLICY "Everyone can view active seasonal pricing" ON seasonal_pricing
  FOR SELECT USING (is_active = true);

-- Only admins can manage seasonal pricing
CREATE POLICY "Admins can manage seasonal pricing" ON seasonal_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Discount Codes Policies
-- Everyone can view active discount codes (needed for booking calculations)
CREATE POLICY "Everyone can view active discount codes" ON discount_codes
  FOR SELECT USING (is_active = true);

-- Only admins can manage discount codes
CREATE POLICY "Admins can manage discount codes" ON discount_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Enhanced Users Table Policies
-- Update existing users policies to include new fields
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON users;

-- Users can view their own profile (including new preferences)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (including preferences)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all user profiles (including preferences for support)
CREATE POLICY "Admins can view all profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage all user profiles
CREATE POLICY "Admins can manage all profiles" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Enable RLS on all new tables (if not already enabled)
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

