#!/bin/bash
# Activate Enhanced Terminal Configuration
# This script enables the enhanced terminal features in the current shell

echo "🚀 Activating Enhanced Terminal Configuration..."
echo ""

# Check if we're in dev container or local environment
if [ -d "/workspace" ]; then
    # Dev container environment
    PROJECT_ROOT="/workspace"
    echo "🐳 Dev Container Environment Detected"
else
    # Local environment
    PROJECT_ROOT="/home/vscode/Kubota-rental-platform"
    echo "💻 Local Development Environment Detected"
fi

echo "📍 Project Root: $PROJECT_ROOT"
echo ""

# Source the terminal configuration
if [ -f "$PROJECT_ROOT/.cursor/terminal-config.sh" ]; then
    echo "📋 Loading terminal configuration..."
    source "$PROJECT_ROOT/.cursor/terminal-config.sh"
else
    echo "❌ Terminal configuration not found at $PROJECT_ROOT/.cursor/terminal-config.sh"
fi

# Source AI assistant functions
if [ -f "$PROJECT_ROOT/.cursor/ai-assistant.sh" ]; then
    echo "🤖 Loading AI assistant functions..."
    source "$PROJECT_ROOT/.cursor/ai-assistant.sh"
else
    echo "❌ AI assistant functions not found at $PROJECT_ROOT/.cursor/ai-assistant.sh"
fi

echo ""
echo "✅ Enhanced Terminal Configuration Active!"
echo ""
echo "📚 Available Commands:"
echo "  • Navigation: goto f/b/r, frontend, backend, proj"
echo "  • Development: dev, build, test, lint, start-dev"
echo "  • AI Assistant: analyze, errors, container-info, status"
echo "  • Git: gac 'msg', gs, gl, gacp 'msg'"
echo ""
echo "💡 Quick Start:"
echo "  • Type 'container-info' to check environment status"
echo "  • Type 'help' for available commands"
echo "  • Type 'aihelp' for AI assistant functions"
echo ""
echo "🎉 Ready for development!"

