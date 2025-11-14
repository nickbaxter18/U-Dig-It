#!/bin/bash

# Safe Test Runner - Tests in small batches to prevent crashes
# Usage: bash test-safe.sh [directory]

echo "🧪 Safe Test Runner - Testing in small batches"
echo "==============================================="

# Default to testing all if no argument provided
TARGET="${1:-src}"

echo "📁 Target: $TARGET"
echo ""

# Find all test files
TEST_FILES=$(find "$TARGET" -name "*.test.ts" -o -name "*.test.tsx" | sort)
TOTAL=$(echo "$TEST_FILES" | wc -l | xargs)

echo "Found $TOTAL test files"
echo ""

# Test each file individually
PASSED=0
FAILED=0
FAILED_FILES=()

while IFS= read -r file; do
  if [ -n "$file" ]; then
    echo "Testing: $file"

    # Run single test file with minimal output
    if pnpm vitest "$file" --run --reporter=dot 2>&1 | grep -q "Test Files.*passed"; then
      ((PASSED++))
      echo "  ✅ PASSED"
    else
      ((FAILED++))
      FAILED_FILES+=("$file")
      echo "  ❌ FAILED"
    fi

    echo ""

    # Small delay to prevent memory issues
    sleep 0.5
  fi
done <<< "$TEST_FILES"

# Summary
echo "==============================================="
echo "📊 Test Summary"
echo "==============================================="
echo "Total:  $TOTAL files"
echo "Passed: $PASSED files"
echo "Failed: $FAILED files"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "❌ Failed Files:"
  printf '%s\n' "${FAILED_FILES[@]}"
  exit 1
else
  echo "✅ All tests passed!"
  exit 0
fi

