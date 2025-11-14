-- Add More Foreign Key Indexes for Performance
-- Date: 2025-01-22
-- Purpose: Add indexes on frequently-used foreign key columns

-- Core booking-related indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments("bookingId");
CREATE INDEX IF NOT EXISTS idx_contracts_booking_id ON public.contracts("bookingId");
CREATE INDEX IF NOT EXISTS idx_insurance_documents_booking_id ON public.insurance_documents("bookingId");
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_id ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_booking_id ON public.support_tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_equipment_id ON public.equipment_maintenance(equipment_id);

-- Add comments documenting performance improvements
COMMENT ON INDEX idx_payments_booking_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_contracts_booking_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_insurance_documents_booking_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_notifications_user_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_support_tickets_customer_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_support_tickets_assigned_to IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_support_tickets_booking_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';

COMMENT ON INDEX idx_equipment_maintenance_equipment_id IS
'PERFORMANCE: Index on foreign key for faster joins and lookups. Improves query performance.';
