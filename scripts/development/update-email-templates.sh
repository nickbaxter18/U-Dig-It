#!/bin/bash

# ============================================================================
# Supabase Email Template Updater for U-Dig It Rentals
# ============================================================================
# This script updates all email templates in your Supabase cloud project
# using the Management API.
#
# Prerequisites:
# 1. Get your Supabase Access Token: https://supabase.com/dashboard/account/tokens
# 2. Get your Project Ref from your dashboard URL:
#    https://supabase.com/dashboard/project/<PROJECT_REF>
#
# Usage:
#   ./update-email-templates.sh YOUR_ACCESS_TOKEN YOUR_PROJECT_REF
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Supabase Email Template Updater${NC}"
echo -e "${BLUE}U-Dig It Rentals${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to escape HTML for JSON
escape_for_json() {
    local content="$1"
    # Use jq to properly escape the HTML content for JSON
    echo "$content" | jq -Rs .
}

# Read template files
echo -e "${YELLOW}📂 Reading email templates...${NC}"

CONFIRMATION_HTML=$(cat supabase/templates/confirmation.html)
RECOVERY_HTML=$(cat supabase/templates/recovery.html)
MAGIC_LINK_HTML=$(cat supabase/templates/magic_link.html)
EMAIL_CHANGE_HTML=$(cat supabase/templates/email_change.html)

echo -e "${GREEN}✓ Confirmation template loaded (${#CONFIRMATION_HTML} chars)${NC}"
echo -e "${GREEN}✓ Recovery template loaded (${#RECOVERY_HTML} chars)${NC}"
echo -e "${GREEN}✓ Magic Link template loaded (${#MAGIC_LINK_HTML} chars)${NC}"
echo -e "${GREEN}✓ Email Change template loaded (${#EMAIL_CHANGE_HTML} chars)${NC}"
echo ""

# Escape templates for JSON
echo -e "${YELLOW}🔧 Preparing templates for API...${NC}"

CONFIRMATION_JSON=$(escape_for_json "$CONFIRMATION_HTML")
RECOVERY_JSON=$(escape_for_json "$RECOVERY_HTML")
MAGIC_LINK_JSON=$(escape_for_json "$MAGIC_LINK_HTML")
EMAIL_CHANGE_JSON=$(escape_for_json "$EMAIL_CHANGE_HTML")

echo -e "${GREEN}✓ Templates prepared${NC}"
echo ""

# Create JSON payload
echo -e "${YELLOW}📦 Building API payload...${NC}"

JSON_PAYLOAD=$(cat <<EOF
{
  "mailer_subjects_confirmation": "Confirm Your Email - U-Dig It Rentals",
  "mailer_templates_confirmation_content": $CONFIRMATION_JSON,
  "mailer_subjects_recovery": "Reset Your Password - U-Dig It Rentals",
  "mailer_templates_recovery_content": $RECOVERY_JSON,
  "mailer_subjects_magic_link": "Your Sign-In Link - U-Dig It Rentals",
  "mailer_templates_magic_link_content": $MAGIC_LINK_JSON,
  "mailer_subjects_email_change": "Confirm Your Email Change - U-Dig It Rentals",
  "mailer_templates_email_change_content": $EMAIL_CHANGE_JSON
}
EOF
)

echo -e "${GREEN}✓ Payload created (${#JSON_PAYLOAD} bytes)${NC}"
echo ""

# Update templates via API
echo -e "${YELLOW}🚀 Updating email templates in Supabase...${NC}"
echo -e "${BLUE}Project: $PROJECT_REF${NC}"
echo ""

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
    echo -e "${GREEN}All email templates have been updated:${NC}"
    echo -e "  ✓ Confirmation Email (Signup)"
    echo -e "  ✓ Password Recovery Email"
    echo -e "  ✓ Magic Link Email"
    echo -e "  ✓ Email Change Confirmation"
    echo ""
    echo -e "${BLUE}Your users will now receive branded U-Dig It Rentals emails!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test signup to see the new confirmation email"
    echo "2. Test password reset to see the recovery email"
    echo "3. Verify all emails look professional and branded"
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
    echo "3. Check that your token has the necessary permissions"
    echo "4. Ensure you're using a valid Supabase Access Token (not API key)"
    echo ""
    exit 1
fi

