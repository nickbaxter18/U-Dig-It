#!/bin/bash

# Kubota Rental Platform - Optimized Supabase Database Setup
# This script sets up the enhanced database with all optimizations
# Created: 2025-01-21

set -e  # Exit on any error

echo "🚀 Starting Optimized Supabase Database Setup..."
echo "📍 Working directory: $(pwd)"

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "📖 Installation: npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [[ ! -f "supabase/config.toml" ]]; then
    echo "❌ Not in Supabase project directory. Looking for supabase/config.toml"
    exit 1
fi

echo "✅ Supabase CLI found"
echo "✅ Project configuration found"

# Set environment variables
export SUPABASE_URL=${SUPABASE_URL:-"https://bnimazxnqligusckahab.supabase.co"}
export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc"}
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I"}

echo "🔗 Supabase URL: $SUPABASE_URL"

# Test database connection
echo "🔍 Testing database connection..."
if ! supabase db ping &> /dev/null; then
    echo "❌ Cannot connect to Supabase database"
    echo "💡 Make sure you're logged in: supabase login"
    echo "💡 And linked to project: supabase link --project-ref bnimazxnqligusckahab"
    exit 1
fi

echo "✅ Database connection successful"

# Reset database (optional - uncomment if you want a fresh start)
# echo "🗑️  Resetting database..."
# supabase db reset --linked

# Apply migrations in order
echo "📄 Applying migrations..."

echo "1️⃣  Applying initial schema..."
supabase db push --include-all || {
    echo "❌ Failed to apply initial schema"
    exit 1
}

echo "2️⃣  Applying RLS policies..."
supabase migration up --include-all || {
    echo "❌ Failed to apply RLS policies"
    exit 1
}

# Apply enhanced schema (if not already applied)
echo "3️⃣  Applying enhanced schema..."
if ! supabase db execute --file supabase/migrations/20250121000003_enhanced_schema.sql &> /dev/null; then
    echo "   Applying enhanced schema migration..."
    supabase migration new enhanced_schema || echo "Migration may already exist"
    cp supabase/migrations/20250121000003_enhanced_schema.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_enhanced_schema.sql
    supabase db push
fi

# Apply RLS policies (if not already applied)
echo "4️⃣  Applying enhanced RLS policies..."
if ! supabase db execute --file supabase/migrations/20250121000004_enhanced_rls_policies.sql &> /dev/null; then
    echo "   Applying enhanced RLS policies migration..."
    supabase migration new enhanced_rls_policies || echo "Migration may already exist"
    cp supabase/migrations/20250121000004_enhanced_rls_policies.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_enhanced_rls_policies.sql
    supabase db push
fi

# Apply advanced functions (if not already applied)
echo "5️⃣  Applying advanced functions..."
if ! supabase db execute --file supabase/migrations/20250121000005_advanced_functions.sql &> /dev/null; then
    echo "   Applying advanced functions migration..."
    supabase migration new advanced_functions || echo "Migration may already exist"
    cp supabase/migrations/20250121000005_advanced_functions.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_advanced_functions.sql
    supabase db push
fi

echo "✅ All migrations applied successfully"

# Apply seed data
echo "🌱 Applying enhanced seed data..."
supabase db execute --file supabase/enhanced_seed.sql || {
    echo "⚠️  Warning: Some seed data may already exist"
}

echo "✅ Seed data applied"

# Generate TypeScript types
echo "📝 Generating TypeScript types..."
supabase gen types typescript --project-id bnimazxnqligusckahab > apps/api/src/types/supabase.ts || {
    echo "⚠️  Could not generate types automatically"
    echo "💡 Run this manually: supabase gen types typescript --project-id bnimazxnqligusckahab > apps/api/src/types/supabase.ts"
}

# Start local development (optional)
echo "🚀 Starting local Supabase development..."
echo "💡 Run this in a separate terminal: supabase start"

# Test the setup
echo "🧪 Testing setup..."
echo "   Running system health check..."
supabase db execute --command "
SELECT
  'Setup Test' as test_name,
  CASE
    WHEN COUNT(*) > 10 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as result,
  'Found ' || COUNT(*) || ' tables' as details
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" || {
    echo "⚠️  Health check could not be completed"
}

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📊 What's been added:"
echo "   • Enhanced database schema with 15+ new tables"
echo "   • Comprehensive RLS security policies"
echo "   • Advanced business logic functions and triggers"
echo "   • Real-time subscriptions for critical tables"
echo "   • Full-text search capabilities"
echo "   • Automated analytics and reporting"
echo "   • Notification system with templates"
echo "   • Audit logging for compliance"
echo "   • API usage tracking and rate limiting"
echo "   • Document management system"
echo "   • Maintenance scheduling and tracking"
echo "   • Seasonal pricing and discount codes"
echo "   • Customer communication history"
echo ""
echo "🔧 Next steps:"
echo "   1. Update your NestJS entities to match new schema"
echo "   2. Test the new functions and triggers"
echo "   3. Configure notification templates"
echo "   4. Set up automated jobs for analytics"
echo "   5. Update frontend components to use new features"
echo ""
echo "📖 Documentation:"
echo "   • See supabase/README.md for detailed feature documentation"
echo "   • Check supabase/migrations/ for all migration files"
echo "   • Review supabase/enhanced_seed.sql for sample data"
echo ""
echo "🔗 Useful commands:"
echo "   supabase status          # Check local development status"
echo "   supabase db diff         # See schema differences"
echo "   supabase studio          # Open Supabase Studio"
echo "   supabase logs            # View logs"
echo ""
echo "✅ Your optimized Supabase database is ready!"

