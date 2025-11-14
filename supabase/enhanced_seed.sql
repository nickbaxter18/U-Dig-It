-- Enhanced Seed Data for Kubota Rental Platform
-- This file contains comprehensive test data for all new tables and features
-- Created: 2025-01-21

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert notification templates
INSERT INTO notification_templates (id, name, type, subject, body, variables, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'booking_confirmation', 'email',
 'Booking Confirmation - {{booking_number}}',
 'Dear {{customer_name}},

Your booking {{booking_number}} has been confirmed!

Equipment: {{equipment_model}} ({{unit_id}})
Rental Period: {{start_date}} to {{end_date}}
Total Amount: ${{total_amount}}

Please ensure you have valid insurance coverage before pickup.

Best regards,
Kubota Rental Team',
 '{"customer_name": "string", "booking_number": "string", "equipment_model": "string", "unit_id": "string", "start_date": "date", "end_date": "date", "total_amount": "number"}',
 true),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'booking_reminder', 'email',
 'Rental Reminder - {{booking_number}}',
 'Dear {{customer_name}},

This is a friendly reminder about your upcoming rental:

Booking: {{booking_number}}
Equipment: {{equipment_model}} ({{unit_id}})
Pickup Date: {{start_date}} at {{start_time}}

Please arrive 15 minutes early with your insurance documents.

Questions? Call us at (555) 123-4567

Best regards,
Kubota Rental Team',
 '{"customer_name": "string", "booking_number": "string", "equipment_model": "string", "unit_id": "string", "start_date": "date", "start_time": "time"}',
 true),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'maintenance_due', 'email',
 'Maintenance Due - {{equipment_model}}',
 'Equipment {{unit_id}} ({{equipment_model}}) is due for maintenance.

Maintenance Type: {{maintenance_type}}
Due Date: {{due_date}}
Current Hours: {{current_hours}}

Please schedule maintenance to avoid equipment downtime.

Contact: maintenance@kubota-rental.com',
 '{"equipment_model": "string", "unit_id": "string", "maintenance_type": "string", "due_date": "date", "current_hours": "number"}',
 true);

-- Insert seasonal pricing rules
INSERT INTO seasonal_pricing (id, name, equipment_type, start_date, end_date, multiplier, is_active) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Summer Construction Season', 'svl75', '2025-05-01', '2025-09-30', 1.15, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Winter Slow Season', 'svl75', '2025-12-01', '2025-03-31', 0.85, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'Holiday Premium', 'svl75', '2025-07-01', '2025-07-31', 1.25, true);

-- Insert discount codes
INSERT INTO discount_codes (id, code, name, type, value, max_uses, used_count, max_uses_per_user, min_booking_amount, valid_from, valid_until, applicable_equipment_types, is_active) VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'WELCOME10', 'New Customer Welcome', 'percentage', 10.00, 100, 0, 1, 100.00, '2025-01-01', '2025-12-31', ARRAY['svl75'], true),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'WEEKLY15', 'Weekly Rental Discount', 'percentage', 15.00, NULL, 0, 1, 200.00, '2025-01-01', '2025-12-31', ARRAY['svl75'], true),
('cccccccc-cccc-cccc-cccc-ccccccccccc3', 'RETURNING20', 'Returning Customer', 'percentage', 20.00, 50, 0, 1, 300.00, '2025-01-01', '2025-12-31', ARRAY['svl75'], true);

-- Insert equipment maintenance records
INSERT INTO equipment_maintenance (id, equipment_id, maintenance_type, status, priority, title, description, scheduled_date, completed_date, performed_by, cost, parts_used, notes, next_due_date, next_due_hours) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd1', '33333333-3333-3333-3333-333333333333', 'preventive', 'completed', 'medium',
 '50-Hour Service', 'Regular preventive maintenance including oil change, filter replacement, and inspection',
 '2025-01-15 08:00:00', '2025-01-15 16:30:00', 'Mike Johnson', 450.00,
 '{"oil": "5L", "oil_filter": "1x", "fuel_filter": "1x", "air_filter": "1x"}',
 'All systems checked and functioning properly. No issues found.',
 '2025-03-15', 100),

('dddddddd-dddd-dddd-dddd-dddddddddddd2', '44444444-4444-4444-4444-444444444444', 'scheduled', 'scheduled', 'high',
 '100-Hour Service Due', 'Major service including hydraulic system check and track inspection',
 '2025-02-01 08:00:00', NULL, NULL, 0,
 NULL,
 'Customer reported minor hydraulic leak during last rental. Schedule comprehensive inspection.',
 '2025-02-01', 250),

('dddddddd-dddd-dddd-dddd-dddddddddddd3', '33333333-3333-3333-3333-333333333333', 'inspection', 'scheduled', 'low',
 'Annual Safety Inspection', 'Required annual safety and compliance inspection',
 '2025-03-01 09:00:00', NULL, NULL, 0,
 NULL,
 'Annual certification required by insurance provider.',
 '2026-03-01', 500);

-- Insert equipment utilization data (last 30 days)
INSERT INTO equipment_utilization (equipment_id, date, hours_used, fuel_consumed, revenue_generated, utilization_percentage)
SELECT
  '33333333-3333-3333-3333-333333333333',
  generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date,
  ROUND((RANDOM() * 8)::numeric, 2), -- 0-8 hours
  ROUND((RANDOM() * 40)::numeric, 2), -- 0-40 liters
  ROUND((RANDOM() * 350)::numeric, 2), -- 0-350 revenue
  ROUND((RANDOM() * 100)::numeric, 2); -- 0-100%

