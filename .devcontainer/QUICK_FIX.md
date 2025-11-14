# Quick Fix: File Watching Error

## If you see: "Unable to watch for file changes"

### **Option 1: Permanent Fix (5 minutes) - RECOMMENDED**

**On your HOST machine** (not in the container):

```bash
# Linux
sudo sh -c 'echo "fs.inotify.max_user_watches=524288" >> /etc/sysctl.conf'
sudo sysctl -p

# WSL2 (Windows)
# Edit C:\Users\YourUsername\.wslconfig and add:
# [wsl2]
# kernelCommandLine = fs.inotify.max_user_watches=524288
# Then restart WSL: wsl --shutdown

# macOS
# No fix needed - macOS doesn't have this issue
```

Then restart your dev container.

### **Option 2: Temporary Fix (30 seconds)**

Inside the dev container:

```bash
bash /workspace/.devcontainer/fix-file-watching.sh
```

**Note:** Resets on host reboot.

### **Option 3: Use Polling (Not Recommended - High CPU)**

Add to your `.env` files:

```bash
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

---

**For full details, see:** [FILE_WATCHING.md](./FILE_WATCHING.md)

