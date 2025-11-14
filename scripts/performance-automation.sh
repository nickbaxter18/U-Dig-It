#!/bin/bash

echo "⚡ Performance Automation - Starting comprehensive performance optimization..."

# Function to run performance check
run_performance_check() {
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

# Run all performance checks
echo "📊 Running comprehensive performance checks..."

# CDN optimization
run_performance_check "CDN Optimization" "node scripts/cdn-optimizer.js"

# Cache optimization
run_performance_check "Cache Optimization" "node scripts/cache-optimizer.js"

# Bundle analysis
run_performance_check "Bundle Analysis" "node scripts/bundle-analyzer.js"

# Performance monitoring
run_performance_check "Performance Monitoring" "node scripts/performance-monitor.js"

# Generate performance report
echo "📊 Generating performance report..."
node scripts/performance-monitor.js > performance-report.txt 2>&1

echo "🎉 Performance automation complete!"
echo "📄 Performance report saved to performance-report.txt"