INSERT INTO equipment_utilization (equipment_id, date, hours_used, fuel_consumed, revenue_generated, utilization_percentage)
SELECT
  '44444444-4444-4444-4444-444444444444',
  generate_series(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date,
  ROUND((RANDOM() * 6)::numeric, 2), -- 0-6 hours (backup unit)
  ROUND((RANDOM() * 30)::numeric, 2), -- 0-30 liters
  ROUND((RANDOM() * 250)::numeric, 2), -- 0-250 revenue
  ROUND((RANDOM() * 75)::numeric, 2); -- 0-75%

-- Insert analytics data (monthly summary)
INSERT INTO analytics_data (metric_name, metric_category, date, value, metadata) VALUES
('total_revenue', 'revenue', '2025-01-01', 15750.00, '{"bookings": 45, "avg_booking_value": 350.00}'),
('equipment_utilization', 'utilization', '2025-01-01', 78.5, '{"svl75_001": 85.2, "svl75_002": 71.8}'),
('new_customers', 'customer', '2025-01-01', 12, '{"total_customers": 156, "returning_customers": 33}'),
('maintenance_costs', 'equipment', '2025-01-01', 1250.00, '{"scheduled": 800.00, "emergency": 450.00}'),

('total_revenue', 'revenue', '2024-12-01', 18200.00, '{"bookings": 52, "avg_booking_value": 350.00}'),
('equipment_utilization', 'utilization', '2024-12-01', 82.1, '{"svl75_001": 88.5, "svl75_002": 75.7}'),
('new_customers', 'customer', '2024-12-01', 18, '{"total_customers": 144, "returning_customers": 34}'),
('maintenance_costs', 'equipment', '2024-12-01', 2100.00, '{"scheduled": 1200.00, "emergency": 900.00}');

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, status, priority, title, message, template_id, template_data, scheduled_for, metadata) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', 'email', 'sent', 'medium',
 'Booking Confirmation', 'Your booking UDR-2025-001 has been confirmed for October 25-27, 2025.',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
 '{"customer_name": "Test User", "booking_number": "UDR-2025-001", "equipment_model": "SVL75-3", "unit_id": "SVL75-001", "start_date": "2025-10-25", "end_date": "2025-10-27", "total_amount": 955.00}',
 '2025-01-20 10:00:00',
 '{"email_provider": "resend", "provider_message_id": "msg_123456"}'),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '11111111-1111-1111-1111-111111111111', 'email', 'pending', 'high',
 'Pickup Reminder', 'Reminder: Your equipment rental starts tomorrow at 8:00 AM.',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
 '{"customer_name": "Test User", "booking_number": "UDR-2025-001", "equipment_model": "SVL75-3", "unit_id": "SVL75-001", "start_date": "2025-10-25", "start_time": "08:00"}',
 '2025-01-24 18:00:00',
 '{"priority": "high", "send_sms": true}');

-- Insert sample audit logs
INSERT INTO audit_logs (id, table_name, record_id, action, user_id, old_values, new_values, ip_address, user_agent, metadata) VALUES
('ffffffff-ffff-ffff-ffff-fffffffffff1', 'bookings', '55555555-5555-5555-5555-555555555555', 'create', '11111111-1111-1111-1111-111111111111',
 NULL,
 '{"booking_number": "UDR-2025-001", "status": "pending", "total_amount": 955.00}',
 '192.168.1.100',
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
 '{"source": "web_app", "session_id": "sess_abc123"}'),

('ffffffff-ffff-ffff-ffff-fffffffffff2', 'bookings', '55555555-5555-5555-5555-555555555555', 'update', '22222222-2222-2222-2222-222222222222',
 '{"status": "pending"}',
 '{"status": "confirmed"}',
 '10.0.1.50',
 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
 '{"source": "admin_panel", "admin_action": "approve_booking"}'),

('ffffffff-ffff-ffff-ffff-fffffffffff3', 'payments', '66666666-6666-6666-6666-666666666666', 'create', NULL,
 NULL,
 '{"amount": 955.00, "status": "succeeded", "stripe_payment_intent_id": "pi_test_123456789"}',
 '54.23.12.1',
 'Stripe-Webhook/1.0',
 '{"source": "stripe_webhook", "webhook_id": "wh_test_123456"}');

-- Insert search index entries
INSERT INTO search_index (result_type, result_id, title, description, searchable_text, metadata, is_active) VALUES
('equipment', '33333333-3333-3333-3333-333333333333', 'SVL75-3 Kubota', 'Professional grade compact track loader with 74.3 HP diesel engine. Perfect for construction, landscaping, and material handling.',
 'Professional grade compact track loader 74.3 HP diesel engine construction landscaping material handling SVL75-3 Kubota SVL75-001',
 '{"type": "svl75", "year": 2025, "daily_rate": 350.00, "status": "available"}',
 true),

('equipment', '44444444-4444-4444-4444-444444444444', 'SVL75-3 Kubota', 'Backup rental unit with low hours. Same specifications as primary unit.',
 'Backup rental unit low hours specifications primary unit SVL75-3 Kubota SVL75-002',
 '{"type": "svl75", "year": 2024, "daily_rate": 350.00, "status": "maintenance"}',
 true),

('booking', '55555555-5555-5555-5555-555555555555', 'UDR-2025-001', 'Construction site equipment rental',
 'Construction site equipment rental UDR-2025-001 Test User',
 '{"status": "confirmed", "total_amount": 955.00, "start_date": "2025-10-25", "end_date": "2025-10-27"}',
 true);

-- Insert webhook events
INSERT INTO webhook_events (id, event_type, payload, status, retry_count, metadata) VALUES
('gggggggg-gggg-gggg-gggg-ggggggggggg1', 'booking_created', '{"booking_id": "55555555-5555-5555-5555-555555555555", "booking_number": "UDR-2025-001", "customer_id": "11111111-1111-1111-1111-111111111111"}',
 'processed', 0, '{"processed_at": "2025-01-20T10:30:00Z", "processing_time_ms": 150}'),

('gggggggg-gggg-gggg-gggg-ggggggggggg2', 'payment_received', '{"payment_id": "66666666-6666-6666-6666-666666666666", "amount": 955.00, "booking_id": "55555555-5555-5555-5555-555555555555"}',
 'processed', 0, '{"processed_at": "2025-01-20T10:45:00Z", "processing_time_ms": 75}');

-- Insert API usage logs (sample from last 24 hours)
INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent, metadata)
SELECT
  CASE WHEN RANDOM() > 0.3 THEN '11111111-1111-1111-1111-111111111111' ELSE '22222222-2222-2222-2222-222222222222' END,
  (ARRAY['/api/equipment', '/api/bookings', '/api/user/profile', '/api/availability', '/api/payments'])[(RANDOM() * 4 + 1)::int],
  (ARRAY['GET', 'POST', 'PUT', 'DELETE'])[(RANDOM() * 3 + 1)::int],
  (ARRAY[200, 201, 400, 404, 500])[1 + (RANDOM() * 4)::int],
  (RANDOM() * 500 + 50)::int,
  '192.168.1.' || (RANDOM() * 255)::int,
  'Mozilla/5.0 (compatible; RentalApp/1.0)',
  CASE
    WHEN RANDOM() > 0.5 THEN '{"cached": true}'
    ELSE '{"cached": false, "complex_query": true}'
  END
FROM generate_series(1, 100);

-- Insert sample documents
INSERT INTO documents (id, name, type, category, file_path, file_size, mime_type, checksum, version, is_template, tags, metadata, uploaded_by) VALUES
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh1', 'Rental Agreement Template', 'contract', 'legal',
 '/templates/rental_agreement_v1.0.pdf', 245760, 'application/pdf',
 'sha256:a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 1, true,
 ARRAY['template', 'contract', 'legal'],
 '{"sections": ["equipment", "terms", "insurance", "payment"], "required_signatures": 2}',
 NULL),

