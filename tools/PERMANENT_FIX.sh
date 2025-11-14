#!/bin/bash
# PERMANENT FIX for "Unable to watch for file changes" error
#
# ⚠️ IMPORTANT: Run this ON YOUR HOST MACHINE (not in the Docker container)
#
# Usage:
#   bash PERMANENT_FIX.sh

set -e

echo "🔧 Applying PERMANENT fix for file watching..."
echo ""

# Check if already fixed
CURRENT=$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo "0")
if [ "$CURRENT" -ge 524288 ]; then
    echo "✅ Already fixed! Current limit: $CURRENT"
    exit 0
fi

echo "Current limit: $CURRENT"
echo "Target limit: 524288"
echo ""

# Add the setting to sysctl.conf (if not already there)
if grep -q "fs.inotify.max_user_watches" /etc/sysctl.conf 2>/dev/null; then
    echo "⚠️  Setting already exists in /etc/sysctl.conf"
    echo "Updating it..."
    sudo sed -i 's/fs.inotify.max_user_watches=.*/fs.inotify.max_user_watches=524288/' /etc/sysctl.conf
else
    echo "Adding setting to /etc/sysctl.conf..."
    echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
fi

# Apply the changes
echo ""
echo "Applying changes..."
sudo sysctl -p | grep inotify || sudo sysctl -w fs.inotify.max_user_watches=524288

# Verify
NEW_LIMIT=$(cat /proc/sys/fs/inotify/max_user_watches)
echo ""
echo "✅ DONE! New limit: $NEW_LIMIT"
echo ""
echo "📋 Next steps:"
echo "   1. Restart your Docker containers"
echo "   2. Or restart your dev container in VS Code"
echo "   3. File watching should now work! 🎉"

