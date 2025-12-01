#!/bin/bash

# Performance Benchmarking Script
# Tests performance improvements from Supabase optimizations

set -e

echo "🚀 Supabase Feature Optimization - Performance Benchmarking"
echo "============================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database connection (adjust as needed)
DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@localhost:54322/postgres}"

echo "📊 Benchmark 1: Dashboard Materialized View Query"
echo "---------------------------------------------------"
echo "Testing: SELECT * FROM mv_dashboard_overview"
echo ""

START_TIME=$(date +%s%N)
psql "$DB_URL" -c "SELECT * FROM mv_dashboard_overview;" > /dev/null 2>&1
END_TIME=$(date +%s%N)
DURATION=$((($END_TIME - $START_TIME) / 1000000))

if [ $DURATION -lt 100 ]; then
  echo -e "${GREEN}✅ PASS${NC}: ${DURATION}ms (Target: <100ms)"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: ${DURATION}ms (Target: <100ms)"
fi
echo ""

echo "📊 Benchmark 2: Vector Search Query"
echo "---------------------------------------------------"
echo "Testing: search_equipment_by_similarity function"
echo ""

# Create a test embedding vector (1536 dimensions)
TEST_VECTOR=$(python3 -c "import json; print(json.dumps([0.1] * 1536))" 2>/dev/null || echo "[0.1,0.1,0.1]")

START_TIME=$(date +%s%N)
psql "$DB_URL" -c "SELECT COUNT(*) FROM search_equipment_by_similarity('${TEST_VECTOR}'::vector(1536), 0.7, 20, NULL);" > /dev/null 2>&1
END_TIME=$(date +%s%N)
DURATION=$((($END_TIME - $START_TIME) / 1000000))

if [ $DURATION -lt 50 ]; then
  echo -e "${GREEN}✅ PASS${NC}: ${DURATION}ms (Target: <50ms)"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: ${DURATION}ms (Target: <50ms)"
fi
echo ""

echo "📊 Benchmark 3: PostGIS Distance Calculation"
echo "---------------------------------------------------"
echo "Testing: calculate_delivery_distance_km function"
echo ""

# Get a test booking ID (if available)
BOOKING_ID=$(psql "$DB_URL" -t -c "SELECT id FROM bookings WHERE delivery_location_geography IS NOT NULL LIMIT 1;" 2>/dev/null | xargs)

if [ -n "$BOOKING_ID" ]; then
  START_TIME=$(date +%s%N)
  psql "$DB_URL" -c "SELECT calculate_delivery_distance_km('${BOOKING_ID}');" > /dev/null 2>&1
  END_TIME=$(date +%s%N)
  DURATION=$((($END_TIME - $START_TIME) / 1000000))

  if [ $DURATION -lt 10 ]; then
    echo -e "${GREEN}✅ PASS${NC}: ${DURATION}ms (Target: <10ms)"
  else
    echo -e "${YELLOW}⚠️  WARNING${NC}: ${DURATION}ms (Target: <10ms)"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC}: No bookings with delivery location found"
fi
echo ""

echo "📊 Benchmark 4: Materialized View Refresh"
echo "---------------------------------------------------"
echo "Testing: refresh_dashboard_views() function"
echo ""

START_TIME=$(date +%s%N)
psql "$DB_URL" -c "SELECT refresh_dashboard_views();" > /dev/null 2>&1
END_TIME=$(date +%s%N)
DURATION=$((($END_TIME - $START_TIME) / 1000000))

if [ $DURATION -lt 5000 ]; then
  echo -e "${GREEN}✅ PASS${NC}: ${DURATION}ms (Target: <5s)"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: ${DURATION}ms (Target: <5s)"
fi
echo ""

echo "📊 Benchmark 5: Connection Pool Health Check"
echo "---------------------------------------------------"
echo "Testing: check_connection_pool_health() function"
echo ""

START_TIME=$(date +%s%N)
psql "$DB_URL" -c "SELECT * FROM check_connection_pool_health();" > /dev/null 2>&1
END_TIME=$(date +%s%N)
DURATION=$((($END_TIME - $START_TIME) / 1000000))

if [ $DURATION -lt 100 ]; then
  echo -e "${GREEN}✅ PASS${NC}: ${DURATION}ms (Target: <100ms)"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: ${DURATION}ms (Target: <100ms)"
fi
echo ""

echo "============================================================"
echo "✅ Benchmarking Complete"
echo ""
echo "📝 Note: These benchmarks test database-level performance."
echo "   For full end-to-end testing, use the testing guide:"
echo "   docs/TESTING_VALIDATION.md"
echo ""


