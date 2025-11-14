#!/usr/bin/env node
/**
 * Cursor Action: Generate Git Commit Message
 * Usage: node scripts/cursor-actions/generate-commit-message.js
 */

import { execSync } from 'child_process';

try {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  
  if (stagedFiles.length === 0) {
    console.log('❌ No files staged. Stage some files first with: git add .');
    process.exit(1);
  }
  
  // Get diff of staged changes
  const diff = execSync('git diff --cached', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  
  // Get file stats
  const stats = execSync('git diff --cached --stat', { encoding: 'utf8' });
  
  console.log('📝 Staged files:');
  stagedFiles.forEach(file => console.log(`   - ${file}`));
  console.log('\n📊 Changes:');
  console.log(stats);
  console.log('\n💡 Use Cursor Composer (Ctrl+Shift+C) to generate commit message:');
  console.log('   "Generate a conventional commit message for these changes:"');
  console.log('   Then paste the diff above.\n');
  
  // For now, provide a simple suggestion
  const fileTypes = {
    'api': stagedFiles.some(f => f.includes('/api/')),
    'component': stagedFiles.some(f => f.includes('/components/')),
    'migration': stagedFiles.some(f => f.includes('/migrations/')),
    'test': stagedFiles.some(f => f.includes('.test.') || f.includes('.spec.')),
    'fix': diff.includes('fix') || diff.includes('bug'),
    'feat': diff.includes('add') || diff.includes('new') || diff.includes('create')
  };
  
  let type = 'chore';
  let scope = '';
  
  if (fileTypes.fix) type = 'fix';
  else if (fileTypes.feat) type = 'feat';
  else if (fileTypes.test) type = 'test';
  
  if (fileTypes.api) scope = 'api';
  else if (fileTypes.component) scope = 'components';
  else if (fileTypes.migration) scope = 'database';
  
  const scopeStr = scope ? `(${scope})` : '';
  console.log(`📝 Suggested format: ${type}${scopeStr}: <description>`);
  console.log(`\n   Example: ${type}${scopeStr}: update authentication logic`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
