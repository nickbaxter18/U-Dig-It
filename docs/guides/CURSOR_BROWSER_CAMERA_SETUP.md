# Cursor Browser Automation - Camera Permissions Setup

## The Goal
Make camera permissions work automatically in Cursor's browser automation tabs.

## Solution: Start Chrome with Auto-Grant Permissions

The easiest way is to start Chrome/Brave with a flag that **auto-grants camera permissions**.

### Step 1: Start Chrome with CDP + Auto-Grant Permissions

**On your HOST machine terminal**, run:

```bash
brave-browser \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --use-fake-ui-for-media-stream \
  --user-data-dir=/tmp/brave-debug-9222 \
  http://localhost:3000 &
```

**Key flag:** `--use-fake-ui-for-media-stream`
- This **auto-grants** camera/microphone permissions
- No permission prompts will appear
- Camera will work immediately

### Step 2: Configure Cursor

1. Go to **Cursor Settings** → **Tools & MCP** → **Browser Automation**
2. **CDP Connection URL:** `http://localhost:9222`
3. Click **Refresh**
4. Browser contexts should appear

### Step 3: Test Camera

1. Use Cursor's browser automation to navigate to a booking page
2. Click "Take photo"
3. Camera should work **without any permission prompts**! 🎉

## Alternative: Grant Permissions Manually

If you don't want to use `--use-fake-ui-for-media-stream`:

### Option A: Grant in Browser Window

1. When Cursor opens a browser tab, **look at the browser window**
2. Click the **lock/camera icon** in the address bar
3. Set Camera to **"Allow"**
4. Refresh the page

### Option B: Grant via Browser Settings

1. Open Brave Settings
2. **Privacy and security** → **Site settings** → **Camera**
3. Add `http://localhost:3000` and set to **"Allow"**

## Important Notes

### `--use-fake-ui-for-media-stream` Flag

- ✅ **Pros:** Auto-grants permissions, no prompts
- ⚠️ **Note:** This flag is designed for testing and may use fake devices in some cases
- 💡 **For real camera:** You can still use real camera, but permissions are auto-granted

### For Real Camera Access

If you want to ensure real camera (not fake):

1. **Don't use** `--use-fake-ui-for-media-stream`
2. **Do use** `--use-fake-device-for-media-stream` (if you want fake devices)
3. **Or** grant permissions manually (Options A or B above)

### Recommended Setup

For Cursor browser automation, I recommend:

```bash
brave-browser \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --use-fake-ui-for-media-stream \
  --user-data-dir=/tmp/brave-debug-9222 \
  http://localhost:3000 &
```

This gives you:
- ✅ CDP access for Cursor
- ✅ Auto-granted camera permissions
- ✅ No permission prompts
- ✅ Camera works immediately in browser automation

## Troubleshooting

### Still getting permission denied

1. **Check Chrome is running:** `ps aux | grep brave`
2. **Check CDP is accessible:** `curl http://localhost:9222/json/version`
3. **Try clearing browser data:**
   - Settings → Privacy → Clear browsing data
   - Or use a fresh `--user-data-dir`

### Camera works but CDP doesn't

- Make sure `--remote-debugging-port=9222` is set
- Check port forwarding in devcontainer.json
- Try gateway IP: `http://172.20.0.1:9222`

### Permission prompt still appears

- Make sure `--use-fake-ui-for-media-stream` flag is included
- Check you're using the correct browser executable
- Try restarting Chrome with all flags

