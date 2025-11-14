#!/bin/bash
# Start Chrome with proxy configuration for browser automation
# Usage: ./start-chrome-with-proxy.sh [proxy_url]

set -e

PROXY_URL="${1:-${HTTP_PROXY:-${http_proxy}}}"
PORT="${2:-9222}"

echo "🚀 Starting Chrome with DevTools on port $PORT"

if [ -n "$PROXY_URL" ]; then
  echo "📡 Using proxy: $PROXY_URL"
  google-chrome \
    --headless \
    --remote-debugging-port="$PORT" \
    --remote-debugging-address=0.0.0.0 \
    --no-sandbox \
    --disable-gpu \
    --disable-dev-shm-usage \
    --proxy-server="$PROXY_URL" \
    --disable-web-security \
    --disable-features=IsolateOrigins,site-per-process \
    http://localhost:3000 &
else
  echo "🌐 No proxy configured, starting Chrome without proxy"
  google-chrome \
    --headless \
    --remote-debugging-port="$PORT" \
    --remote-debugging-address=0.0.0.0 \
    --no-sandbox \
    --disable-gpu \
    --disable-dev-shm-usage \
    --disable-web-security \
    --disable-features=IsolateOrigins,site-per-process \
    http://localhost:3000 &
fi

CHROME_PID=$!
echo "✅ Chrome started with PID: $CHROME_PID"
echo "🔗 DevTools available at:"
echo "   - http://localhost:$PORT (from host)"
echo "   - http://0.0.0.0:$PORT (from network/container)"
echo "📝 To stop: kill $CHROME_PID"

# Wait a moment for Chrome to start
sleep 3

# Test connection on localhost
if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
  echo "✅ Chrome DevTools is accessible on localhost"
  curl -s "http://localhost:$PORT/json/version" | head -3
else
  echo "⚠️  Chrome DevTools may not be ready yet, check logs above"
fi

# Test connection on 0.0.0.0 (for container access)
if curl -s "http://0.0.0.0:$PORT/json/version" > /dev/null 2>&1; then
  echo "✅ Chrome DevTools is accessible on network interface"
else
  echo "⚠️  Chrome DevTools may not be accessible from network yet"
fi
