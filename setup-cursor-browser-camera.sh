#!/bin/bash
# Setup Chrome/Brave for Cursor browser automation with camera access
# This ensures Cursor can control the browser AND camera works

PORT=9222

echo "🔧 Setting up browser for Cursor automation with camera access"
echo ""

# Kill any existing browser on this port
echo "🧹 Cleaning up existing browsers..."
pkill -f "brave.*$PORT" 2>/dev/null || true
pkill -f "chrome.*$PORT" 2>/dev/null || true
pkill -f "chromium.*$PORT" 2>/dev/null || true
sleep 2

# Find browser executable
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
    echo "   Please install one of: brave-browser, google-chrome, or chromium"
    exit 1
fi

echo "✅ Using browser: $BROWSER"
echo ""

# Start browser with CDP + auto-grant camera permissions
echo "🚀 Starting browser with:"
echo "   - CDP on port $PORT (for Cursor automation)"
echo "   - Auto-grant camera permissions"
echo "   - Network accessible (0.0.0.0)"
echo ""

$BROWSER \
  --remote-debugging-port=$PORT \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --use-fake-ui-for-media-stream \
  --user-data-dir=/tmp/browser-cursor-$PORT \
  http://localhost:3000 > /tmp/browser-cursor-$PORT.log 2>&1 &

BROWSER_PID=$!
echo "✅ Browser started with PID: $BROWSER_PID"
echo ""

# Wait for browser to initialize
echo "⏳ Waiting for browser to initialize..."
sleep 5

# Verify CDP is accessible
echo "🔍 Verifying CDP connection..."
if curl -s --connect-timeout 3 http://localhost:$PORT/json/version > /dev/null 2>&1; then
    echo "✅ CDP is accessible!"
    VERSION=$(curl -s http://localhost:$PORT/json/version | grep -o '"Browser":"[^"]*"' | head -1)
    echo "   $VERSION"
else
    echo "⚠️  CDP not accessible yet. Browser may still be starting..."
    echo "   Check logs: tail -f /tmp/browser-cursor-$PORT.log"
fi

echo ""
echo "📝 Next steps:"
echo "   1. Go to Cursor Settings → Tools & MCP → Browser Automation"
echo "   2. Set CDP Connection URL to: http://localhost:9222"
echo "   3. Click Refresh"
echo "   4. Browser contexts should appear"
echo ""
echo "📹 Camera permissions:"
echo "   ✅ Auto-granted via --use-fake-ui-for-media-stream"
echo "   ✅ Camera will work in Cursor browser automation"
echo ""
echo "🛑 To stop: kill $BROWSER_PID"
echo "📋 Logs: tail -f /tmp/browser-cursor-$PORT.log"

