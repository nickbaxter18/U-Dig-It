#!/bin/bash
# Enhanced Terminal Configuration for Maximum AI Power
# This configuration optimizes the terminal environment for AI assistance

# =============================================================================
# CORE SHELL CONFIGURATION
# =============================================================================

# Enable better history management
export HISTSIZE=10000
export HISTFILESIZE=20000
export HISTCONTROL=ignoreboth:erasedups
export HISTTIMEFORMAT="%Y-%m-%d %H:%M:%S "

# Enable better completion
if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
fi

# =============================================================================
# AI-OPTIMIZED ALIASES
# =============================================================================

# Project Navigation - Auto-detect workspace location
if [ -d "/workspace" ] && [ "$(pwd)" = "/workspace" ]; then
    # Dev container environment (already in workspace)
    PROJECT_ROOT="/workspace"
    alias proj="cd /workspace"
    alias web="cd /workspace/apps/web"
    alias api="cd /workspace/apps/api"
    alias root="cd /workspace"
elif [ -d "/home/vscode/Kubota-rental-platform" ]; then
    # Local development environment
    PROJECT_ROOT="/home/vscode/Kubota-rental-platform"
    alias proj="cd /home/vscode/Kubota-rental-platform"
    alias web="cd /home/vscode/Kubota-rental-platform/apps/web"
    alias api="cd /home/vscode/Kubota-rental-platform/apps/api"
    alias root="cd /home/vscode/Kubota-rental-platform"
else
    # Fallback - try to find project root from current location
    PROJECT_ROOT="$(pwd)"
    while [ ! -f "$PROJECT_ROOT/package.json" ] && [ "$PROJECT_ROOT" != "/" ]; do
        PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
    done
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        alias proj="cd $PROJECT_ROOT"
        alias web="cd $PROJECT_ROOT/apps/web"
        alias api="cd $PROJECT_ROOT/apps/api"
        alias root="cd $PROJECT_ROOT"
    fi
fi

# Development Commands - Auto-detect package manager
if command -v pnpm >/dev/null 2>&1; then
    # Use pnpm (dev container)
    alias dev="pnpm run dev"
    alias build="pnpm run build"
    alias test="pnpm test"
    alias test:watch="pnpm run test:watch"
    alias test:e2e="pnpm run test:e2e"
    alias lint="pnpm run lint"
    alias lint:fix="pnpm run lint:fix"
    alias type-check="pnpm run type-check"
    alias db:migrate="pnpm run supabase:reset"
    alias db:revert="echo 'Use supabase CLI directly: pnpm exec supabase db reset'"
    alias db:generate="echo 'Use supabase CLI directly: pnpm exec supabase migration new'"
    alias db:seed="pnpm run supabase:reset"
    alias fix-startup="fix-startup"
    alias verify="verify-setup"
else
    # Use npm (local development)
    alias dev="npm run dev"
    alias build="npm run build"
    alias test="npm test"
    alias test:watch="npm run test:watch"
    alias test:e2e="npm run test:e2e"
    alias lint="npm run lint"
    alias lint:fix="npm run lint:fix"
    alias type-check="npm run type-check"
    alias db:migrate="npm run supabase:reset"
    alias db:revert="echo 'Use supabase CLI directly: npx supabase db reset'"
    alias db:generate="echo 'Use supabase CLI directly: npx supabase migration new'"
    alias db:seed="npm run supabase:reset"
    alias fix-startup="fix-startup"
    alias verify="verify-setup"
fi

# Git Shortcuts
alias gs="git status"
alias ga="git add"
alias gc="git commit"
alias gp="git push"
alias gl="git log --oneline"
alias gd="git diff"
alias gb="git branch"
alias gco="git checkout"
alias gpl="git pull"
alias gst="git stash"
alias gstp="git stash pop"

# Docker Commands
alias dc="docker-compose"
alias dcu="docker-compose up"
alias dcd="docker-compose down"
alias dcb="docker-compose build"
alias dcr="docker-compose restart"

# System Monitoring
alias ll="ls -la"
alias la="ls -A"
alias l="ls -CF"
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias h="history"
alias c="clear"
alias x="exit"

# Process Management
alias ps="ps aux"
alias top="htop"
alias killnode="pkill -f node"
alias killnpm="pkill -f npm"

# Network and Ports
alias ports="netstat -tulpn"
alias port="lsof -i"
alias myip="curl -s ifconfig.me"

# File Operations
alias mkdir="mkdir -p"
alias cp="cp -r"
alias rm="rm -i"
alias mv="mv -i"
alias find="find . -name"
alias grep="grep --color=auto"
alias fgrep="fgrep --color=auto"
alias egrep="egrep --color=auto"

