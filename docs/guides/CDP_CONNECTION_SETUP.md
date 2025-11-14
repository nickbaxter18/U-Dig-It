# CDP Connection Setup for Camera Access

## The Problem
When using CDP from inside a container, `localhost:9222` refers to the container's localhost, not the host machine where Chrome is running.

## The Solution

### Option 1: Use Port Forwarding (Recommended)
VS Code/Cursor automatically forwards ports defined in `devcontainer.json`. I've already added port `9222` to the forward ports list.

**CDP Connection URL:** `http://localhost:9222`

This will work because:
- Port `9222` is forwarded from container → host
- Chrome runs on host at `localhost:9222`
- Container connects to `localhost:9222` → forwarded to host

**Steps:**
1. Start Chrome on your **HOST machine** (not in container):
   ```bash
   # On HOST machine:
   ./start-chrome-with-camera.sh 9222
   ```

2. In Cursor Settings → Browser Automation:
   - **CDP Connection URL:** `http://localhost:9222`
   - Click "Refresh" or reconnect

3. Verify connection:
   - You should see browser contexts appear
   - Camera will work because Chrome runs on host with direct camera access

### Option 2: Use Host Gateway IP (If port forwarding doesn't work)

If `localhost:9222` doesn't work, try the host gateway IP:

**CDP Connection URL:** `http://172.20.0.1:9222`

**Steps:**
1. Start Chrome on host with `--remote-debugging-address=0.0.0.0`:
   ```bash
   # On HOST machine:
   google-chrome \
     --remote-debugging-port=9222 \
     --remote-debugging-address=0.0.0.0 \
     --no-sandbox \
     --disable-dev-shm-usage \
     --user-data-dir=/tmp/chrome-debug-9222 \
     http://localhost:3000 &
   ```

2. In Cursor Settings:
   - **CDP Connection URL:** `http://172.20.0.1:9222`

### Option 3: Use Host Machine's Actual IP

If neither works, find your host machine's IP:

**On Linux/Mac host:**
```bash
# Run on HOST machine:
ip addr show | grep "inet " | grep -v 127.0.0.1
# or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**CDP Connection URL:** `http://<your-host-ip>:9222`

## Important Notes

1. **Chrome must run on HOST** (not in container) for camera access
2. **Chrome must be NON-HEADLESS** (remove `--headless` flag) for camera
3. **Port forwarding** is the cleanest solution - use `localhost:9222`
4. **Camera permissions** are handled by Chrome on the host

## Testing the Connection

From inside the container, test if Chrome is accessible:

```bash
# Test Option 1 (port forwarding):
curl http://localhost:9222/json/version

# Test Option 2 (gateway):
curl http://172.20.0.1:9222/json/version

# Test Option 3 (host IP):
curl http://<host-ip>:9222/json/version
```

If any of these return Chrome version info, that's the URL to use in Cursor settings.

## Troubleshooting

### "No contexts available"
- Chrome isn't running on host
- Wrong CDP URL in Cursor settings
- Port forwarding not working

### "Cannot connect"
- Check Chrome is running: `ps aux | grep chrome`
- Check Chrome logs: `tail -f /tmp/chrome-9222.log`
- Verify port is open: `lsof -i :9222` (on host)

### Camera still doesn't work
- Ensure Chrome is **non-headless** (you should see a Chrome window)
- Grant camera permission in Chrome when prompted
- Check Chrome is running on host (not in container)

