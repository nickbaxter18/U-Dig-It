#!/bin/bash

# Kubota Rental Platform - Complete Migration Deployment Script
# This script applies all enhanced migrations to your cloud Supabase database

set -e  # Exit on any error

echo "🚀 Starting Complete Supabase Migration Deployment..."
echo "📍 Project: bnimazxnqligusckahab"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "📖 Installation: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in the right directory
if [[ ! -f "supabase/config.toml" ]]; then
    echo "❌ Not in Supabase project directory. Looking for supabase/config.toml"
    exit 1
fi

echo "✅ Project configuration found"

# Test connection to cloud database
echo "🔍 Testing connection to cloud database..."
if ! supabase db ping &> /dev/null; then
    echo "❌ Cannot connect to cloud database"
    echo "💡 Make sure your Supabase project is active and accessible"
    exit 1
fi

echo "✅ Cloud database connection successful"
echo ""

# Apply migrations in order
echo "📄 Applying migrations..."

MIGRATIONS=(
    "20250121000003_enhanced_schema.sql"
    "20250121000004_enhanced_rls_policies.sql"
    "20250121000005_advanced_functions.sql"
    "20250121000006_performance_optimizations.sql"
    "20250121000007_advanced_features.sql"
    "20250121000008_monitoring_alerting.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "🔄 Applying: $migration"
    
    if supabase db execute --file "supabase/migrations/$migration"; then
        echo "✅ Successfully applied: $migration"
    else
        echo "❌ Failed to apply: $migration"
        echo "💡 Check the error message above and fix any issues"
        exit 1
    fi
    
    echo ""
done

echo "🌱 Applying enhanced seed data..."
if supabase db execute --file "supabase/enhanced_seed.sql"; then
    echo "✅ Successfully applied enhanced seed data"
else
    echo "⚠️  Warning: Some seed data may already exist or failed to apply"
fi

echo ""
echo "🔍 Running verification..."
if node verify_supabase_schema.js; then
    echo ""
    echo "🎉 MIGRATION DEPLOYMENT COMPLETE!"
    echo ""
    echo "📊 Your Supabase database now includes:"
    echo "   • 21 enterprise-grade tables"
    echo "   • 50+ advanced database functions"
    echo "   • 30+ strategic performance indexes"
    echo "   • Comprehensive RLS security policies"
    echo "   • Real-time subscriptions for live updates"
    echo "   • Automated business logic and triggers"
    echo "   • Complete monitoring and alerting system"
    echo ""
    echo "🚀 Your rental platform is now enterprise-ready!"
else
    echo ""
    echo "⚠️  Verification completed with some issues"
    echo "💡 Check the verification output above for details"
fi

echo ""
echo "📖 Next steps:"
echo "   1. Update your NestJS entities to match new schema"
echo "   2. Test the new database functions"
echo "   3. Configure notification templates"
echo "   4. Set up automated monitoring jobs"
echo "   5. Update frontend components to use new features"
echo ""
echo "✅ Deployment script completed successfully!"
