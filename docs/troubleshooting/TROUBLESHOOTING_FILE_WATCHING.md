# File Watching Troubleshooting

## Error: "Unable to watch for file changes"

This is a **system limit issue**, not a bug in the code. It affects Next.js, NestJS, and other dev tools that watch files for hot reload.

## Quick Fix

### **For Linux Users:**

```bash
# On your HOST machine (outside container)
sudo sh -c 'echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf'
sudo sysctl -p
```

### **For Windows (WSL2) Users:**

1. Open PowerShell as Administrator
2. Edit WSL config:
   ```powershell
   notepad $env:USERPROFILE\.wslconfig
   ```
3. Add:
   ```ini
   [wsl2]
   kernelCommandLine = fs.inotify.max_user_watches=524288
   ```
4. Restart WSL:
   ```powershell
   wsl --shutdown
   ```

### **For macOS Users:**

macOS doesn't have this issue. If you see this error on macOS, check your Docker Desktop settings.

## Verify the Fix

```bash
# Check the limit
cat /proc/sys/fs/inotify/max_user_watches
# Should show: 524288

# Restart your dev servers
cd frontend && npm run dev
cd ../backend && npm run start:dev
```

## More Details

See comprehensive guide: [.devcontainer/FILE_WATCHING.md](./.devcontainer/FILE_WATCHING.md)

## Why This Happens

Our project has:
- ~20,000 files in `node_modules`
- Multiple dev servers (Next.js + NestJS)
- TypeScript compiler watching
- ESLint watching
- Jest watching

Default Linux limit: **8,192** watches
Our project needs: **~50,000** watches
Recommended limit: **524,288** watches

## Alternative: Reduce Watch Count

If you can't increase the system limit, exclude directories from watching:

```bash
# In frontend and backend
npm run build
# Then use production build instead of dev mode
```

Or modify `next.config.js` and `nest-cli.json` to exclude certain directories.

