#!/bin/bash

# ============================================================================
# Email Template Updater for Supabase Cloud
# ============================================================================
# Updates email templates using the Supabase Management API
# ============================================================================

set -e

ACCESS_TOKEN="$1"
PROJECT_REF="$2"
API_ENDPOINT="https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Updating Email Templates${NC}"
echo -e "${BLUE}U-Dig It Rentals${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Read and escape templates
echo -e "${YELLOW}📂 Reading templates...${NC}"

# Read confirmation template
CONFIRMATION_HTML=$(cat supabase/templates/confirmation.html | jq -Rs .)
RECOVERY_HTML=$(cat supabase/templates/recovery.html | jq -Rs .)
MAGIC_LINK_HTML=$(cat supabase/templates/magic_link.html | jq -Rs .)
EMAIL_CHANGE_HTML=$(cat supabase/templates/email_change.html | jq -Rs .)

echo -e "${GREEN}✓ All templates loaded${NC}"
echo ""

# Create JSON payload
echo -e "${YELLOW}📦 Creating API payload...${NC}"

JSON_PAYLOAD=$(cat <<EOF
{
  "mailer_subjects_confirmation": "Confirm Your Email - U-Dig It Rentals",
  "mailer_templates_confirmation_content": $CONFIRMATION_HTML,
  "mailer_subjects_recovery": "Reset Your Password - U-Dig It Rentals",
  "mailer_templates_recovery_content": $RECOVERY_HTML,
  "mailer_subjects_magic_link": "Your Sign-In Link - U-Dig It Rentals",
  "mailer_templates_magic_link_content": $MAGIC_LINK_HTML,
  "mailer_subjects_email_change": "Confirm Your Email Change - U-Dig It Rentals",
  "mailer_templates_email_change_content": $EMAIL_CHANGE_HTML
}
EOF
)

echo -e "${GREEN}✓ Payload ready${NC}"
echo ""

# Send to API
echo -e "${YELLOW}🚀 Updating templates in Supabase...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$API_ENDPOINT" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ EMAIL TEMPLATES UPDATED!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}All templates are now professional and branded:${NC}"
    echo "  ✓ Confirmation Email (Signup)"
    echo "  ✓ Password Recovery Email"
    echo "  ✓ Magic Link Email"
    echo "  ✓ Email Change Confirmation"
    echo ""
    echo -e "${BLUE}Features:${NC}"
    echo "  • U-Dig It Rentals branding"
    echo "  • Professional design"
    echo "  • Mobile responsive"
    echo "  • Contact info & social links"
    echo "  • Clear call-to-action buttons"
    echo ""
    echo -e "${YELLOW}🎉 Test it now by creating a new account!${NC}"
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
    exit 1
fi

