#!/bin/bash
# Simple Chrome start command - run this from ANYWHERE on your host machine
# No need to find the project directory!

echo "🚀 Starting Chrome with CDP on port 9222..."
echo ""

# Kill any existing Chrome on port 9222
pkill -f "chrome.*9222" 2>/dev/null || true
sleep 1

# Start Chrome with CDP
google-chrome \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --user-data-dir=/tmp/chrome-debug-9222 \
  http://localhost:3000 > /tmp/chrome-9222.log 2>&1 &

CHROME_PID=$!
echo "✅ Chrome started with PID: $CHROME_PID"
echo ""
echo "⏳ Waiting for Chrome to initialize..."
sleep 4

# Test connection
if curl -s --connect-timeout 2 http://localhost:9222/json/version > /dev/null 2>&1; then
    echo "✅ Chrome CDP is accessible!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Go to Cursor Settings → Browser Automation"
    echo "   2. CDP URL should be: http://localhost:9222"
    echo "   3. Click Refresh"
    echo "   4. Browser contexts should appear!"
else
    echo "⚠️  Chrome may still be starting. Check logs:"
    echo "   tail -f /tmp/chrome-9222.log"
fi

echo ""
echo "To stop Chrome: kill $CHROME_PID"

