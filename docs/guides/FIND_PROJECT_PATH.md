# Finding Your Project Path

Since you're in a dev container, the project path on your **host machine** might be different.

## Option 1: Check VS Code/Cursor Workspace

1. In VS Code/Cursor, look at the bottom-left corner
2. Click on the container name/remote indicator
3. It might show the host path that's mounted

## Option 2: Common Locations

The project is likely in one of these locations:

```bash
# Check common locations:
ls ~/Kubota-rental-platform
ls ~/Projects/Kubota-rental-platform
ls ~/workspace/Kubota-rental-platform
ls ~/Documents/Kubota-rental-platform
ls ~/dev/Kubota-rental-platform
```

## Option 3: Find It

```bash
# Search for the project:
find ~ -name "Kubota-rental-platform" -type d 2>/dev/null | head -5
```

## Option 4: Check Where VS Code Mounted It

The container path is `/home/vscode/Kubota-rental-platform`, but on your host it's likely:
- `~/Kubota-rental-platform`
- Or wherever you cloned/opened the project in VS Code

## Once You Find It

```bash
cd /actual/path/to/Kubota-rental-platform
chmod +x start-chrome-with-camera.sh
./start-chrome-with-camera.sh 9222
```

## Alternative: Start Chrome Without the Script

If you can't find the project, you can start Chrome directly:

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --no-sandbox \
  --disable-dev-shm-usage \
  --user-data-dir=/tmp/chrome-debug-9222 \
  http://localhost:3000 &
```

This will work from anywhere!

