# File Watching Issues - Complete Fix Guide

## The Problem

You're seeing this error:
```
Unable to watch for file changes. Please follow the instructions link to resolve this issue.
```

This happens because your system has run out of **inotify watches** - the system limit for monitoring file changes. Next.js, NestJS, and other dev tools all need to watch files for hot reload, and large projects like ours exceed the default limit.

## Quick Fix (Temporary)

Inside the dev container, run:

```bash
# Check current limit
cat /proc/sys/fs/inotify/max_user_watches

# Run our fix script
bash /workspace/.devcontainer/fix-file-watching.sh
```

**Note:** This fix is temporary and will reset when you reboot your host machine.

## Permanent Fix (Recommended)

### For Linux Host Machine

**1. Edit sysctl configuration on your HOST machine (not in container):**

```bash
# On your HOST machine (outside container)
sudo nano /etc/sysctl.conf
```

**2. Add these lines at the end:**

```bash
# Increase inotify watches for file watching (needed for Node.js dev servers)
fs.inotify.max_user_watches=524288
fs.inotify.max_user_instances=512
fs.inotify.max_queued_events=32768
```

**3. Apply the changes:**

```bash
# On your HOST machine
sudo sysctl -p
```

**4. Verify the changes:**

```bash
cat /proc/sys/fs/inotify/max_user_watches
# Should show: 524288
```

**5. Restart your dev container:**

```bash
# In VS Code: F1 -> Dev Containers: Rebuild Container
```

### For macOS Host Machine

macOS doesn't have this issue - it uses a different file watching mechanism (FSEvents). If you're on macOS and seeing this error, it's likely a different issue.

### For Windows Host Machine (WSL2)

**1. Create/edit `.wslconfig` in your Windows home directory:**

```powershell
# On Windows, edit: C:\Users\YourUsername\.wslconfig
notepad $env:USERPROFILE\.wslconfig
```

**2. Add these settings:**

```ini
[wsl2]
kernelCommandLine = fs.inotify.max_user_watches=524288
```

**3. Restart WSL:**

```powershell
# In PowerShell (as Administrator)
wsl --shutdown
```

**4. Restart your WSL distribution and dev container**

## Why 524288?

This is the recommended value for modern development:

- **Default limit:** 8,192 (too low for modern projects)
- **Our project needs:** ~50,000-100,000 watches
  - Next.js watches all frontend files
  - NestJS watches all backend files
  - TypeScript watches for compilation
  - ESLint watches for linting
  - Jest watches for testing
- **Recommended limit:** 524,288 (provides headroom)

Each watch uses about 1KB of memory, so 524,288 watches = ~512MB RAM (negligible on modern systems).

## Verification

After applying the fix, verify it works:

```bash
# In dev container
cat /proc/sys/fs/inotify/max_user_watches
# Should show: 524288

# Start dev servers
cd /workspace/frontend && npm run dev
# Should start without file watching errors

cd /workspace/backend && npm run start:dev
# Should start without file watching errors
```

## Alternative Solutions

If you can't increase the system limit, you can reduce file watching:

### Option 1: Exclude Directories from Watching

Add to `next.config.js`:

```javascript
module.exports = {
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/dist/**',
        '**/coverage/**',
      ]
    }
    return config
  }
}
```

### Option 2: Use Polling Instead (Not Recommended - High CPU)

```bash
# Use polling (slower, higher CPU usage)
CHOKIDAR_USEPOLLING=true npm run dev
```

### Option 3: Reduce Watch Depth

Add to `tsconfig.json`:

```json
{
  "watchOptions": {
    "excludeDirectories": ["**/node_modules", "**/.git", "dist", "coverage"]
  }
}
```

## Troubleshooting

### Still seeing errors after increasing limit?

1. **Verify the limit was actually increased:**
   ```bash
   cat /proc/sys/fs/inotify/max_user_watches
   ```

2. **Restart everything:**
   ```bash
   # Exit dev container
   # Restart Docker Desktop (if using)
   # Reopen in dev container
   ```

3. **Check if other processes are using watches:**
   ```bash
   # See which processes are using inotify
   find /proc/*/fd -lname anon_inode:inotify -printf '%hinfo/%f\n' 2>/dev/null | xargs cat 2>/dev/null | grep -c '^inotify'
   ```

### Getting "permission denied"?

You need to run the sysctl commands on your **HOST machine**, not inside the container. The container shares the kernel with the host.

### Changes not persisting after reboot?

Make sure you edited `/etc/sysctl.conf` (not just ran `sysctl -w`). The config file persists across reboots.

## For CI/CD Environments

If you're running into this in CI/CD, add to your workflow:

```yaml
# .github/workflows/test.yml
- name: Increase file watchers
  run: |
    sudo sysctl -w fs.inotify.max_user_watches=524288
    sudo sysctl -w fs.inotify.max_user_instances=512
```

## Additional Resources

- [VS Code File Watching Limits](https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc)
- [Next.js File Watching Issues](https://nextjs.org/docs/messages/failed-to-load-swc)
- [Node.js File Watching](https://nodejs.org/docs/latest/api/fs.html#fswatchfilename-options-listener)

## Summary

**Quick Fix (Temporary):**
```bash
sudo sysctl -w fs.inotify.max_user_watches=524288
```

**Permanent Fix (Add to `/etc/sysctl.conf` on HOST):**
```bash
fs.inotify.max_user_watches=524288
```

**Then restart your dev container.**

---

**Questions?** See the troubleshooting section above or check the error logs in your dev server output.

