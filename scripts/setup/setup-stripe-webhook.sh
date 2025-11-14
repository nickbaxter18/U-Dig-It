#!/bin/bash

echo "🎯 Stripe Webhook Setup Script"
echo "================================"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first."
    exit 1
fi

echo "✅ Stripe CLI found: $(stripe --version)"
echo ""

# Check if logged in
echo "📝 Checking Stripe authentication..."
if stripe config --list &> /dev/null; then
    echo "✅ Already logged in to Stripe"
else
    echo "⏳ Please login to Stripe..."
    stripe login
fi

echo ""
echo "🚀 Starting webhook forwarding..."
echo "📌 Forwarding to: http://localhost:3000/api/webhooks/stripe"
echo ""
echo "⚠️  IMPORTANT: Copy the webhook secret (whsec_...) from below"
echo "   and add it to frontend/.env.local as STRIPE_WEBHOOK_SECRET"
echo ""

# Start webhook forwarding
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
