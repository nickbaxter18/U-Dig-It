# PERMANENT FIX - File Watching Error

## The Problem
You see: **"Unable to watch for file changes. Please follow the instructions link to resolve this issue."**

## The Solution (One Command)

### Step 1: Copy the script to your host machine

The script is here: `/home/vscode/Kubota-rental-platform/PERMANENT_FIX.sh`

### Step 2: Open a terminal ON YOUR HOST MACHINE (not in Docker)

### Step 3: Run this ONE command:

```bash
cd ~/Kubota-rental-platform && bash PERMANENT_FIX.sh
```

When prompted, enter your password: `NiBa00242!`

### Step 4: Restart your dev container

In VS Code:
- Press `F1`
- Type: `Dev Containers: Rebuild Container`
- Press Enter

### Step 5: Done! ✅

File watching errors should be gone forever.

---

## What This Does

- Increases your system's file watch limit from 65,536 to 524,288
- Makes the change permanent (survives reboots)
- Works for all Docker containers on your machine

---

## Manual Alternative

If you prefer to do it manually, run these on your HOST machine:

```bash
# Add the setting
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf

# Apply it
sudo sysctl -p

# Verify
cat /proc/sys/fs/inotify/max_user_watches
# Should show: 524288
```

---

## For Windows (WSL2)

If you're using WSL2 on Windows:

1. Open PowerShell as Administrator
2. Edit WSL config:
   ```powershell
   notepad $env:USERPROFILE\.wslconfig
   ```
3. Add these lines:
   ```ini
   [wsl2]
   kernelCommandLine = fs.inotify.max_user_watches=524288
   ```
4. Restart WSL:
   ```powershell
   wsl --shutdown
   ```

---

**Questions?** See full documentation in `.devcontainer/FILE_WATCHING.md`

