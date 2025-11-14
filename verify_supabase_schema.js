#!/usr/bin/env node

// Verification script to check current Supabase database schema
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = "https://bnimazxnqligusckahab.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I";

async function verifySupabaseSchema() {
  console.log('🔍 Verifying Supabase Database Schema...');
  console.log(`📍 Project: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Create Supabase client with service role key for full access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Test basic connection
    console.log('1️⃣  Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('equipment')
      .select('count')
      .single();

    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`);
    }
    console.log('✅ Database connection successful');

    // Check core tables
    console.log('\n2️⃣  Checking core tables...');
    const coreTables = [
      'equipment', 'bookings', 'users', 'payments', 'contracts',
      'insurance_documents', 'equipment_maintenance', 'analytics_data'
    ];

    for (const table of coreTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${Array.isArray(data) ? data.length : 'exists'} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Table does not exist or no access`);
      }
    }

    // Check advanced features tables
    console.log('\n3️⃣  Checking advanced features tables...');
    const advancedTables = [
      'equipment_utilization', 'notifications', 'audit_logs', 'search_index',
      'customer_segments', 'dynamic_pricing_rules', 'equipment_lifecycle',
      'financial_transactions', 'risk_assessments', 'support_tickets',
      'fleet_tracking', 'compliance_requirements', 'ab_tests'
    ];

    let advancedTablesFound = 0;
    for (const table of advancedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists`);
          advancedTablesFound++;
        }
      } catch (err) {
        console.log(`❌ ${table}: Table does not exist`);
      }
    }

    // Check functions
    console.log('\n4️⃣  Checking database functions...');
    const functions = [
      'calculate_booking_pricing', 'check_equipment_availability',
      'apply_discount_code', 'get_dashboard_metrics', 'global_search',
      'generate_weekly_report', 'calculate_customer_tier', 'assess_customer_risk'
    ];

    let functionsFound = 0;
    for (const func of functions) {
      try {
        const { data, error } = await supabase.rpc(func, {});

        if (error && error.message.includes('function') && error.message.includes('does not exist')) {
          console.log(`❌ ${func}: Function does not exist`);
        } else {
          console.log(`✅ ${func}: exists`);
          functionsFound++;
        }
      } catch (err) {
        console.log(`❌ ${func}: Function does not exist`);
      }
    }

    // Check materialized views
    console.log('\n5️⃣  Checking materialized views...');
    const materializedViews = [
      'equipment_availability_summary', 'customer_booking_analytics'
    ];

    let viewsFound = 0;
    for (const view of materializedViews) {
      try {
        const { data, error } = await supabase
          .from(view)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${view}: ${error.message}`);
        } else {
          console.log(`✅ ${view}: exists`);
          viewsFound++;
        }
      } catch (err) {
        console.log(`❌ ${view}: View does not exist`);
      }
    }

    // Check RLS policies
    console.log('\n6️⃣  Checking Row Level Security policies...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('pg_policies')
        .select('*');

      if (policyError) {
        console.log(`❌ RLS Policies: Could not check (${policyError.message})`);
      } else {
        const policyCount = Array.isArray(policies) ? policies.length : 0;
        console.log(`✅ RLS Policies: ${policyCount} policies configured`);
      }
    } catch (err) {
      console.log(`❌ RLS Policies: Could not check`);
    }

    // Check indexes
    console.log('\n7️⃣  Checking database indexes...');
    try {
      const { data: indexes, error: indexError } = await supabase
        .from('pg_indexes')
        .select('*');

      if (indexError) {
        console.log(`❌ Indexes: Could not check (${indexError.message})`);
      } else {
        const indexCount = Array.isArray(indexes) ? indexes.length : 0;
        console.log(`✅ Indexes: ${indexCount} indexes configured`);
      }
    } catch (err) {
      console.log(`❌ Indexes: Could not check`);
    }

    // Check extensions
    console.log('\n8️⃣  Checking PostgreSQL extensions...');
    try {
      const { data: extensions, error: extError } = await supabase
        .from('pg_extension')
        .select('*');

      if (extError) {
        console.log(`❌ Extensions: Could not check (${extError.message})`);
      } else {
        const extensionsList = Array.isArray(extensions) ? extensions.map(e => e.extname).join(', ') : 'none';
        console.log(`✅ Extensions: ${extensionsList}`);
      }
    } catch (err) {
      console.log(`❌ Extensions: Could not check`);
    }

    // Generate summary report
    console.log('\n📊 SUPABASE SCHEMA VERIFICATION SUMMARY');
    console.log('=' .repeat(50));

    const expectedTables = coreTables.length + advancedTables.length;
    const foundTables = coreTables.length + advancedTablesFound;
    const foundFunctions = functionsFound;

    console.log(`📋 Tables: ${foundTables}/${expectedTables} found`);
    console.log(`🔧 Functions: ${foundFunctions}/${functions.length} found`);
    console.log(`👁️  Materialized Views: ${viewsFound}/${materializedViews.length} found`);

    if (foundTables >= expectedTables * 0.8) {
      console.log('\n✅ SCHEMA STATUS: Most improvements are in place!');
    } else if (foundTables >= expectedTables * 0.5) {
      console.log('\n⚠️  SCHEMA STATUS: Some improvements applied, but missing key features');
    } else {
      console.log('\n❌ SCHEMA STATUS: Basic schema only - enhancements not applied');
    }

    console.log('\n🔧 RECOMMENDATIONS:');
    if (advancedTablesFound < advancedTables.length / 2) {
      console.log('- Run the enhanced migrations to add advanced features');
      console.log('- Apply RLS policies for security');
      console.log('- Set up automated functions and triggers');
    }

    if (functionsFound < functions.length / 2) {
      console.log('- Install advanced database functions');
      console.log('- Set up automated business logic');
    }

    if (viewsFound < materializedViews.length / 2) {
      console.log('- Create materialized views for performance');
      console.log('- Set up automated data refresh');
    }

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('- Check if Supabase project is active');
    console.log('- Verify service role key permissions');
    console.log('- Ensure database is accessible');
    console.log('- Check network connectivity');
  }
}

// Run the verification
verifySupabaseSchema().catch(console.error);