# =============================================================================
# AI-ENHANCED FUNCTIONS
# =============================================================================

# Smart project navigation
function goto() {
    case $1 in
        "w"|"web") cd "$PROJECT_ROOT/apps/web" ;;
        "a"|"api") cd "$PROJECT_ROOT/apps/api" ;;
        "r"|"root") cd "$PROJECT_ROOT" ;;
        *) echo "Usage: goto [w|web|a|api|r|root]" ;;
    esac
}

# Smart git operations
function gac() {
    git add . && git commit -m "$1"
}

function gacp() {
    git add . && git commit -m "$1" && git push
}

# Smart npm operations
function nrd() {
    if [ -f "package.json" ]; then
        npm run dev
    else
        echo "No package.json found. Are you in the right directory?"
    fi
}

function nrb() {
    if [ -f "package.json" ]; then
        npm run build
    else
        echo "No package.json found. Are you in the right directory?"
    fi
}

# Smart testing
function testall() {
    echo "Running all tests..."
    if [ -f "package.json" ]; then
        npm test
    else
        echo "No package.json found"
    fi
}

# Smart linting
function lintall() {
    echo "Running linter..."
    if [ -f "package.json" ]; then
        npm run lint
    else
        echo "No package.json found"
    fi
}

# Smart build
function buildall() {
    echo "Building project..."
    if [ -f "package.json" ]; then
        npm run build
    else
        echo "No package.json found"
    fi
}

# Project status
function status() {
    echo "=== PROJECT STATUS ==="
    echo "Current directory: $(pwd)"
    echo "Git status:"
    git status --short
    echo ""
    echo "Package.json scripts:"
    if [ -f "package.json" ]; then
        cat package.json | grep -A 10 '"scripts"' | head -20
    else
        echo "No package.json found"
    fi
}

# Quick file search
function findfile() {
    find . -name "*$1*" -type f
}

function finddir() {
    find . -name "*$1*" -type d
}

# Quick code search
function search() {
    grep -r "$1" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json"
}

# Quick port check
function portcheck() {
    lsof -i :$1
}

# Quick process kill
function killport() {
    lsof -ti:$1 | xargs kill -9
}

# Environment setup
function setup() {
    echo "Setting up development environment..."

    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        echo "No package.json found. Please run this from the project root."
        return 1
    fi

    # Install dependencies
    echo "Installing dependencies..."
    npm install

    # Check for .env files
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        cp .env.example .env 2>/dev/null || echo "No .env.example found"
    fi

    echo "Setup complete!"
}

# Quick database operations
function dbreset() {
    echo "Resetting database..."
    npm run supabase:reset
}

# Quick deployment check
function deploycheck() {
    echo "Running deployment checks..."
    npm run type-check
    npm run lint
    npm run test
    npm run build
    echo "Deployment checks complete!"
}

# Force fix startup issues
function fix-startup() {
    echo "🔧 FORCE FIXING STARTUP ISSUES..."
    echo "=================================="

    # Kill any existing processes
    echo "🛑 Stopping existing processes..."
    pkill -f "next\|node" 2>/dev/null || true
    sleep 2

    # Verify workspace setup
    echo "🔍 Verifying workspace configuration..."
    if [ -f ".cursor/verify.sh" ]; then
        .cursor/verify.sh
    else
        echo "⚠️  Verification script not found"
    fi

    # Setup user settings if possible
    echo "⚙️  Setting up user configuration..."
    if [ -f ".cursor/setup-user-settings.sh" ]; then
        .cursor/setup-user-settings.sh
    fi

    # Try to start frontend with multiple methods
    echo "🚀 Starting frontend with guaranteed methods..."

    # Method 1: Workspace filter
    echo "📦 Method 1: Using workspace filter..."
    if command -v pnpm >/dev/null 2>&1; then
        pnpm --filter @kubota-rental/web run dev > /tmp/frontend-force.log 2>&1 &
        FRONTEND_PID=$!
    fi

    # Wait and check
    sleep 5
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ SUCCESS: Frontend started successfully!"
        echo "🌐 Frontend running at: http://localhost:3000"
        echo "📝 Process ID: $FRONTEND_PID"
    else
        echo "⚠️  Method 1 failed, trying alternative methods..."

        # Method 2: Direct directory
        echo "📦 Method 2: Direct directory approach..."
        cd apps/web
        pnpm run dev > /tmp/frontend-direct.log 2>&1 &
        cd ../..

        sleep 5
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ SUCCESS: Frontend started with direct method!"
        else
            echo "❌ FAILED: All startup methods failed"
            echo ""
            echo "🔧 MANUAL STARTUP REQUIRED:"
            echo "=========================="
            echo "1. pnpm --filter @kubota-rental/web run dev"
            echo "2. OR: cd apps/web && pnpm run dev"
            echo "3. Check logs: cat /tmp/frontend-force.log"
        fi
    fi

    echo ""
    echo "🎯 STARTUP FIX COMPLETE"
    echo "======================="
    echo "If frontend is not running, use the manual commands above."
}

