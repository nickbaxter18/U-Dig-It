#!/bin/bash

# Implementation Verification Script
# Verifies all Supabase optimizations are properly implemented

set -e

echo "🔍 Supabase Feature Optimization - Implementation Verification"
echo "================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection (adjust as needed)
DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@localhost:54322/postgres}"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

check_pass() {
  echo -e "${GREEN}✅ PASS${NC}: $1"
  ((PASS_COUNT++))
}

check_fail() {
  echo -e "${RED}❌ FAIL${NC}: $1"
  ((FAIL_COUNT++))
}

check_warn() {
  echo -e "${YELLOW}⚠️  WARN${NC}: $1"
  ((WARN_COUNT++))
}

echo -e "${BLUE}Phase 1: Quick Wins${NC}"
echo "-------------------"

# Check pgvector
if psql "$DB_URL" -t -c "SELECT 1 FROM pg_extension WHERE extname = 'vector';" | grep -q 1; then
  check_pass "pgvector extension enabled"
else
  check_fail "pgvector extension not found"
fi

# Check PostGIS
if psql "$DB_URL" -t -c "SELECT 1 FROM pg_extension WHERE extname = 'postgis';" | grep -q 1; then
  check_pass "PostGIS extension enabled"
else
  check_fail "PostGIS extension not found"
fi

# Check vector search function
if psql "$DB_URL" -t -c "SELECT 1 FROM information_schema.routines WHERE routine_name = 'search_equipment_by_similarity';" | grep -q 1; then
  check_pass "Vector search function exists"
else
  check_fail "Vector search function not found"
fi

# Check geography columns
GEO_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE column_name LIKE '%geography%' AND table_name IN ('equipment', 'bookings', 'locations');" | xargs)
if [ "$GEO_COUNT" -ge 3 ]; then
  check_pass "Geography columns created ($GEO_COUNT found)"
else
  check_warn "Geography columns may be missing ($GEO_COUNT found, expected 3+)"
fi

echo ""
echo -e "${BLUE}Phase 2: Performance Optimizations${NC}"
echo "-----------------------------------"

# Check materialized views
MV_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public' AND matviewname LIKE 'mv_%';" | xargs)
if [ "$MV_COUNT" -ge 3 ]; then
  check_pass "Materialized views created ($MV_COUNT found)"
else
  check_fail "Materialized views missing ($MV_COUNT found, expected 3+)"
fi

# Check refresh function
if psql "$DB_URL" -t -c "SELECT 1 FROM information_schema.routines WHERE routine_name = 'refresh_dashboard_views';" | grep -q 1; then
  check_pass "Dashboard refresh function exists"
else
  check_fail "Dashboard refresh function not found"
fi

# Check pg_cron jobs
CRON_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM cron.job WHERE active = true AND jobname IN ('refresh-dashboard-views', 'cleanup-old-notifications', 'archive-old-audit-logs', 'generate-daily-analytics', 'storage-cleanup');" | xargs)
if [ "$CRON_COUNT" -ge 5 ]; then
  check_pass "Scheduled jobs created ($CRON_COUNT found)"
else
  check_warn "Some scheduled jobs may be missing ($CRON_COUNT found, expected 5)"
fi

# Check connection pool monitoring
if psql "$DB_URL" -t -c "SELECT 1 FROM information_schema.routines WHERE routine_name = 'check_connection_pool_health';" | grep -q 1; then
  check_pass "Connection pool health check exists"
else
  check_fail "Connection pool health check not found"
fi

echo ""
echo -e "${BLUE}Phase 3: Advanced Features${NC}"
echo "----------------------------"

# Check pg_graphql
if psql "$DB_URL" -t -c "SELECT 1 FROM pg_extension WHERE extname = 'pg_graphql';" | grep -q 1; then
  check_pass "pg_graphql extension enabled"
else
  check_fail "pg_graphql extension not found"
fi

# Check HTTP extension
if psql "$DB_URL" -t -c "SELECT 1 FROM pg_extension WHERE extname = 'http';" | grep -q 1; then
  check_pass "HTTP extension enabled"
else
  check_fail "HTTP extension not found"
fi

# Check webhook tables
if psql "$DB_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_endpoints';" | grep -q 1; then
  check_pass "Webhook endpoints table exists"
else
  check_fail "Webhook endpoints table not found"
fi

if psql "$DB_URL" -t -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_events';" | grep -q 1; then
  check_pass "Webhook events table exists"
else
  check_fail "Webhook events table not found"
fi

# Check webhook trigger
if psql "$DB_URL" -t -c "SELECT 1 FROM pg_trigger WHERE tgname = 'trg_booking_webhook';" | grep -q 1; then
  check_pass "Booking webhook trigger exists"
else
  check_fail "Booking webhook trigger not found"
fi

echo ""
echo -e "${BLUE}Phase 4: Infrastructure & Reliability${NC}"
echo "----------------------------------------"

# Check storage cleanup functions
if psql "$DB_URL" -t -c "SELECT 1 FROM information_schema.routines WHERE routine_name = 'cleanup_orphaned_files';" | grep -q 1; then
  check_pass "Storage cleanup function exists"
else
  check_fail "Storage cleanup function not found"
fi

if psql "$DB_URL" -t -c "SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_storage_usage_stats';" | grep -q 1; then
  check_pass "Storage usage stats function exists"
else
  check_fail "Storage usage stats function not found"
fi

# Check storage cleanup job
if psql "$DB_URL" -t -c "SELECT 1 FROM cron.job WHERE jobname = 'storage-cleanup' AND active = true;" | grep -q 1; then
  check_pass "Storage cleanup job scheduled"
else
  check_fail "Storage cleanup job not found"
fi

echo ""
echo "================================================================"
echo "Verification Summary"
echo "================================================================"
echo -e "${GREEN}✅ Passed: $PASS_COUNT${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}✅ All critical checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Please review above.${NC}"
  exit 1
fi


