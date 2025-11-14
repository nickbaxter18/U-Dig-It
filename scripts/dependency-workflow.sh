#!/bin/bash

echo "🔄 Smart Dependency Management Workflow - Starting..."

# Function to run dependency check
run_dependency_check() {
  echo "📦 Running dependency check..."
  if pnpm validate:dependencies > /dev/null 2>&1; then
    echo "✅ Dependencies: VALID"
    return 0
  else
    echo "❌ Dependencies: INVALID"
    return 1
  fi
}

# Function to run security audit
run_security_audit() {
  echo "🔒 Running security audit..."
  if pnpm audit --audit-level moderate > /dev/null 2>&1; then
    echo "✅ Security: PASSED"
    return 0
  else
    echo "❌ Security: FAILED"
    return 1
  fi
}

# Function to update dependencies
update_dependencies() {
  echo "🔄 Updating dependencies..."
  if pnpm update --recursive > /dev/null 2>&1; then
    echo "✅ Dependencies updated successfully"
    return 0
  else
    echo "❌ Failed to update dependencies"
    return 1
  fi
}

# Run dependency management workflow
echo "🚀 Starting smart dependency management..."

# Check current status
run_dependency_check
run_security_audit

# Update if needed
echo "🔄 Checking for updates..."
if pnpm outdated > /dev/null 2>&1; then
  echo "📦 Updates available - updating dependencies..."
  update_dependencies
else
  echo "✅ All dependencies are up to date"
fi

# Final verification
echo "🔍 Final verification..."
run_dependency_check
run_security_audit

echo "🎉 Smart dependency management complete!"