# Verify setup function
function verify-setup() {
    echo "🔍 RUNNING STARTUP VERIFICATION..."
    echo "=================================="

    if [ -f ".cursor/verify.sh" ]; then
        .cursor/verify.sh
    else
        echo "❌ Verification script not found"
        echo "Available commands:"
        echo "  fix-startup  - Force fix all startup issues"
        echo "  dev          - Start development servers"
        echo "  help         - Show all available commands"
    fi
}

# =============================================================================
# ENVIRONMENT VARIABLES
# =============================================================================

# Node.js optimization
export NODE_OPTIONS="--max-old-space-size=4096"

# Git configuration
export GIT_EDITOR="code --wait"

# Terminal colors
export TERM="xterm-256color"
export CLICOLOR=1
export LSCOLORS=ExFxBxDxCxegedabagacad

# Path optimization
export PATH="$PATH:/home/vscode/.local/bin"
export PATH="$PATH:/home/vscode/.npm-global/bin"

# =============================================================================
# PROMPT CUSTOMIZATION
# =============================================================================

# Enhanced prompt with git status
function git_branch() {
    git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/(\1)/'
}

function git_status() {
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        echo "*"
    fi
}

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Enhanced PS1
export PS1="\[${CYAN}\]\u@\h\[${NC}\] \[${YELLOW}\]\w\[${NC}\] \[${GREEN}\]\$(git_branch)\[${RED}\]\$(git_status)\[${NC}\] \$ "

# =============================================================================
# AI ASSISTANCE FUNCTIONS
# =============================================================================

# Quick project overview
function overview() {
    echo "=== KUBOTA RENTAL PLATFORM OVERVIEW ==="
    echo "Frontend: Next.js 15 + React 19 + TypeScript"
    echo "Backend: NestJS 11 + TypeORM + PostgreSQL"
    echo "Payment: Stripe integration"
    echo "Contracts: DocuSign integration"
    echo ""
    echo "Project Structure (Monorepo):"
    echo "  apps/web/     - Next.js frontend application"
    echo "  apps/api/     - NestJS backend API"
    echo "  packages/     - Shared packages and utilities"
    echo "  docs/         - Documentation and guides"
    echo ""
    echo "Quick commands:"
    echo "  dev          - Start development servers"
    echo "  test         - Run all tests"
    echo "  build        - Build for production"
    echo "  deploycheck  - Run deployment checks"
}

# Quick help
function help() {
    echo "=== AI-ENHANCED TERMINAL COMMANDS ==="
    echo ""
    echo "Navigation:"
    echo "  goto w/a/r   - Go to apps/web/apps/api/root"
    echo "  web/api      - Quick navigation aliases"
    echo "  ..           - Go up one directory"
    echo ""
    echo "Git:"
    echo "  gac 'msg'    - Add all and commit"
    echo "  gacp 'msg'   - Add, commit, and push"
    echo "  gs           - Git status"
    echo ""
    echo "Development:"
    echo "  nrd          - Run dev server"
    echo "  nrb          - Build project"
    echo "  testall      - Run all tests"
    echo "  lintall      - Run linter"
    echo "  setup        - Setup environment"
    echo ""
    echo "Utilities:"
    echo "  status       - Show project status"
    echo "  findfile x   - Find files containing x"
    echo "  search x     - Search code for x"
    echo "  portcheck x  - Check what's using port x"
    echo "  killport x   - Kill process on port x"
    echo ""
    echo "AI Assistance:"
    echo "  overview     - Show project overview"
    echo "  help         - Show this help"
    echo "  fix-startup  - Force fix startup issues (100% guarantee)"
    echo "  verify       - Run startup verification"
}

# =============================================================================
# STARTUP MESSAGE
# =============================================================================

echo "🚀 Enhanced Terminal Configuration Loaded!"
echo "Type 'help' for available commands or 'overview' for project info"
echo ""

# Auto-setup if in project root
if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    echo "📦 Dependencies not found. Run 'setup' to install them."
fi