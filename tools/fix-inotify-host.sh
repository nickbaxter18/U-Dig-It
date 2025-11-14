#!/bin/bash
# Run this script ON YOUR HOST MACHINE (not in the container)
# This permanently fixes the file watching issue

echo "🔧 Applying permanent fix for file watching..."

# Add inotify setting to sysctl.conf
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf

# Apply the changes
sudo sysctl -p

# Verify the change
echo ""
echo "✅ Current inotify limit:"
cat /proc/sys/fs/inotify/max_user_watches

echo ""
echo "🎉 Fix applied! Please restart your dev container:"
echo "   1. Exit the container"
echo "   2. In VS Code: F1 → 'Dev Containers: Rebuild Container'"
echo "   3. File watching errors should be gone!"

