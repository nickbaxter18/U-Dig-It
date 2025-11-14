#!/usr/bin/env node

/**
 * 🚀 ADVANCED DATABASE DEBUGGER
 * Comprehensive database debugging with query analysis, performance monitoring, and optimization
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('🚀 ADVANCED DATABASE DEBUGGER STARTING...\n');

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

class DatabaseDebugger {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.metrics = {
      connectionTime: 0,
      queryPerformance: [],
      slowQueries: [],
      missingIndexes: [],
      unusedIndexes: [],
      tableSizes: [],
      schemaIssues: [],
    };
  }

  async runFullDebug() {
    log('cyan', '🔍 DATABASE DEBUGGING ANALYSIS');
    log('white', '='.repeat(60));

    try {
      // 1. Connection Analysis
      await this.analyzeConnections();

      // 2. Query Performance Analysis
      await this.analyzeQueryPerformance();

      // 3. Schema Analysis
      await this.analyzeSchema();

      // 4. Index Analysis
      await this.analyzeIndexes();

      // 5. Data Integrity Checks
      await this.analyzeDataIntegrity();

      // 6. Performance Recommendations
      await this.generatePerformanceRecommendations();

      // 7. Generate Report
      this.generateDebugReport();

      return this.calculateHealthScore();
    } catch (error) {
      log('red', `❌ Database debugging failed: ${error.message}`);
      throw error;
    }
  }

  async analyzeConnections() {
    log('cyan', '\n🔌 CONNECTION ANALYSIS');
    log('white', '-'.repeat(30));

    const databaseUrl = process.env.DATABASE_URL;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!databaseUrl) {
      this.addIssue(
        'critical',
        'connection',
        'DATABASE_URL not configured',
        'Configure database connection string'
      );
      return;
    }

    // Test direct PostgreSQL connection
    try {
      const { Client } = await import('pg');
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

      this.metrics.connectionTime = connectTime;
      log('white', `   Connection time: ${connectTime}ms`);

      if (connectTime > 2000) {
        this.addIssue(
          'medium',
          'connection',
          `Slow connection time: ${connectTime}ms`,
          'Check network latency or connection pooling'
        );
      }

      // Test basic queries
      await this.testBasicQueries(client);

      await client.end();
    } catch (error) {
      this.addIssue(
        'critical',
        'connection',
        `Connection failed: ${error.message}`,
        'Check database credentials and network'
      );
    }

    // Test Supabase connection if available
    if (supabaseUrl && supabaseAnonKey) {
      await this.testSupabaseConnection();
    }
  }

  async testBasicQueries(client) {
    try {
      // Test version and database info
      const result = await client.query(
        'SELECT version(), current_database(), current_user, inet_server_addr()'
      );
      log('white', `   Database: ${result.rows[0].current_database}`);
      log('white', `   User: ${result.rows[0].current_user}`);
      log('white', `   Version: ${result.rows[0].version.substring(0, 50)}...`);
      log('white', `   Server IP: ${result.rows[0].inet_server_addr}`);

      // Test table count
      const tableResult = await client.query(`
        SELECT schemaname, tablename,
               pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
      `);

      log('white', `   Tables found: ${tableResult.rows.length}`);
      tableResult.rows.forEach(row => {
        this.metrics.tableSizes.push({
          table: row.tablename,
          size: row.size_bytes,
          sizeMB: (row.size_bytes / 1024 / 1024).toFixed(2),
        });
      });
    } catch (error) {
      this.addIssue(
        'high',
        'queries',
        `Basic query test failed: ${error.message}`,
        'Check database permissions'
      );
    }
  }

  async testSupabaseConnection() {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );

      const startTime = Date.now();
      const { data, error } = await supabase
        .from('_supabase_migrations')
        .select('version')
        .limit(1);

      const responseTime = Date.now() - startTime;

      if (error) {
        this.addIssue(
          'medium',
          'supabase',
          `Supabase connection issue: ${error.message}`,
          'Check Supabase configuration'
        );
      } else {
        log('green', `✅ Supabase connection successful (${responseTime}ms)`);
      }
    } catch (error) {
      this.addIssue(
        'medium',
        'supabase',
        `Supabase test failed: ${error.message}`,
        'Check Supabase credentials'
      );
    }
  }

  async analyzeQueryPerformance() {
    log('cyan', '\n⚡ QUERY PERFORMANCE ANALYSIS');
    log('white', '-'.repeat(30));

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    try {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: databaseUrl });

      await client.connect();

      // Analyze slow queries
      const slowQueries = await client.query(`
        SELECT query, calls, total_time, mean_time, rows
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `);

      if (slowQueries.rows.length > 0) {
        log(
          'yellow',
          `⚠️  Found ${slowQueries.rows.length} potentially slow queries:`
        );
        slowQueries.rows.forEach((query, index) => {
          log(
            'white',
            `   ${index + 1}. ${query.mean_time.toFixed(2)}ms avg - ${query.calls} calls`
          );
          this.metrics.slowQueries.push(query);
        });
      } else {
        log('green', '✅ No slow queries detected');
      }

      // Check for missing indexes on foreign keys
      const missingIndexes = await client.query(`
        SELECT
          tc.table_name,
          tc.constraint_name,
          tc.table_name as foreign_table,
          ccu.table_name as referenced_table,
          ccu.column_name as referenced_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        LEFT JOIN pg_indexes pi ON pi.tablename = tc.table_name
          AND pi.indexname = tc.table_name || '_' || ccu.column_name || '_fkey'
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND pi.indexname IS NULL
      `);

      if (missingIndexes.rows.length > 0) {
        log(
          'yellow',
          `⚠️  Missing indexes on ${missingIndexes.rows.length} foreign keys:`
        );
        missingIndexes.rows.forEach(row => {
          log(
            'white',
            `   ${row.table_name}.${row.constraint_name} -> ${row.referenced_table}.${row.referenced_column}`
          );
          this.metrics.missingIndexes.push(row);
        });
      } else {
        log('green', '✅ All foreign keys have proper indexes');
      }

      await client.end();
    } catch (error) {
      this.addIssue(
        'medium',
        'performance',
        `Query analysis failed: ${error.message}`,
        'Check pg_stat_statements extension'
      );
    }
  }

  async analyzeSchema() {
    log('cyan', '\n📋 SCHEMA ANALYSIS');
    log('white', '-'.repeat(30));

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    try {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: databaseUrl });

      await client.connect();

      // Check for common schema issues
      const schemaIssues = [];

      // Check for tables without primary keys
      const noPrimaryKey = await client.query(`
        SELECT table_name
        FROM information_schema.tables t
        LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name AND tc.constraint_type = 'PRIMARY KEY'
        WHERE t.table_schema = 'public' AND tc.constraint_name IS NULL
      `);

      if (noPrimaryKey.rows.length > 0) {
        schemaIssues.push(
          `Tables without primary keys: ${noPrimaryKey.rows.map(r => r.table_name).join(', ')}`
        );
      }

      // Check for nullable columns that should be NOT NULL
      const nullableColumns = await client.query(`
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ('id', 'created_at', 'updated_at')
          AND is_nullable = 'YES'
      `);

      if (nullableColumns.rows.length > 0) {
        schemaIssues.push(
          `Nullable critical columns: ${nullableColumns.rows.length} found`
        );
      }

      // Check for inconsistent naming
      const inconsistentNaming = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name NOT REGEXP '^[a-z][a-z0-9_]*$'
      `);

      if (inconsistentNaming.rows.length > 0) {
        schemaIssues.push(
          `Inconsistent table naming: ${inconsistentNaming.rows.length} tables`
        );
      }

      if (schemaIssues.length > 0) {
        schemaIssues.forEach(issue => {
          log('yellow', `⚠️  ${issue}`);
          this.metrics.schemaIssues.push(issue);
        });
      } else {
        log('green', '✅ Schema analysis passed');
      }

      await client.end();
    } catch (error) {
      this.addIssue(
        'medium',
        'schema',
        `Schema analysis failed: ${error.message}`,
        'Check database permissions'
      );
    }
  }

  async analyzeIndexes() {
    log('cyan', '\n🔍 INDEX ANALYSIS');
    log('white', '-'.repeat(30));

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    try {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: databaseUrl });

      await client.connect();

      // Check for unused indexes
      const unusedIndexes = await client.query(`
        SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        ORDER BY tablename, indexname
      `);

      if (unusedIndexes.rows.length > 0) {
        log(
          'yellow',
          `⚠️  Found ${unusedIndexes.rows.length} potentially unused indexes:`
        );
        unusedIndexes.rows.forEach(row => {
          log(
            'white',
            `   ${row.tablename}.${row.indexname} (scans: ${row.idx_scan})`
          );
          this.metrics.unusedIndexes.push(row);
        });
      } else {
        log('green', '✅ No unused indexes detected');
      }

      // Check index usage statistics
      const indexUsage = await client.query(`
        SELECT schemaname, tablename, indexname,
               idx_scan as scans, idx_tup_read as tuples_read,
               idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 10
      `);

      if (indexUsage.rows.length > 0) {
        log('white', '📊 Top used indexes:');
        indexUsage.rows.forEach((row, index) => {
          log(
            'white',
            `   ${index + 1}. ${row.tablename}.${row.indexname} (${row.scans} scans)`
          );
        });
      }

      await client.end();
    } catch (error) {
      this.addIssue(
        'medium',
        'indexes',
        `Index analysis failed: ${error.message}`,
        'Check pg_stat_user_indexes view'
      );
    }
  }

  async analyzeDataIntegrity() {
    log('cyan', '\n🔒 DATA INTEGRITY ANALYSIS');
    log('white', '-'.repeat(30));

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    try {
      const { Client } = await import('pg');
      const client = new Client({ connectionString: databaseUrl });

      await client.connect();

      // Check for orphaned records
      const orphanedChecks = [
        {
          name: 'Bookings without users',
          query:
            'SELECT COUNT(*) as count FROM bookings WHERE customer_id NOT IN (SELECT id FROM users)',
        },
        {
          name: 'Bookings without equipment',
          query:
            'SELECT COUNT(*) as count FROM bookings WHERE equipment_id NOT IN (SELECT id FROM equipment)',
        },
        {
          name: 'Payments without bookings',
          query:
            'SELECT COUNT(*) as count FROM payments WHERE booking_id NOT IN (SELECT id FROM bookings)',
        },
      ];

      for (const check of orphanedChecks) {
        try {
          const result = await client.query(check.query);
          const count = parseInt(result.rows[0].count);

          if (count > 0) {
            log('red', `❌ ${check.name}: ${count} orphaned records`);
            this.addIssue(
              'high',
              'integrity',
              `${check.name}: ${count} orphaned records`,
              'Clean up orphaned data'
            );
          } else {
            log('green', `✅ ${check.name}: No orphaned records`);
          }
        } catch (error) {
          log('yellow', `⚠️  Could not check ${check.name}: ${error.message}`);
        }
      }

      await client.end();
    } catch (error) {
      this.addIssue(
        'medium',
        'integrity',
        `Data integrity analysis failed: ${error.message}`,
        'Check database structure'
      );
    }
  }

  async generatePerformanceRecommendations() {
    log('cyan', '\n💡 PERFORMANCE RECOMMENDATIONS');
    log('white', '-'.repeat(30));

    // Generate index recommendations
    if (this.metrics.missingIndexes.length > 0) {
      log('yellow', '📈 Index Recommendations:');
      this.metrics.missingIndexes.forEach(index => {
        log(
          'white',
          `   CREATE INDEX idx_${index.table_name}_${index.column_name} ON ${index.table_name}(${index.column_name});`
        );
      });
    }

    // Generate query optimization recommendations
    if (this.metrics.slowQueries.length > 0) {
      log('yellow', '🚀 Query Optimization:');
      log(
        'white',
        '   • Review the slowest queries and add appropriate indexes'
      );
      log(
        'white',
        '   • Consider query result caching for frequently accessed data'
      );
      log(
        'white',
        '   • Use EXPLAIN ANALYZE to understand query execution plans'
      );
    }

    // Connection pooling recommendations
    if (this.metrics.connectionTime > 1000) {
      log('yellow', '🔌 Connection Optimization:');
      log('white', '   • Implement connection pooling with pg-boss or similar');
      log('white', '   • Use connection limits appropriately');
      log('white', '   • Consider read replicas for heavy read workloads');
    }
  }

  addIssue(severity, category, message, recommendation) {
    this.issues.push({
      severity,
      category,
      message,
      recommendation,
      timestamp: new Date().toISOString(),
    });
  }

  calculateHealthScore() {
    const criticalIssues = this.issues.filter(
      issue => issue.severity === 'critical'
    ).length;
    const highIssues = this.issues.filter(
      issue => issue.severity === 'high'
    ).length;
    const mediumIssues = this.issues.filter(
      issue => issue.severity === 'medium'
    ).length;

    // Weighted scoring
    const score = Math.max(
      0,
      100 - criticalIssues * 20 - highIssues * 10 - mediumIssues * 5
    );

    return Math.round(score);
  }

  generateDebugReport() {
    log('cyan', '\n📋 DATABASE DEBUG REPORT');
    log('white', '='.repeat(60));

    const healthScore = this.calculateHealthScore();

    log('cyan', `🎯 DATABASE HEALTH SCORE: ${healthScore}/100`);

    if (healthScore >= 90) {
      log('green', '✅ EXCELLENT - Database is well-optimized');
    } else if (healthScore >= 75) {
      log('yellow', '⚠️  GOOD - Minor optimizations recommended');
    } else if (healthScore >= 60) {
      log('yellow', '⚠️  FAIR - Significant optimizations needed');
    } else {
      log('red', '❌ POOR - Major database issues require attention');
    }

    // Critical issues
    const criticalIssues = this.issues.filter(
      issue => issue.severity === 'critical'
    );
    if (criticalIssues.length > 0) {
      log('red', `\n🚨 CRITICAL ISSUES (${criticalIssues.length})`);
      criticalIssues.forEach((issue, index) => {
        log('red', `   ${index + 1}. ${issue.message}`);
        log('blue', `      💡 ${issue.recommendation}`);
      });
    }

    // Performance metrics summary
    log('cyan', '\n📊 PERFORMANCE METRICS');
    log('white', `   Connection time: ${this.metrics.connectionTime}ms`);
    log('white', `   Slow queries: ${this.metrics.slowQueries.length}`);
    log('white', `   Missing indexes: ${this.metrics.missingIndexes.length}`);
    log('white', `   Unused indexes: ${this.metrics.unusedIndexes.length}`);
    log('white', `   Schema issues: ${this.metrics.schemaIssues.length}`);

    // Top recommendations
    log('cyan', '\n💡 TOP OPTIMIZATION RECOMMENDATIONS');
    this.recommendations.slice(0, 5).forEach((rec, index) => {
      log('blue', `   ${index + 1}. ${rec}`);
    });
  }
}

async function runDatabaseDebug() {
  const dbDebugger = new DatabaseDebugger();

  try {
    const score = await dbDebugger.runFullDebug();

    // Exit with appropriate code
    if (score >= 80) {
      log('green', '🎉 Database debugging completed successfully!');
      process.exit(0);
    } else if (score >= 60) {
      log(
        'yellow',
        '⚠️  Database debugging completed - optimizations recommended'
      );
      process.exit(0);
    } else {
      log(
        'red',
        '❌ Database debugging failed - critical issues require attention'
      );
      process.exit(1);
    }
  } catch (error) {
    log('red', `❌ Database debugging failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseDebug().catch(error => {
    log('red', `❌ Database debugging failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

export { DatabaseDebugger, runDatabaseDebug };
