#!/bin/bash

# Simple script to generate embeddings via API endpoint
# Requires the Next.js server to be running

echo "🚀 Generating embeddings for equipment..."
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "❌ Error: Next.js server is not running"
  echo "   Please start it with: bash start-frontend-clean.sh"
  exit 1
fi

# Call the generate embeddings endpoint
# Note: This endpoint uses createServiceClient() so it should work without auth
echo "📡 Calling embedding generation API..."
RESPONSE=$(curl -s -X POST "http://localhost:3000/api/equipment/generate-embeddings" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Success! Embeddings generated"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "✨ Done! You can now use semantic search."
else
  echo "❌ Error: HTTP $HTTP_CODE"
  echo "$BODY"
  exit 1
fi

