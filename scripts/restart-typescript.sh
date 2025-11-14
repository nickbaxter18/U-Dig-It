#!/bin/bash

# Script to restart TypeScript language service
echo "Restarting TypeScript language service..."

# Kill any existing TypeScript processes
pkill -f "typescript"

# Clear TypeScript cache
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
find . -name ".tscache" -type d -exec rm -rf {} + 2>/dev/null || true

echo "TypeScript service restarted. Please reload VS Code window (Ctrl+Shift+P -> 'Developer: Reload Window')"
