#!/bin/bash

# Systematically test all directories and generate report
# This prevents crashes by testing one directory at a time

echo "🧪 Comprehensive Test Suite Analysis"
echo "===================================="
echo ""

RESULTS_FILE="test-results.txt"
> $RESULTS_FILE

# Test directories
DIRS=(
  "src/lib/__tests__"
  "src/components/auth/__tests__"
  "src/components/admin/__tests__"
  "src/components/booking/__tests__"
  "src/components/contracts/__tests__"
  "src/components/providers/__tests__"
  "src/app/api/__tests__"
  "src/lib/validators/__tests__"
  "src/lib/supabase/__tests__"
)

TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_FILES=0

for DIR in "${DIRS[@]}"; do
  if [ ! -d "$DIR" ]; then
    echo "⏭️  Skipping $DIR (not found)"
    continue
  fi
  
  echo "Testing: $DIR"
  
  # Run tests with timeout
  OUTPUT=$(timeout 30 pnpm vitest "$DIR" --run 2>&1)
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 124 ]; then
    echo "  ⏱️  TIMEOUT"
    echo "$DIR: TIMEOUT" >> $RESULTS_FILE
  elif [ $EXIT_CODE -eq 0 ]; then
    # Extract results
    PASSED=$(echo "$OUTPUT" | grep "Test Files" | grep -oP '\d+ passed' | head -1 | grep -oP '\d+')
    TESTS_PASSED=$(echo "$OUTPUT" | grep "Tests" | grep -oP '\d+ passed' | head -1 | grep -oP '\d+')
    
    echo "  ✅ PASSED ($PASSED files, $TESTS_PASSED tests)"
    echo "$DIR: PASSED - $PASSED files, $TESTS_PASSED tests" >> $RESULTS_FILE
    
    TOTAL_PASSED=$((TOTAL_PASSED + ${TESTS_PASSED:-0}))
    TOTAL_FILES=$((TOTAL_FILES + ${PASSED:-0}))
  else
    # Extract results
    PASSED=$(echo "$OUTPUT" | grep "Test Files" | grep -oP '\d+ passed' | head -1 | grep -oP '\d+')
    FAILED=$(echo "$OUTPUT" | grep "Test Files" | grep -oP '\d+ failed' | head -1 | grep -oP '\d+')
    TESTS_PASSED=$(echo "$OUTPUT" | grep "Tests" | grep -oP '\d+ passed' | head -1 | grep -oP '\d+')
    TESTS_FAILED=$(echo "$OUTPUT" | grep "Tests" | grep -oP '\d+ failed' | head -1 | grep -oP '\d+')
    
    echo "  ❌ FAILED ($FAILED files failed, $PASSED files passed)"
    echo "     Tests: $TESTS_FAILED failed, $TESTS_PASSED passed"
    echo "$DIR: FAILED - $FAILED files failed, $PASSED passed - Tests: $TESTS_FAILED failed, $TESTS_PASSED passed" >> $RESULTS_FILE
    
    TOTAL_PASSED=$((TOTAL_PASSED + ${TESTS_PASSED:-0}))
    TOTAL_FAILED=$((TOTAL_FAILED + ${TESTS_FAILED:-0}))
    TOTAL_FILES=$((TOTAL_FILES + ${PASSED:-0} + ${FAILED:-0}))
  fi
  
  echo ""
  sleep 1
done

echo "===================================="
echo "📊 Final Summary"
echo "===================================="
echo "Total Files: $TOTAL_FILES"
echo "Total Tests Passed: $TOTAL_PASSED"
echo "Total Tests Failed: $TOTAL_FAILED"
echo ""
echo "Results saved to: $RESULTS_FILE"

cat $RESULTS_FILE

