#!/bin/bash
# Check if Chrome CDP is accessible from container
# Run this AFTER starting Chrome on your host machine

echo "🔍 Checking Chrome CDP connection..."
echo ""

# Test localhost (via port forwarding)
echo "1. Testing localhost:9222 (port forwarding)..."
if curl -s --connect-timeout 2 http://localhost:9222/json/version > /dev/null 2>&1; then
    echo "   ✅ SUCCESS! Chrome is accessible via port forwarding"
    curl -s http://localhost:9222/json/version | grep -o '"Browser":"[^"]*"' | head -1
else
    echo "   ❌ FAILED - Chrome not accessible via localhost"
fi

echo ""

# Test gateway IP
echo "2. Testing gateway IP (172.20.0.1:9222)..."
if curl -s --connect-timeout 2 http://172.20.0.1:9222/json/version > /dev/null 2>&1; then
    echo "   ✅ SUCCESS! Chrome is accessible via gateway IP"
    curl -s http://172.20.0.1:9222/json/version | grep -o '"Browser":"[^"]*"' | head -1
    echo ""
    echo "   💡 Use this URL in Cursor: http://172.20.0.1:9222"
else
    echo "   ❌ FAILED - Chrome not accessible via gateway"
fi

echo ""

# List available contexts
echo "3. Checking for browser contexts..."
CONTEXTS=$(curl -s --connect-timeout 2 http://localhost:9222/json 2>/dev/null | grep -o '"id":"[^"]*"' | wc -l)
if [ "$CONTEXTS" -gt 0 ]; then
    echo "   ✅ Found browser contexts!"
    curl -s http://localhost:9222/json 2>/dev/null | grep -o '"id":"[^"]*"' | head -3
else
    echo "   ⚠️  No contexts found (Chrome may not have any tabs open)"
fi

echo ""
echo "📝 Next steps:"
echo "   1. If localhost works → Use http://localhost:9222 in Cursor"
echo "   2. If gateway works → Use http://172.20.0.1:9222 in Cursor"
echo "   3. If both fail → Chrome is not running on host or port forwarding not working"