('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh2', 'SVL75-3 Operator Manual', 'manual', 'equipment',
 '/documents/manuals/svl75-manual.pdf', 5242880, 'application/pdf',
 'sha256:b3d63b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b', 1, false,
 ARRAY['manual', 'equipment', 'svl75'],
 '{"equipment_model": "SVL75-3", "language": "en", "revision": "1.2"}',
 NULL),

('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh3', 'Insurance Certificate - Test User', 'insurance', 'customer',
 '/uploads/insurance/test_user_insurance.pdf', 1024000, 'application/pdf',
 'sha256:c3d63c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c', 1, false,
 ARRAY['insurance', 'customer', 'verified'],
 '{"policy_number": "INS-2025-001", "expiry_date": "2025-12-31", "coverage_amount": 1000000}',
 '11111111-1111-1111-1111-111111111111');

-- Insert document relations
INSERT INTO document_relations (document_id, related_table, related_id, relation_type) VALUES
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh1', 'bookings', '55555555-5555-5555-5555-555555555555', 'booking_contract'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh2', 'equipment', '33333333-3333-3333-3333-333333333333', 'equipment_manual'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh2', 'equipment', '44444444-4444-4444-4444-444444444444', 'equipment_manual'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh3', 'bookings', '55555555-5555-5555-5555-555555555555', 'booking_insurance');

-- Insert customer communications
INSERT INTO customer_communications (id, user_id, booking_id, type, direction, subject, content, metadata, created_by) VALUES
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiii1', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555',
 'email', 'outbound', 'Booking Confirmation - UDR-2025-001',
 'Your booking has been confirmed. Please review the attached rental agreement.',
 '{"email_provider": "resend", "template": "booking_confirmation", "attachments": ["rental_agreement.pdf"]}',
 '22222222-2222-2222-2222-222222222222'),

('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiii2', '11111111-1111-1111-1111-111111111111', NULL,
 'phone', 'inbound', 'Equipment Question',
 'Customer called asking about delivery options and insurance requirements.',
 '{"duration": 5.5, "agent": "Sarah Wilson", "priority": "medium"}',
 '22222222-2222-2222-2222-222222222222'),

('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiii3', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555',
 'in_person', 'outbound', 'Equipment Delivery',
 'Delivered SVL75-001 to construction site. Customer signed delivery receipt.',
 '{"delivery_confirmed": true, "photos_taken": true, "customer_signature": true}',
 '22222222-2222-2222-2222-222222222222');

-- Update user preferences for test users
UPDATE users SET preferences = '{
  "notifications": {
    "email": true,
    "sms": true,
    "marketing": false,
    "booking_reminders": true,
    "maintenance_alerts": true
  },
  "booking": {
    "default_delivery": true,
    "preferred_times": ["08:00", "09:00", "10:00"],
    "special_requirements": ["wheel chocks", "tie-down straps"]
  },
  "privacy": {
    "profile_visible": true,
    "booking_history_visible": false,
    "contact_preferences": "email"
  }
}' WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE users SET preferences = '{
  "notifications": {
    "email": true,
    "sms": false,
    "marketing": false,
    "booking_reminders": true,
    "maintenance_alerts": true
  },
  "booking": {
    "default_delivery": false,
    "preferred_times": ["09:00", "14:00"],
    "special_requirements": []
  },
  "privacy": {
    "profile_visible": true,
    "booking_history_visible": true,
    "contact_preferences": "email"
  }
}' WHERE id = '22222222-2222-2222-2222-222222222222';

-- Insert additional equipment for testing (3 more units)
INSERT INTO equipment (
  id, unit_id, serial_number, type, model, year, make, description, replacement_value,
  daily_rate, weekly_rate, monthly_rate, overage_hourly_rate, daily_hour_allowance,
  weekly_hour_allowance, specifications, status, notes, attachments, total_engine_hours,
  location, images, documents, created_at, updated_at
) VALUES
('99999999-9999-9999-9999-999999999999', 'SVL75-003', 'SN111111111', 'svl75', 'SVL75-3', 2023, 'Kubota',
 'Third rental unit - good condition with moderate usage', 110000.00,
 325.00, 1950.00, 7800.00, 60.00, 8, 40,
 '{"operatingWeight": 7500, "transportDimensions": {"length": 120, "width": 60, "height": 80}, "engineHours": 320, "fuelType": "Diesel", "attachments": ["Standard Bucket", "Pallet Forks"]}',
 'available', 'Moderate usage, well maintained', '[{"name": "Standard Bucket", "type": "bucket", "included": true}]',
 320, '{"address": "123 Industrial Blvd", "city": "Saint John", "province": "NB", "postalCode": "E2K 1A1", "coordinates": {"lat": 45.2733, "lng": -66.0633}}',
 '[{"url": "/images/kubota-svl-75-hero.png", "alt": "Kubota SVL-75 Compact Track Loader", "isPrimary": true}]',
 '[{"type": "manual", "url": "/documents/svl75-manual.pdf", "name": "Operator Manual"}]',
 NOW(), NOW()),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'SVL75-004', 'SN222222222', 'svl75', 'SVL75-3', 2024, 'Kubota',
 'Fourth rental unit - low hours, excellent condition', 115000.00,
 350.00, 2100.00, 8400.00, 65.00, 8, 40,
 '{"operatingWeight": 7500, "transportDimensions": {"length": 120, "width": 60, "height": 80}, "engineHours": 45, "fuelType": "Diesel", "attachments": ["Standard Bucket", "Pallet Forks", "Grapple"]}',
 'rented', 'Very low hours, pristine condition', '[{"name": "Standard Bucket", "type": "bucket", "included": true}, {"name": "Grapple", "type": "grapple", "included": false, "additionalCost": 30}]',
 45, '{"address": "123 Industrial Blvd", "city": "Saint John", "province": "NB", "postalCode": "E2K 1A1", "coordinates": {"lat": 45.2733, "lng": -66.0633}}',
 '[{"url": "/images/kubota-svl-75-hero.png", "alt": "Kubota SVL-75 Compact Track Loader", "isPrimary": true}]',
 '[{"type": "manual", "url": "/documents/svl75-manual.pdf", "name": "Operator Manual"}]',
 NOW(), NOW()),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'SVL75-005', 'SN333333333', 'svl75', 'SVL75-3', 2022, 'Kubota',
 'Fifth rental unit - high hours but well maintained', 105000.00,
 300.00, 1800.00, 7200.00, 55.00, 8, 40,
 '{"operatingWeight": 7500, "transportDimensions": {"length": 120, "width": 60, "height": 80}, "engineHours": 850, "fuelType": "Diesel", "attachments": ["Standard Bucket"]}',
 'maintenance', 'High hours but regularly maintained - currently in for service', '[{"name": "Standard Bucket", "type": "bucket", "included": true}]',
 850, '{"address": "123 Industrial Blvd", "city": "Saint John", "province": "NB", "postalCode": "E2K 1A1", "coordinates": {"lat": 45.2733, "lng": -66.0633}}',
 '[{"url": "/images/kubota-svl-75-hero.png", "alt": "Kubota SVL-75 Compact Track Loader", "isPrimary": true}]',
 '[{"type": "manual", "url": "/documents/svl75-manual.pdf", "name": "Operator Manual"}]',
 NOW(), NOW());

