#!/bin/bash
# Fix file watching issues in dev container
# This script increases the inotify watch limit

set -e

echo "🔧 Fixing file watching issues..."

# Check current limit
CURRENT_LIMIT=$(cat /proc/sys/fs/inotify/max_user_watches 2>/dev/null || echo "0")
echo "Current inotify limit: $CURRENT_LIMIT"

# Recommended limit for large projects
RECOMMENDED_LIMIT=524288

if [ "$CURRENT_LIMIT" -lt "$RECOMMENDED_LIMIT" ]; then
    echo "⚠️  Current limit is too low for this project"
    echo "📝 Attempting to increase limit to $RECOMMENDED_LIMIT..."

    # Try to set it temporarily (requires privileges)
    if sudo sysctl -w fs.inotify.max_user_watches=$RECOMMENDED_LIMIT 2>/dev/null; then
        echo "✅ Temporarily increased limit to $RECOMMENDED_LIMIT"
        echo ""
        echo "⚠️  This is temporary and will reset on reboot."
        echo "📖 See .devcontainer/FILE_WATCHING.md for permanent fix"
    else
        echo "❌ Cannot increase limit (need sudo on host machine)"
        echo "📖 See .devcontainer/FILE_WATCHING.md for manual fix"
    fi
else
    echo "✅ inotify limit is sufficient: $CURRENT_LIMIT"
fi

echo ""
echo "Current limits:"
echo "  max_user_watches: $(cat /proc/sys/fs/inotify/max_user_watches)"
echo "  max_user_instances: $(cat /proc/sys/fs/inotify/max_user_instances)"
echo "  max_queued_events: $(cat /proc/sys/fs/inotify/max_queued_events)"

