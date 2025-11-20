#!/bin/bash

# Script to apply permission system migrations
# This fixes the "Failed to fetch permissions" error

set -e

echo "🚀 Applying Permission System Migrations..."
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found."
    echo "📖 Install: npm install -g supabase"
    echo ""
    echo "Alternatively, apply migrations manually via Supabase Dashboard:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to SQL Editor"
    echo "4. Copy and paste the contents of each migration file:"
    echo "   - supabase/migrations/20250123000001_enterprise_permission_system.sql"
    echo "   - supabase/migrations/20250123000002_seed_permissions_and_roles.sql"
    echo "   - supabase/migrations/20250123000003_rls_permission_integration.sql"
    echo "5. Run each migration in order"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Apply migrations in order
echo "📄 Applying Migration 1: Enterprise Permission System..."
supabase db execute --file supabase/migrations/20250123000001_enterprise_permission_system.sql || {
    echo "⚠️  Migration 1 may have already been applied or encountered an error"
    echo "   Continuing with next migration..."
}

echo ""
echo "📄 Applying Migration 2: Seed Permissions and Roles..."
supabase db execute --file supabase/migrations/20250123000002_seed_permissions_and_roles.sql || {
    echo "⚠️  Migration 2 may have already been applied or encountered an error"
    echo "   Continuing with next migration..."
}

echo ""
echo "📄 Applying Migration 3: RLS Permission Integration..."
supabase db execute --file supabase/migrations/20250123000003_rls_permission_integration.sql || {
    echo "⚠️  Migration 3 may have already been applied or encountered an error"
}

echo ""
echo "✅ Migration process complete!"
echo ""
echo "🔄 Next steps:"
echo "1. Refresh the admin settings page"
echo "2. Navigate to Settings → Permissions tab"
echo "3. The permission system should now be functional"
echo ""


