# Starting Chrome for DevContainer Access

## Problem
Chrome DevTools needs to be accessible from inside the devcontainer. By default, Chrome only listens on `127.0.0.1` (localhost), which isn't accessible from containers.

## Solution
Start Chrome with `--remote-debugging-address=0.0.0.0` to bind to all network interfaces.

## Quick Start (Run on Host Machine)

### Option 1: Use the script (if you have access to the project)
```bash
cd /path/to/Kubota-rental-platform/frontend
bash scripts/start-chrome-for-container.sh 9223
```

### Option 2: Manual command (run on host)
```bash
# Kill any existing Chrome instances
pkill -f "chrome.*remote-debugging-port=9223"

# Start Chrome with network-accessible DevTools
google-chrome \
  --headless \
  --remote-debugging-port=9223 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --user-data-dir=/tmp/chrome-debug-9223 \
  http://localhost:3000 &
```

### Option 3: One-liner
```bash
pkill -f "chrome.*9223" 2>/dev/null; google-chrome --headless --remote-debugging-port=9223 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-gpu --disable-dev-shm-usage --user-data-dir=/tmp/chrome-debug-9223 http://localhost:3000 &
```

## Verify from Host
```bash
# Should return JSON with Chrome version info
curl http://localhost:9223/json/version
```

## Verify from Container
```bash
# Replace 10.0.0.108 with your actual host IP
curl http://10.0.0.108:9223/json/version
```

## Key Flag
The critical flag is: `--remote-debugging-address=0.0.0.0`

This makes Chrome listen on all network interfaces instead of just localhost.

## Troubleshooting

### Port already in use
```bash
# Find process using port 9223
lsof -i :9223
# Kill it
kill <PID>
```

### Still can't connect from container
1. Check firewall rules on host
2. Verify host IP is correct (check with `ip addr` or `ifconfig`)
3. Ensure port forwarding is configured in devcontainer

### Check Chrome logs
```bash
tail -f /tmp/chrome-9223.log
```

## Security Note
⚠️ Binding to `0.0.0.0` makes Chrome DevTools accessible from any network interface. Only use this in development environments!
