#!/usr/bin/env node
/**
 * Cursor Action: Generate Supabase Migration
 * Usage: node scripts/cursor-actions/generate-migration.js <migration-name> [table-name]
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const [migrationName, tableName] = process.argv.slice(2);

if (!migrationName) {
  console.error('Usage: generate-migration.js <migration-name> [table-name]');
  process.exit(1);
}

// Generate timestamp for migration filename
const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '_');
const filename = `${timestamp}_${migrationName}.sql`;
const migrationsDir = join(process.cwd(), 'supabase', 'migrations');

// Ensure migrations directory exists
mkdirSync(migrationsDir, { recursive: true });

const migrationPath = join(migrationsDir, filename);

// Template for migration
const template = `-- Migration: ${migrationName}
-- Description: ${tableName ? `Create/modify ${tableName} table` : 'Database migration'}
-- Date: ${new Date().toISOString()}

${tableName ? `-- Create table
CREATE TABLE IF NOT EXISTS ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "${tableName}_select" ON ${tableName}
FOR SELECT TO authenticated
USING (
  -- Add your policy logic here
  true
);

CREATE POLICY "${tableName}_insert" ON ${tableName}
FOR INSERT TO authenticated
WITH CHECK (
  -- Add your policy logic here
  true
);

-- Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${tableName}_created_at
ON ${tableName}(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER set_updated_at_${tableName}
BEFORE UPDATE ON ${tableName}
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();` : '-- Add your migration SQL here'}

`;

writeFileSync(migrationPath, template);

console.log(`✅ Migration created: ${migrationPath}`);
console.log(`📝 Edit the file to add your migration logic`);

// Optionally open in editor
try {
  execSync(`code ${migrationPath}`, { stdio: 'ignore' });
} catch (e) {
  // VS Code not available, that's okay
}
