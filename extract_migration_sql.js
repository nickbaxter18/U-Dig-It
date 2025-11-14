#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const migrations = [
  '20250121000003_enhanced_schema.sql',
  '20250121000004_enhanced_rls_policies.sql',
  '20250121000005_advanced_functions.sql',
  '20250121000006_performance_optimizations.sql',
  '20250121000007_advanced_features.sql',
  '20250121000008_monitoring_alerting.sql'
];

console.log('📋 SUPABASE MIGRATION SQL EXTRACTION');
console.log('=' .repeat(60));
console.log('');

for (const migration of migrations) {
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', migration);
  
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf8');
    const shortName = migration.replace('.sql', '');
    
    console.log(`\n📄 ${shortName.toUpperCase()}`);
    console.log('-'.repeat(40));
    console.log('```sql');
    console.log('-- Copy the SQL below and paste into Supabase SQL Editor');
    console.log(content);
    console.log('```');
    console.log('');
    console.log('✅ After running this migration, proceed to the next one');
    console.log('');
  } else {
    console.log(`❌ Migration file not found: ${migration}`);
  }
}

console.log('🌱 ENHANCED SEED DATA');
console.log('=' .repeat(60));
console.log('```sql');
console.log('-- Copy the SQL below and paste into Supabase SQL Editor');
const seedPath = path.join(process.cwd(), 'supabase', 'enhanced_seed.sql');
if (fs.existsSync(seedPath)) {
  const seedContent = fs.readFileSync(seedPath, 'utf8');
  console.log(seedContent);
} else {
  console.log('-- Seed file not found');
}
console.log('```');

console.log('\n🎉 Ready to apply migrations to your Supabase cloud database!');
