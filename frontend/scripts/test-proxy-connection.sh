#!/bin/bash
# Test proxy connection and browser automation setup
# Usage: ./test-proxy-connection.sh

set -e

echo "🔍 Browser Proxy Diagnostic Tool"
echo "=================================="
echo ""

# Check environment variables
echo "📋 Environment Variables:"
echo "  HTTP_PROXY: ${HTTP_PROXY:-not set}"
echo "  HTTPS_PROXY: ${HTTPS_PROXY:-not set}"
echo "  NO_PROXY: ${NO_PROXY:-not set}"
echo "  http_proxy: ${http_proxy:-not set}"
echo "  https_proxy: ${https_proxy:-not set}"
echo ""

# Check Chrome installation
echo "🌐 Chrome Installation:"
if command -v google-chrome &> /dev/null; then
  CHROME_VERSION=$(google-chrome --version 2>&1 || echo "unknown")
  echo "  ✅ Chrome found: $CHROME_VERSION"
else
  echo "  ❌ Chrome not found in PATH"
  exit 1
fi
echo ""

# Test Chrome DevTools port
echo "🔌 Port Availability:"
for PORT in 9222 9223 9224; do
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "  ⚠️  Port $PORT is in use"
    lsof -Pi :$PORT -sTCP:LISTEN
  else
    echo "  ✅ Port $PORT is available"
  fi
done
echo ""

# Test Chrome DevTools connection (if Chrome is running)
echo "🔗 Chrome DevTools Connection:"
if curl -s "http://localhost:9222/json/version" > /dev/null 2>&1; then
  echo "  ✅ Chrome DevTools accessible on port 9222"
  VERSION_INFO=$(curl -s "http://localhost:9222/json/version")
  echo "  $VERSION_INFO" | head -3
else
  echo "  ⚠️  Chrome DevTools not accessible (Chrome may not be running)"
  echo "  💡 Start Chrome with: bash scripts/start-chrome-with-proxy.sh"
fi
echo ""

# Test network connectivity
echo "🌍 Network Connectivity:"
if [ -n "$HTTP_PROXY" ] || [ -n "$http_proxy" ]; then
  PROXY_URL="${HTTP_PROXY:-$http_proxy}"
  echo "  Testing proxy: $PROXY_URL"
  
  # Extract host and port from proxy URL
  if [[ $PROXY_URL =~ http://([^:]+):([0-9]+) ]]; then
    PROXY_HOST="${BASH_REMATCH[1]}"
    PROXY_PORT="${BASH_REMATCH[2]}"
    
    if timeout 3 bash -c "echo > /dev/tcp/$PROXY_HOST/$PROXY_PORT" 2>/dev/null; then
      echo "  ✅ Proxy server is reachable"
    else
      echo "  ❌ Proxy server is not reachable"
    fi
  fi
else
  echo "  ℹ️  No proxy configured, testing direct connection"
fi

# Test localhost connectivity
if timeout 2 curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "  ✅ Local server (localhost:3000) is accessible"
else
  echo "  ⚠️  Local server (localhost:3000) is not accessible"
  echo "  💡 Start frontend with: bash start-frontend-clean.sh"
fi
echo ""

# Playwright proxy test
echo "🎭 Playwright Configuration:"
if [ -f "playwright.config.ts" ]; then
  echo "  ✅ playwright.config.ts found"
  if grep -q "proxy" playwright.config.ts; then
    echo "  ✅ Proxy configuration detected in Playwright config"
  else
    echo "  ⚠️  No proxy configuration in Playwright config"
  fi
else
  echo "  ⚠️  playwright.config.ts not found"
fi
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "💡 Next steps:"
echo "  1. Set proxy environment variables if needed:"
echo "     export HTTP_PROXY=http://proxy.example.com:8080"
echo "     export HTTPS_PROXY=http://proxy.example.com:8080"
echo "     export NO_PROXY=localhost,127.0.0.1"
echo ""
echo "  2. Start Chrome with proxy:"
echo "     bash scripts/start-chrome-with-proxy.sh"
echo ""
echo "  3. Run Playwright tests:"
echo "     pnpm playwright test"
