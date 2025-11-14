#!/bin/bash

# Test Payment Completion Helper Script
# This script helps test payment completion manually without Stripe webhooks

echo "🧪 Payment Completion Testing Helper"
echo "===================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  Warning: 'jq' is not installed. Install it for better output formatting."
    echo "   Run: brew install jq (on macOS) or sudo apt-get install jq (on Ubuntu)"
    echo ""
fi

# Get booking ID
echo "📝 Enter the booking ID to mark payment as completed:"
read -p "Booking ID: " BOOKING_ID

if [ -z "$BOOKING_ID" ]; then
    echo "❌ Error: Booking ID is required"
    exit 1
fi

# Get payment type
echo ""
echo "💳 Select payment type:"
echo "  1) Invoice Payment"
echo "  2) Security Deposit"
read -p "Choice (1 or 2): " PAYMENT_CHOICE

case $PAYMENT_CHOICE in
    1)
        PAYMENT_TYPE="payment"
        PAYMENT_LABEL="Invoice Payment"
        ;;
    2)
        PAYMENT_TYPE="deposit"
        PAYMENT_LABEL="Security Deposit"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🔄 Marking $PAYMENT_LABEL as completed for booking $BOOKING_ID..."
echo ""

# Make API call
RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments/mark-completed \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat ~/.cursor/stripe-test-session 2>/dev/null || echo '')" \
  -d "{\"bookingId\": \"$BOOKING_ID\", \"paymentType\": \"$PAYMENT_TYPE\"}")

# Check if jq is available for pretty printing
if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq '.'

    # Check for success
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo ""
        echo "✅ Success! Payment marked as completed."
        echo ""
        echo "📍 Next steps:"
        echo "  1. Refresh the booking manage page in your browser"
        echo "  2. You should see a green checkmark (✅) next to the payment step"
        echo ""
    else
        echo ""
        echo "❌ Failed to mark payment as completed"
        echo ""
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        echo "Error: $ERROR_MSG"
        echo ""

        if [[ "$ERROR_MSG" == "Unauthorized" ]]; then
            echo "💡 Tip: Make sure you're logged in to the application first."
            echo "   1. Login at http://localhost:3000/auth/signin"
            echo "   2. Copy your session cookie"
            echo "   3. Save it to ~/.cursor/stripe-test-session"
            echo ""
        fi
    fi
else
    echo "$RESPONSE"

    if [[ "$RESPONSE" == *"\"success\":true"* ]]; then
        echo ""
        echo "✅ Success! Payment marked as completed."
    else
        echo ""
        echo "❌ Failed to mark payment as completed"
    fi
fi

echo ""
echo "📖 For more details, see: PAYMENT_COMPLETION_DIAGNOSIS.md"
echo ""












