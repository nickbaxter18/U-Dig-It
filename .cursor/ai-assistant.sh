#!/bin/bash
# AI Assistant Terminal Functions
# This script provides AI-optimized terminal functions for maximum productivity

# =============================================================================
# AI ASSISTANCE FUNCTIONS
# =============================================================================

# Smart project analysis
function analyze() {
    echo "🔍 ANALYZING PROJECT STRUCTURE..."
    echo ""

    # Check project structure
    echo "📁 Project Structure:"
    find . -maxdepth 2 -type d -name "node_modules" -prune -o -type d -print | head -20

    echo ""
    echo "📊 File Statistics:"
    echo "TypeScript files: $(find . -name "*.ts" -not -path "*/node_modules/*" | wc -l)"
    echo "React components: $(find . -name "*.tsx" -not -path "*/node_modules/*" | wc -l)"
    echo "Test files: $(find . -name "*.test.*" -o -name "*.spec.*" | wc -l)"
    echo "Configuration files: $(find . -name "*.json" -o -name "*.js" -o -name "*.ts" | grep -E "(config|\.config)" | wc -l)"

    echo ""
    echo "🔧 Dependencies:"
    if [ -f "package.json" ]; then
        echo "Dependencies: $(cat package.json | grep -c '"dependencies"')"
        echo "Dev dependencies: $(cat package.json | grep -c '"devDependencies"')"
    fi

    echo ""
    echo "📈 Git Status:"
    git status --short
}

# Smart error analysis
function errors() {
    echo "🐛 ANALYZING ERRORS..."
    echo ""

    # Check for TypeScript errors
    echo "TypeScript errors:"
    npm run type-check 2>&1 | grep -i error || echo "No TypeScript errors found"

    echo ""
    echo "Linting errors:"
    npm run lint 2>&1 | grep -i error || echo "No linting errors found"

    echo ""
    echo "Test failures:"
    npm test 2>&1 | grep -i "fail\|error" || echo "No test failures found"
}

# Smart dependency management
function deps() {
    echo "📦 DEPENDENCY MANAGEMENT..."
    echo ""

    if [ -f "package.json" ]; then
        echo "Current dependencies:"
        npm list --depth=0 2>/dev/null | head -20

        echo ""
        echo "Outdated packages:"
        npm outdated 2>/dev/null || echo "All packages are up to date"

        echo ""
        echo "Security vulnerabilities:"
        npm audit 2>/dev/null | grep -E "(high|critical|moderate)" || echo "No security vulnerabilities found"
    else
        echo "No package.json found"
    fi
}

# Smart performance analysis
function performance() {
    echo "⚡ PERFORMANCE ANALYSIS..."
    echo ""

    # Check bundle size
    if [ -f "package.json" ]; then
        echo "Bundle analysis:"
        npm run build 2>/dev/null && echo "Build completed successfully"
    fi

    # Check for large files
    echo ""
    echo "Large files (>1MB):"
    find . -type f -size +1M -not -path "*/node_modules/*" -not -path "*/.git/*" | head -10

    # Check for unused dependencies
    echo ""
    echo "Potentially unused dependencies:"
    if command -v depcheck &> /dev/null; then
        depcheck 2>/dev/null | head -10
    else
        echo "Install depcheck to analyze unused dependencies: npm install -g depcheck"
    fi
}

# Smart code quality analysis
function quality() {
    echo "🎯 CODE QUALITY ANALYSIS..."
    echo ""

    # TypeScript coverage
    echo "TypeScript coverage:"
    if command -v type-coverage &> /dev/null; then
        type-coverage 2>/dev/null || echo "Install type-coverage: npm install -g type-coverage"
    else
        echo "Install type-coverage: npm install -g type-coverage"
    fi

    # Test coverage
    echo ""
    echo "Test coverage:"
    if [ -f "package.json" ] && grep -q "coverage" package.json; then
        npm run coverage 2>/dev/null || echo "No coverage script found"
    else
        echo "Add coverage script to package.json"
    fi

    # Code complexity
    echo ""
    echo "Code complexity analysis:"
    if command -v complexity-report &> /dev/null; then
        complexity-report . 2>/dev/null | head -20
    else
        echo "Install complexity-report: npm install -g complexity-report"
    fi
}

# Smart debugging
function debug() {
    echo "🔧 DEBUGGING ASSISTANCE..."
    echo ""

    # Check running processes
    echo "Running Node.js processes:"
    ps aux | grep node | grep -v grep || echo "No Node.js processes running"

    # Check ports
    echo ""
    echo "Active ports:"
    netstat -tulpn | grep LISTEN | head -10

    # Check logs
    echo ""
    echo "Recent log files:"
    find . -name "*.log" -mtime -1 2>/dev/null | head -5

    # Check environment
    echo ""
    echo "Environment variables:"
    env | grep -E "(NODE|NPM|PATH)" | head -10
}

# Smart testing
function test() {
    echo "🧪 TESTING ASSISTANCE..."
    echo ""

    if [ -f "package.json" ]; then
        # Check test scripts
        echo "Available test scripts:"
        cat package.json | grep -A 10 '"scripts"' | grep test

        echo ""
        echo "Running tests..."
        npm test 2>&1 | head -50

        echo ""
        echo "Test coverage:"
        if grep -q "coverage" package.json; then
            npm run coverage 2>&1 | head -20
        else
            echo "No coverage script found"
        fi
    else
        echo "No package.json found"
    fi
}

# Smart deployment
function deploy() {
    echo "🚀 DEPLOYMENT ASSISTANCE..."
    echo ""

    # Pre-deployment checks
    echo "Running pre-deployment checks..."

    # Type check
    echo "1. Type checking..."
    npm run type-check 2>/dev/null && echo "✅ Type check passed" || echo "❌ Type check failed"

    # Linting
    echo "2. Linting..."
    npm run lint 2>/dev/null && echo "✅ Linting passed" || echo "❌ Linting failed"

    # Testing
    echo "3. Testing..."
    npm test 2>/dev/null && echo "✅ Tests passed" || echo "❌ Tests failed"

    # Building
    echo "4. Building..."
    npm run build 2>/dev/null && echo "✅ Build successful" || echo "❌ Build failed"

    echo ""
    echo "Deployment readiness:"
    if [ $? -eq 0 ]; then
        echo "✅ Ready for deployment"
    else
        echo "❌ Not ready for deployment - fix issues above"
    fi
}

# Smart git operations
function git() {
    echo "📚 GIT ASSISTANCE..."
    echo ""

    # Current status
    echo "Current status:"
    git status --short

    echo ""
    echo "Recent commits:"
    git log --oneline -10

    echo ""
    echo "Branches:"
    git branch -a

    echo ""
    echo "Remote status:"
    git remote -v

    echo ""
    echo "Uncommitted changes:"
    git diff --name-only
}

# Smart environment setup
function env() {
    echo "🌍 ENVIRONMENT ASSISTANCE..."
    echo ""

    # Check Node.js version
    echo "Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "NPM version: $(npm --version 2>/dev/null || echo 'Not installed')"

    # Check environment files
    echo ""
    echo "Environment files:"
    ls -la .env* 2>/dev/null || echo "No .env files found"

    # Check package.json
    if [ -f "package.json" ]; then
        echo ""
        echo "Package.json scripts:"
        cat package.json | grep -A 20 '"scripts"'
    fi

    # Check for common issues
    echo ""
    echo "Common issues check:"
    if [ ! -d "node_modules" ]; then
        echo "❌ node_modules not found - run 'npm install'"
    else
        echo "✅ node_modules found"
    fi

    if [ ! -f ".env" ]; then
        echo "❌ .env file not found - create one from .env.example"
    else
        echo "✅ .env file found"
    fi
}

# Smart help system
function aihelp() {
    echo "🤖 AI ASSISTANT HELP..."
    echo ""
    echo "Available commands:"
    echo "  analyze     - Analyze project structure and statistics"
    echo "  errors      - Analyze and display current errors"
    echo "  deps        - Manage and analyze dependencies"
    echo "  performance - Analyze performance and bundle size"
    echo "  quality     - Analyze code quality and coverage"
    echo "  debug       - Debugging assistance and process info"
    echo "  test        - Testing assistance and coverage"
    echo "  deploy      - Pre-deployment checks and readiness"
    echo "  git         - Git status and operations"
    echo "  env         - Environment setup and configuration"
    echo "  start-dev   - Start development servers (frontend + backend)"
    echo "  container-info - Show dev container status and services"
    echo "  aihelp      - Show this help message"
    echo ""
    echo "Quick tips:"
    echo "  - Use 'start-dev' to start both frontend and backend"
    echo "  - Use 'container-info' to check dev container status"
    echo "  - Use 'analyze' to get a project overview"
    echo "  - Use 'errors' to identify and fix issues"
    echo "  - Use 'deploy' before pushing to production"
    echo "  - Use 'debug' when troubleshooting issues"
}

# =============================================================================
# AUTO-LOAD FUNCTIONS
# =============================================================================

# Dev container specific functions
function container-info() {
    echo "🐳 DEVELOPMENT ENVIRONMENT INFORMATION"
    echo ""
    echo "📍 Workspace Location:"
    if [ -d "/workspace" ] && [ "$(pwd)" = "/workspace" ]; then
        echo "  - Dev container workspace: /workspace"
        echo "  - Project root: $PROJECT_ROOT"
        echo "  - Environment: Dev Container"
    elif [ -d "/home/vscode/Kubota-rental-platform" ]; then
        echo "  - Local workspace: $PROJECT_ROOT"
        echo "  - Environment: Local Development"
    else
        echo "  - Current directory: $(pwd)"
        echo "  - Project root: $PROJECT_ROOT"
        echo "  - Environment: Unknown"
    fi

    echo ""
    echo "🌐 Active Services:"
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "  - ✅ Frontend (apps/web): http://localhost:3000"
    else
        echo "  - ❌ Frontend (apps/web): not running"
    fi

    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "  - ✅ Backend (apps/api): http://localhost:3001"
    else
        echo "  - ❌ Backend (apps/api): not running"
    fi

    echo ""
    echo "🛠️  Quick Commands:"
    echo "  - 'start-dev' - Start development servers"
    echo "  - 'dev' - Start development servers (alias)"
    echo "  - 'goto w/a/r' - Navigate to apps/web/apps/api/root"
    echo "  - 'web/api/proj' - Quick navigation aliases"
    echo "  - 'status' - Show project status"
    echo "  - 'errors' - Show current errors"

    echo ""
    echo "📱 Access URLs:"
    echo "  - Frontend (apps/web): http://localhost:3000"
    echo "  - Backend (apps/api):  http://localhost:3001"
    echo "  - Health:              http://localhost:3001/health"
}

# Start development servers
function start-dev() {
    echo "🚀 Starting development servers..."

    # Check if already running
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend already running on port 3000"
    else
        echo "🎯 Starting frontend..."
        if [ -d "$PROJECT_ROOT/apps/web" ]; then
            cd "$PROJECT_ROOT/apps/web"
            if command -v pnpm >/dev/null 2>&1; then
                PORT=3000 pnpm run dev > /tmp/frontend.log 2>&1 &
            else
                PORT=3000 npm run dev > /tmp/frontend.log 2>&1 &
            fi
            cd "$PROJECT_ROOT"
        else
            echo "❌ Frontend directory not found at $PROJECT_ROOT/apps/web"
        fi
        sleep 3
    fi

    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend already running on port 3001"
    else
        echo "🎯 Starting backend..."
        if [ -d "$PROJECT_ROOT/apps/api" ]; then
            cd "$PROJECT_ROOT/apps/api"
            if command -v pnpm >/dev/null 2>&1; then
                PORT=3001 pnpm run start:simple > /tmp/backend.log 2>&1 &
            else
                PORT=3001 npm run start:simple > /tmp/backend.log 2>&1 &
            fi
            cd "$PROJECT_ROOT"
        else
            echo "❌ Backend directory not found at $PROJECT_ROOT/apps/api"
        fi
        sleep 5
    fi

    echo ""
    echo "🎉 Development servers started!"
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend:  http://localhost:3001"
    echo "💊 Health:   http://localhost:3001/health"
    echo ""
    echo "Type 'container-info' to check status"
}

# Make functions available in the current shell
export -f analyze errors deps performance quality debug test deploy git env aihelp container-info start-dev

echo "🤖 AI Assistant functions loaded!"
echo "Type 'aihelp' for available commands or 'container-info' for dev container details"