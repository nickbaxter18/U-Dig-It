-- Kubota Rental Platform - Test Seed Data
-- This file contains deterministic test data for local development and testing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert test users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'test@kubota-rental.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Test", "last_name": "User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'admin@kubota-rental.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "User", "role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
), (
  '00000000-0000-0000-0000-000000000000',
  '33333333-aaaa-bbbb-cccc-333333333333',
  'authenticated',
  'authenticated',
  'udigitrentalsinc@gmail.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Nick", "last_name": "Baxter", "role": "super_admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Ensure admin users have correct roles in public.users
UPDATE users
SET role = 'admin'
WHERE id = '22222222-2222-2222-2222-222222222222';

UPDATE users
SET role = 'super_admin'
WHERE id = '33333333-aaaa-bbbb-cccc-333333333333';

-- Insert test equipment
INSERT INTO equipment (
  id,
  unit_id,
  serial_number,
  type,
  model,
  year,
  make,
  description,
  replacement_value,
  daily_rate,
  weekly_rate,
  monthly_rate,
  overage_hourly_rate,
  daily_hour_allowance,
  weekly_hour_allowance,
  specifications,
  status,
  notes,
  attachments,
  total_engine_hours,
  location,
  images,
  documents,
  created_at,
  updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'SVL75-001',
  'SN123456789',
  'svl75',
  'SVL75-3',
  2025,
  'Kubota',
  'Professional grade compact track loader with 74.3 HP diesel engine. Perfect for construction, landscaping, and material handling.',
  120000.00,
  350.00,
  2100.00,
  8400.00,
  65.00,
  8,
  40,
  '{"operatingWeight": 7500, "transportDimensions": {"length": 120, "width": 60, "height": 80}, "engineHours": 0, "fuelType": "Diesel", "attachments": ["Standard Bucket", "Pallet Forks", "Grapple"]}',
  'available',
  'Primary rental unit - excellent condition',
  '[{"name": "Standard Bucket", "type": "bucket", "included": true}, {"name": "Pallet Forks", "type": "forks", "included": true, "additionalCost": 0}, {"name": "Grapple", "type": "grapple", "included": false, "additionalCost": 25}]',
  0,
  '{"address": "123 Industrial Blvd", "city": "Saint John", "province": "NB", "postalCode": "E2K 1A1", "coordinates": {"lat": 45.2733, "lng": -66.0633}}',
  '[{"url": "/images/kubota-svl-75-hero.png", "alt": "Kubota SVL-75 Compact Track Loader", "isPrimary": true}]',
  '[{"type": "manual", "url": "/documents/svl75-manual.pdf", "name": "Operator Manual"}]',
  NOW(),
  NOW()
), (
  '44444444-4444-4444-4444-444444444444',
  'SVL75-002',
  'SN987654321',
  'svl75',
  'SVL75-3',
  2024,
  'Kubota',
  'Backup rental unit with low hours. Same specifications as primary unit.',
  115000.00,
  350.00,
  2100.00,
  8400.00,
  65.00,
  8,
  40,
  '{"operatingWeight": 7500, "transportDimensions": {"length": 120, "width": 60, "height": 80}, "engineHours": 150, "fuelType": "Diesel", "attachments": ["Standard Bucket", "Pallet Forks"]}',
  'maintenance',
  'Currently in for scheduled maintenance',
  '[{"name": "Standard Bucket", "type": "bucket", "included": true}, {"name": "Pallet Forks", "type": "forks", "included": true, "additionalCost": 0}]',
  150,
  '{"address": "123 Industrial Blvd", "city": "Saint John", "province": "NB", "postalCode": "E2K 1A1", "coordinates": {"lat": 45.2733, "lng": -66.0633}}',
  '[{"url": "/images/kubota-svl-75-hero.png", "alt": "Kubota SVL-75 Compact Track Loader", "isPrimary": true}]',
  '[{"type": "manual", "url": "/documents/svl75-manual.pdf", "name": "Operator Manual"}]',
  NOW(),
  NOW()
);

-- Insert test bookings
INSERT INTO bookings (
  id,
  booking_number,
  customer_id,
  equipment_id,
  start_date,
  end_date,
  status,
  type,
  delivery_address,
  delivery_city,
  delivery_province,
  delivery_postal_code,
  daily_rate,
  weekly_rate,
  monthly_rate,
  subtotal,
  taxes,
  float_fee,
  delivery_fee,
  seasonal_multiplier,
  total_amount,
  security_deposit,
  additional_charges,
  refund_amount,
  actual_start_date,
  actual_end_date,
  start_engine_hours,
  end_engine_hours,
  overage_hours,
  overage_charges,
  special_instructions,
  internal_notes,
  attachments,
  cancelled_at,
  cancellation_reason,
  cancellation_fee,
  terms_accepted,
  signatures,
  documents,
  created_at,
  updated_at
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  'UDR-2025-001',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '2025-10-25 08:00:00',
  '2025-10-27 17:00:00',
  'confirmed',
  'delivery',
  '456 Construction Site Rd',
  'Saint John',
  'NB',
  'E2K 2B2',
  350.00,
  2100.00,
  8400.00,
  700.00,
  105.00,
  150.00,
  0.00,
  1.0,
  955.00,
  500.00,
  0.00,
  0.00,
  NULL,
  NULL,
  0,
  0,
  0.00,
  0.00,
  'Please deliver to construction site entrance',
  'Customer requested early morning delivery',
  '[{"name": "Standard Bucket", "type": "bucket", "included": true}]',
  NULL,
  NULL,
  0.00,
  '{"termsVersion": "1.0", "riderVersion": "1.0", "termsHash": "abc123", "riderHash": "def456", "acceptedAt": "2025-10-22T10:00:00Z", "ipAddress": "192.168.1.1", "userAgent": "Mozilla/5.0", "initials": {"section2": "TU", "section3": "TU", "section4": "TU", "section5": "TU", "section7": "TU", "section8": "TU", "finalAcceptance": "TU"}}',
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- Insert test payments
INSERT INTO payments (
  id,
  booking_id,
  amount,
  currency,
  status,
  payment_method,
  stripe_payment_intent_id,
  stripe_charge_id,
  description,
  metadata,
  created_at,
  updated_at
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  '55555555-5555-5555-5555-555555555555',
  955.00,
  'CAD',
  'succeeded',
  'card',
  'pi_test_123456789',
  'ch_test_123456789',
  'Booking payment for UDR-2025-001',
  '{"booking_number": "UDR-2025-001", "customer_id": "11111111-1111-1111-1111-111111111111"}',
  NOW(),
  NOW()
);

-- Insert test contracts
INSERT INTO contracts (
  id,
  booking_id,
  contract_number,
  status,
  template_version,
  terms_version,
  rider_version,
  generated_at,
  signed_at,
  docusign_envelope_id,
  contract_url,
  signed_contract_url,
  created_at,
  updated_at
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  '55555555-5555-5555-5555-555555555555',
  'CON-2025-001',
  'generated',
  '1.0',
  '1.0',
  '1.0',
  NOW(),
  NULL,
  NULL,
  '/contracts/UDR-2025-001.pdf',
  NULL,
  NOW(),
  NOW()
);

-- Insert test insurance documents
INSERT INTO insurance_documents (
  id,
  booking_id,
  document_type,
  file_name,
  file_url,
  file_size,
  mime_type,
  uploaded_at,
  verified_at,
  status,
  created_at,
  updated_at
) VALUES (
  '88888888-8888-8888-8888-888888888888',
  '55555555-5555-5555-5555-555555555555',
  'liability_insurance',
  'insurance_certificate.pdf',
  '/uploads/insurance_certificate.pdf',
  1024000,
  'application/pdf',
  NOW(),
  NULL,
  'pending',
  NOW(),
  NOW()
);

-- Create RLS policies for testing
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_documents ENABLE ROW LEVEL SECURITY;

-- Equipment policies (public read, admin write)
CREATE POLICY "Equipment is viewable by everyone" ON equipment FOR SELECT USING (true);
CREATE POLICY "Equipment is manageable by admins" ON equipment FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Bookings policies (users can see their own, admins see all)
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins can manage all bookings" ON bookings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Payments policies (users can see their own, admins see all)
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = payments.booking_id
    AND bookings.customer_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Contracts policies (users can see their own, admins see all)
CREATE POLICY "Users can view own contracts" ON contracts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = contracts.booking_id
    AND bookings.customer_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all contracts" ON contracts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Insurance documents policies (users can see their own, admins see all)
CREATE POLICY "Users can view own insurance documents" ON insurance_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = insurance_documents.booking_id
    AND bookings.customer_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all insurance documents" ON insurance_documents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);