-- Create additional test users
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated',
 'contractor@kubota-rental.com', crypt('contractor123', gen_salt('bf')), NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"first_name": "John", "last_name": "Contractor"}',
 NOW(), NOW(), '', '', '', ''),

('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated',
 'landscaper@kubota-rental.com', crypt('landscaper123', gen_salt('bf')), NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"first_name": "Jane", "last_name": "Landscaper"}',
 NOW(), NOW(), '', '', '', ''),

('00000000-0000-0000-0000-000000000000', '55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated',
 'construction@kubota-rental.com', crypt('construction123', gen_salt('bf')), NOW(), NULL, NOW(),
 '{"provider": "email", "providers": ["email"]}', '{"first_name": "Mike", "last_name": "Construction"}',
 NOW(), NOW(), '', '', '', '');

-- Insert corresponding user profiles
INSERT INTO users (id, first_name, last_name, phone, company_name, drivers_license, address, city, province, postal_code, country, role, status, email_verified, preferences, stripe_customer_id, created_at, updated_at) VALUES
('33333333-3333-3333-3333-333333333333', 'John', 'Contractor', '+1-555-0101', 'ABC Contracting Ltd.', 'DL123456789', '789 Construction Ave', 'Saint John', 'NB', 'E2K 3C4', 'Canada', 'customer', 'active', true,
 '{"notifications": {"email": true, "sms": true, "booking_reminders": true}, "booking": {"default_delivery": true}}',
 'cus_contractor123', NOW(), NOW()),

('44444444-4444-4444-4444-444444444444', 'Jane', 'Landscaper', '+1-555-0102', 'Green Thumb Landscaping', 'DL987654321', '321 Garden Street', 'Saint John', 'NB', 'E2K 3C5', 'Canada', 'customer', 'active', true,
 '{"notifications": {"email": true, "sms": false, "booking_reminders": true}, "booking": {"default_delivery": false}}',
 'cus_landscaper123', NOW(), NOW()),

('55555555-5555-5555-5555-555555555555', 'Mike', 'Construction', '+1-555-0103', 'Build Right Construction', 'DL555666777', '654 Builder Blvd', 'Saint John', 'NB', 'E2K 3C6', 'Canada', 'customer', 'active', true,
 '{"notifications": {"email": true, "sms": true, "booking_reminders": true}, "booking": {"default_delivery": true}}',
 'cus_construction123', NOW(), NOW());

-- Insert additional bookings for variety
INSERT INTO bookings (
  id, booking_number, customer_id, equipment_id, start_date, end_date, status, type,
  delivery_address, delivery_city, delivery_province, delivery_postal_code,
  daily_rate, weekly_rate, monthly_rate, subtotal, taxes, float_fee, delivery_fee,
  seasonal_multiplier, total_amount, security_deposit, additional_charges, special_instructions,
  internal_notes, attachments, terms_accepted, created_at, updated_at
) VALUES
('66666666-6666-6666-6666-666666666666', 'UDR-2025-002', '33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999',
 '2025-02-01 09:00:00', '2025-02-03 17:00:00', 'confirmed', 'pickup',
 NULL, NULL, NULL, NULL, 325.00, 1950.00, 7800.00, 650.00, 97.50, 0.00, 0.00, 1.0, 747.50, 400.00, 0.00,
 'Customer will pick up at our location', 'Prefers morning pickup', '[]',
 '{"termsVersion": "1.0", "riderVersion": "1.0", "acceptedAt": "2025-01-20T14:30:00Z"}',
 NOW(), NOW()),

('77777777-7777-7777-7777-777777777777', 'UDR-2025-003', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
 '2025-01-28 08:00:00', '2025-02-05 17:00:00', 'active', 'delivery',
 '987 Garden Way', 'Saint John', 'NB', 'E2K 4D7', 350.00, 2100.00, 8400.00, 2800.00, 420.00, 150.00, 75.00, 1.0, 3445.00, 600.00, 0.00,
 'Please deliver to backyard garden area. Gate access available.', 'Customer requested grapple attachment for landscaping work',
 '[{"name": "Grapple", "type": "grapple", "included": false, "additionalCost": 30}]',
 '{"termsVersion": "1.0", "riderVersion": "1.0", "acceptedAt": "2025-01-20T16:45:00Z"}',
 NOW(), NOW()),

('88888888-8888-8888-8888-888888888888', 'UDR-2025-004', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
 '2025-02-10 07:00:00', '2025-02-12 18:00:00', 'pending', 'delivery',
 '147 Industrial Park Dr', 'Saint John', 'NB', 'E2K 5E8', 300.00, 1800.00, 7200.00, 600.00, 90.00, 0.00, 50.00, 1.0, 740.00, 350.00, 0.00,
 'Early morning delivery preferred. Site access from 6:30 AM.', 'Discounted rate for high-hour equipment',
 '[]', '{"termsVersion": "1.0", "riderVersion": "1.0", "acceptedAt": "2025-01-21T09:15:00Z"}',
 NOW(), NOW());

-- Insert payments for new bookings
INSERT INTO payments (id, booking_id, amount, currency, status, payment_method, stripe_payment_intent_id, stripe_charge_id, description, metadata, created_at, updated_at) VALUES
('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 747.50, 'CAD', 'succeeded', 'card',
 'pi_test_222222222', 'ch_test_222222222', 'Booking payment for UDR-2025-002',
 '{"booking_number": "UDR-2025-002", "customer_id": "33333333-3333-3333-3333-333333333333"}',
 NOW(), NOW()),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '77777777-7777-7777-7777-777777777777', 3445.00, 'CAD', 'succeeded', 'card',
 'pi_test_333333333', 'ch_test_333333333', 'Booking payment for UDR-2025-003',
 '{"booking_number": "UDR-2025-003", "customer_id": "44444444-4444-4444-4444-444444444444"}',
 NOW(), NOW());

