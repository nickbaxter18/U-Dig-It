#!/bin/bash
# Start Chrome with DevTools accessible from devcontainer
# This script binds Chrome DevTools to 0.0.0.0 so it's accessible from containers
# Usage: ./start-chrome-for-container.sh [port]

set -e

PORT="${1:-9223}"
HOST_IP="${HOST_IP:-10.0.0.108}"

echo "🚀 Starting Chrome with DevTools for container access"
echo "   Port: $PORT"
echo "   Host IP: $HOST_IP"
echo ""

# Kill any existing Chrome instances on this port
echo "🧹 Cleaning up existing Chrome instances on port $PORT..."
pkill -f "chrome.*remote-debugging-port=$PORT" 2>/dev/null || true
sleep 1

# Start Chrome with network-accessible DevTools
echo "🌐 Starting Chrome with --remote-debugging-address=0.0.0.0"
google-chrome \
  --headless \
  --remote-debugging-port="$PORT" \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-gpu \
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

# Test network interface
if curl -s --connect-timeout 2 "http://0.0.0.0:$PORT/json/version" > /dev/null 2>&1; then
  echo "✅ Network interface (0.0.0.0) connection: SUCCESS"
else
  echo "⚠️  Network interface (0.0.0.0) connection: FAILED (may need firewall rules)"
fi

# Test from container perspective (if HOST_IP is set)
if [ -n "$HOST_IP" ] && [ "$HOST_IP" != "localhost" ]; then
  echo ""
  echo "🔗 Container access URL:"
  echo "   http://$HOST_IP:$PORT/json/version"
  echo ""
  echo "📋 Test from inside container:"
  echo "   curl http://$HOST_IP:$PORT/json/version"
fi

echo ""
echo "📝 Chrome process info:"
echo "   PID: $CHROME_PID"
echo "   Log: /tmp/chrome-$PORT.log"
echo "   To stop: kill $CHROME_PID"
echo "   To view logs: tail -f /tmp/chrome-$PORT.log"
