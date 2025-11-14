# Complete Setup: Camera in Cursor Browser Automation

## Goal
Enable camera access in Cursor's browser automation tabs so I can control and test the camera functionality with full context.

## Step-by-Step Setup

### Step 1: Run the Setup Script

**On your HOST machine terminal** (not in container), run:

```bash
cd /path/to/Kubota-rental-platform
chmod +x setup-cursor-browser-camera.sh
./setup-cursor-browser-camera.sh
```

This script will:
- ✅ Find your browser (Brave/Chrome/Chromium)
- ✅ Start it with CDP on port 9222
- ✅ Auto-grant camera permissions
- ✅ Make it accessible to Cursor

### Step 2: Configure Cursor

1. Open **Cursor Settings** → **Tools & MCP** → **Browser Automation**
2. **CDP Connection URL:** `http://localhost:9222`
3. Click **Refresh** or wait a few seconds
4. **Browser Context** should show contexts (no longer "No contexts available")

### Step 3: Test Camera Access

Once Cursor is connected, I can:
1. Navigate to booking pages
2. Click "Take photo" buttons
3. Camera will work automatically (permissions auto-granted)
4. Test the full camera functionality

## What the Script Does

The script starts your browser with these critical flags:

- `--remote-debugging-port=9222` - Enables CDP for Cursor
- `--remote-debugging-address=0.0.0.0` - Makes CDP network-accessible
- `--use-fake-ui-for-media-stream` - **Auto-grants camera permissions**
- `--user-data-dir=/tmp/browser-cursor-9222` - Isolated profile

## Troubleshooting

### Browser contexts don't appear

1. **Check browser is running:**
   ```bash
   ps aux | grep brave
   # or
   ps aux | grep chrome
   ```

2. **Check CDP is accessible:**
   ```bash
   curl http://localhost:9222/json/version
   ```
   Should return JSON with browser version.

3. **Check Cursor settings:**
   - CDP URL: `http://localhost:9222`
   - Click Refresh
   - Wait 5-10 seconds

### Camera still doesn't work

1. **Verify permissions are granted:**
   - The `--use-fake-ui-for-media-stream` flag should auto-grant
   - Check browser console for errors (F12)

2. **Try manual grant:**
   - In the browser window, click lock icon in address bar
   - Set Camera to "Allow"
   - Refresh page

3. **Check browser logs:**
   ```bash
   tail -f /tmp/browser-cursor-9222.log
   ```

### Port already in use

```bash
# Kill existing browser
pkill -f "brave.*9222"
pkill -f "chrome.*9222"

# Then run setup script again
./setup-cursor-browser-camera.sh
```

## Manual Alternative

If the script doesn't work, start browser manually:

```bash
brave-browser \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --use-fake-ui-for-media-stream \
  --user-data-dir=/tmp/browser-cursor-9222 \
  http://localhost:3000 &
```

## Verification

After setup, verify everything works:

1. ✅ Browser contexts appear in Cursor Settings
2. ✅ I can navigate pages via browser automation
3. ✅ Camera works when clicking "Take photo"
4. ✅ No permission prompts appear

## Success Indicators

- Cursor Settings shows browser contexts
- Browser automation can navigate pages
- Camera access works without prompts
- Full camera functionality is testable

