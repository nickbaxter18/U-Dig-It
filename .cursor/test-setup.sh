#!/bin/bash
# Test script to verify enhanced terminal configuration
# This script works in both dev container and local environments

echo "🧪 Testing Enhanced Terminal Configuration"
echo "=========================================="

# Test 1: Check PROJECT_ROOT detection
echo ""
echo "📍 Test 1: Project Root Detection"
echo "Current directory: $(pwd)"
echo "PROJECT_ROOT: $PROJECT_ROOT"

if [ -d "/workspace" ] && [ "$(pwd)" = "/workspace" ]; then
    echo "✅ Environment: Dev Container"
elif [ -d "/home/vscode/Kubota-rental-platform" ]; then
    echo "✅ Environment: Local Development"
else
    echo "❌ Environment: Unknown"
fi

# Test 2: Check navigation commands
echo ""
echo "📁 Test 2: Navigation Commands"
echo "Testing 'frontend' command..."
if frontend && [ "$(pwd)" = "$PROJECT_ROOT/frontend" ]; then
    echo "✅ Frontend navigation works"
    root
else
    echo "❌ Frontend navigation failed"
fi

echo ""
echo "Testing 'backend' command..."
if backend && [ "$(pwd)" = "$PROJECT_ROOT/backend" ]; then
    echo "✅ Backend navigation works"
    root
else
    echo "❌ Backend navigation failed"
fi

# Test 3: Check development commands
echo ""
echo "🔧 Test 3: Development Commands"
echo "Testing package manager detection..."
if command -v pnpm >/dev/null 2>&1; then
    echo "✅ Package manager: pnpm"
else
    echo "✅ Package manager: npm"
fi

# Test 4: Check AI assistant functions
echo ""
echo "🤖 Test 4: AI Assistant Functions"
echo "Testing 'container-info' function..."
if command -v container-info >/dev/null 2>&1; then
    echo "✅ AI assistant functions loaded"
    echo ""
    container-info | head -10
else
    echo "❌ AI assistant functions not loaded"
fi

echo ""
echo "🎉 Terminal configuration test complete!"
echo "Type 'help' for available commands"
echo "Type 'aihelp' for AI assistant functions"

