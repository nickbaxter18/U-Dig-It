# Run This on Your Host Machine

## Option 1: Direct Command (Easiest - Run from ANYWHERE)

You don't need the script file! Just run this command directly in your host terminal:

```bash
pkill -f "brave.*9222" 2>/dev/null; pkill -f "chrome.*9222" 2>/dev/null; sleep 2 && brave-browser --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-dev-shm-usage --use-fake-ui-for-media-stream --user-data-dir=/tmp/browser-cursor-9222 http://localhost:3000 > /tmp/browser-cursor-9222.log 2>&1 & sleep 5 && curl -s http://localhost:9222/json/version && echo "" && echo "✅ Browser started! Now configure Cursor Settings → Browser Automation → CDP URL: http://localhost:9222"
```

## Option 2: Find Your Project Location

The project might be in a different location. Try:

```bash
# Find where VS Code mounted the project
find ~ -name "Kubota-rental-platform" -type d 2>/dev/null | head -5

# Or check common locations:
ls ~/Projects/Kubota-rental-platform 2>/dev/null
ls ~/workspace/Kubota-rental-platform 2>/dev/null
ls ~/dev/Kubota-rental-platform 2>/dev/null
ls ~/Documents/Kubota-rental-platform 2>/dev/null
```

Then navigate there and run the script.

## Option 3: Copy Script Content

If you can't find the project, just copy this into a file on your host:

```bash
# Create the script anywhere
cat > ~/start-browser-for-cursor.sh << 'EOF'
#!/bin/bash
PORT=9222
pkill -f "brave.*$PORT" 2>/dev/null || true
pkill -f "chrome.*$PORT" 2>/dev/null || true
sleep 2

if command -v brave-browser &> /dev/null; then
    BROWSER="brave-browser"
elif command -v brave &> /dev/null; then
    BROWSER="brave"
elif command -v google-chrome &> /dev/null; then
    BROWSER="google-chrome"
elif command -v chromium &> /dev/null; then
    BROWSER="chromium"
else
    echo "❌ No browser found!"
    exit 1
fi

echo "🚀 Starting $BROWSER with CDP and camera access..."
$BROWSER \
  --remote-debugging-port=$PORT \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --use-fake-ui-for-media-stream \
  --user-data-dir=/tmp/browser-cursor-$PORT \
  http://localhost:3000 > /tmp/browser-cursor-$PORT.log 2>&1 &

sleep 5
curl -s http://localhost:9222/json/version && echo "" && echo "✅ Ready! Configure Cursor: http://localhost:9222"
EOF

chmod +x ~/start-browser-for-cursor.sh
~/start-browser-for-cursor.sh
```

## Quick Test After Starting

Once browser is started, test it:

```bash
curl http://localhost:9222/json/version
```

Should return JSON with browser info.