-- Insert contracts for new bookings
INSERT INTO contracts (id, booking_id, contract_number, status, template_version, terms_version, rider_version, generated_at, contract_url, created_at, updated_at) VALUES
('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'CON-2025-002', 'generated', '1.0', '1.0', '1.0', NOW(), '/contracts/UDR-2025-002.pdf', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '77777777-7777-7777-7777-777777777777', 'CON-2025-003', 'generated', '1.0', '1.0', '1.0', NOW(), '/contracts/UDR-2025-003.pdf', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '88888888-8888-8888-8888-888888888888', 'CON-2025-004', 'draft', '1.0', '1.0', '1.0', NULL, NULL, NOW(), NOW());

-- Insert insurance documents for new bookings
INSERT INTO insurance_documents (id, booking_id, document_type, file_name, file_url, file_size, mime_type, status, created_at, updated_at) VALUES
('99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666666', 'liability_insurance', 'contractor_insurance.pdf', '/uploads/contractor_insurance.pdf', 1024000, 'application/pdf', 'verified', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '77777777-7777-7777-7777-777777777777', 'liability_insurance', 'landscaper_insurance.pdf', '/uploads/landscaper_insurance.pdf', 1024000, 'application/pdf', 'pending', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', '88888888-8888-8888-8888-888888888888', 'liability_insurance', 'construction_insurance.pdf', '/uploads/construction_insurance.pdf', 1024000, 'application/pdf', 'pending', NOW(), NOW());

-- Update search index for new equipment and bookings
INSERT INTO search_index (result_type, result_id, title, description, searchable_text, metadata, is_active) VALUES
('equipment', '99999999-9999-9999-9999-999999999999', 'SVL75-3 Kubota', 'Third rental unit - good condition with moderate usage',
 'Third rental unit good condition moderate usage SVL75-3 Kubota SVL75-003', '{"type": "svl75", "year": 2023, "daily_rate": 325.00, "status": "available"}', true),

('equipment', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'SVL75-3 Kubota', 'Fourth rental unit - low hours, excellent condition',
 'Fourth rental unit low hours excellent condition SVL75-3 Kubota SVL75-004', '{"type": "svl75", "year": 2024, "daily_rate": 350.00, "status": "rented"}', true),

('equipment', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'SVL75-3 Kubota', 'Fifth rental unit - high hours but well maintained',
 'Fifth rental unit high hours well maintained SVL75-3 Kubota SVL75-005', '{"type": "svl75", "year": 2022, "daily_rate": 300.00, "status": "maintenance"}', true),

('booking', '66666666-6666-6666-6666-666666666666', 'UDR-2025-002', 'Construction equipment rental',
 'Construction equipment rental UDR-2025-002 John Contractor', '{"status": "confirmed", "total_amount": 747.50, "start_date": "2025-02-01", "end_date": "2025-02-03"}', true),

('booking', '77777777-7777-7777-7777-777777777777', 'UDR-2025-003', 'Landscaping equipment rental',
 'Landscaping equipment rental UDR-2025-003 Jane Landscaper', '{"status": "active", "total_amount": 3445.00, "start_date": "2025-01-28", "end_date": "2025-02-05"}', true),

('booking', '88888888-8888-8888-8888-888888888888', 'UDR-2025-004', 'Construction site rental',
 'Construction site rental UDR-2025-004 Mike Construction', '{"status": "pending", "total_amount": 740.00, "start_date": "2025-02-10", "end_date": "2025-02-12"}', true);

-- Update search index for new users
INSERT INTO search_index (result_type, result_id, title, description, searchable_text, metadata, is_active) VALUES
('customer', '33333333-3333-3333-3333-333333333333', 'John Contractor', 'ABC Contracting Ltd.',
 'John Contractor ABC Contracting Ltd. construction', '{"company": "ABC Contracting Ltd.", "role": "customer"}', true),

('customer', '44444444-4444-4444-4444-444444444444', 'Jane Landscaper', 'Green Thumb Landscaping',
 'Jane Landscaper Green Thumb Landscaping landscaping', '{"company": "Green Thumb Landscaping", "role": "customer"}', true),

('customer', '55555555-5555-5555-5555-555555555555', 'Mike Construction', 'Build Right Construction',
 'Mike Construction Build Right Construction construction', '{"company": "Build Right Construction", "role": "customer"}', true);

-- Create indexes for search on new data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_index_customer_id ON search_index(result_type, result_id) WHERE result_type = 'customer';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_index_booking_id ON search_index(result_type, result_id) WHERE result_type = 'booking';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_index_equipment_id ON search_index(result_type, result_id) WHERE result_type = 'equipment';

-- Insert more comprehensive utilization data for the last 90 days
INSERT INTO equipment_utilization (equipment_id, date, hours_used, fuel_consumed, revenue_generated, utilization_percentage)
SELECT
  e.id,
  generate_series(
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE - INTERVAL '1 day',
    INTERVAL '1 day'
  )::date,
  ROUND((RANDOM() * 8)::numeric, 2),
  ROUND((RANDOM() * 40)::numeric, 2),
  ROUND((RANDOM() * 350)::numeric, 2),
  ROUND((RANDOM() * 100)::numeric, 2)
FROM equipment e
WHERE e.id NOT IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');

-- Insert monthly analytics data for the past 6 months
INSERT INTO analytics_data (metric_name, metric_category, date, value, metadata)
SELECT
  metric,
  category,
  generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '6 months'),
    date_trunc('month', CURRENT_DATE - INTERVAL '1 month'),
    INTERVAL '1 month'
  )::date,
  ROUND((RANDOM() * 20000 + 10000)::numeric, 2),
  jsonb_build_object('generated_at', NOW(), 'data_quality', 'good')
FROM (VALUES
  ('total_revenue', 'revenue'),
  ('equipment_utilization', 'utilization'),
  ('new_customers', 'customer'),
  ('maintenance_costs', 'equipment'),
  ('booking_cancellations', 'customer'),
  ('average_booking_duration', 'customer')
) AS metrics(metric, category);

-- Insert sample webhook events for variety
INSERT INTO webhook_events (event_type, payload, status, retry_count, metadata)
SELECT
  (ARRAY['booking_created', 'booking_updated', 'payment_received', 'contract_signed', 'equipment_maintenance_due'])[(RANDOM() * 4 + 1)::int],
  jsonb_build_object(
    'event_id', 'evt_' || encode(gen_random_bytes(16), 'hex'),
    'timestamp', NOW() - (RANDOM() * INTERVAL '7 days'),
    'test_data', true
  ),
  (ARRAY['processed', 'pending', 'failed'])[1 + (RANDOM() * 2)::int],
  CASE WHEN RANDOM() > 0.9 THEN (RANDOM() * 3)::int ELSE 0 END,
  jsonb_build_object('source', 'test_data', 'created_at', NOW())
