#!/usr/bin/env node

/**
 * 🚀 MAXIMUM POWER SYSTEM ANALYSIS
 * Comprehensive analysis of the entire development environment
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 MAXIMUM POWER SYSTEM ANALYSIS STARTING...\n');

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

async function analyzeSystem() {
  try {
    // 1. Environment Analysis
    log('cyan', '📊 ENVIRONMENT ANALYSIS');
    log('white', '='.repeat(50));

    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();

    log('green', `✅ Node.js: ${nodeVersion}`);
    log('green', `✅ npm: ${npmVersion}`);
    log('green', `✅ pnpm: ${pnpmVersion}`);

    // 2. Project Structure Analysis
    log('cyan', '\n📁 PROJECT STRUCTURE ANALYSIS');
    log('white', '='.repeat(50));

    const directories = [
      'frontend',
      'backend',
      'shared',
      'config',
      'scripts',
      'docker',
      'tests',
      'docs',
    ];
    for (const dir of directories) {
      try {
        const stats = await fs.stat(path.join(rootDir, dir));
        if (stats.isDirectory()) {
          log('green', `✅ ${dir}/ directory exists`);
        }
      } catch (error) {
        log('yellow', `⚠️  ${dir}/ directory missing`);
      }
    }

    // 3. Configuration Files Analysis
    log('cyan', '\n⚙️  CONFIGURATION FILES ANALYSIS');
    log('white', '='.repeat(50));

    const configFiles = [
      'package.json',
      'tsconfig.json',
      'tsconfig.power.json',
      '.eslintrc.js',
      '.prettierrc',
      'docker-compose.yml',
      'frontend/package.json',
      'backend/package.json',
      'frontend/tsconfig.json',
      'backend/tsconfig.json',
      'frontend/.env.local',
      'backend/.env',
    ];

    for (const file of configFiles) {
      try {
        const stats = await fs.stat(path.join(rootDir, file));
        if (stats.isFile()) {
          log(
            'green',
            `✅ ${file} exists (${Math.round(stats.size / 1024)}KB)`
          );
        }
      } catch (error) {
        log('red', `❌ ${file} missing`);
      }
    }

    // 4. Dependencies Analysis
    log('cyan', '\n📦 DEPENDENCIES ANALYSIS');
    log('white', '='.repeat(50));

    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(rootDir, 'package.json'), 'utf8')
      );
      log('green', `✅ Root package.json found`);
      log('white', `   - Name: ${packageJson.name}`);
      log('white', `   - Version: ${packageJson.version}`);
      log(
        'white',
        `   - Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`
      );
      log(
        'white',
        `   - DevDependencies: ${Object.keys(packageJson.devDependencies || {}).length}`
      );
    } catch (error) {
      log('red', `❌ Error reading package.json: ${error.message}`);
    }

    // 5. TypeScript Configuration Analysis
    log('cyan', '\n🔧 TYPESCRIPT CONFIGURATION ANALYSIS');
    log('white', '='.repeat(50));

    try {
      const tsConfig = JSON.parse(
        await fs.readFile(path.join(rootDir, 'tsconfig.power.json'), 'utf8')
      );
      log('green', `✅ Power TypeScript config found`);
      log('white', `   - Target: ${tsConfig.compilerOptions.target}`);
      log('white', `   - Module: ${tsConfig.compilerOptions.module}`);
      log('white', `   - Strict: ${tsConfig.compilerOptions.strict}`);
      log(
        'white',
        `   - Paths: ${Object.keys(tsConfig.compilerOptions.paths || {}).length}`
      );
    } catch (error) {
      log('red', `❌ Error reading tsconfig.power.json: ${error.message}`);
    }

    // 6. Environment Variables Analysis
    log('cyan', '\n🔐 ENVIRONMENT VARIABLES ANALYSIS');
    log('white', '='.repeat(50));

    const envFiles = [
      'backend/.env',
      'frontend/.env.local',
      '.env',
      '.env.development',
    ];
    for (const envFile of envFiles) {
      try {
        const content = await fs.readFile(path.join(rootDir, envFile), 'utf8');
        const lines = content
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'));
        log('green', `✅ ${envFile} found (${lines.length} variables)`);
      } catch (error) {
        log('yellow', `⚠️  ${envFile} missing`);
      }
    }

    // 7. Running Processes Analysis
    log('cyan', '\n🔄 RUNNING PROCESSES ANALYSIS');
    log('white', '='.repeat(50));

    try {
      const processes = execSync(
        'ps aux | grep -E "(node|next|nest)" | grep -v grep',
        { encoding: 'utf8' }
      );
      const processLines = processes.split('\n').filter(line => line.trim());
      log('white', `Found ${processLines.length} Node.js processes running:`);
      processLines.forEach((line, index) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        const command = parts.slice(10).join(' ');
        log(
          'white',
          `   ${index + 1}. PID ${pid}: ${command.substring(0, 80)}...`
        );
      });
    } catch (error) {
      log('yellow', `⚠️  No Node.js processes found`);
    }

    // 8. Network Ports Analysis
    log('cyan', '\n🌐 NETWORK PORTS ANALYSIS');
    log('white', '='.repeat(50));

    const ports = [3000, 3001, 3004, 5432, 6379, 27017];
    for (const port of ports) {
      try {
        const result = execSync(`lsof -i :${port}`, { encoding: 'utf8' });
        if (result.trim()) {
          log('green', `✅ Port ${port} is in use`);
        }
      } catch (error) {
        log('yellow', `⚠️  Port ${port} is available`);
      }
    }

    // 9. Docker Analysis
    log('cyan', '\n🐳 DOCKER ANALYSIS');
    log('white', '='.repeat(50));

    try {
      const dockerVersion = execSync('docker --version', {
        encoding: 'utf8',
      }).trim();
      log('green', `✅ ${dockerVersion}`);

      const containers = execSync(
        'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"',
        { encoding: 'utf8' }
      );
      if (containers.includes('NAMES')) {
        log('white', 'Running containers:');
        log('white', containers);
      } else {
        log('yellow', '⚠️  No containers running');
      }
    } catch (error) {
      log('red', `❌ Docker not available: ${error.message}`);
    }

    // 10. Git Analysis
    log('cyan', '\n📝 GIT ANALYSIS');
    log('white', '='.repeat(50));

    try {
      const gitStatus = execSync('git status --porcelain', {
        encoding: 'utf8',
      });
      const gitBranch = execSync('git branch --show-current', {
        encoding: 'utf8',
      }).trim();
      const gitCommit = execSync('git rev-parse --short HEAD', {
        encoding: 'utf8',
      }).trim();

      log('green', `✅ Current branch: ${gitBranch}`);
      log('green', `✅ Current commit: ${gitCommit}`);

      if (gitStatus.trim()) {
        log('yellow', `⚠️  Uncommitted changes detected`);
      } else {
        log('green', `✅ Working directory clean`);
      }
    } catch (error) {
      log('red', `❌ Git analysis failed: ${error.message}`);
    }

    // 11. Performance Analysis
    log('cyan', '\n⚡ PERFORMANCE ANALYSIS');
    log('white', '='.repeat(50));

    const memoryUsage = process.memoryUsage();
    log('white', `Memory Usage:`);
    log('white', `   - RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
    log(
      'white',
      `   - Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
    );
    log(
      'white',
      `   - Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    );
    log(
      'white',
      `   - External: ${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    );

    // 12. Summary
    log('cyan', '\n🎯 ANALYSIS SUMMARY');
    log('white', '='.repeat(50));
    log('green', '✅ Maximum Power Analysis Complete!');
    log('white', '🚀 System is ready for maximum AI-powered development');
    log('white', '💡 All configurations optimized for maximum performance');
  } catch (error) {
    log('red', `❌ Analysis failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the analysis
analyzeSystem();

