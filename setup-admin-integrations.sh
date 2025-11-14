#!/bin/bash

# ============================================
# Kubota Rental Platform - Integration Setup
# ============================================
# This script helps configure Stripe and SendGrid
# for the admin dashboard

echo "🚀 Kubota Rental Platform - Integration Setup"
echo "=============================================="
echo ""

# Check if we're in the project root
if [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

cd frontend

echo "📁 Working directory: $(pwd)"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local already exists"
    echo "   Creating backup: .env.local.backup"
    cp .env.local .env.local.backup
    echo ""
fi

# Create or append to .env.local
echo "📝 Configuring environment variables..."
echo ""

cat >> .env.local << 'EOF'

# ========= STRIPE (TEST MODE) =========
# Added by setup script on $(date)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# ========= EMAIL (SENDGRID) =========
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
EMAIL_FROM=NickBaxter@udigit.ca
EMAIL_FROM_NAME=U-Dig It Rentals

# ========= FEATURE FLAGS =========
NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true

EOF

echo "✅ Environment variables added to .env.local"
echo ""

# Verify the file was created/updated
if [ -f ".env.local" ]; then
    echo "📊 Configuration Summary:"
    echo "   - Stripe: TEST MODE (safe for development)"
    echo "   - SendGrid: Configured for NickBaxter@udigit.ca"
    echo "   - Feature flags: Payments and emails enabled"
    echo ""

    # Count variables
    VAR_COUNT=$(grep -c "=" .env.local)
    echo "   Total environment variables: $VAR_COUNT"
    echo ""
else
    echo "❌ Error: Failed to create .env.local"
    exit 1
fi

echo "🎯 Next Steps:"
echo ""
echo "1. Restart your development server:"
echo "   $ npm run dev"
echo ""
echo "2. Test integrations:"
echo "   Visit: http://localhost:3000/api/admin/test-integrations"
echo "   (Sign in as admin first)"
echo ""
echo "3. Access admin dashboard:"
echo "   - Sign in as admin"
echo "   - Click profile dropdown"
echo "   - Click 'Admin Dashboard'"
echo ""
echo "4. Test payment with test card:"
echo "   Card: 4242 4242 4242 4242"
echo "   Exp: 12/26, CVC: 123"
echo ""
echo "5. Send a test email:"
echo "   Admin → Customers → Email icon"
echo ""

echo "✅ Setup Complete!"
echo ""
echo "📚 Documentation:"
echo "   - SETUP_AND_TEST.md - Complete testing guide"
echo "   - STRIPE_EMAIL_CONFIGURATION_GUIDE.md - Integration details"
echo "   - COMPLETE_ADMIN_SYSTEM_SUMMARY.md - Full system overview"
echo ""
echo "🎉 Your admin dashboard is ready to use!"
echo ""


