-- Row Level Security policies for Kubota Rental Platform
-- This migration enables RLS and creates security policies

-- Enable RLS on all tables
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_documents ENABLE ROW LEVEL SECURITY;

-- Equipment policies
-- Equipment is viewable by everyone (public catalog)
CREATE POLICY "Equipment is viewable by everyone" ON equipment
  FOR SELECT USING (true);

-- Only admins can manage equipment
CREATE POLICY "Equipment is manageable by admins" ON equipment
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Bookings policies
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = customer_id);

-- Users can create bookings for themselves
CREATE POLICY "Users can create own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Users can update their own bookings (limited fields)
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Payments policies
-- Users can view payments for their own bookings
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Users can create payments for their own bookings
CREATE POLICY "Users can create payments for own bookings" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Contracts policies
-- Users can view contracts for their own bookings
CREATE POLICY "Users can view own contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = contracts.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Users can create contracts for their own bookings
CREATE POLICY "Users can create contracts for own bookings" ON contracts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = contracts.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Admins can view all contracts
CREATE POLICY "Admins can view all contracts" ON contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage all contracts
CREATE POLICY "Admins can manage all contracts" ON contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insurance documents policies
-- Users can view insurance documents for their own bookings
CREATE POLICY "Users can view own insurance documents" ON insurance_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = insurance_documents.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Users can create insurance documents for their own bookings
CREATE POLICY "Users can create insurance documents for own bookings" ON insurance_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = insurance_documents.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Users can update their own insurance documents
CREATE POLICY "Users can update own insurance documents" ON insurance_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = insurance_documents.booking_id
      AND bookings.customer_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = insurance_documents.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Admins can view all insurance documents
CREATE POLICY "Admins can view all insurance documents" ON insurance_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can manage all insurance documents
CREATE POLICY "Admins can manage all insurance documents" ON insurance_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users table policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Admins can manage all user profiles
CREATE POLICY "Admins can manage all profiles" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

