#!/bin/bash
# Start Chrome with CDP and auto-grant camera permissions
# This script starts Chrome and grants camera permissions for localhost:3000

PORT="${1:-9222}"

echo "🚀 Starting Chrome with CDP and camera permissions"
echo ""

# Kill existing Chrome
pkill -f "chrome.*$PORT" 2>/dev/null || true
pkill -f "brave.*$PORT" 2>/dev/null || true
sleep 1

# Start Chrome/Brave with CDP
# Using --use-fake-ui-for-media-stream to auto-grant permissions
echo "Starting browser with CDP on port $PORT..."

# Try different browsers
if command -v brave-browser &> /dev/null; then
    BROWSER="brave-browser"
elif command -v brave &> /dev/null; then
    BROWSER="brave"
elif command -v google-chrome &> /dev/null; then
    BROWSER="google-chrome"
elif command -v chromium-browser &> /dev/null; then
    BROWSER="chromium-browser"
elif command -v chromium &> /dev/null; then
    BROWSER="chromium"
else
    echo "❌ No Chrome/Brave/Chromium found!"
    exit 1
fi

echo "Using: $BROWSER"

$BROWSER \
  --remote-debugging-port="$PORT" \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --use-fake-ui-for-media-stream \
  --user-data-dir=/tmp/browser-debug-$PORT \
  http://localhost:3000 > /tmp/browser-$PORT.log 2>&1 &

BROWSER_PID=$!
echo "✅ Browser started with PID: $BROWSER_PID"
echo ""

# Wait for browser to start
echo "⏳ Waiting for browser to initialize..."
sleep 5

# Grant camera permissions via CDP
echo "📹 Granting camera permissions via CDP..."
sleep 2

# Get the browser WebSocket URL
WS_URL=$(curl -s http://localhost:$PORT/json/version 2>/dev/null | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

if [ -n "$WS_URL" ]; then
    echo "✅ Found CDP endpoint: $WS_URL"
    echo ""
    echo "📝 To grant permissions manually:"
    echo "   1. Open Chrome DevTools (F12)"
    echo "   2. Go to Application → Permissions"
    echo "   3. Find 'Camera' and set to 'Allow' for localhost:3000"
    echo ""
    echo "Or use the browser automation in Cursor to grant permissions."
else
    echo "⚠️  Could not get CDP endpoint. Browser may still be starting..."
fi

echo ""
echo "🔍 Testing CDP connection..."
if curl -s --connect-timeout 2 http://localhost:$PORT/json/version > /dev/null 2>&1; then
    echo "✅ CDP is accessible!"
    echo ""
    echo "Next steps:"
    echo "   1. Go to Cursor Settings → Browser Automation"
    echo "   2. Set CDP URL to: http://localhost:9222"
    echo "   3. Click Refresh"
    echo "   4. Navigate to booking page and click 'Take photo'"
    echo "   5. Camera permission should be auto-granted"
else
    echo "❌ CDP not accessible yet. Check logs: tail -f /tmp/browser-$PORT.log"
fi

