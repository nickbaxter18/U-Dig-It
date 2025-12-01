-- Add Remaining Critical Indexes
-- Date: 2025-01-27
-- Purpose: Add missing indexes for booking availability queries and other critical paths
-- Reference: Comprehensive Code Audit - HIGH-2

-- ============================================================================
-- Critical Index 1: Booking Actual Dates (for availability queries)
-- ============================================================================
-- These indexes support the fixed availability check that uses actualStartDate/actualEndDate
-- for active rentals. Critical for the booking availability fix.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_actual_start_date
ON bookings("actualStartDate")
WHERE "actualStartDate" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_actual_end_date
ON bookings("actualEndDate")
WHERE "actualEndDate" IS NOT NULL;

-- Composite index for active rental availability queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_active_rental_dates
ON bookings("equipmentId", "actualStartDate", "actualEndDate")
WHERE status IN ('active', 'in_progress')
  AND "actualStartDate" IS NOT NULL
  AND "actualEndDate" IS NOT NULL;

COMMENT ON INDEX idx_bookings_actual_start_date IS
'Supports availability queries for active rentals using actualStartDate. Critical for booking availability check fix.';

COMMENT ON INDEX idx_bookings_actual_end_date IS
'Supports availability queries for active rentals using actualEndDate. Critical for booking availability check fix.';

COMMENT ON INDEX idx_bookings_active_rental_dates IS
'Composite index for active rental availability queries. Filters by equipment, actual dates, and active status.';

-- ============================================================================
-- Critical Index 2: Booking Status + Date Composite (common query pattern)
-- ============================================================================
-- Supports queries that filter by status and date range simultaneously
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status_start_date
ON bookings(status, "startDate")
WHERE status NOT IN ('cancelled', 'rejected', 'completed');

COMMENT ON INDEX idx_bookings_status_start_date IS
'Supports common query pattern: filter bookings by status and start date. Used in dashboard and reporting queries.';

-- ============================================================================
-- Critical Index 3: Equipment Status + Type (for availability queries)
-- ============================================================================
-- Supports equipment search and availability filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_status_type
ON equipment(status, type)
WHERE status = 'available';

COMMENT ON INDEX idx_equipment_status_type IS
'Supports equipment search queries filtering by status and type. Common in equipment catalog queries.';

-- ============================================================================
-- Critical Index 4: Payments Status + Created Date (for reporting)
-- ============================================================================
-- Supports payment reporting and analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created
ON payments(status, created_at DESC);

COMMENT ON INDEX idx_payments_status_created IS
'Supports payment reporting queries filtering by status and sorting by creation date.';

-- ============================================================================
-- Critical Index 5: Contracts Status + Booking (for completion tracking)
-- ============================================================================
-- Supports contract completion and status tracking queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_status_booking
ON contracts(status, "bookingId")
WHERE status IN ('pending', 'sent', 'signed');

COMMENT ON INDEX idx_contracts_status_booking IS
'Supports contract status tracking queries. Used in booking completion logic.';

-- ============================================================================
-- Critical Index 6: Insurance Documents Expiry (for reminders)
-- ============================================================================
-- Supports insurance expiry reminder queries (mentioned in audit as missing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_documents_expires_at
ON insurance_documents("expiresAt")
WHERE "expiresAt" IS NOT NULL;

COMMENT ON INDEX idx_insurance_documents_expires_at IS
'Supports insurance expiry reminder queries. Identified as missing in schema audit.';

-- ============================================================================
-- Critical Index 7: Support Tickets Status + Created (for dashboard)
-- ============================================================================
-- Supports support ticket dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_status_created
ON support_tickets(status, created_at DESC);

COMMENT ON INDEX idx_support_tickets_status_created IS
'Supports support ticket dashboard queries filtering by status and sorting by creation date.';

-- ============================================================================
-- Analyze tables to update statistics
-- ============================================================================
ANALYZE bookings;
ANALYZE equipment;
ANALYZE payments;
ANALYZE contracts;
ANALYZE insurance_documents;
ANALYZE support_tickets;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify all indexes were created successfully:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%'
--   AND indexname IN (
--     'idx_bookings_actual_start_date',
--     'idx_bookings_actual_end_date',
--     'idx_bookings_active_rental_dates',
--     'idx_bookings_status_start_date',
--     'idx_equipment_status_type',
--     'idx_payments_status_created',
--     'idx_contracts_status_booking',
--     'idx_insurance_documents_expires_at',
--     'idx_support_tickets_status_created'
--   )
-- ORDER BY tablename, indexname;

