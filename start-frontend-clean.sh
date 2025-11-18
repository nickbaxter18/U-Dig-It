#!/bin/bash

# Clean Frontend Startup Script for PNPM project
# Ensures frontend always starts on port 3000

echo "🧹 Cleaning up any existing processes..."

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

cd /home/vscode/U-Dig-It-1/frontend

# Check for stale lock file (only clear if exists)
# With turbopackFileSystemCacheForDev enabled, we DON'T want to clear .next on every start
# Only clear the lock file if it exists from a crashed process
if [ -f ".next/dev/lock" ]; then
  echo "🔓 Removing stale Turbopack lock file..."
  rm -f .next/dev/lock
fi

echo "🚀 Starting frontend on port 3000 with pnpm..."
echo "   Using Turbopack with filesystem caching enabled for faster restarts"

# Start frontend with Next.js directly (Turbopack is default in Next.js 16)
# Use 'next dev' directly to avoid infinite loop (pnpm dev calls this script)
PORT=3000 pnpm next dev
