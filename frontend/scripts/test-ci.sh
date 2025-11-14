#!/bin/bash

# CI/CD Test Runner
# Runs all tests in batches to prevent crashes and generates comprehensive reports

set -e

echo "🔍 CI/CD Test Suite"
echo "==================="
echo ""

# Test directories in order of priority
DIRECTORIES=(
  "src/lib/__tests__"
  "src/components/auth/__tests__"
  "src/components/providers/__tests__"
  "src/app/api/admin/__tests__"
  "src/app/api/__tests__"
  "src/components/admin/__tests__"
  "src/components/booking/__tests__"
  "src/components/contracts/__tests__"
  "src/lib/validators/__tests__"
  "src/lib/supabase/__tests__"
)

TOTAL_PASSED=0
TOTAL_FAILED=0
FAILED_DIRS=()

for DIR in "${DIRECTORIES[@]}"; do
  if [ ! -d "$DIR" ]; then
    echo "⏭️  Skipping $DIR (not found)"
    continue
  fi

  echo "📁 Testing: $DIR"

  if timeout 60 pnpm vitest "$DIR" --run --reporter=basic 2>&1 | grep -q "Test Files.*passed"; then
    RESULT=$(pnpm vitest "$DIR" --run 2>&1 | grep "Test Files" || echo "")
    PASSED=$(echo "$RESULT" | grep -oP '\d+ passed' | grep -oP '\d+' || echo "0")

    echo "  ✅ Passed ($PASSED files)"
    TOTAL_PASSED=$((TOTAL_PASSED + ${PASSED:-0}))
  else
    RESULT=$(pnpm vitest "$DIR" --run 2>&1 | grep "Test Files" || echo "")
    FAILED=$(echo "$RESULT" | grep -oP '\d+ failed' | grep -oP '\d+' || echo "0")
    PASSED=$(echo "$RESULT" | grep -oP '\d+ passed' | grep -oP '\d+' || echo "0")

    echo "  ❌ Failed ($FAILED failed, $PASSED passed)"
    TOTAL_FAILED=$((TOTAL_FAILED + ${FAILED:-0}))
    FAILED_DIRS+=("$DIR")
  fi

  echo ""
done

echo "==================="
echo "📊 Final Results"
echo "==================="
echo "Passed: $TOTAL_PASSED directories"
echo "Failed: $TOTAL_FAILED directories"
echo ""

if [ $TOTAL_FAILED -gt 0 ]; then
  echo "❌ Failed directories:"
  printf '%s\n' "${FAILED_DIRS[@]}"
  exit 1
else
  echo "✅ All tests passed!"
  exit 0
fi

