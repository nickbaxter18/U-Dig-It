#!/usr/bin/env node

/**
 * ===========================================
 * KUBOTA RENTAL PLATFORM - CONFIGURATION OPTIMIZER
 * ===========================================
 *
 * This script optimizes all development configurations
 * for maximum performance and developer experience.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ===========================================
// CONFIGURATION
// ===========================================

const CONFIGURATIONS = {
  // TypeScript configurations
  typescript: {
    source: 'tsconfig.optimized.json',
    targets: [
      { path: 'tsconfig.json', backup: 'tsconfig.json.backup' },
      {
        path: 'frontend/tsconfig.json',
        backup: 'frontend/tsconfig.json.backup',
      },
      { path: 'backend/tsconfig.json', backup: 'backend/tsconfig.json.backup' },
    ],
  },

  // ESLint configurations
  eslint: {
    source: '.eslintrc.optimized.js',
    targets: [
      { path: '.eslintrc.js', backup: '.eslintrc.js.backup' },
      {
        path: 'frontend/.eslintrc.cjs',
        backup: 'frontend/.eslintrc.cjs.backup',
      },
      { path: 'backend/.eslintrc.js', backup: 'backend/.eslintrc.js.backup' },
    ],
  },

  // Prettier configurations
  prettier: {
    source: '.prettierrc.optimized.json',
    targets: [
      { path: '.prettierrc.json', backup: '.prettierrc.json.backup' },
      {
        path: 'frontend/.prettierrc.json',
        backup: 'frontend/.prettierrc.json.backup',
      },
      {
        path: 'backend/.prettierrc.json',
        backup: 'backend/.prettierrc.json.backup',
      },
    ],
  },

  // Jest configurations
  jest: {
    source: 'jest.config.optimized.js',
    targets: [
      { path: 'jest.config.js', backup: 'jest.config.js.backup' },
      {
        path: 'frontend/jest.config.js',
        backup: 'frontend/jest.config.js.backup',
      },
      {
        path: 'backend/jest.config.js',
        backup: 'backend/jest.config.js.backup',
      },
    ],
  },

  // Docker configurations
  docker: {
    source: 'docker-compose.optimized.yml',
    targets: [
      { path: 'docker-compose.yml', backup: 'docker-compose.yml.backup' },
      {
        path: 'docker-compose.dev.yml',
        backup: 'docker-compose.dev.yml.backup',
      },
      {
        path: 'docker-compose.production.yml',
        backup: 'docker-compose.production.yml.backup',
      },
    ],
  },

  // Environment configurations
  environment: {
    source: 'config/environment.example',
    targets: [
      { path: '.env.example', backup: '.env.example.backup' },
      { path: '.env.local.example', backup: '.env.local.example.backup' },
    ],
  },
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix =
    {
      info: '🔧',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }[type] || '🔧';

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, 'info');
  }
}

function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    log(`Backed up: ${filePath} → ${backupPath}`, 'info');
    return backupPath;
  }
  return null;
}

function copyOptimizedConfig(source, target) {
  try {
    log(`🔍 [OPTIMIZE] Starting copy operation: ${source} → ${target}`, 'info');

    // Check if source exists
    if (!fs.existsSync(source)) {
      log(
        `⚠️ [OPTIMIZE] Source file ${source} does not exist - skipping`,
        'warning'
      );
      return {
        success: false,
        error: 'Source file does not exist',
        skipped: true,
      };
    }

    ensureDirectoryExists(target);
    log(`🔍 [OPTIMIZE] Directory structure ensured for ${target}`, 'info');

    // Backup existing file
    const backupPath = backupFile(target);
    log(`🔍 [OPTIMIZE] Backup completed: ${backupPath}`, 'info');

    // Copy optimized configuration
    fs.copyFileSync(source, target);
    log(
      `✅ [OPTIMIZE] Applied optimized config: ${source} → ${target}`,
      'success'
    );

    // Verify the copy
    if (fs.existsSync(target)) {
      const stats = fs.statSync(target);
      log(
        `🔍 [OPTIMIZE] Copy verified: ${target} (${stats.size} bytes)`,
        'info'
      );
    }

    return { success: true, backupPath };
  } catch (error) {
    log(`❌ [OPTIMIZE] Failed to copy ${source} to ${target}`, 'error');
    log(`🔍 [OPTIMIZE] Error details: ${error.message}`, 'info');
    log(`🔍 [OPTIMIZE] Error stack: ${error.stack}`, 'info');
    return { success: false, error: error.message };
  }
}

function installDependencies() {
  log('🔍 [OPTIMIZE] Installing optimized dependencies...', 'info');

  try {
    log('🔍 [OPTIMIZE] Installing additional ESLint plugins...', 'info');
    execSync(
      'pnpm add -D eslint-plugin-import eslint-plugin-unused-imports eslint-plugin-prefer-arrow eslint-plugin-simple-import-sort',
      {
        stdio: 'pipe',
        encoding: 'utf8',
      }
    );
    log('✅ [OPTIMIZE] ESLint plugins installed', 'success');

    log('🔍 [OPTIMIZE] Installing Jest plugins...', 'info');
    execSync('pnpm add -D jest-html-reporters jest-junit', {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    log('✅ [OPTIMIZE] Jest plugins installed', 'success');

    log('🔍 [OPTIMIZE] Installing additional TypeScript types...', 'info');
    execSync('pnpm add -D @types/jest @types/node', {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    log('✅ [OPTIMIZE] TypeScript types installed', 'success');

    log('✅ [OPTIMIZE] All dependencies installed successfully', 'success');
    return true;
  } catch (error) {
    log(
      `⚠️ [OPTIMIZE] Failed to install some dependencies - this is OK for development`,
      'warning'
    );
    log(
      `🔍 [OPTIMIZE] Error details: ${error.stdout || error.stderr || error.message}`,
      'info'
    );
    log(`🔍 [OPTIMIZE] Exit code: ${error.status}`, 'info');
    log(`🔍 [OPTIMIZE] Signal: ${error.signal}`, 'info');
    // Don't fail on dependency installation errors
    return false;
  }
}

function validateConfigurations() {
  log('Validating configurations...', 'info');

  const validations = [
    {
      name: 'TypeScript',
      command: 'pnpm type-check',
      description: 'TypeScript type checking',
    },
    {
      name: 'ESLint',
      command: 'pnpm lint',
      description: 'ESLint validation',
    },
    {
      name: 'Prettier',
      command: 'pnpm format:check',
      description: 'Prettier formatting check',
    },
  ];

  const results = [];

  for (const validation of validations) {
    try {
      log(`Running ${validation.name} validation...`, 'info');
      execSync(validation.command, { stdio: 'pipe' });
      log(`${validation.name} validation passed`, 'success');
      results.push({ name: validation.name, success: true });
    } catch (error) {
      log(`${validation.name} validation failed: ${error.message}`, 'error');
      results.push({
        name: validation.name,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    configurations: results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    },
  };

  const reportPath = 'config-optimization-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Optimization report saved to: ${reportPath}`, 'info');

  return report;
}

// ===========================================
// MAIN OPTIMIZATION FUNCTION
// ===========================================

function optimizeConfigurations() {
  log('🚀 Starting Kubota Rental Platform Configuration Optimization', 'info');
  log('===========================================', 'info');

  const results = [];

  // Process each configuration type
  for (const [configType, config] of Object.entries(CONFIGURATIONS)) {
    log(`Processing ${configType} configurations...`, 'info');

    const configResults = [];

    for (const target of config.targets) {
      const result = copyOptimizedConfig(config.source, target.path);
      configResults.push({
        type: configType,
        target: target.path,
        ...result,
      });
    }

    results.push(...configResults);
    log(`${configType} configurations processed`, 'success');
  }

  // Install dependencies
  installDependencies();

  // Validate configurations
  const validationResults = validateConfigurations();

  // Generate report
  const report = generateReport(results);

  // Summary
  log('===========================================', 'info');
  log('🎉 Configuration Optimization Complete!', 'success');
  log(
    `✅ Successfully processed: ${report.summary.successful}/${report.summary.total} configurations`,
    'success'
  );

  if (report.summary.failed > 0) {
    log(`⚠️  Failed configurations: ${report.summary.failed}`, 'warning');
  }

  log('📋 Next steps:', 'info');
  log(
    '1. Review the optimization report: config-optimization-report.json',
    'info'
  );
  log('2. Test your application: pnpm dev', 'info');
  log('3. Run tests: pnpm test', 'info');
  log('4. Check formatting: pnpm format', 'info');
  log('5. Validate types: pnpm type-check', 'info');

  return report;
}

// ===========================================
// CLI INTERFACE
// ===========================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Kubota Rental Platform - Configuration Optimizer

Usage: node scripts/optimize-configurations.js [options]

Options:
  --help, -h          Show this help message
  --dry-run           Show what would be done without making changes
  --validate-only     Only validate existing configurations
  --install-only      Only install dependencies

Examples:
  node scripts/optimize-configurations.js
  node scripts/optimize-configurations.js --dry-run
  node scripts/optimize-configurations.js --validate-only
`);
    process.exit(0);
  }

  if (args.includes('--dry-run')) {
    log('🔍 Dry run mode - no changes will be made', 'info');
    // TODO: Implement dry run logic
    process.exit(0);
  }

  if (args.includes('--validate-only')) {
    log('🔍 Validation only mode', 'info');
    validateConfigurations();
    process.exit(0);
  }

  if (args.includes('--install-only')) {
    log('📦 Install only mode', 'info');
    installDependencies();
    process.exit(0);
  }

  // Run full optimization
  optimizeConfigurations();
}

export { installDependencies, optimizeConfigurations, validateConfigurations };
