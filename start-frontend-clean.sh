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
echo "🚀 Starting frontend on port 3000 with pnpm..."

# Clear Next.js cache
cd /home/vscode/Kubota-rental-platform/frontend
rm -rf .next

# Start frontend with pnpm
PORT=3000 pnpm dev
