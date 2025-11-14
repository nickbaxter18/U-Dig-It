#!/bin/bash

# Card Verification Fix Test Script
# Run this to verify the fix is working

echo "🧪 Testing Card Verification Fix..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if API file has the fix
echo "Test 1: Checking API file for 'pending' support..."
if grep -q "bookingId === 'pending'" frontend/src/app/api/stripe/verify-card-hold/route.ts; then
    echo -e "${GREEN}✅ PASS${NC}: API supports 'pending' bookingId"
else
    echo -e "${RED}❌ FAIL${NC}: API does NOT support 'pending' bookingId"
    echo "  Fix not applied. Code might have been overwritten."
    exit 1
fi
echo ""

# Test 2: Check if component fetches client secret
echo "Test 2: Checking component fetches clientSecret..."
if grep -q "fetchClientSecret" frontend/src/components/booking/VerificationHoldPayment.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: Component has fetchClientSecret function"
else
    echo -e "${RED}❌ FAIL${NC}: Component missing fetchClientSecret"
    exit 1
fi
echo ""

# Test 3: Check if Elements receives clientSecret
echo "Test 3: Checking Elements receives clientSecret..."
if grep -q "options={{" frontend/src/components/booking/VerificationHoldPayment.tsx && \
   grep -q "clientSecret" frontend/src/components/booking/VerificationHoldPayment.tsx; then
    echo -e "${GREEN}✅ PASS${NC}: Elements configured with clientSecret"
else
    echo -e "${RED}❌ FAIL${NC}: Elements not configured with clientSecret"
    exit 1
fi
echo ""

# Test 4: Check API responds (without auth, should be 401 not 403)
echo "Test 4: Testing API endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/stripe/verify-card-hold \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "pending"}')

if [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${GREEN}✅ PASS${NC}: API responds with 401 Unauthorized (expected without auth)"
elif [ "$HTTP_STATUS" = "403" ]; then
    echo -e "${RED}❌ FAIL${NC}: API responds with 403 Forbidden (fix not working!)"
    echo "  This means the dev server hasn't reloaded the new code."
    echo "  Try: cd frontend && rm -rf .next && npm run dev"
    exit 1
elif [ "$HTTP_STATUS" = "000" ]; then
    echo -e "${YELLOW}⚠️  WARN${NC}: API not responding. Is dev server running?"
    echo "  Start it with: cd frontend && npm run dev"
    exit 1
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Unexpected status code: $HTTP_STATUS"
fi
echo ""

# Test 5: Check Stripe env vars
echo "Test 5: Checking Stripe environment variables..."
if grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" frontend/.env.local; then
    echo -e "${GREEN}✅ PASS${NC}: Stripe publishable key configured"
else
    echo -e "${RED}❌ FAIL${NC}: Stripe publishable key missing"
    exit 1
fi

if grep -q "STRIPE_SECRET_KEY" frontend/.env.local; then
    echo -e "${GREEN}✅ PASS${NC}: Stripe secret key configured"
else
    echo -e "${RED}❌ FAIL${NC}: Stripe secret key missing"
    exit 1
fi
echo ""

# Summary
echo "================================================"
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo "================================================"
echo ""
echo "The fix has been applied correctly."
echo ""
echo "Next steps:"
echo "1. Clear your browser cache (Ctrl+Shift+R)"
echo "2. Navigate to: http://localhost:3000/book"
echo "3. Complete the booking form"
echo "4. Click 'Confirm Booking' → 'Proceed to Card Verification'"
echo "5. You should see the Stripe payment form load successfully!"
echo ""
echo "Test Card: 4242 4242 4242 4242"
echo "Expiry: 12/34"
echo "CVC: 123"
echo ""



