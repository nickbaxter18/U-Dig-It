# Grant Camera Permissions - Quick Fix

## The Problem
Browser is running but camera permissions are not granted, so the camera doesn't work.

## Solution 1: Auto-Grant Permissions (Easiest)

Start Chrome with the flag that auto-grants camera permissions:

```bash
# On your HOST machine terminal:
brave-browser --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-dev-shm-usage --use-fake-ui-for-media-stream --user-data-dir=/tmp/brave-debug-9222 http://localhost:3000 &
```

**Key flag:** `--use-fake-ui-for-media-stream` - This auto-grants camera/microphone permissions!

## Solution 2: Grant Permissions Manually in Browser

1. **Open the browser** (Brave/Chrome window)
2. **Click the lock/camera icon** in the address bar (left of URL)
3. **Set Camera to "Allow"**
4. **Refresh the page**

## Solution 3: Grant via Browser Settings

1. Open browser settings
2. Go to **Privacy and security** → **Site settings** → **Camera**
3. Find `http://localhost:3000` or add it
4. Set to **"Allow"**

## Solution 4: Use the Script

Run the script I created:

```bash
chmod +x start-chrome-with-permissions.sh
./start-chrome-with-permissions.sh 9222
```

This starts Chrome with auto-grant permissions enabled.

## Solution 5: Grant via CDP (Advanced)

If you have CDP access, you can grant permissions programmatically:

```bash
# Get browser context ID
CONTEXT_ID=$(curl -s http://localhost:9222/json | jq -r '.[0].id')

# Grant camera permission (requires CDP WebSocket connection)
# This is complex - Solution 1 is easier!
```

## Quick Test

After granting permissions:

1. Navigate to: `http://localhost:3000/booking/[id]/manage`
2. Click **"Take photo"** on either card
3. Camera should work immediately! 🎉

## Troubleshooting

### Still says "Camera permission denied"

1. **Check browser address bar** - Look for camera icon
2. **Clear browser data** for localhost:3000:
   - Settings → Privacy → Clear browsing data → Cookies
   - Or use Incognito mode
3. **Restart browser** with the `--use-fake-ui-for-media-stream` flag

### Permission prompt doesn't appear

- Make sure you're using **non-headless** Chrome (you see a window)
- Check browser console for errors (F12)
- Try the `--use-fake-ui-for-media-stream` flag

### Camera works but CDP doesn't

- Make sure Chrome is started with `--remote-debugging-port=9222`
- Check: `curl http://localhost:9222/json/version`
- Verify in Cursor Settings → Browser Automation

