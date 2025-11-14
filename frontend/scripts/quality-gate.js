#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 RUNNING QUALITY GATES\n');

// 1. Check coverage
const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
let coveragePassed = true;

if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const total = summary.total;

  coveragePassed =
    total.lines.pct >= 70 &&
    total.functions.pct >= 70 &&
    total.branches.pct >= 65 &&
    total.statements.pct >= 70;

  console.log(`${coveragePassed ? '✅' : '❌'} Coverage: ${total.lines.pct.toFixed(1)}% lines`);
} else {
  console.log('⚠️  Coverage report not found (run pnpm test:coverage first)');
  coveragePassed = false;
}

// 2. Summary
console.log('\n' + '─'.repeat(50));

if (coveragePassed) {
  console.log('\n✅ ALL QUALITY GATES PASSED\n');
  process.exit(0);
} else {
  console.log('\n❌ QUALITY GATES FAILED\n');
  if (!coveragePassed) console.log('  → Increase test coverage');
  console.log();
  process.exit(1);
}



