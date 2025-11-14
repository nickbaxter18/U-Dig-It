#!/usr/bin/env node

/**
 * 🚀 FRONTEND BUILD DEBUGGER
 * Comprehensive frontend build analysis and debugging
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 FRONTEND BUILD DEBUGGER STARTING...\n');

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

function runCommand(command, description) {
  log('cyan', `🔧 ${description}`);
  log('white', '-'.repeat(30));

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '../frontend'),
      timeout: 30000,
    });
    log('green', `✅ ${description} completed successfully`);
    return output;
  } catch (error) {
    log('red', `❌ ${description} failed: ${error.message}`);
    return null;
  }
}

async function debugFrontend() {
  log('cyan', '🎨 FRONTEND BUILD ANALYSIS');
  log('white', '='.repeat(50));

  // 1. TypeScript Check
  log('cyan', '\n📝 TYPESCRIPT COMPILATION CHECK');
  log('white', '-'.repeat(30));

  runCommand(
    'npx tsc --noEmit --noEmitOnError false',
    'TypeScript compilation check'
  );

  // 2. ESLint Check
  log('cyan', '\n🔍 ESLINT CODE QUALITY CHECK');
  log('white', '-'.repeat(30));

  runCommand(
    'npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0',
    'ESLint code quality check'
  );

  // 3. Next.js Build Check
  log('cyan', '\n🏗️  NEXT.JS BUILD ANALYSIS');
  log('white', '-'.repeat(30));

  const buildOutput = runCommand(
    'npx next build --dry-run',
    'Next.js build dry run'
  );

  if (buildOutput) {
    // Analyze build output for warnings/errors
    const warnings = (buildOutput.match(/⚠️|warning/gi) || []).length;
    const errors = (buildOutput.match(/❌|error/gi) || []).length;

    log('white', `   Warnings found: ${warnings}`);
    log('white', `   Errors found: ${errors}`);

    if (warnings > 0) {
      log('yellow', `⚠️  Found ${warnings} warnings in build output`);
    }
    if (errors > 0) {
      log('red', `❌ Found ${errors} errors in build output`);
    }
  }

  // 4. Bundle Analysis
  log('cyan', '\n📦 BUNDLE ANALYSIS');
  log('white', '-'.repeat(30));

  const bundleOutput = runCommand(
    'npx next build --analyze',
    'Next.js bundle analysis'
  );

  // 5. Dependency Check
  log('cyan', '\n📚 DEPENDENCY ANALYSIS');
  log('white', '-'.repeat(30));

  runCommand('npm ls --depth=0', 'Dependency tree analysis');

  // 6. Performance Check
  log('cyan', '\n⚡ PERFORMANCE CHECK');
  log('white', '-'.repeat(30));

  runCommand(
    'npx lighthouse http://localhost:3000 --chrome-flags="--headless" --output=json --output-path=lighthouse-report.json',
    'Lighthouse performance audit'
  );

  // 7. Build Size Analysis
  log('cyan', '\n📏 BUILD SIZE ANALYSIS');
  log('white', '-'.repeat(30));

  const buildSizeOutput = runCommand(
    'du -sh .next',
    'Build directory size check'
  );

  if (buildSizeOutput) {
    log('white', `   Build size: ${buildSizeOutput.trim()}`);
  }

  // 8. Summary
  log('cyan', '\n🎯 FRONTEND DEBUG SUMMARY');
  log('white', '='.repeat(50));
  log('green', `✅ Frontend debugging complete!`);
  log('white', `🚀 Frontend build analysis finished`);

  log('yellow', '\n💡 RECOMMENDATIONS:');
  log('yellow', '   • Run "npm run analyze" for detailed bundle analysis');
  log('yellow', '   • Use "npm run test:coverage" for test coverage reports');
  log('yellow', '   • Check "npm run build" for production build issues');
  log('yellow', '   • Review Lighthouse reports for performance optimizations');
}

// Run the frontend debug
debugFrontend().catch(error => {
  log('red', `❌ Frontend debugging failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
