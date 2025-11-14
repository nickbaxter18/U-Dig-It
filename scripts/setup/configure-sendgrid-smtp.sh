#!/bin/bash

# ============================================================================
# SendGrid SMTP Configuration for Supabase
# ============================================================================
# This script configures SendGrid as your SMTP provider in Supabase Cloud
#
# Prerequisites:
# 1. Get your Supabase Access Token: https://supabase.com/dashboard/account/tokens
# 2. Get your Project Ref from your dashboard URL
#
# Usage:
#   ./configure-sendgrid-smtp.sh YOUR_ACCESS_TOKEN YOUR_PROJECT_REF
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo ""
    echo "Usage: $0 <SUPABASE_ACCESS_TOKEN> <PROJECT_REF>"
    echo ""
    echo "Example:"
    echo "  $0 sbp_abc123xyz456 abcdefghijklmnop"
    echo ""
    echo "Get your access token: https://supabase.com/dashboard/account/tokens"
    echo "Get your project ref from your dashboard URL"
    exit 1
fi

ACCESS_TOKEN="$1"
PROJECT_REF="$2"
API_ENDPOINT="https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth"

# SendGrid SMTP Configuration
SENDGRID_API_KEY="your_sendgrid_api_key_here"
SMTP_FROM_EMAIL="NickBaxter@udigit.ca"
SMTP_SENDER_NAME="U-Dig It Rentals"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SendGrid SMTP Configuration${NC}"
echo -e "${BLUE}U-Dig It Rentals${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}📧 SMTP Provider: SendGrid${NC}"
echo -e "${YELLOW}📨 From Email: $SMTP_FROM_EMAIL${NC}"
echo -e "${YELLOW}✉️  Sender Name: $SMTP_SENDER_NAME${NC}"
echo ""

# Create JSON payload for SendGrid SMTP
JSON_PAYLOAD=$(cat <<EOF
{
  "external_email_enabled": true,
  "mailer_secure_email_change_enabled": true,
  "mailer_autoconfirm": false,
  "smtp_admin_email": "$SMTP_FROM_EMAIL",
  "smtp_host": "smtp.sendgrid.net",
  "smtp_port": "587",
  "smtp_user": "apikey",
  "smtp_pass": "$SENDGRID_API_KEY",
  "smtp_sender_name": "$SMTP_SENDER_NAME"
}
EOF
)

echo -e "${YELLOW}🚀 Configuring SendGrid SMTP in Supabase...${NC}"
echo -e "${BLUE}Project: $PROJECT_REF${NC}"
echo ""

# Send API request
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_ENDPOINT" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ SUCCESS!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}SendGrid SMTP has been configured:${NC}"
    echo "  ✓ SMTP Host: smtp.sendgrid.net"
    echo "  ✓ SMTP Port: 587"
    echo "  ✓ From Email: $SMTP_FROM_EMAIL"
    echo "  ✓ Sender Name: $SMTP_SENDER_NAME"
    echo "  ✓ Email Confirmations: Enabled"
    echo ""
    echo -e "${BLUE}Your emails will now be sent through SendGrid!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
    echo "1. Update your email templates in Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/auth/templates"
    echo ""
    echo "2. Copy/paste the professional HTML templates from:"
    echo "   - supabase/templates/confirmation.html"
    echo "   - supabase/templates/recovery.html"
    echo "   - supabase/templates/magic_link.html"
    echo "   - supabase/templates/email_change.html"
    echo ""
    echo "3. Adjust rate limits (default: 30 emails/hour):"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/auth/rate-limits"
    echo ""
    echo "4. Test by creating a new account!"
    echo ""
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ ERROR${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${RED}HTTP Status Code: $HTTP_CODE${NC}"
    echo ""
    echo -e "${RED}Response:${NC}"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Verify your Access Token is valid"
    echo "2. Verify your Project Ref is correct"
    echo "3. Ensure SendGrid API key is valid"
    echo "4. Check that $SMTP_FROM_EMAIL is verified in SendGrid"
    echo ""
    exit 1
fi

