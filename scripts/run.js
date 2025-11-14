#!/usr/bin/env node
/**
 * Unified Script Runner
 * Usage: node scripts/run.js <category> <command> [args...]
 * Example: node scripts/run.js migration add_table bookings
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Script categories
const CATEGORIES = {
  migration: {
    dir: 'scripts/cursor-actions',
    prefix: 'generate-migration',
    description: 'Database migration scripts'
  },
  'api-route': {
    dir: 'scripts/cursor-actions',
    prefix: 'create-api-route',
    description: 'API route generation'
  },
  component: {
    dir: 'scripts/cursor-actions',
    prefix: 'generate-component',
    description: 'Component generation'
  },
  test: {
    dir: 'scripts',
    prefix: 'test',
    description: 'Testing scripts'
  },
  quality: {
    dir: 'scripts',
    prefix: 'quality',
    description: 'Code quality scripts'
  },
  security: {
    dir: 'scripts',
    prefix: 'security',
    description: 'Security scripts'
  },
  performance: {
    dir: 'scripts',
    prefix: 'performance',
    description: 'Performance scripts'
  },
  deploy: {
    dir: 'scripts',
    prefix: 'deploy',
    description: 'Deployment scripts'
  }
};

function findScripts(category) {
  const config = CATEGORIES[category];
  if (!config) return [];

  const dir = join(ROOT_DIR, config.dir);
  try {
    const files = readdirSync(dir);
    return files
      .filter(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);
        return stat.isFile() && (
          file.includes(config.prefix) ||
          file.startsWith(config.prefix) ||
          file.endsWith('.sh') ||
          file.endsWith('.js')
        );
      })
      .map(file => ({
        name: file,
        path: join(dir, file),
        category
      }));
  } catch (error) {
    return [];
  }
}

function listAllScripts() {
  console.log('📋 Available Scripts:\n');
  
  Object.keys(CATEGORIES).forEach(category => {
    const scripts = findScripts(category);
    if (scripts.length > 0) {
      console.log(`\n${category.toUpperCase()}:`);
      scripts.forEach(script => {
        console.log(`  - ${script.name}`);
      });
    }
  });
  
  console.log('\n💡 Usage: node scripts/run.js <category> <script-name> [args...]');
  console.log('   Example: node scripts/run.js migration generate-migration add_table bookings');
}

function runScript(category, scriptName, args = []) {
  const scripts = findScripts(category);
  const script = scripts.find(s => 
    s.name === scriptName || 
    s.name.includes(scriptName) ||
    s.name.startsWith(scriptName)
  );

  if (!script) {
    console.error(`❌ Script not found: ${scriptName}`);
    console.log(`\nAvailable scripts in ${category}:`);
    scripts.forEach(s => console.log(`  - ${s.name}`));
    process.exit(1);
  }

  const scriptPath = script.path;
  const isExecutable = scriptPath.endsWith('.sh') || scriptPath.endsWith('.js');

  console.log(`🚀 Running: ${script.name}`);
  console.log(`   Path: ${scriptPath}\n`);

  try {
    if (scriptPath.endsWith('.sh')) {
      execSync(`bash "${scriptPath}" ${args.join(' ')}`, {
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
    } else if (scriptPath.endsWith('.js')) {
      execSync(`node "${scriptPath}" ${args.join(' ')}`, {
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
    } else {
      console.error(`❌ Unknown script type: ${scriptPath}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error running script: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
const [category, scriptName, ...args] = process.argv.slice(2);

if (!category || category === '--help' || category === '-h') {
  console.log('🔧 Unified Script Runner\n');
  console.log('Usage: node scripts/run.js <category> <script-name> [args...]\n');
  console.log('Categories:');
  Object.keys(CATEGORIES).forEach(cat => {
    console.log(`  - ${cat}: ${CATEGORIES[cat].description}`);
  });
  console.log('\nExamples:');
  console.log('  node scripts/run.js migration generate-migration add_table bookings');
  console.log('  node scripts/run.js api-route create-api-route bookings/create POST');
  console.log('  node scripts/run.js component generate-component BookingCard');
  console.log('\nList all scripts:');
  console.log('  node scripts/run.js --list\n');
  process.exit(0);
}

if (category === '--list') {
  listAllScripts();
  process.exit(0);
}

if (!scriptName) {
  console.error('❌ Script name required');
  console.log(`\nAvailable scripts in ${category}:`);
  const scripts = findScripts(category);
  scripts.forEach(s => console.log(`  - ${s.name}`));
  process.exit(1);
}

runScript(category, scriptName, args);
