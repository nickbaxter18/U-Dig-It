#!/usr/bin/env node

/**
 * 🚀 DATABASE CONNECTION DEBUGGER
 * Comprehensive database connection testing and analysis
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🚀 DATABASE CONNECTION DEBUGGER STARTING...\n');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  try {
    log('cyan', '📊 DATABASE CONNECTION ANALYSIS');
    log('white', '='.repeat(50));

    // 1. Environment Variables Check
    log('cyan', '\n🔐 ENVIRONMENT VARIABLES CHECK');
    log('white', '-'.repeat(30));

    const databaseUrl = process.env.DATABASE_URL;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (databaseUrl) {
      log('green', `✅ DATABASE_URL found`);
      log('white', `   URL: ${databaseUrl.substring(0, 50)}...`);
    } else {
      log('red', `❌ DATABASE_URL missing`);
    }

    if (supabaseUrl) {
      log('green', `✅ SUPABASE_URL found`);
      log('white', `   URL: ${supabaseUrl}`);
    } else {
      log('yellow', `⚠️  SUPABASE_URL missing`);
    }

    if (supabaseAnonKey) {
      log('green', `✅ SUPABASE_ANON_KEY found`);
      log('white', `   Key: ${supabaseAnonKey.substring(0, 20)}...`);
    } else {
      log('yellow', `⚠️  SUPABASE_ANON_KEY missing`);
    }

    if (supabaseServiceKey) {
      log('green', `✅ SUPABASE_SERVICE_ROLE_KEY found`);
      log('white', `   Key: ${supabaseServiceKey.substring(0, 20)}...`);
    } else {
      log('yellow', `⚠️  SUPABASE_SERVICE_ROLE_KEY missing`);
    }

    // 2. Direct PostgreSQL Connection Test
    if (databaseUrl) {
      log('cyan', '\n🔌 DIRECT POSTGRESQL CONNECTION TEST');
      log('white', '-'.repeat(30));

      try {
        const client = new Client({
          connectionString: databaseUrl,
          ssl:
            process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
        });

        await client.connect();
        log('green', '✅ Direct PostgreSQL connection successful');

        // Test basic query
        const result = await client.query(
          'SELECT version(), current_database(), current_user'
        );
        log('green', '✅ Database query successful');
        log(
          'white',
          `   Version: ${result.rows[0].version.substring(0, 50)}...`
        );
        log('white', `   Database: ${result.rows[0].current_database}`);
        log('white', `   User: ${result.rows[0].current_user}`);

        // Test table existence
        const tablesResult = await client.query(`
          SELECT table_name, table_type
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name
        `);

        log(
          'green',
          `✅ Found ${tablesResult.rows.length} tables in public schema:`
        );
        tablesResult.rows.forEach(row => {
          log('white', `   - ${row.table_name} (${row.table_type})`);
        });

        await client.end();
      } catch (error) {
        log('red', `❌ Direct PostgreSQL connection failed: ${error.message}`);
        log('white', `   Error code: ${error.code}`);
        log('white', `   Error detail: ${error.detail || 'N/A'}`);
      }
    }

    // 3. Supabase Client Test
    if (supabaseUrl && supabaseAnonKey) {
      log('cyan', '\n🚀 SUPABASE CLIENT TEST');
      log('white', '-'.repeat(30));

      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Test connection
        const { data, error } = await supabase
          .from('_supabase_migrations')
          .select('version')
          .limit(1);

        if (error) {
          log(
            'yellow',
            `⚠️  Supabase connection test (expected error): ${error.message}`
          );
        } else {
          log('green', '✅ Supabase client connection successful');
        }

        // Test auth
        const { data: authData, error: authError } =
          await supabase.auth.getSession();
        if (authError) {
          log('yellow', `⚠️  Supabase auth test: ${authError.message}`);
        } else {
          log('green', '✅ Supabase auth client working');
        }
      } catch (error) {
        log('red', `❌ Supabase client test failed: ${error.message}`);
      }
    }

    // 4. Database Schema Analysis
    if (databaseUrl) {
      log('cyan', '\n📋 DATABASE SCHEMA ANALYSIS');
      log('white', '-'.repeat(30));

      try {
        const client = new Client({
          connectionString: databaseUrl,
          ssl:
            process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
        });

        await client.connect();

        // Check for common tables
        const commonTables = [
          'users',
          'equipment',
          'bookings',
          'payments',
          'contracts',
        ];
        for (const tableName of commonTables) {
          try {
            const result = await client.query(
              `
              SELECT COUNT(*) as count
              FROM information_schema.tables
              WHERE table_name = $1 AND table_schema = 'public'
            `,
              [tableName]
            );

            if (parseInt(result.rows[0].count) > 0) {
              log('green', `✅ Table '${tableName}' exists`);

              // Get table structure
              const structure = await client.query(
                `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
              `,
                [tableName]
              );

              log('white', `   Columns (${structure.rows.length}):`);
              structure.rows.forEach(col => {
                log(
                  'white',
                  `     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`
                );
              });
            } else {
              log('yellow', `⚠️  Table '${tableName}' does not exist`);
            }
          } catch (error) {
            log(
              'red',
              `❌ Error checking table '${tableName}': ${error.message}`
            );
          }
        }

        await client.end();
      } catch (error) {
        log('red', `❌ Schema analysis failed: ${error.message}`);
      }
    }

    // 5. Connection Performance Test
    if (databaseUrl) {
      log('cyan', '\n⚡ CONNECTION PERFORMANCE TEST');
      log('white', '-'.repeat(30));

      try {
        const client = new Client({
          connectionString: databaseUrl,
          ssl:
            process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : false,
        });

        const startTime = Date.now();
        await client.connect();
        const connectTime = Date.now() - startTime;

        log('green', `✅ Connection established in ${connectTime}ms`);

        // Test query performance
        const queryStartTime = Date.now();
        await client.query('SELECT 1');
        const queryTime = Date.now() - queryStartTime;

        log('green', `✅ Simple query executed in ${queryTime}ms`);

        await client.end();
      } catch (error) {
        log('red', `❌ Performance test failed: ${error.message}`);
      }
    }

    // 6. Summary
    log('cyan', '\n🎯 DATABASE DEBUG SUMMARY');
    log('white', '='.repeat(50));
    log('green', '✅ Database debugging complete!');
    log('white', '🚀 Database connection analysis finished');
  } catch (error) {
    log('red', `❌ Database debugging failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the database debug
testDatabaseConnection();