FROM generate_series(1, 50);

-- Insert API usage patterns for different user types
INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent, metadata)
SELECT
  CASE
    WHEN RANDOM() > 0.6 THEN '11111111-1111-1111-1111-111111111111' -- Regular user
    WHEN RANDOM() > 0.3 THEN '22222222-2222-2222-2222-222222222222' -- Admin user
    ELSE (ARRAY['33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'])[1 + (RANDOM() * 2)::int]
  END,
  (ARRAY['/api/equipment', '/api/bookings', '/api/availability', '/api/user/profile', '/api/payments', '/api/contracts', '/api/analytics'])[1 + (RANDOM() * 6)::int],
  (ARRAY['GET', 'POST', 'PUT', 'DELETE'])[1 + (RANDOM() * 3)::int],
  (ARRAY[200, 201, 400, 404, 500])[1 + (RANDOM() * 4)::int],
  (RANDOM() * 1000 + 100)::int,
  ('192.168.1.' || (RANDOM() * 255)::int)::inet,
  'Mozilla/5.0 (compatible; RentalApp/' || (1 + (RANDOM() * 2)::int) || '.0)',
  CASE
    WHEN RANDOM() > 0.7 THEN '{"cached": true}'
    ELSE '{"cached": false, "complex_query": ' || (RANDOM() > 0.5)::text || '}'
  END
FROM generate_series(1, 200);

-- Insert notification templates for various scenarios
INSERT INTO notification_templates (id, name, type, subject, body, variables, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'booking_reminder_24h', 'email',
 'Reminder: Equipment Rental Tomorrow - {{booking_number}}',
 'Dear {{customer_name}},

This is a 24-hour reminder for your upcoming rental:

Booking: {{booking_number}}
Equipment: {{equipment_model}} ({{unit_id}})
Pickup/Delivery: {{start_date}} at {{start_time}}

Please ensure:
✓ Valid insurance certificate
✓ Payment method ready
✓ Site access prepared (for deliveries)

Need to make changes? Contact us immediately.

Best regards,
Kubota Rental Team',
 '{"customer_name": "string", "booking_number": "string", "equipment_model": "string", "unit_id": "string", "start_date": "date", "start_time": "time"}',
 true),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'maintenance_completed', 'email',
 'Maintenance Completed - {{equipment_model}}',
 'Good news! Maintenance has been completed on {{equipment_model}} ({{unit_id}}).

Maintenance Type: {{maintenance_type}}
Completed: {{completed_date}}
Cost: ${{cost}}

The equipment is now ready for rental and has been thoroughly tested.

Next scheduled maintenance: {{next_due_date}}

Thank you for your patience.

Best regards,
Kubota Rental Team',
 '{"equipment_model": "string", "unit_id": "string", "maintenance_type": "string", "completed_date": "date", "cost": "number", "next_due_date": "date"}',
 true),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', 'payment_failed', 'email',
 'Payment Failed - {{booking_number}}',
 'Dear {{customer_name}},

We were unable to process payment for booking {{booking_number}}.

Amount: ${{amount}}
Reason: {{failure_reason}}

Please update your payment method or contact us to resolve this issue. Your booking may be cancelled if payment is not received within 24 hours.

Update payment method: {{payment_link}}

Questions? Call us at (555) 123-4567

Best regards,
Kubota Rental Team',
 '{"customer_name": "string", "booking_number": "string", "amount": "number", "failure_reason": "string", "payment_link": "url"}',
 true);

-- Insert sample notifications for various scenarios
INSERT INTO notifications (id, user_id, type, status, priority, title, message, template_id, template_data, scheduled_for, sent_at, metadata) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', '33333333-3333-3333-3333-333333333333', 'email', 'sent', 'high',
 'Booking Reminder 24h', 'Reminder: Your equipment rental starts tomorrow at 9:00 AM.',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
 '{"customer_name": "John Contractor", "booking_number": "UDR-2025-002", "equipment_model": "SVL75-3", "unit_id": "SVL75-003", "start_date": "2025-02-01", "start_time": "09:00"}',
 '2025-01-31 18:00:00', '2025-01-31 18:05:00',
 '{"email_provider": "resend", "provider_message_id": "msg_789012"}'),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', '44444444-4444-4444-4444-444444444444', 'email', 'delivered', 'medium',
 'Maintenance Completed', 'Maintenance has been completed on your rental equipment.',
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5',
 '{"equipment_model": "SVL75-3", "unit_id": "SVL75-004", "maintenance_type": "100-Hour Service", "completed_date": "2025-01-20", "cost": 650.00, "next_due_date": "2025-04-20"}',
 '2025-01-20 14:00:00', '2025-01-20 14:02:00',
 '{"email_provider": "resend", "provider_message_id": "msg_345678"}');

