#!/bin/bash

# Comprehensive Test Analysis Script
# Tests every directory and generates detailed report

set -e

echo "🔬 Comprehensive Test Analysis"
echo "==============================="
echo ""

# Output file
REPORT="test-analysis-detailed.txt"
> $REPORT

echo "Test Analysis Report" > $REPORT
echo "===================" >> $REPORT
echo "" >> $REPORT

# Track totals
TOTAL_FILES=0
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0

# Find all test directories
TEST_DIRS=$(ls -d src/**/__tests__ 2>/dev/null || echo "")

for DIR in $TEST_DIRS; do
  if [ ! -d "$DIR" ]; then
    continue
  fi

  FILE_COUNT=$(ls $DIR/*.test.* 2>/dev/null | wc -l)

  if [ $FILE_COUNT -eq 0 ]; then
    continue
  fi

  echo "📁 Testing: $DIR ($FILE_COUNT files)"
  echo "Testing: $DIR ($FILE_COUNT files)" >> $REPORT

  # Run tests with timeout
  OUTPUT=$(timeout 60 pnpm vitest "$DIR" --run 2>&1 || echo "TIMEOUT")

  if echo "$OUTPUT" | grep -q "TIMEOUT"; then
    echo "  ⏱️  TIMEOUT (>60s)"
    echo "  Status: TIMEOUT" >> $REPORT
  elif echo "$OUTPUT" | grep -q "Test Files"; then
    FILES_PASSED=$(echo "$OUTPUT" | grep "Test Files" | grep -o "[0-9]* passed" | grep -o "[0-9]*" || echo "0")
    FILES_FAILED=$(echo "$OUTPUT" | grep "Test Files" | grep -o "[0-9]* failed" | grep -o "[0-9]*" || echo "0")
    TESTS_PASSED=$(echo "$OUTPUT" | grep "Tests" | grep -o "[0-9]* passed" | head -1 | grep -o "[0-9]*" || echo "0")
    TESTS_FAILED=$(echo "$OUTPUT" | grep "Tests" | grep -o "[0-9]* failed" | head -1 | grep -o "[0-9]*" || echo "0")

    FILES_TOTAL=$((FILES_PASSED + FILES_FAILED))
    TESTS_TOTAL=$((TESTS_PASSED + TESTS_FAILED))

    if [ $FILES_FAILED -eq 0 ]; then
      echo "  ✅ PASSED - $FILES_TOTAL files, $TESTS_PASSED tests"
    else
      echo "  ⚠️  MIXED - $FILES_PASSED passed/$FILES_FAILED failed files, $TESTS_PASSED/$TESTS_FAILED tests"
    fi

    echo "  Files: $FILES_PASSED passed, $FILES_FAILED failed" >> $REPORT
    echo "  Tests: $TESTS_PASSED passed, $TESTS_FAILED failed" >> $REPORT

    TOTAL_FILES=$((TOTAL_FILES + FILES_TOTAL))
    TOTAL_TESTS=$((TOTAL_TESTS + TESTS_TOTAL))
    TOTAL_PASSED=$((TOTAL_PASSED + TESTS_PASSED))
    TOTAL_FAILED=$((TOTAL_FAILED + TESTS_FAILED))
  fi

  echo "" >> $REPORT
  echo ""
done

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
  PASS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
else
  PASS_RATE=0
fi

echo "==============================="
echo "📊 FINAL TOTALS"
echo "==============================="
echo "Test Files: $TOTAL_FILES"
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $TOTAL_PASSED"
echo "Failed: $TOTAL_FAILED"
echo "Pass Rate: ${PASS_RATE}%"
echo ""

echo "===============================" >> $REPORT
echo "FINAL TOTALS" >> $REPORT
echo "===============================" >> $REPORT
echo "Test Files: $TOTAL_FILES" >> $REPORT
echo "Total Tests: $TOTAL_TESTS" >> $REPORT
echo "Passed: $TOTAL_PASSED" >> $REPORT
echo "Failed: $TOTAL_FAILED" >> $REPORT
echo "Pass Rate: ${PASS_RATE}%" >> $REPORT

echo "Report saved to: $REPORT"
cat $REPORT

