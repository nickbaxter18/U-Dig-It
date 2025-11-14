#!/bin/bash
# Kill Chrome on port 9223 and restart with correct settings

echo "🔍 Finding processes on port 9223..."
PID=$(lsof -ti :9223 2>/dev/null || sudo lsof -ti :9223 2>/dev/null || echo "")

if [ -n "$PID" ]; then
  echo "⚠️  Found process(es) using port 9223: $PID"
  echo "🔪 Killing process(es)..."
  kill -9 $PID 2>/dev/null || sudo kill -9 $PID 2>/dev/null
  sleep 2
else
  echo "✅ Port 9223 appears to be free"
fi

# Double-check with pkill
pkill -9 -f "chrome.*9223" 2>/dev/null
sleep 1

echo "🚀 Starting Chrome with network-accessible DevTools..."
google-chrome \
  --headless \
  --remote-debugging-port=9223 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --user-data-dir=/tmp/chrome-debug-9223 \
  http://localhost:3000 > /tmp/chrome-9223.log 2>&1 &

CHROME_PID=$!
echo "✅ Chrome started with PID: $CHROME_PID"
echo ""
echo "⏳ Waiting for Chrome to initialize..."
sleep 3

echo ""
echo "🔍 Testing Chrome DevTools..."
if curl -s --connect-timeout 2 http://localhost:9223/json/version > /dev/null 2>&1; then
  echo "✅ Chrome DevTools is accessible on localhost"
  curl -s http://localhost:9223/json/version | head -5
else
  echo "❌ Chrome DevTools not accessible. Check logs:"
  tail -20 /tmp/chrome-9223.log
fi

echo ""
echo "📋 Test from container:"
echo "   curl http://10.0.0.108:9223/json/version"
