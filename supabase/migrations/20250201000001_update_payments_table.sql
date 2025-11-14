-- Update payments table for Stripe checkout integration
-- Add missing columns for payment tracking

-- Add payment_number column for unique payment identifiers
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_number VARCHAR(50) UNIQUE;

-- Add type column to differentiate payment types (payment, deposit)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'payment';

-- Add method column (alias for payment_method for consistency)
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS method VARCHAR(50);

-- Add stripe_session_id for Stripe Checkout tracking
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(100);

-- Add processed_at timestamp for completed payments
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have proper payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('payments_sequence')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for payment numbers
CREATE SEQUENCE IF NOT EXISTS payments_sequence START 1;

-- Create trigger to auto-generate payment numbers
DROP TRIGGER IF NOT EXISTS generate_payment_number_trigger ON payments;
CREATE TRIGGER generate_payment_number_trigger
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_number();

-- Sync method column with payment_method for existing records
UPDATE payments SET method = payment_method WHERE method IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON payments(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_processed_at ON payments(processed_at) WHERE processed_at IS NOT NULL;

-- Update payment_method to be nullable (method column is now used)
ALTER TABLE payments
ALTER COLUMN payment_method DROP NOT NULL;

COMMENT ON COLUMN payments.type IS 'Payment type: payment (rental fee) or deposit (security deposit)';
COMMENT ON COLUMN payments.method IS 'Payment method: stripe, cash, check, wire_transfer';
COMMENT ON COLUMN payments.stripe_session_id IS 'Stripe Checkout Session ID for tracking checkout payments';
COMMENT ON COLUMN payments.processed_at IS 'Timestamp when payment was successfully processed';
COMMENT ON COLUMN payments.payment_number IS 'Unique payment identifier (e.g., PAY-20250201-000001)';



