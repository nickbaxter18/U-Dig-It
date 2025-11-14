# Start Chrome with CDP - Do This Now!

## The Problem
Brave/Chrome is running, but **not with CDP enabled**. That's why Cursor shows "No contexts available."

## The Solution

### Step 1: Close Current Browser
Close the Brave browser window you have open (or any Chrome windows).

### Step 2: Start Chrome/Brave with CDP

**On your HOST machine terminal**, run ONE of these commands:

#### Option A: If you have `google-chrome`:
```bash
google-chrome --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/chrome-debug-9222 http://localhost:3000 &
```

#### Option B: If you have `brave-browser`:
```bash
brave-browser --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/brave-debug-9222 http://localhost:3000 &
```

#### Option C: If you have `chromium`:
```bash
chromium --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/chrome-debug-9222 http://localhost:3000 &
```

### Step 3: Wait 5 seconds
Give Chrome/Brave time to start.

### Step 4: Verify It Worked

**In your HOST terminal**, run:
```bash
curl http://localhost:9222/json/version
```

You should see JSON output with Chrome version info. If you see that, it's working!

### Step 5: Refresh Cursor

1. Go to **Cursor Settings** → **Tools & MCP** → **Browser Automation**
2. Make sure **CDP Connection URL** is: `http://localhost:9222`
3. Click **Refresh** or wait a few seconds
4. **Browser Context** should now show contexts instead of "No contexts available"

## Troubleshooting

### "Command not found"
Find your browser:
```bash
which google-chrome
which brave-browser
which chromium
which chromium-browser
```

Then use the full path:
```bash
/usr/bin/google-chrome --remote-debugging-port=9222 ...
```

### Still "No contexts available"
1. Check Chrome is running: `ps aux | grep chrome`
2. Check port is open: `lsof -i :9222` (should show Chrome)
3. Test CDP: `curl http://localhost:9222/json/version`
4. Try gateway IP in Cursor: `http://172.20.0.1:9222`

### Port already in use
```bash
# Kill existing Chrome on port 9222:
pkill -f "chrome.*9222"
pkill -f "brave.*9222"
# Then start again
```

