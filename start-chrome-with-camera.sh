#!/bin/bash
# Start Chrome with CDP and camera access on HOST machine
# This allows the container to connect via CDP while Chrome has direct camera access
# Usage: ./start-chrome-with-camera.sh [port]

set -e

PORT="${1:-9222}"

echo "🚀 Starting Chrome with CDP and camera support"
echo "   Port: $PORT"
echo "   Mode: Non-headless (required for camera)"
echo ""

# Kill any existing Chrome instances on this port
echo "🧹 Cleaning up existing Chrome instances on port $PORT..."
pkill -f "chrome.*remote-debugging-port=$PORT" 2>/dev/null || true
sleep 1

# Start Chrome in NON-HEADLESS mode with camera support
# Non-headless is required for getUserMedia/camera access
echo "🌐 Starting Chrome with --remote-debugging-address=0.0.0.0"
google-chrome \
  --remote-debugging-port="$PORT" \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --disable-web-security \
  --disable-features=IsolateOrigins,site-per-process \
  --user-data-dir=/tmp/chrome-debug-$PORT \
  http://localhost:3000 > /tmp/chrome-$PORT.log 2>&1 &

CHROME_PID=$!
echo "✅ Chrome started with PID: $CHROME_PID"
echo ""

# Wait for Chrome to initialize
echo "⏳ Waiting for Chrome to initialize..."
sleep 4

# Test connections
echo "🔍 Testing DevTools connectivity..."
echo ""

# Test localhost
if curl -s --connect-timeout 2 "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
  echo "✅ Localhost connection: SUCCESS"
  LOCAL_VERSION=$(curl -s "http://localhost:$PORT/json/version" | grep -o '"Browser":"[^"]*"' | head -1)
  echo "   $LOCAL_VERSION"
else
  echo "❌ Localhost connection: FAILED"
fi

echo ""
echo "📝 Chrome process info:"
echo "   PID: $CHROME_PID"
echo "   Log: /tmp/chrome-$PORT.log"
echo "   To stop: kill $CHROME_PID"
echo "   To view logs: tail -f /tmp/chrome-$PORT.log"
echo ""
echo "📹 Camera access:"
echo "   Chrome is running on HOST with camera access"
echo "   Container connects via CDP on port $PORT"
echo "   Camera permissions handled by host Chrome"

