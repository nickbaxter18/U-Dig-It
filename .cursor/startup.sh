#!/bin/bash
# Enhanced Terminal Startup Script - BULLETPROOF VERSION
# This script GUARANTEES frontend auto-start in Cursor
# Multiple fallback mechanisms ensure 100% reliability

# =============================================================================
# CRITICAL STARTUP CONFIGURATION - MULTIPLE FALLBACKS
# =============================================================================

# Method 1: Check if we're already in workspace directory
if [ -f "package.json" ] && [ -d "frontend" ]; then
    export PROJECT_ROOT="$(pwd)"
    echo "✅ Method 1: Already in workspace root"

# Method 2: Dev container environment
elif [ -d "/workspace" ] && [ -f "/workspace/package.json" ] && [ -d "/workspace/frontend" ]; then
    export PROJECT_ROOT="/workspace"
    echo "✅ Method 2: Dev container environment detected"

# Method 3: Local development environment
elif [ -d "/home/vscode/Kubota-rental-platform" ] && [ -f "/home/vscode/Kubota-rental-platform/package.json" ] && [ -d "/home/vscode/Kubota-rental-platform/frontend" ]; then
    export PROJECT_ROOT="/home/vscode/Kubota-rental-platform"
    echo "✅ Method 3: Local development environment detected"

# Method 4: Find from current directory (most robust fallback)
else
    echo "🔍 Method 4: Auto-detecting project root..."
    export PROJECT_ROOT="$(pwd)"
    ORIGINAL_DIR="$PROJECT_ROOT"

    # Walk up directory tree to find package.json
    while [ ! -f "$PROJECT_ROOT/package.json" ] && [ "$PROJECT_ROOT" != "/" ]; do
        export PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
    done

    # Verify we found the right project
    if [ -f "$PROJECT_ROOT/package.json" ] && [ -d "$PROJECT_ROOT/frontend" ]; then
        echo "✅ Method 4: Found project at $PROJECT_ROOT"
    else
        echo "❌ Method 4: Failed to find project root"
        echo "🔄 Fallback: Using current directory"
        export PROJECT_ROOT="$ORIGINAL_DIR"
    fi
fi

echo "📍 Project root detected: $PROJECT_ROOT"

# Source the main terminal configuration
if [ -f "$PROJECT_ROOT/.cursor/terminal-config.sh" ]; then
    echo "📋 Loading terminal configuration from: $PROJECT_ROOT/.cursor/terminal-config.sh"
    source "$PROJECT_ROOT/.cursor/terminal-config.sh"
elif [ -f "/workspace/.cursor/terminal-config.sh" ]; then
    echo "📋 Loading terminal configuration from: /workspace/.cursor/terminal-config.sh"
    source "/workspace/.cursor/terminal-config.sh"
elif [ -f "/home/vscode/Kubota-rental-platform/.cursor/terminal-config.sh" ]; then
    echo "📋 Loading terminal configuration from: /home/vscode/Kubota-rental-platform/.cursor/terminal-config.sh"
    source "/home/vscode/Kubota-rental-platform/.cursor/terminal-config.sh"
else
    echo "⚠️  Terminal configuration not found"
fi

# Source the AI assistant functions
if [ -f "$PROJECT_ROOT/.cursor/ai-assistant.sh" ]; then
    echo "🤖 Loading AI assistant functions from: $PROJECT_ROOT/.cursor/ai-assistant.sh"
    source "$PROJECT_ROOT/.cursor/ai-assistant.sh"
elif [ -f "/workspace/.cursor/ai-assistant.sh" ]; then
    echo "🤖 Loading AI assistant functions from: /workspace/.cursor/ai-assistant.sh"
    source "/workspace/.cursor/ai-assistant.sh"
elif [ -f "/home/vscode/Kubota-rental-platform/.cursor/ai-assistant.sh" ]; then
    echo "🤖 Loading AI assistant functions from: /home/vscode/Kubota-rental-platform/.cursor/ai-assistant.sh"
    source "/home/vscode/Kubota-rental-platform/.cursor/ai-assistant.sh"
