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

// Define thresholds (match vitest.config.ts global thresholds)
const thresholds = {
  lines: 70,
  functions: 70,
  branches: 65,
  statements: 70,
};

console.log('\n🎯 COVERAGE QUALITY GATE\n');

const checks = {
  lines: total.lines.pct >= thresholds.lines,
  functions: total.functions.pct >= thresholds.functions,
  branches: total.branches.pct >= thresholds.branches,
  statements: total.statements.pct >= thresholds.statements,
};

Object.entries(checks).forEach(([metric, passed]) => {
  const value = total[metric].pct.toFixed(1);
  const threshold = thresholds[metric];
  const status = passed ? '✅' : '❌';
  const symbol = passed ? '≥' : '<';

  console.log(`${status} ${metric.padEnd(11)}: ${value}% ${symbol} ${threshold}%`);
});

const allPassed = Object.values(checks).every(Boolean);

if (allPassed) {
  console.log('\n✅ QUALITY GATE: PASSED\n');
  process.exit(0);
} else {
  console.log('\n❌ QUALITY GATE: FAILED\n');
  console.log('Please increase test coverage before merging.\n');
  process.exit(1);
}



