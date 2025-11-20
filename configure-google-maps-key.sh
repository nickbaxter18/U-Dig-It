#!/bin/bash
# Configure Google Maps API Key
# Usage: bash configure-google-maps-key.sh

echo "🔧 Google Maps API Key Configuration"
echo "======================================"
echo ""

# Check if API key is provided
if [ -z "$1" ]; then
  echo "❌ Error: No API key provided"
  echo ""
  echo "Usage:"
  echo "  bash configure-google-maps-key.sh YOUR_GOOGLE_MAPS_API_KEY"
  echo ""
  echo "Example:"
  echo "  bash configure-google-maps-key.sh AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  echo ""
  echo "Where to find your Google Maps API key:"
  echo "  1. Google Cloud Console → APIs & Services → Credentials"
  echo "  2. Look for 'API Keys' section"
  echo "  3. Copy the key (starts with 'AIzaSy...')"
  echo ""
  exit 1
fi

API_KEY="$1"

echo "📝 Adding Google Maps API key to configuration..."
echo ""

# Option 1: Add to frontend/.env.local
echo "Option 1: Adding to frontend/.env.local"
if [ -d "frontend" ]; then
  # Remove existing entry if present
  if [ -f "frontend/.env.local" ]; then
    grep -v "GOOGLE_MAPS_API_KEY=" frontend/.env.local > frontend/.env.local.tmp 2>/dev/null || true
    mv frontend/.env.local.tmp frontend/.env.local 2>/dev/null || true
  fi

  # Add new entry
  echo "GOOGLE_MAPS_API_KEY=$API_KEY" >> frontend/.env.local
  echo "✅ Added to frontend/.env.local"
else
  echo "⚠️  frontend/ directory not found, skipping .env.local"
fi

echo ""
echo "Option 2: SQL command to add to database"
echo "Run this in Supabase SQL Editor:"
echo ""
echo "UPDATE system_config"
echo "SET value = '\"$API_KEY\"'::jsonb,"
echo "    updated_at = NOW()"
echo "WHERE key = 'GOOGLE_MAPS_API_KEY';"
echo ""

echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Restart your frontend server: cd frontend && pnpm dev"
echo "2. Test the booking flow: http://localhost:3000/book"
echo "3. Try typing an address in the delivery location field"
echo ""

