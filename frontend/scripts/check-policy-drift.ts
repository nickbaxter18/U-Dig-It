#!/usr/bin/env tsx
import fs from 'node:fs';
import path from 'node:path';

import { SUPABASE_SERVICE_ROLE_KEY as CONFIG_SERVICE_ROLE_KEY, SUPABASE_URL as CONFIG_SUPABASE_URL } from '../src/lib/supabase/config';

const SUPABASE_URL = process.env.SUPABASE_URL ?? CONFIG_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? CONFIG_SERVICE_ROLE_KEY;
const BASELINE_PATH = path.resolve(process.cwd(), '../supabase/policies-baseline.json');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Skipping policy drift check: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured.');
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.warn('⚠️  Skipping policy drift check: baseline file missing at', BASELINE_PATH);
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8')) as PolicyRow[];

type PolicyRow = {
  schemaname: string;
  tablename: string;
  policyname: string;
  roles: string | null;
  cmd: string;
  qual: string | null;
  with_check: string | null;
};

function normalize(records: PolicyRow[]) {
  return records
    .map((record) => ({
      ...record,
      roles: record.roles ?? null,
      qual: record.qual ?? null,
      with_check: record.with_check ?? null,
    }))
    .sort((a, b) => {
      return (
        a.schemaname.localeCompare(b.schemaname) ||
        a.tablename.localeCompare(b.tablename) ||
        a.policyname.localeCompare(b.policyname) ||
        a.cmd.localeCompare(b.cmd)
      );
    });
}

async function fetchCurrentPolicies(): Promise<PolicyRow[]> {
  const url = new URL('/rest/v1/pg_policies', SUPABASE_URL);
  url.searchParams.set('select', 'schemaname,tablename,policyname,roles,cmd,qual,with_check');
  url.searchParams.set('order', 'schemaname,tablename,policyname');

  const response = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch policies (${response.status}): ${body}`);
  }

  const data = (await response.json()) as PolicyRow[];
  return data;
}

function diffPolicies(expected: PolicyRow[], actual: PolicyRow[]) {
  const expectedMap = new Map(expected.map((item) => [key(item), item]));
  const actualMap = new Map(actual.map((item) => [key(item), item]));

  const missing: PolicyRow[] = [];
  const extra: PolicyRow[] = [];
  const changed: { baseline: PolicyRow; actual: PolicyRow }[] = [];

  for (const [policyKey, expectedPolicy] of expectedMap.entries()) {
    const actualPolicy = actualMap.get(policyKey);
    if (!actualPolicy) {
      missing.push(expectedPolicy);
      continue;
    }

    if (JSON.stringify(expectedPolicy) !== JSON.stringify(actualPolicy)) {
      changed.push({ baseline: expectedPolicy, actual: actualPolicy });
    }
  }

  for (const [policyKey, actualPolicy] of actualMap.entries()) {
    if (!expectedMap.has(policyKey)) {
      extra.push(actualPolicy);
    }
  }

  return { missing, extra, changed };
}

function key(row: PolicyRow) {
  return `${row.schemaname}.${row.tablename}.${row.policyname}.${row.cmd}`;
}

(async () => {
  try {
    const currentPolicies = await fetchCurrentPolicies();

    const baselineNormalized = normalize(baseline);
    const currentNormalized = normalize(currentPolicies);

    const { missing, extra, changed } = diffPolicies(baselineNormalized, currentNormalized);

    if (missing.length === 0 && extra.length === 0 && changed.length === 0) {
      console.log('✅ No policy drift detected.');
      process.exit(0);
    }

    console.error('❌ Policy drift detected!');

    if (missing.length) {
      console.error('\n-- Policies missing from database (expected but not found) --');
      for (const policy of missing) {
        console.error(` • ${key(policy)}`);
      }
    }

    if (extra.length) {
      console.error('\n-- New policies present in database (not in baseline) --');
      for (const policy of extra) {
        console.error(` • ${key(policy)}`);
      }
    }

    if (changed.length) {
      console.error('\n-- Policies changed compared to baseline --');
      for (const item of changed) {
        console.error(` • ${key(item.baseline)}`);
        console.error('   baseline:', JSON.stringify(item.baseline));
        console.error('   actual:  ', JSON.stringify(item.actual));
      }
    }

    process.exit(1);
  } catch (error) {
    console.error('❌ Failed to evaluate policy drift:', error);
    process.exit(1);
  }
})();
