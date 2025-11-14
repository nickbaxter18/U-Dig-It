#!/bin/bash
# Frontend Auto-Start Verification Script
# This script diagnoses and fixes startup issues

echo "🔍 KUBOTA RENTAL PLATFORM - STARTUP VERIFICATION"
echo "================================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${BLUE}ℹ️  $message${NC}"
    fi
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""

# 1. Check if we're in the right directory
print_status "info" "Step 1: Verifying project location..."
if [ -f "package.json" ] && [ -d "apps/web" ]; then
    print_status "success" "Project root detected correctly"
    PROJECT_ROOT="$(pwd)"
else
    print_status "error" "Not in project root directory"
    echo "Please navigate to the project root and run this script again"
    exit 1
fi

# 2. Check package manager
print_status "info" "Step 2: Checking package manager..."
if command_exists pnpm; then
    PACKAGE_MANAGER="pnpm"
    print_status "success" "pnpm available"
elif command_exists npm; then
    PACKAGE_MANAGER="npm"
    print_status "success" "npm available (fallback)"
else
    print_status "error" "No package manager found"
    echo "Please install pnpm or npm"
    exit 1
fi

# 3. Check if dependencies are installed
print_status "info" "Step 3: Checking dependencies..."
if [ -d "node_modules" ] && [ -d "apps/web/node_modules" ]; then
    print_status "success" "Dependencies installed"
else
    print_status "warning" "Dependencies not installed"
    echo "Installing dependencies..."
    $PACKAGE_MANAGER install
    if [ $? -eq 0 ]; then
        print_status "success" "Dependencies installed successfully"
    else
        print_status "error" "Failed to install dependencies"
        exit 1
    fi
fi

# 4. Check if frontend is running
print_status "info" "Step 4: Checking frontend status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "success" "Frontend running on port 3000"
    FRONTEND_RUNNING=true
else
    print_status "warning" "Frontend not running on port 3000"
    FRONTEND_RUNNING=false
fi

# 5. Check if backend is running
print_status "info" "Step 5: Checking backend status..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_status "success" "Backend running on port 3001"
else
    print_status "info" "Backend not running (optional)"
fi

# 6. Test workspace filter
print_status "info" "Step 6: Testing workspace configuration..."
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    if $PACKAGE_MANAGER --filter @kubota-rental/web run --dry-run dev > /dev/null 2>&1; then
        print_status "success" "Workspace filter working correctly"
    else
        print_status "error" "Workspace filter not working"
        echo "This might indicate a workspace configuration issue"
    fi
fi

# 7. Check VS Code settings
print_status "info" "Step 7: Checking VS Code configuration..."
if [ -f ".vscode/settings.json" ]; then
    if grep -q "Frontend Auto-Start" .vscode/settings.json; then
        print_status "success" "VS Code tasks configured"
    else
        print_status "warning" "VS Code tasks not configured"
    fi
else
    print_status "warning" "VS Code settings file not found"
fi

# 8. Check Cursor configuration
print_status "info" "Step 8: Checking Cursor configuration..."
if [ -f ".cursor/startup.sh" ] && [ -x ".cursor/startup.sh" ]; then
    print_status "success" "Cursor startup script exists and is executable"
else
    print_status "error" "Cursor startup script missing or not executable"
    echo "Making startup script executable..."
    chmod +x .cursor/startup.sh
fi

# 9. Test startup script
print_status "info" "Step 9: Testing startup script..."
if .cursor/startup.sh > /tmp/verify-test.log 2>&1; then
    print_status "success" "Startup script executes without errors"
else
    print_status "error" "Startup script has errors"
    echo "Check /tmp/verify-test.log for details"
fi

echo ""
echo "🎯 VERIFICATION SUMMARY"
echo "======================"

# 10. Overall assessment
ISSUES_FOUND=false

if [ "$FRONTEND_RUNNING" = false ]; then
    print_status "error" "Frontend is not running"
    ISSUES_FOUND=true

    echo ""
    echo "🔧 STARTUP COMMANDS:"
    echo "===================="
    echo "1. Quick start:"
    echo "   $PACKAGE_MANAGER --filter @kubota-rental/web run dev"
    echo ""
    echo "2. Direct approach:"
    echo "   cd apps/web && $PACKAGE_MANAGER run dev"
    echo ""
    echo "3. Full development:"
    echo "   $PACKAGE_MANAGER dev"
    echo ""
    echo "4. Force restart:"
    echo "   pkill -f 'next\|node' && $PACKAGE_MANAGER dev"
fi

if [ "$ISSUES_FOUND" = false ]; then
    print_status "success" "All systems operational!"
    echo ""
    echo "🎉 Everything is working correctly!"
    echo "Frontend should auto-start when Cursor opens."
else
    echo ""
    print_status "warning" "Some issues detected. Use the commands above to start manually."

    echo ""
    echo "🛠️  TROUBLESHOOTING STEPS:"
    echo "=========================="
    echo "1. Check VS Code/Cursor settings"
    echo "2. Verify terminal profile is set to 'enhanced-bash'"
    echo "3. Ensure tasks are configured to run on folder open"
    echo "4. Check startup script logs: cat /tmp/frontend.log"
fi

echo ""
print_status "info" "Verification complete!"
echo ""

# Clean up test log
rm -f /tmp/verify-test.log