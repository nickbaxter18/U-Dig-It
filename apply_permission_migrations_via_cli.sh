#!/bin/bash

# Script to apply permission system migrations using Supabase CLI
# This is an alternative when MCP tools are not working

set -e

echo "🚀 Applying Permission System Migrations via Supabase CLI..."
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
    echo "4. Copy and paste the contents of each migration file in order:"
    echo "   - supabase/migrations/20250123000001_enterprise_permission_system.sql"
    echo "   - supabase/migrations/20250123000002_seed_permissions_and_roles.sql"
    echo "   - supabase/migrations/20250123000003_rls_permission_integration.sql"
    echo "5. Run each migration"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  Warning: supabase/config.toml not found"
    echo "   This script should be run from the project root"
    echo ""
fi

echo "📋 Migration files to apply:"
echo "   1. 20250123000001_enterprise_permission_system.sql"
echo "   2. 20250123000002_seed_permissions_and_roles.sql"
echo "   3. 20250123000003_rls_permission_integration.sql"
echo ""

# Apply migrations
echo "🔄 Applying migration 1/3..."
supabase db push --file supabase/migrations/20250123000001_enterprise_permission_system.sql || {
    echo "❌ Migration 1 failed. Please check the error above."
    exit 1
}

echo "✅ Migration 1/3 completed"
echo ""

echo "🔄 Applying migration 2/3..."
supabase db push --file supabase/migrations/20250123000002_seed_permissions_and_roles.sql || {
    echo "❌ Migration 2 failed. Please check the error above."
    exit 1
}

echo "✅ Migration 2/3 completed"
echo ""

echo "🔄 Applying migration 3/3..."
supabase db push --file supabase/migrations/20250123000003_rls_permission_integration.sql || {
    echo "❌ Migration 3 failed. Please check the error above."
    exit 1
}

echo "✅ Migration 3/3 completed"
echo ""

echo "🎉 All migrations applied successfully!"
echo ""
echo "✅ Permission system is now initialized"
echo "   - Tables created"
echo "   - Permissions seeded"
echo "   - Roles created and assigned"
echo "   - RLS policies updated"
echo ""
echo "🔄 Please refresh the admin settings page to see the permission management UI"

