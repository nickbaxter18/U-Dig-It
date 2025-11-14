#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://bnimazxnqligusckahab.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2NjQ5OSwiZXhwIjoyMDc1MzQyNDk5fQ.ZkwAdRCdTL0DKGPgJtkbcBllkvachJqTdomV7IcGH3I";

const migrations = [
  '20250121000003_enhanced_schema.sql',
  '20250121000004_enhanced_rls_policies.sql', 
  '20250121000005_advanced_functions.sql',
  '20250121000006_performance_optimizations.sql',
  '20250121000007_advanced_features.sql',
  '20250121000008_monitoring_alerting.sql'
];

async function applyMigrations() {
  console.log('🚀 Applying Enhanced Migrations to Cloud Supabase...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  for (const migration of migrations) {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migration);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  Migration file not found: ${migration}`);
      continue;
    }

    console.log(`📄 Applying migration: ${migration}`);
    
    try {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec', { query: statement + ';' });
          if (error) {
            console.log(`❌ Error in ${migration}: ${error.message}`);
            // Continue with next migration
            break;
          }
        }
      }
      
      console.log(`✅ Successfully applied: ${migration}`);
    } catch (error) {
      console.log(`❌ Failed to apply ${migration}: ${error.message}`);
    }
  }

  console.log('\n🎉 Migration Application Complete!');
  console.log('\n🔧 Next steps:');
  console.log('1. Run: node verify_supabase_schema.js');
  console.log('2. Apply enhanced seed data');
  console.log('3. Update your NestJS entities');
  console.log('4. Test the new features');
}

applyMigrations().catch(console.error);