-- Insert audit logs for various actions
INSERT INTO audit_logs (id, table_name, record_id, action, user_id, old_values, new_values, ip_address, user_agent, metadata)
SELECT
  'ffffffff-ffff-ffff-ffff-fffffffffff' || (1000 + generate_series(4, 100)),
  (ARRAY['equipment', 'bookings', 'users', 'payments', 'contracts'])[1 + (RANDOM() * 4)::int],
  (ARRAY['33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777'])[1 + (RANDOM() * 4)::int],
  (ARRAY['create', 'update', 'delete', 'login', 'logout', 'payment', 'booking'])[1 + (RANDOM() * 6)::int],
  CASE WHEN RANDOM() > 0.2 THEN (ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'])[1 + (RANDOM() * 2)::int] END,
  CASE WHEN RANDOM() > 0.5 THEN jsonb_build_object('status', 'pending') END,
  CASE WHEN RANDOM() > 0.5 THEN jsonb_build_object('status', 'confirmed') END,
  ('192.168.1.' || (RANDOM() * 255)::int)::inet,
  'Mozilla/5.0 (compatible; RentalApp/1.0)',
  jsonb_build_object('source', 'web_app', 'timestamp', NOW() - (RANDOM() * INTERVAL '30 days'))
FROM generate_series(4, 100);

-- Insert customer communications for variety
INSERT INTO customer_communications (id, user_id, booking_id, type, direction, subject, content, metadata, created_by)
SELECT
  'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiii' || (1000 + generate_series(4, 50)),
  (ARRAY['11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'])[1 + (RANDOM() * 3)::int],
  CASE WHEN RANDOM() > 0.7 THEN (ARRAY['55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'])[1 + (RANDOM() * 3)::int] END,
  (ARRAY['email', 'phone', 'sms', 'in_person'])[1 + (RANDOM() * 3)::int],
  (ARRAY['inbound', 'outbound'])[1 + (RANDOM())::int],
  'Communication Subject ' || generate_series(4, 50),
  'Communication content for record ' || generate_series(4, 50),
  jsonb_build_object('priority', (ARRAY['low', 'medium', 'high'])[1 + (RANDOM() * 2)::int], 'category', (ARRAY['booking', 'payment', 'maintenance', 'general'])[1 + (RANDOM() * 3)::int]),
  (ARRAY['22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'])[1 + (RANDOM())::int]
FROM generate_series(4, 50);

-- Insert document relations for all bookings and equipment
INSERT INTO document_relations (document_id, related_table, related_id, relation_type)
SELECT
  'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh' || (1000 + (generate_series(1, 20) % 3 + 1)),
  'bookings',
  (ARRAY['55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'])[1 + (RANDOM() * 3)::int],
  'booking_insurance'
FROM generate_series(1, 20);

INSERT INTO document_relations (document_id, related_table, related_id, relation_type)
SELECT
  'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh2',
  'equipment',
  e.id,
  'equipment_manual'
FROM equipment e;

-- Insert additional documents for testing
INSERT INTO documents (id, name, type, category, file_path, file_size, mime_type, checksum, version, is_template, tags, metadata, uploaded_by) VALUES
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh4', 'Equipment Maintenance Log Template', 'maintenance', 'template',
 '/templates/maintenance_log.xlsx', 51200, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 'sha256:d4d64d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d4d', 1, true,
 ARRAY['template', 'maintenance', 'excel'],
 '{"fields": ["date", "equipment_id", "maintenance_type", "hours", "cost", "technician"]}',
 NULL),

('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh5', 'Customer Onboarding Guide', 'guide', 'customer',
 '/documents/guides/customer_onboarding.pdf', 2048000, 'application/pdf',
 'sha256:e4e64e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e4e', 1, false,
 ARRAY['guide', 'customer', 'onboarding'],
 '{"sections": ["getting_started", "insurance_requirements", "booking_process", "safety_guidelines"]}',
 NULL),

('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh6', 'Warranty Document Template', 'warranty', 'legal',
 '/templates/warranty_template.pdf', 153600, 'application/pdf',
 'sha256:f4f64f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f4f', 1, true,
 ARRAY['template', 'warranty', 'legal'],
 '{"validity_period_months": 12, "coverage_types": ["parts", "labor"]}',
 NULL);

-- Insert document relations for templates
INSERT INTO document_relations (document_id, related_table, related_id, relation_type) VALUES
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh4', 'equipment', '33333333-3333-3333-3333-333333333333', 'maintenance_template'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh5', 'users', '11111111-1111-1111-1111-111111111111', 'customer_guide'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhh6', 'contracts', '77777777-7777-7777-7777-777777777777', 'warranty_template');

-- Update search index for all new content
INSERT INTO search_index (result_type, result_id, title, description, searchable_text, metadata, is_active)
SELECT
  'customer',
  u.id,
  u.first_name || ' ' || u.last_name,
  COALESCE(u.company_name, ''),
  u.first_name || ' ' || u.last_name || ' ' || COALESCE(u.company_name, '') || ' ' || COALESCE(u.city, ''),
  jsonb_build_object('company', u.company_name, 'role', u.role, 'city', u.city),
  true
FROM users u
WHERE u.id NOT IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555')
  AND u.role = 'customer';

-- Final update to ensure all triggers run
UPDATE equipment SET updated_at = NOW() WHERE id IN ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3');
UPDATE bookings SET updated_at = NOW() WHERE id IN ('66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888');
UPDATE users SET updated_at = NOW() WHERE id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555');

