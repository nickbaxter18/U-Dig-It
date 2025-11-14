#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error('❌ Coverage summary not found. Run tests with --coverage first.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = summary.total;

console.log('\n📊 COVERAGE SUMMARY\n');
console.log('┌─────────────┬────────┬───────┬──────────┬───────────┐');
console.log('│ Category    │ Lines  │ Funcs │ Branches │ Stmts     │');
console.log('├─────────────┼────────┼───────┼──────────┼───────────┤');

const formatPercent = (pct) => `${pct.toFixed(1)}%`.padStart(6);

console.log(
  `│ Global      │ ${formatPercent(total.lines.pct)} │ ${formatPercent(total.functions.pct)} │ ${formatPercent(total.branches.pct)}   │ ${formatPercent(total.statements.pct)}  │`
);

console.log('└─────────────┴────────┴───────┴──────────┴───────────┘\n');

// Detailed breakdown
const formatCovered = (c, t) => `${c}/${t}`.padStart(10);

console.log('Detailed:');
console.log(`  Lines:      ${formatCovered(total.lines.covered, total.lines.total)} (${formatPercent(total.lines.pct)})`);
console.log(`  Functions:  ${formatCovered(total.functions.covered, total.functions.total)} (${formatPercent(total.functions.pct)})`);
console.log(`  Branches:   ${formatCovered(total.branches.covered, total.branches.total)} (${formatPercent(total.branches.pct)})`);
console.log(`  Statements: ${formatCovered(total.statements.covered, total.statements.total)} (${formatPercent(total.statements.pct)})`);
console.log();

// Pass/fail indicators
const passed = {
  lines: total.lines.pct >= 70,
  functions: total.functions.pct >= 70,
  branches: total.branches.pct >= 65,
  statements: total.statements.pct >= 70,
};

const allPassed = Object.values(passed).every(Boolean);

if (allPassed) {
  console.log('✅ All coverage thresholds met!');
} else {
  console.log('⚠️  Some thresholds not met:');
  if (!passed.lines) console.log('  ❌ Lines < 70%');
  if (!passed.functions) console.log('  ❌ Functions < 70%');
  if (!passed.branches) console.log('  ❌ Branches < 65%');
  if (!passed.statements) console.log('  ❌ Statements < 70%');
}

console.log('\n📁 Full report: coverage/index.html\n');



