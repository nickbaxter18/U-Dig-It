#!/bin/bash

# Comprehensive Test Runner for Kubota Rental Platform
# Runs all test categories and generates coverage reports

set -e

echo "🧪 Kubota Rental Platform - Comprehensive Test Suite"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test category
run_test_category() {
  local category=$1
  local pattern=$2

  echo -e "${BLUE}🔍 Running $category tests...${NC}"

  if pnpm test -- "$pattern" --run --reporter=verbose; then
    echo -e "${GREEN}✅ $category tests passed${NC}"
    return 0
  else
    echo -e "${RED}❌ $category tests failed${NC}"
    return 1
  fi
}

# 1. Unit Tests
echo -e "${YELLOW}📦 Phase 1: Unit Tests${NC}"
echo "========================================"

run_test_category "Logger" "src/lib/__tests__/logger.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Rate Limiter" "src/lib/__tests__/rate-limiter.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Input Sanitizer" "src/lib/__tests__/input-sanitizer.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Validation" "src/lib/__tests__/validation.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Request Validator" "src/lib/__tests__/request-validator.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "HTML Sanitizer" "src/lib/__tests__/html-sanitizer.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Password Validator" "src/lib/validators/__tests__/password.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))

echo ""

# 2. Component Tests
echo -e "${YELLOW}🎨 Phase 2: Component Tests${NC}"
echo "========================================"

run_test_category "Navigation" "src/components/__tests__/Navigation.test.tsx" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Toast" "src/components/__tests__/Toast.test.tsx" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Booking Flow" "src/components/__tests__/BookingFlow.test.tsx" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Booking Confirmed Modal" "src/components/__tests__/BookingConfirmedModal.test.tsx" || FAILED_TESTS=$((FAILED_TESTS + 1))

echo ""

# 3. API Route Tests
echo -e "${YELLOW}🌐 Phase 3: API Route Tests${NC}"
echo "========================================"

run_test_category "Bookings API" "src/app/api/__tests__/bookings-route.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))
run_test_category "Stripe Checkout API" "src/app/api/__tests__/stripe-checkout.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))

echo ""

# 4. Integration Tests
echo -e "${YELLOW}🔗 Phase 4: Integration Tests${NC}"
echo "========================================"

run_test_category "Supabase Integration" "src/__tests__/supabase-integration.test.ts" || FAILED_TESTS=$((FAILED_TESTS + 1))

echo ""

# 5. E2E Tests
echo -e "${YELLOW}🎭 Phase 5: E2E Tests${NC}"
echo "========================================"

echo -e "${BLUE}Running Playwright E2E tests...${NC}"
if pnpm test:e2e; then
  echo -e "${GREEN}✅ E2E tests passed${NC}"
else
  echo -e "${RED}❌ E2E tests failed${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""

# 6. Generate Coverage Report
echo -e "${YELLOW}📊 Phase 6: Coverage Report${NC}"
echo "========================================"

echo -e "${BLUE}Generating coverage report...${NC}"
pnpm test:coverage

echo ""

# 7. Summary
echo -e "${YELLOW}📈 Test Summary${NC}"
echo "========================================"

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All test categories passed!${NC}"
  echo ""
  echo "🎉 Success! The Kubota Rental Platform is fully tested and verified."
  exit 0
else
  echo -e "${RED}❌ $FAILED_TESTS test category(ies) failed${NC}"
  echo ""
  echo "⚠️  Please review the failing tests and fix any issues."
  exit 1
fi


