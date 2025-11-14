#!/bin/bash

echo "🔍 Quality Automation - Starting automated quality checks..."

# Function to run quality check
run_quality_check() {
  local check_name="$1"
  local command="$2"
  
  echo "Running $check_name..."
  if eval "$command" > /dev/null 2>&1; then
    echo "✅ $check_name: PASSED"
    return 0
  else
    echo "❌ $check_name: FAILED"
    return 1
  fi
}

# Run all quality checks
echo "📊 Running comprehensive quality checks..."

# Type checking
run_quality_check "Type Check" "pnpm type-check"

# Linting
run_quality_check "Linting" "pnpm lint:fast"

# Formatting
run_quality_check "Formatting" "pnpm format:check"

# Tests
run_quality_check "Tests" "pnpm test:fast"

# Security audit
run_quality_check "Security Audit" "pnpm audit --audit-level moderate"

# Dependency check
run_quality_check "Dependency Check" "pnpm validate:dependencies"

echo "🎉 Quality automation complete!"
