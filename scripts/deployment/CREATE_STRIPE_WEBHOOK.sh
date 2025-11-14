#!/bin/bash

# Automated Stripe Webhook Configuration
# This script creates the webhook endpoint programmatically using Stripe API

echo "🔧 Creating Stripe Webhook Endpoint..."
echo ""

STRIPE_SECRET_KEY="your_stripe_secret_key_here"
WEBHOOK_URL="https://bnimazxnqligusckahab.supabase.co/functions/v1/stripe-webhook"

# Create webhook endpoint via Stripe API
RESPONSE=$(curl -s -X POST https://api.stripe.com/v1/webhook_endpoints \
  -u "${STRIPE_SECRET_KEY}:" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "url=${WEBHOOK_URL}" \
  -d "enabled_events[]=payment_intent.succeeded" \
  -d "enabled_events[]=payment_intent.payment_failed" \
  -d "enabled_events[]=charge.refunded" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "description=Kubota Rental Platform - Production Webhook")

# Check if successful
if echo "$RESPONSE" | grep -q "\"id\":"; then
  echo "✅ Webhook endpoint created successfully!"
  echo ""

  # Extract webhook secret
  WEBHOOK_SECRET=$(echo "$RESPONSE" | grep -o '"secret":"whsec_[^"]*"' | sed 's/"secret":"\(.*\)"/\1/')

  if [ -n "$WEBHOOK_SECRET" ]; then
    echo "🔑 Your Webhook Signing Secret:"
    echo "$WEBHOOK_SECRET"
    echo ""
    echo "📋 COPY THIS SECRET AND RUN:"
    echo ""
    echo "supabase secrets set STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
    echo ""
    echo "OR add it in Supabase Dashboard:"
    echo "https://supabase.com/dashboard/project/bnimazxnqligusckahab/settings/vault"
    echo ""
  else
    echo "⚠️  Webhook created but couldn't extract secret. Check Stripe Dashboard."
  fi

  echo "✅ Webhook Details:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

else
  echo "❌ Failed to create webhook endpoint"
  echo ""
  echo "Response:"
  echo "$RESPONSE"
  echo ""
  echo "Please create manually at: https://dashboard.stripe.com/webhooks"
  echo "URL to use: $WEBHOOK_URL"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Next steps:"
echo "1. Copy the webhook secret above (whsec_...)"
echo "2. Run: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
echo "3. Done! Your Stripe integration is fully configured."
echo "════════════════════════════════════════════════════════════════"



























































