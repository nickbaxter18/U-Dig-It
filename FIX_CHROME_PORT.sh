#!/bin/bash
# Fix Chrome port binding issue

echo "🔍 Step 1: Checking port 9223..."
lsof -i :9223 || echo "Port appears free"

echo ""
echo "🔍 Step 2: Checking for TIME_WAIT connections..."
netstat -an | grep 9223 || ss -an | grep 9223 || echo "No connections found"

echo ""
echo "🔪 Step 3: Killing all Chrome processes..."
sudo killall -9 chrome chromium chromium-browser 2>/dev/null
sleep 2

echo ""
echo "🔍 Step 4: Double-checking port..."
lsof -i :9223 || echo "✅ Port is definitely free"

echo ""
echo "⏳ Step 5: Waiting for port to fully release..."
sleep 5

echo ""
echo "🚀 Step 6: Starting Chrome with SO_REUSEADDR workaround..."
# Try using a different user-data-dir to avoid lock files
rm -rf /tmp/chrome-debug-9223-new
google-chrome \
  --headless \
  --remote-debugging-port=9223 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --user-data-dir=/tmp/chrome-debug-9223-new \
  --disable-background-networking \
  --disable-background-timer-throttling \
  --disable-breakpad \
  --disable-client-side-phishing-detection \
  --disable-default-apps \
  --disable-dev-shm-usage \
  --disable-extensions \
  --disable-features=TranslateUI \
  --disable-hang-monitor \
  --disable-popup-blocking \
  --disable-prompt-on-repost \
  --disable-sync \
  --disable-translate \
  --metrics-recording-only \
  --no-first-run \
  --safebrowsing-disable-auto-update \
  --enable-automation \
  --password-store=basic \
  --use-mock-keychain \
  http://localhost:3000 > /tmp/chrome-9223.log 2>&1 &

CHROME_PID=$!
echo "Chrome PID: $CHROME_PID"
sleep 4

echo ""
echo "🔍 Step 7: Testing Chrome DevTools..."
if curl -s --connect-timeout 3 http://localhost:9223/json/version > /dev/null 2>&1; then
  echo "✅ SUCCESS! Chrome DevTools is accessible"
  curl -s http://localhost:9223/json/version | head -5
else
  echo "❌ Still failing. Checking logs..."
  tail -30 /tmp/chrome-9223.log
  echo ""
  echo "Checking if Chrome process is running..."
  ps aux | grep chrome | grep -v grep | head -3
fi
