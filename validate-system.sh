#!/bin/bash

# =============================================
# Admin Dashboard System Validation
# =============================================
# Validates that all components are working

echo "🔍 Kubota Admin Dashboard - System Validation"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

function test_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS_COUNT++))
}

function test_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL_COUNT++))
}

function test_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

echo "📁 Checking project structure..."
echo ""

# Test 1: Check if in correct directory
if [ -d "frontend" ] && [ -d "supabase" ]; then
    test_pass "Project directory structure"
else
    test_fail "Not in project root or missing directories"
    exit 1
fi

# Test 2: Check if .env.local exists
if [ -f "frontend/.env.local" ]; then
    test_pass "Environment file exists ($(wc -l < frontend/.env.local) lines)"
else
    test_fail ".env.local file not found"
fi

# Test 3: Check if node_modules exists
if [ -d "frontend/node_modules" ]; then
    test_pass "Node modules installed"
else
    test_fail "Node modules not installed (run: npm install)"
fi

echo ""
echo "📦 Checking required packages..."
echo ""

# Test 4: Check for Stripe package
if [ -d "frontend/node_modules/stripe" ]; then
    test_pass "Stripe package installed"
else
    test_fail "Stripe package missing (run: npm install stripe)"
fi

# Test 5: Check for SendGrid package
if [ -d "frontend/node_modules/@sendgrid/mail" ]; then
    test_pass "SendGrid package installed"
else
    test_fail "SendGrid package missing (run: npm install @sendgrid/mail)"
fi

# Test 6: Check for Stripe React
if [ -d "frontend/node_modules/@stripe/react-stripe-js" ]; then
    test_pass "Stripe React package installed"
else
    test_fail "Stripe React package missing"
fi

echo ""
echo "📄 Checking admin page files..."
echo ""

# Test 7-20: Check all admin pages exist
ADMIN_PAGES=(
    "dashboard/page.tsx"
    "bookings/page.tsx"
    "equipment/page.tsx"
    "customers/page.tsx"
    "payments/page.tsx"
    "operations/page.tsx"
    "support/page.tsx"
    "insurance/page.tsx"
    "promotions/page.tsx"
    "contracts/page.tsx"
    "communications/page.tsx"
    "analytics/page.tsx"
    "audit/page.tsx"
    "settings/page.tsx"
)

for page in "${ADMIN_PAGES[@]}"; do
    if [ -f "frontend/src/app/admin/$page" ]; then
        test_pass "Admin page exists: $page"
    else
        test_fail "Admin page missing: $page"
    fi
done

echo ""
echo "🔧 Checking API routes..."
echo ""

# Test 21-26: Check critical API routes
API_ROUTES=(
    "payments/create-intent/route.ts"
    "webhook/stripe/route.ts"
    "admin/payments/refund/route.ts"
    "admin/payments/receipt/[id]/route.ts"
    "admin/test-integrations/route.ts"
    "bookings/export/route.ts"
)

for route in "${API_ROUTES[@]}"; do
    if [ -f "frontend/src/app/api/$route" ]; then
        test_pass "API route exists: $route"
    else
        test_fail "API route missing: $route"
    fi
done

echo ""
echo "🧩 Checking critical components..."
echo ""

# Test 27-32: Check components
COMPONENTS=(
    "admin/AdminSidebar.tsx"
    "admin/EquipmentModal.tsx"
    "admin/EmailCustomerModal.tsx"
    "admin/CustomerEditModal.tsx"
    "admin/RevenueChart.tsx"
    "admin/RecentBookings.tsx"
)

for component in "${COMPONENTS[@]}"; do
    if [ -f "frontend/src/components/$component" ]; then
        test_pass "Component exists: $component"
    else
        test_fail "Component missing: $component"
    fi
done

echo ""
echo "📚 Checking documentation..."
echo ""

# Test 33-37: Check documentation files
DOCS=(
    "README_ADMIN_DASHBOARD.md"
    "SETUP_AND_TEST.md"
    "YOUR_NEXT_STEPS.md"
    "SYSTEM_READY.md"
    "STRIPE_EMAIL_CONFIGURATION_GUIDE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        test_pass "Documentation exists: $doc"
    else
        test_warn "Documentation missing: $doc"
    fi
done

echo ""
echo "🌐 Checking server status..."
echo ""

# Test 38: Check if server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    test_pass "Development server is running (port 3000)"
else
    test_warn "Server not responding (may need restart)"
fi

echo ""
echo "=============================================="
echo "📊 VALIDATION SUMMARY"
echo "=============================================="
echo ""
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"
echo ""

TOTAL=$((PASS_COUNT + FAIL_COUNT))
PERCENTAGE=$((PASS_COUNT * 100 / TOTAL))

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED ($PERCENTAGE%)${NC}"
    echo ""
    echo "🎉 Your admin dashboard is ready to use!"
    echo ""
    echo "Next steps:"
    echo "1. Visit: http://localhost:3000/api/admin/test-integrations"
    echo "2. Access: http://localhost:3000/admin/dashboard"
    echo "3. Read: YOUR_NEXT_STEPS.md"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  $FAIL_COUNT CHECK(S) FAILED ($PERCENTAGE% passed)${NC}"
    echo ""
    echo "Please fix the failed checks above before using the system."
    echo ""
    exit 1
fi


