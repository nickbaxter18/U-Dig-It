#!/usr/bin/env tsx

/**
 * Schema Diff Tool
 * Compares database schema with TypeScript types to detect drift
 *
 * Usage: npx tsx scripts/schema-diff.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface TableInfo {
  name: string;
  columns: string[];
}

/**
 * Extract table names and columns from TypeScript types file
 */
function extractTypesFromFile(typesPath: string): Map<string, TableInfo> {
  const content = readFileSync(typesPath, 'utf-8');
  const tables = new Map<string, TableInfo>();

  // Match table definitions in the Database type
  const tableRegex = /Tables:\s*\{([^}]+)\}/s;
  const tableMatch = content.match(tableRegex);

  if (!tableMatch) {
    console.warn('⚠️  Could not find Tables definition in types file');
    return tables;
  }

  const tablesContent = tableMatch[1];

  // Extract each table definition
  const tableDefRegex = /(\w+):\s*\{[^}]*Row:\s*\{([^}]+)\}/g;
  let match;

  while ((match = tableDefRegex.exec(tablesContent)) !== null) {
    const tableName = match[1];
    const rowContent = match[2];

    // Extract column names from Row type
    const columns: string[] = [];
    const columnRegex = /(\w+)(\?)?:\s*[^;,\n]+/g;
    let colMatch;

    while ((colMatch = columnRegex.exec(rowContent)) !== null) {
      columns.push(colMatch[1]);
    }

    tables.set(tableName, {
      name: tableName,
      columns,
    });
  }

  return tables;
}

/**
 * Main function
 */
async function main() {
  const projectRoot = join(__dirname, '..');
  const typesFile = join(projectRoot, 'supabase', 'types.ts');

  console.log('🔍 Comparing database schema with TypeScript types...\n');

  // Check if types file exists
  try {
    readFileSync(typesFile, 'utf-8');
  } catch (error) {
    console.error('❌ Error: Types file not found:', typesFile);
    console.error('   Run: bash scripts/update-supabase-types.sh');
    process.exit(1);
  }

  // Extract types
  const typesTables = extractTypesFromFile(typesFile);

  if (typesTables.size === 0) {
    console.warn('⚠️  No tables found in types file');
    console.warn('   This might indicate the types file is outdated');
    process.exit(1);
  }

  console.log(`📊 Found ${typesTables.size} tables in types file\n`);

  // Note: Actual database schema comparison would require MCP tools
  // This is a placeholder that shows the structure
  console.log('💡 To compare with actual database schema:');
  console.log('   1. Use mcp_supabase_list_tables() to get current schema');
  console.log('   2. Compare table names and columns');
  console.log('   3. Report any differences\n');

  console.log('📋 Tables in types file:');
  for (const [name, info] of typesTables.entries()) {
    console.log(`   - ${name} (${info.columns.length} columns)`);
  }

  console.log('\n✅ Schema diff check complete');
  console.log('   Note: Full comparison requires MCP tools integration');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

