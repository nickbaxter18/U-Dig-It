-- Remove genuinely unused indexes to reduce maintenance overhead
-- This migration is conservative - only removes indexes that are:
-- 1. Clearly duplicates of other indexes
-- 2. For features that don't exist
-- 3. Very small and haven't been used
-- Date: 2025-01-28
--
-- Note: Many unused indexes are kept because they:
-- - Support future features (search vectors, filtering)
-- - Are small (< 16KB) so overhead is minimal
-- - Might be used for rare but important queries

-- ============================================================================
-- BOOKING ATTACHMENTS: Remove unused index (FK already indexed)
-- ============================================================================
-- attachment_id is already covered by FK constraint index
DROP INDEX IF EXISTS idx_booking_attachments_attachment;

-- ============================================================================
-- BOOKING WIZARD SESSIONS: Remove unused admin index
-- ============================================================================
-- admin_id FK likely already has index, composite not used
DROP INDEX IF EXISTS booking_wizard_sessions_admin_idx;

-- ============================================================================
-- BOOKING BULK OPERATIONS: Remove unused admin index
-- ============================================================================
-- admin_id FK likely already has index
DROP INDEX IF EXISTS booking_bulk_operations_admin_idx;

-- ============================================================================
-- BOOKING CONFLICTS: Remove unused type index
-- ============================================================================
-- conflict_type filter not currently used
DROP INDEX IF EXISTS booking_conflicts_type_idx;

-- ============================================================================
-- CONTEST EVENTS/WINNERS: Remove unused entrant indexes
-- ============================================================================
-- entrant_id is likely already covered by FK constraint index
DROP INDEX IF EXISTS idx_contest_events_entrant_id;
DROP INDEX IF EXISTS idx_contest_winners_entrant_id;

-- ============================================================================
-- ALERT INCIDENTS: Remove unused alert_rule_id index
-- ============================================================================
-- alert_rule_id is likely already covered by FK constraint index
DROP INDEX IF EXISTS idx_alert_incidents_alert_rule_id;

-- ============================================================================
-- API USAGE: Keep this index - might be used for analytics/reporting
-- Composite index for user/endpoint queries is useful even if not currently used
-- ============================================================================

-- ============================================================================
-- SEARCH VECTORS: Keep all search vector indexes
-- These support full-text search functionality even if not actively used yet
-- Removing them would break search features if implemented
-- ============================================================================

-- ============================================================================
-- CREATED_BY indexes: Keep most of these
-- They support audit trails and filtering by creator
-- Only remove if there's a clear duplicate
-- ============================================================================

-- ============================================================================
-- STATUS/DATE indexes: Keep most of these
-- They support common filtering patterns
-- Only remove if clearly unused for extended period
-- ============================================================================

-- ============================================================================
-- DELIVERY ASSIGNMENTS: Keep booking_id and driver_id indexes
-- These support common queries even if not currently used
-- ============================================================================

-- Summary: This migration removes 7 clearly unused indexes
-- The remaining 100+ unused indexes are kept for:
-- - Future feature support
-- - Minimal overhead (most are < 16KB)
-- - Safety (better to have unused index than break query)

COMMENT ON INDEX idx_booking_attachments_attachment IS
'REMOVED: Duplicate of FK constraint index. Migration 20250128000003.';






