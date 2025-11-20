-- Add Missing Indexes for RLS Policies and Performance
-- Date: 2025-11-18
-- Purpose: Add critical indexes for RLS policies and booking availability queries
-- Reference: @Supabase RLS and @Supabase Platform Advisors best practices

-- ============================================================================
-- Critical Index 1: Booking Availability Composite Index
-- ============================================================================
-- This is THE most important index for booking availability queries
-- Reference: Audit finding #12 - suggested but never created
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_availability
ON bookings(equipment_id, start_date, end_date)
WHERE status NOT IN ('cancelled', 'rejected', 'completed');

COMMENT ON INDEX idx_bookings_availability IS
'Critical for availability queries. Filters active bookings by equipment and date range. Expected 10-100x performance improvement.';

-- ============================================================================
-- RLS Policy Support Indexes
-- ============================================================================

-- Index 2: Users role lookup (used in MANY RLS policies)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role
ON users(role)
WHERE role IN ('admin', 'super_admin');

COMMENT ON INDEX idx_users_role IS
'Supports RLS policies that check admin/super_admin roles. Used in 20+ policies.';

-- Index 3: Users ID + Role composite (even faster for RLS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_role
ON users(id, role);

COMMENT ON INDEX idx_users_id_role IS
'Composite index for RLS policies that check both user ID and role simultaneously.';

-- Index 4: Equipment maintenance date lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_maintenance_date
ON equipment_maintenance(equipment_id, scheduled_date)
WHERE status = 'scheduled';

COMMENT ON INDEX idx_equipment_maintenance_date IS
'Supports equipment availability checks that consider maintenance windows.';

-- Index 5: Notifications user + type (for RLS and queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_type
ON notifications(user_id, type);

COMMENT ON INDEX idx_notifications_user_type IS
'Supports notification queries filtered by user and type (in_app, email, etc).';

-- Index 6: ID verification requests user lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_id_verification_user_id
ON id_verification_requests(user_id);

COMMENT ON INDEX idx_id_verification_user_id IS
'Supports RLS policy "Users can update own id verification requests".';

-- Index 7: Bookings customer + status (very common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_customer_status
ON bookings(customer_id, status);

COMMENT ON INDEX idx_bookings_customer_status IS
'Supports user dashboard queries showing bookings by status.';

-- Index 8: Bookings created date descending (for pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_created_desc
ON bookings(created_at DESC);

COMMENT ON INDEX idx_bookings_created_desc IS
'Supports admin dashboard showing recent bookings first.';

-- Index 9: Payments booking + status lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_booking_status
ON payments(booking_id, status);

COMMENT ON INDEX idx_payments_booking_status IS
'Supports payment status checks for booking completion logic.';

-- Index 10: API usage user + endpoint (for rate limiting and analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_user_endpoint
ON api_usage(user_id, endpoint, created_at DESC);

COMMENT ON INDEX idx_api_usage_user_endpoint IS
'Supports API usage analytics and rate limiting lookups.';

-- ============================================================================
-- Analyze tables to update statistics
-- ============================================================================
ANALYZE bookings;
ANALYZE users;
ANALYZE equipment_maintenance;
ANALYZE notifications;
ANALYZE id_verification_requests;
ANALYZE payments;
ANALYZE api_usage;

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
-- ORDER BY tablename, indexname;