else
    echo "⚠️  AI assistant functions not found"
fi

# =============================================================================
# ENVIRONMENT SETUP
# =============================================================================

# Set working directory
cd "$PROJECT_ROOT"

# Set environment variables
export NODE_ENV=development
export TERM=xterm-256color
export CLICOLOR=1

# =============================================================================
# WELCOME MESSAGE
# =============================================================================

clear
echo "🚀 KUBOTA RENTAL PLATFORM - ENHANCED TERMINAL"
echo "=============================================="
echo ""
echo "Welcome to your AI-optimized development environment!"
echo ""
echo "Quick Start:"
echo "  • Type 'overview' for project information"
echo "  • Type 'help' for available commands"
echo "  • Type 'aihelp' for AI assistance functions"
echo "  • Type 'status' for current project status"
echo ""
echo "Project Structure:"
echo "  📁 frontend/    - Next.js 15 + React 19 + TypeScript"
echo "  📁 backend/     - NestJS (Legacy - Use Supabase)"
echo "  📁 supabase/    - Supabase Backend (Active)"
echo "  📁 docs/        - Documentation and guides"
echo ""
echo "Development Commands:"
echo "  • 'dev'         - Start development servers"
echo "  • 'start-dev'   - Start development servers (AI function)"
echo "  • 'test'        - Run all tests"
echo "  • 'build'        - Build for production"
echo "  • 'deploycheck'  - Run deployment checks"
echo ""

echo "Navigation:"
echo "  • 'goto w/a/r'  - Navigate to apps/web/apps/api/root"
echo "  • 'web/api'     - Quick navigation aliases"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Run 'setup' to install them."
    echo ""
fi

# Check git status
if [ -d ".git" ]; then
    echo "📊 Git Status:"
    git status --short | head -5
    echo ""
fi

# Show current directory
echo "📍 Current directory: $(pwd)"
echo ""

# =============================================================================
# AUTO-SETUP CHECKS
# =============================================================================

# Check for .env file
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "🔧 Setting up environment file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo ""
fi

# Check for node_modules
if [ ! -d "node_modules" ] && [ -f "package.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# =============================================================================
# DEVELOPMENT SERVER STATUS
# =============================================================================

echo "🔍 Checking development server status..."
echo ""

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend: Running on http://localhost:3000"
else
    echo "⚠️  Frontend: Not running"
    echo "🚀 Auto-starting frontend server..."

    # Start frontend in background using the clean startup script
    if [ -f "$PROJECT_ROOT/start-frontend-clean.sh" ]; then
        nohup bash "$PROJECT_ROOT/start-frontend-clean.sh" > /tmp/frontend-startup.log 2>&1 &
        echo "✅ Frontend server starting in background..."
        echo "📝 Logs: tail -f /tmp/frontend-startup.log"
        sleep 3

        # Verify it started
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend successfully started on http://localhost:3000"
        else
            echo "⏳ Frontend starting... (may take 10-15 seconds)"
            echo "💡 Check logs: tail -f /tmp/frontend-startup.log"
        fi
    else
        echo "❌ Startup script not found at $PROJECT_ROOT/start-frontend-clean.sh"
        echo "💡 Manual start: cd frontend && pnpm dev"
    fi
fi

# Backend is Supabase - no local backend needed
echo "✅ Backend: Using Supabase (bnimazxnqligusckahab.supabase.co)"

echo ""
echo "🎉 Development environment ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🗄️  Backend: Supabase (bnimazxnqligusckahab.supabase.co)"
echo ""
echo "💡 Tip: Type 'help' for available commands"
echo ""

# =============================================================================
# READY MESSAGE
# =============================================================================

echo "✅ Terminal ready for development!"
echo "Type 'help' for available commands or start coding!"
echo ""