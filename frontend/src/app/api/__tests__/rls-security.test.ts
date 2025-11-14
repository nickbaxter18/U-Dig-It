/**
 * RLS Security Tests
 * Validates Row-Level Security policies are working correctly
 */

import { describe, it, expect } from 'vitest';
import { mcp_supabase_execute_sql } from '@/lib/supabase-mcp-helpers';

describe('RLS Security Validation', () => {
  describe('RLS Enabled Status', () => {
    it('should have RLS enabled on all critical tables', async () => {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT tablename, rowsecurity
          FROM pg_tables
          WHERE schemaname = 'public'
            AND tablename IN ('bookings', 'payments', 'rental_contracts', 'insurance_documents', 'users')
          ORDER BY tablename;
        `
      });

      const tables = JSON.parse(result);
      expect(tables.length).toBe(5);

      tables.forEach((table: any) => {
        expect(table.rowsecurity).toBe(true);
      });
    });

    it('should have RLS enabled on storage.objects', async () => {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT tablename, rowsecurity
          FROM pg_tables
          WHERE schemaname = 'storage'
            AND tablename = 'objects';
        `
      });

      const tables = JSON.parse(result);
      expect(tables.length).toBe(1);
      expect(tables[0].rowsecurity).toBe(true);
    });
  });

  describe('RLS Policies Existence', () => {
    it('should have bookings policies', async () => {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT policyname, cmd
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'bookings'
          ORDER BY policyname;
        `
      });

      const policies = JSON.parse(result);
      expect(policies.length).toBeGreaterThanOrEqual(3); // SELECT, INSERT, UPDATE minimum

      const commands = policies.map((p: any) => p.cmd);
      expect(commands).toContain('SELECT');
      expect(commands).toContain('INSERT');
      expect(commands).toContain('UPDATE');
    });

    it('should have payments policies via booking ownership', async () => {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT policyname, cmd
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'payments'
          ORDER BY policyname;
        `
      });

      const policies = JSON.parse(result);
      expect(policies.length).toBeGreaterThanOrEqual(2); // SELECT, INSERT minimum
    });

    it('should have storage bucket policies', async () => {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT policyname, cmd, bucket_id_extracted
          FROM (
            SELECT
              policyname,
              cmd,
              REGEXP_MATCH(qual, 'bucket_id = ''([^'']+)''') as bucket_id_extracted
            FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename = 'objects'
          ) subquery
          WHERE bucket_id_extracted IS NOT NULL
          ORDER BY policyname;
        `
      });

      const policies = JSON.parse(result);
      expect(policies.length).toBeGreaterThan(0);

      // Should have policies for critical buckets
      const policyText = JSON.stringify(policies);
      expect(policyText).toContain('contracts');
      expect(policyText).toContain('insurance');
    });
  });

  describe('Index Coverage for RLS', () => {
    it('should have indexes on RLS policy columns', async () => {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT
            tablename,
            indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND (
              indexname LIKE '%customer%'
              OR indexname LIKE '%booking%'
            )
          ORDER BY tablename, indexname;
        `
      });

      const indexes = JSON.parse(result);
      expect(indexes.length).toBeGreaterThan(0);

      // Verify critical indexes exist
      const indexNames = indexes.map((idx: any) => idx.indexname);
      expect(indexNames).toContain('idx_bookings_customer_id');
      expect(indexNames).toContain('idx_payments_booking_id');
    });
  });

  describe('Performance Optimization', () => {
    it('should use SELECT auth.uid() wrapper in policies', async () => {
      const result = await mcp_supabase_execute_sql({
        query: `
          SELECT
            tablename,
            policyname,
            qual
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = 'bookings'
            AND qual LIKE '%SELECT auth.uid()%'
          LIMIT 1;
        `
      });

      const policies = JSON.parse(result);
      expect(policies.length).toBeGreaterThan(0);
      expect(policies[0].qual).toContain('SELECT auth.uid()');
    });
  });
});

// Helper function (mock - would need actual implementation)
async function mockMcpSupabaseExecuteSql(options: { query: string }) {
  // This is a mock - in real tests, you'd use the actual MCP tool
  return JSON.stringify([]);
}


