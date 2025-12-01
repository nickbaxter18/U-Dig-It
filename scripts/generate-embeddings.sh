#!/bin/bash

# Script to generate embeddings for all equipment
# This should be run after the Supabase Edge Function is deployed

echo "🚀 Generating embeddings for equipment..."
echo ""

# Check if SUPABASE_URL is set
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ Error: SUPABASE_URL environment variable is not set"
  echo "   Please set it in your .env.local file"
  exit 1
fi

# Make API request to generate embeddings
echo "📡 Calling embedding generation API..."
RESPONSE=$(curl -s -X POST "${SUPABASE_URL%/}/api/equipment/generate-embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY:-}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Success! Embeddings generated"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Error: HTTP $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

echo ""
echo "✨ Done! You can now use semantic search."


