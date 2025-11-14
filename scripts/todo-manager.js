#!/usr/bin/env node
/**
 * TODO Manager - Extract and manage TODOs
 * Usage: node scripts/todo-manager.js <command> [options]
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const ROOT_DIR = process.cwd();
const FRONTEND_SRC = join(ROOT_DIR, 'frontend', 'src');

const TODO_PATTERNS = [
  /\/\/\s*TODO:?\s*(.+)/gi,
  /\/\/\s*FIXME:?\s*(.+)/gi,
  /\/\/\s*HACK:?\s*(.+)/gi,
  /\/\/\s*XXX:?\s*(.+)/gi,
  /\/\/\s*BUG:?\s*(.+)/gi,
  /\/\/\s*OPTIMIZE:?\s*(.+)/gi,
  /\/\/\s*REFACTOR:?\s*(.+)/gi
];

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'build', 'coverage'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function extractTODOs(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const todos = [];
  
  TODO_PATTERNS.forEach(pattern => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const type = match[0].match(/TODO|FIXME|HACK|XXX|BUG|OPTIMIZE|REFACTOR/i)?.[0] || 'TODO';
      todos.push({
        file: filePath.replace(ROOT_DIR + '/', ''),
        line: lineNumber,
        type: type.toUpperCase(),
        text: match[1].trim(),
        fullMatch: match[0]
      });
    }
  });
  
  return todos;
}

function extractAllTODOs() {
  console.log('🔍 Scanning for TODOs...\n');
  
  const files = getAllFiles(FRONTEND_SRC);
  const allTODOs = [];
  
  files.forEach(file => {
    const todos = extractTODOs(file);
    allTODOs.push(...todos);
  });
  
  return allTODOs;
}

function generateReport(todos) {
  console.log('📊 TODO Report\n');
  console.log(`Total TODOs found: ${todos.length}\n`);
  
  // Group by type
  const byType = {};
  todos.forEach(todo => {
    if (!byType[todo.type]) byType[todo.type] = [];
    byType[todo.type].push(todo);
  });
  
  Object.keys(byType).sort().forEach(type => {
    console.log(`${type}: ${byType[type].length}`);
    byType[type].forEach(todo => {
      console.log(`  - ${todo.file}:${todo.line} - ${todo.text.substring(0, 60)}`);
    });
    console.log('');
  });
  
  return { byType, todos };
}

function saveReport(report) {
  const reportPath = join(ROOT_DIR, 'TODO-REPORT.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Report saved to: ${reportPath}`);
}

// Main execution
const command = process.argv[2];

if (!command || command === '--help' || command === '-h') {
  console.log('📝 TODO Manager\n');
  console.log('Usage: node scripts/todo-manager.js <command>\n');
  console.log('Commands:');
  console.log('  extract        - Extract all TODOs from codebase');
  console.log('  report         - Generate and display report');
  console.log('  all            - Extract and report\n');
  process.exit(0);
}

const todos = extractAllTODOs();

if (command === 'extract' || command === 'all') {
  console.log(`✅ Extracted ${todos.length} TODOs\n`);
  saveReport({ todos, extractedAt: new Date().toISOString() });
}

if (command === 'report' || command === 'all') {
  const report = generateReport(todos);
  saveReport(report);
}

if (!['extract', 'report', 'all'].includes(command)) {
  console.error(`❌ Unknown command: ${command}`);
  console.log('Run with --help for usage');
  process.exit(1);
}
