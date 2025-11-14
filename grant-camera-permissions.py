#!/usr/bin/env python3
"""
Grant camera permissions for localhost:3000 via Chrome DevTools Protocol (CDP)
Run this AFTER Chrome is started with CDP enabled
"""

import json
import sys
import time
from urllib.request import urlopen
from urllib.error import URLError

CDP_PORT = 9222
TARGET_URL = "http://localhost:3000"

def get_cdp_endpoint():
    """Get the WebSocket URL for CDP"""
    try:
        response = urlopen(f"http://localhost:{CDP_PORT}/json/version", timeout=2)
        data = json.loads(response.read())
        return data.get("webSocketDebuggerUrl")
    except URLError:
        print(f"❌ Cannot connect to Chrome CDP on port {CDP_PORT}")
        print("   Make sure Chrome is running with: --remote-debugging-port=9222")
        return None

def get_browser_contexts():
    """Get list of browser contexts"""
    try:
        response = urlopen(f"http://localhost:{CDP_PORT}/json", timeout=2)
        contexts = json.loads(response.read())
        return contexts
    except URLError:
        return []

def grant_permissions_via_browser_settings():
    """Instructions for manual permission grant"""
    print("\n📹 To grant camera permissions:")
    print("   1. Open the Chrome/Brave window")
    print("   2. Navigate to:", TARGET_URL)
    print("   3. Click the lock/camera icon in the address bar")
    print("   4. Set Camera to 'Allow'")
    print("   5. Refresh the page")
    print("\n   OR")
    print("\n   1. Open Chrome Settings")
    print("   2. Privacy and security → Site settings → Camera")
    print("   3. Add http://localhost:3000 and set to 'Allow'")

def main():
    print("🔍 Checking Chrome CDP connection...")

    ws_url = get_cdp_endpoint()
    if not ws_url:
        print("\n💡 Start Chrome with CDP first:")
        print("   brave-browser --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-dev-shm-usage --user-data-dir=/tmp/brave-debug-9222 http://localhost:3000 &")
        sys.exit(1)

    print(f"✅ Chrome CDP is accessible: {ws_url}")

    contexts = get_browser_contexts()
    if contexts:
        print(f"✅ Found {len(contexts)} browser context(s)")
    else:
        print("⚠️  No browser contexts found")

    print("\n📝 Note: CDP doesn't directly support granting permissions.")
    print("   However, you can:")
    print("   1. Start Chrome with --use-fake-ui-for-media-stream (auto-grants)")
    print("   2. Grant permissions manually in the browser")
    print("   3. Use browser automation to click 'Allow' when prompted")

    grant_permissions_via_browser_settings()

    print("\n💡 Recommended: Start Chrome with auto-grant flag:")
    print("   brave-browser --remote-debugging-port=9222 --remote-debugging-address=0.0.0.0 --no-sandbox --disable-dev-shm-usage --use-fake-ui-for-media-stream --user-data-dir=/tmp/brave-debug-9222 http://localhost:3000 &")

if __name__ == "__main__":
    main()

