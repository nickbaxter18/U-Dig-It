#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

type CoverageMetric = 'statements' | 'branches' | 'functions' | 'lines';

type CoverageTotals = Record<CoverageMetric, number>;

const SUMMARY_PATH = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
const BASELINE_PATH = path.resolve(process.cwd(), '../docs/qa/coverage-baseline.json');
const OUTPUT_PATH = path.resolve(process.cwd(), 'coverage/nightly-summary.json');

if (!fs.existsSync(SUMMARY_PATH)) {
  console.error('❌ Coverage summary not found at', SUMMARY_PATH);
  process.exit(1);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.warn('⚠️  Coverage baseline missing at', BASELINE_PATH, '- creating new baseline file.');
  const summary = readCoverageTotals();
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(summary, null, 2) + '\n');
  console.log('✅ Baseline created. No drift calculated on first run.');
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8')) as CoverageTotals;
const totals = readCoverageTotals();

const deltas: Record<CoverageMetric, number> = {
  statements: totals.statements - baseline.statements,
  branches: totals.branches - baseline.branches,
  functions: totals.functions - baseline.functions,
  lines: totals.lines - baseline.lines,
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(
  OUTPUT_PATH,
  JSON.stringify({ capturedAt: new Date().toISOString(), totals, baseline, deltas }, null, 2) + '\n'
);

console.log('📊 Coverage totals:', totals);
console.log('📉 Coverage deltas vs baseline:', deltas);

const regressions = (Object.keys(deltas) as CoverageMetric[]).filter((metric) => deltas[metric] < 0);

if (regressions.length > 0) {
  console.error('❌ Coverage regressions detected:');
  for (const metric of regressions) {
    console.error(
      ` • ${metric}: current ${(totals[metric] * 100).toFixed(2)}% (baseline ${(baseline[metric] * 100).toFixed(2)}%)`
    );
  }
  process.exit(1);
}

console.log('✅ Coverage meets or exceeds baseline.');
process.exit(0);

function readCoverageTotals(): CoverageTotals {
  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8')) as Record<string, any>;
  const total = summary.total;
  if (!total) {
    throw new Error('Coverage summary missing "total" section.');
  }

  const metrics: CoverageTotals = {
    statements: Number(total.statements?.pct ?? 0) / 100,
    branches: Number(total.branches?.pct ?? 0) / 100,
    functions: Number(total.functions?.pct ?? 0) / 100,
    lines: Number(total.lines?.pct ?? 0) / 100,
  };

  for (const [metric, value] of Object.entries(metrics)) {
    if (!Number.isFinite(value)) {
      throw new Error(`Coverage metric ${metric} is invalid in summary.`);
    }
  }

  return metrics;
}