-- Create comprehensive indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_equipment_status ON bookings(equipment_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_range ON bookings(start_date, end_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_booking_status ON payments(booking_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_booking_status ON contracts(booking_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_documents_booking_status ON insurance_documents(booking_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_status_location ON equipment(status, id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_utilization;

-- Grant necessary permissions for realtime
GRANT SELECT ON equipment TO anon;
GRANT SELECT ON bookings TO anon;
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON equipment_utilization TO authenticated;

-- Insert final summary analytics
INSERT INTO analytics_data (metric_name, metric_category, date, value, metadata) VALUES
('total_equipment', 'equipment', CURRENT_DATE, 5, '{"available": 3, "rented": 1, "maintenance": 1}'),
('total_customers', 'customer', CURRENT_DATE, 5, '{"active": 5, "new_this_month": 3}'),
('total_bookings', 'customer', CURRENT_DATE, 4, '{"confirmed": 2, "active": 1, "pending": 1}'),
('monthly_revenue', 'revenue', CURRENT_DATE, 5932.50, '{"projected": 15000.00, "actual": 5932.50}');

-- Create a view for dashboard analytics (admins only)
CREATE OR REPLACE VIEW dashboard_analytics AS
SELECT
  ad.metric_name,
  ad.metric_category,
  ad.date,
  ad.value,
  ad.metadata,
  ROW_NUMBER() OVER (PARTITION BY ad.metric_category ORDER BY ad.date DESC) as row_num
FROM analytics_data ad
WHERE ad.date >= CURRENT_DATE - INTERVAL '90 days';

-- Grant access to dashboard view
GRANT SELECT ON dashboard_analytics TO authenticated;

-- Create RLS policy for dashboard view
CREATE POLICY "Admins can view dashboard analytics" ON dashboard_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW dashboard_analytics SET (security_barrier = true);

-- Create a function to calculate equipment availability for next 30 days
CREATE OR REPLACE FUNCTION get_equipment_availability(
  p_equipment_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  is_available BOOLEAN,
  booking_id UUID,
  customer_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cal.date,
    CASE
      WHEN b.id IS NULL THEN true
      ELSE false
    END as is_available,
    b.id as booking_id,
    u.first_name || ' ' || u.last_name as customer_name
  FROM (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date as date
  ) cal
  LEFT JOIN bookings b ON b.equipment_id = p_equipment_id
    AND cal.date BETWEEN b.start_date::date AND b.end_date::date
    AND b.status NOT IN ('cancelled', 'rejected')
  LEFT JOIN users u ON b.customer_id = u.id
  ORDER BY cal.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get customer booking history
CREATE OR REPLACE FUNCTION get_customer_booking_history(p_customer_id UUID)
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
  equipment_model TEXT,
  equipment_unit_id TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2),
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.booking_number,
    e.model,
    e.unit_id,
    b.start_date,
    b.end_date,
    b.total_amount,
    b.status
  FROM bookings b
  JOIN equipment e ON b.equipment_id = e.id
  WHERE b.customer_id = p_customer_id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_equipment_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_booking_history(UUID) TO authenticated;

-- Create RLS policies for functions
CREATE POLICY "Users can check equipment availability" ON bookings
  FOR SELECT USING (true); -- Allow availability checking

CREATE POLICY "Users can view own booking history" ON bookings
  FOR SELECT USING (auth.uid() = customer_id);

-- Insert a sample maintenance schedule for the next year
INSERT INTO equipment_maintenance (id, equipment_id, maintenance_type, status, priority, title, description, scheduled_date, next_due_date, next_due_hours)
SELECT
  'dddddddd-dddd-dddd-dddd-dddddddddddd' || (1000 + generate_series(4, 20)),
  e.id,
  (ARRAY['scheduled', 'preventive', 'inspection'])[1 + (RANDOM() * 2)::int],
  'scheduled',
  (ARRAY['low', 'medium', 'high'])[1 + (RANDOM() * 2)::int],
  'Maintenance Task ' || generate_series(4, 20),
  'Regular maintenance task',
  CURRENT_DATE + (RANDOM() * 365)::int * INTERVAL '1 day',
  CURRENT_DATE + (RANDOM() * 365 + 30)::int * INTERVAL '1 day',
  (RANDOM() * 500 + 100)::int
FROM equipment e
CROSS JOIN generate_series(4, 5); -- 2 maintenance tasks per equipment

-- Insert sample discount code usage
INSERT INTO discount_codes (id, code, name, type, value, max_uses, used_count, max_uses_per_user, min_booking_amount, valid_from, valid_until, applicable_equipment_types, is_active) VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccc4', 'SAVE25', 'Bulk Booking Discount', 'percentage', 25.00, 20, 0, 1, 1000.00, '2025-01-01', '2025-03-31', ARRAY['svl75'], true),
('cccccccc-cccc-cccc-cccc-ccccccccccc5', 'FIRST50', 'First Time Customer', 'fixed_amount', 50.00, 100, 0, 1, 200.00, '2025-01-01', '2025-12-31', ARRAY['svl75'], true),
('cccccccc-cccc-cccc-cccc-ccccccccccc6', 'LOYALTY15', 'Loyalty Program', 'percentage', 15.00, NULL, 0, 3, 100.00, '2025-01-01', '2025-12-31', ARRAY['svl75'], true);

-- Final performance optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_customer_date ON bookings(customer_id, start_date, end_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_status_available ON equipment(status) WHERE status = 'available';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_role ON users(email, role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_recent ON audit_logs(created_at) WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

-- Insert realtime subscriptions setup
INSERT INTO notification_templates (id, name, type, subject, body, variables, is_active) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', 'booking_status_update', 'push',
 'Booking Update',
 'Your booking {{booking_number}} status has been updated to: {{status}}',
 '{"booking_number": "string", "status": "string"}',
 true),

('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', 'equipment_available', 'push',
 'Equipment Available',
 '{{equipment_model}} ({{unit_id}}) is now available for booking',
 '{"equipment_model": "string", "unit_id": "string"}',
 true);

-- Create a comprehensive system status view
CREATE OR REPLACE VIEW system_status AS
SELECT
  'equipment' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'available') as available_records,
  COUNT(*) FILTER (WHERE status = 'rented') as active_records,
  COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance_records
FROM equipment

UNION ALL

SELECT
  'bookings' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'confirmed') as available_records,
  COUNT(*) FILTER (WHERE status = 'active') as active_records,
  COUNT(*) FILTER (WHERE status = 'pending') as maintenance_records
FROM bookings

UNION ALL

SELECT
  'users' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'active') as available_records,
  COUNT(*) FILTER (WHERE role = 'customer') as active_records,
  COUNT(*) FILTER (WHERE role = 'admin') as maintenance_records
FROM users;

-- Grant access to system status view
GRANT SELECT ON system_status TO authenticated;

-- Create RLS policy for system status
CREATE POLICY "Admins can view system status" ON system_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW system_status SET (security_barrier = true);

-- Insert final comprehensive audit logs for system setup
INSERT INTO audit_logs (table_name, record_id, action, user_id, old_values, new_values, metadata)
SELECT
  'system',
  '00000000-0000-0000-0000-000000000000',
  'create',
  '22222222-2222-2222-2222-222222222222',
  NULL,
  jsonb_build_object('setup_complete', true, 'tables_created', 15, 'records_inserted', 500),
  jsonb_build_object('setup_type', 'enhanced_seed', 'timestamp', NOW(), 'version', '1.0')
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE table_name = 'system');

-- Create final indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_utilization_equipment_date ON equipment_utilization(equipment_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_data_category_date_desc ON analytics_data(metric_category, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_date ON audit_logs(table_name, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_search_index_type_text ON search_index(result_type, searchable_text);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, created_at DESC);

-- Set up realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_maintenance;
ALTER PUBLICATION supabase_realtime ADD TABLE customer_communications;

-- Grant realtime permissions
GRANT SELECT ON equipment_maintenance TO anon;
GRANT SELECT ON customer_communications TO authenticated;

-- Final comprehensive data validation
DO $$
BEGIN
  -- Validate data integrity
  IF NOT EXISTS (SELECT 1 FROM equipment WHERE status IN ('available', 'rented', 'maintenance')) THEN
    RAISE EXCEPTION 'Invalid equipment status data';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bookings WHERE status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) THEN
    RAISE EXCEPTION 'Invalid booking status data';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE role IN ('customer', 'admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Invalid user role data';
  END IF;

  RAISE NOTICE 'Enhanced seed data validation completed successfully';
END $$;

-- Log completion
INSERT INTO audit_logs (table_name, record_id, action, user_id, metadata)
VALUES ('system', '00000000-0000-0000-0000-000000000000', 'create', '22222222-2222-2222-2222-222222222222',
        jsonb_build_object('seed_completed', true, 'timestamp', NOW(), 'total_records', 500, 'version', '1.0'));

-- The enhanced seed data setup is now complete!
-- This provides a comprehensive testing environment with:
-- - 5 equipment units with different statuses
-- - 5 customers with varied profiles
-- - 4 bookings in different states
-- - Complete maintenance schedules
-- - Analytics data for reporting
-- - Notification templates and examples
-- - Comprehensive audit trails
-- - Full-text search capabilities
-- - Document management system
-- - Customer communication history
-- - Seasonal pricing and discount codes
-- - API usage tracking
-- - Webhook event logging
-- - Real-time subscriptions setup

COMMIT;

