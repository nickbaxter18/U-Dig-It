# Quick Start: Chrome with CDP for Camera Access

## ⚠️ IMPORTANT: Run Chrome on Your HOST Machine

You must start Chrome **outside the container** on your **host machine** (your laptop/computer).

## Step-by-Step Instructions

### 1. Open Terminal on HOST Machine

**NOT in VS Code/Cursor container terminal!** Open a regular terminal on your computer:

- **Mac**: Terminal app or iTerm
- **Linux**: Terminal or Konsole
- **Windows**: PowerShell or Command Prompt

### 2. Navigate to Project Directory

```bash
cd /path/to/Kubota-rental-platform
# Or wherever your project is located
```

### 3. Make Script Executable (if needed)

```bash
chmod +x start-chrome-with-camera.sh
```

### 4. Start Chrome

```bash
./start-chrome-with-camera.sh 9222
```

You should see:
- ✅ Chrome started with PID: [number]
- ✅ Localhost connection: SUCCESS
- A Chrome window will open on your screen

### 5. Verify in Cursor

1. Go to **Cursor Settings** → **Tools & MCP** → **Browser Automation**
2. **CDP Connection URL** should be: `http://localhost:9222`
3. Click **Refresh** or wait a few seconds
4. You should see **Browser Context** appear (no longer "No contexts available")

### 6. Test Camera Access

1. Navigate to a booking manage page in the browser
2. Click "Take photo"
3. Chrome will request camera permission → Click "Allow"
4. Camera should work! 🎉

## Troubleshooting

### "Command not found: google-chrome"

**Mac:**
```bash
# Try:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 http://localhost:3000 &
```

**Linux:**
```bash
# Try:
chromium-browser --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 http://localhost:3000 &
# or
chromium --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 http://localhost:3000 &
```

**Windows:**
```powershell
# Find Chrome path (usually):
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 http://localhost:3000
```

### Still "No contexts available"

1. **Check Chrome is running:**
   ```bash
   # On HOST machine:
   ps aux | grep chrome
   # or
   lsof -i :9222
   ```

2. **Test CDP endpoint:**
   ```bash
   # On HOST machine:
   curl http://localhost:9222/json/version
   ```
   Should return Chrome version info.

3. **Check Chrome logs:**
   ```bash
   # On HOST machine:
   tail -f /tmp/chrome-9222.log
   ```

4. **Try gateway IP instead:**
   - In Cursor Settings, change CDP URL to: `http://172.20.0.1:9222`

### Port Already in Use

```bash
# Kill existing Chrome on port 9222:
pkill -f "chrome.*9222"
# or
killall chrome
```

## Alternative: Manual Chrome Start

If the script doesn't work, start Chrome manually:

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --user-data-dir=/tmp/chrome-debug-9222 \
  http://localhost:3000 &
```

**Important:** Remove `--headless` flag! Camera requires non-headless mode.

