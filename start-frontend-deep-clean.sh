#!/bin/bash

# Deep Clean Frontend Startup Script for PNPM project
# ⚠️ USE ONLY WHEN EXPERIENCING CACHE CORRUPTION ISSUES
# This script clears ALL caches and should NOT be used for normal development

echo "⚠️  DEEP CLEAN MODE - Clearing ALL caches..."
echo "    This should only be used when experiencing cache corruption"
echo ""

# Kill anything on ports 3000 and 3001
lsof -ti:3000 | xargs -r kill -9 2>/dev/null
lsof -ti:3001 | xargs -r kill -9 2>/dev/null

# Kill all Next.js dev processes
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "next-server" 2>/dev/null

# Wait a moment for cleanup
sleep 2

# Verify port 3000 is free
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "❌ ERROR: Port 3000 is still in use after cleanup!"
    echo "Manual intervention required:"
    lsof -i :3000
    exit 1
fi

echo "✅ Port 3000 is available"
echo "🧹 Performing deep cache cleanup..."

cd /home/vscode/U-Dig-It-1/frontend

# Clear ALL caches
rm -rf .next
rm -rf .turbo
rm -rf node_modules/.cache
rm -rf .next/dev/lock

echo "✅ All caches cleared"
echo "🚀 Starting frontend on port 3000 with pnpm..."

# Start frontend with Next.js directly (Turbopack is default in Next.js 16)
# Use 'next dev' directly to avoid infinite loop (pnpm dev calls start-frontend-clean.sh)
PORT=3000 pnpm next dev


