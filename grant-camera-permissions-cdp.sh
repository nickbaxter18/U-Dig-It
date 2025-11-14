#!/bin/bash
# Grant camera permissions for localhost:3000 via CDP
# Run this AFTER Chrome is started with CDP

PORT="${1:-9222}"
URL="http://localhost:3000"

echo "📹 Granting camera permissions via CDP..."
echo "   Port: $PORT"
echo "   URL: $URL"
echo ""

# Get browser WebSocket URL
WS_URL=$(curl -s http://localhost:$PORT/json/version 2>/dev/null | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$WS_URL" ]; then
    echo "❌ Cannot connect to Chrome CDP. Is Chrome running with --remote-debugging-port=$PORT?"
    exit 1
fi

echo "✅ Connected to Chrome CDP: $WS_URL"
echo ""

# Get browser context ID
CONTEXT_ID=$(curl -s http://localhost:$PORT/json | jq -r '.[0].id' 2>/dev/null)

if [ -z "$CONTEXT_ID" ] || [ "$CONTEXT_ID" = "null" ]; then
    echo "⚠️  Could not get context ID. Trying alternative method..."
    # Create a new context with permissions
    echo "Creating browser context with camera permissions..."
    # This requires a WebSocket connection - providing Python script instead
    echo "See grant-camera-permissions.py for full implementation"
else
    echo "✅ Found browser context: $CONTEXT_ID"
fi

echo ""
echo "📝 To grant permissions manually:"
echo "   1. Open Chrome DevTools (F12 in the browser window)"
echo "   2. Go to Application tab → Permissions"
echo "   3. Find 'Camera' and set to 'Allow' for localhost:3000"
echo ""
echo "Or use the Python script: python3 grant-camera-permissions.py"

