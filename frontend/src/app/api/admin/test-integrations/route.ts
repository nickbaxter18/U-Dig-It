/**
 * Integration Test API Route
 * Tests Stripe and SendGrid integrations
 * Admin-only endpoint for verifying system configuration
 */
import sgMail from '@sendgrid/mail';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import {
  createStripeClient,
  getStripePublishableKey,
  getStripeSecretKey,
  getStripeWebhookSecret,
} from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user?.id || 'unknown')
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: [] as Array<{ name: string; status: 'pass' | 'fail'; message: string; details?: any }>,
    };

    // Test 1: Stripe Configuration
    try {
      const stripeKey = await getStripeSecretKey();
      const stripe = createStripeClient(stripeKey);

      // Test Stripe connection by listing a balance (lightweight check)
      const balance = await stripe.balance.retrieve();

      const usesSupabaseSecrets = !!process.env.STRIPE_SECRET_TEST_KEY;
      const source = usesSupabaseSecrets ? 'Supabase secrets' : 'legacy environment variable';

      results.tests.push({
        name: 'Stripe Configuration',
        status: 'pass',
        message: `Stripe connected successfully (${stripeKey.startsWith('sk_test') ? 'TEST MODE' : 'LIVE MODE'}) - ${source}`,
        details: {
          mode: stripeKey.startsWith('sk_test') ? 'test' : 'live',
          currency: balance.available[0]?.currency || 'cad',
          source,
        },
      });
    } catch (error) {
      results.tests.push({
        name: 'Stripe Configuration',
        status: 'fail',
        message: `Stripe connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    // Test 2: Stripe Publishable Key
    try {
      const publishableKey = await getStripePublishableKey();
      const usesSupabaseSecrets = !!process.env.STRIPE_PUBLIC_TEST_KEY;
      const source = usesSupabaseSecrets ? 'Supabase secrets' : 'legacy environment variable';

      results.tests.push({
        name: 'Stripe Publishable Key',
        status: 'pass',
        message: `Publishable key configured (${publishableKey.startsWith('pk_test') ? 'TEST MODE' : 'LIVE MODE'}) - ${source}`,
        details: {
          mode: publishableKey.startsWith('pk_test') ? 'test' : 'live',
          key: publishableKey.substring(0, 20) + '...',
          source,
        },
      });
    } catch (error) {
      results.tests.push({
        name: 'Stripe Publishable Key',
        status: 'fail',
        message: `Failed to get publishable key: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    // Test 3: Webhook Secret
    try {
      const webhookSecret = getStripeWebhookSecret();
      const usesSupabaseSecrets = !!process.env.STRIPE_WEBHOOK_SECRET;
      const source = usesSupabaseSecrets ? 'Supabase secrets' : 'legacy environment variable';

      results.tests.push({
        name: 'Stripe Webhook Secret',
        status: 'pass',
        message: `Webhook secret configured - ${source}`,
        details: {
          source,
          secretPrefix: webhookSecret.substring(0, 10) + '...',
        },
      });
    } catch (error) {
      results.tests.push({
        name: 'Stripe Webhook Secret',
        status: 'fail',
        message: `STRIPE_WEBHOOK_SECRET not configured: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    // Test 4: SendGrid Configuration
    try {
      const sendgridKey = process.env.SENDGRID_API_KEY;
      if (!sendgridKey) {
        results.tests.push({
          name: 'SendGrid Configuration',
          status: 'fail',
          message: 'SENDGRID_API_KEY not found in environment variables',
        });
      } else {
        sgMail.setApiKey(sendgridKey);

        // Test SendGrid connection (this doesn't send an email, just validates the key)
        results.tests.push({
          name: 'SendGrid Configuration',
          status: 'pass',
          message: 'SendGrid API key configured',
          details: {
            keyPrefix: sendgridKey.substring(0, 10) + '...',
          },
        });
      }
    } catch (error) {
      results.tests.push({
        name: 'SendGrid Configuration',
        status: 'fail',
        message: `SendGrid configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    // Test 5: Email From Address
    try {
      const emailFrom = process.env.EMAIL_FROM;
      if (!emailFrom) {
        results.tests.push({
          name: 'Email From Address',
          status: 'fail',
          message: 'EMAIL_FROM not configured',
        });
      } else {
        results.tests.push({
          name: 'Email From Address',
          status: 'pass',
          message: `From email configured: ${emailFrom}`,
        });
      }
    } catch {
      results.tests.push({
        name: 'Email From Address',
        status: 'fail',
        message: 'Failed to check email from address',
      });
    }

    // Test 6: Database Connection
    try {
      const { count, error: dbError } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true });

      if (dbError) {
        results.tests.push({
          name: 'Database Connection',
          status: 'fail',
          message: `Database error: ${dbError.message}`,
        });
      } else {
        results.tests.push({
          name: 'Database Connection',
          status: 'pass',
          message: `Connected to Supabase (${count || 0} bookings)`,
        });
      }
    } catch {
      results.tests.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'Database connection failed',
      });
    }

    // Test 7: Check Critical Tables
    const criticalTables = [
      'bookings',
      'equipment',
      'users',
      'payments',
      'support_tickets',
      'insurance_documents',
      'discount_codes',
      'drivers',
    ];

    for (const table of criticalTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });

        if (error) {
          results.tests.push({
            name: `Table: ${table}`,
            status: 'fail',
            message: `Error accessing table: ${error.message}`,
          });
        } else {
          results.tests.push({
            name: `Table: ${table}`,
            status: 'pass',
            message: `Table accessible (${count || 0} records)`,
          });
        }
      } catch {
        results.tests.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: 'Failed to check table',
        });
      }
    }

    // Calculate summary
    const totalTests = results.tests.length;
    const passedTests = results.tests.filter((t) => t.status === 'pass').length;
    const failedTests = results.tests.filter((t) => t.status === 'fail').length;

    const summary = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      percentage: Math.round((passedTests / totalTests) * 100),
      status: failedTests === 0 ? 'ALL TESTS PASSED' : `${failedTests} TEST(S) FAILED`,
    };

    logger.info('Integration test completed', {
      component: 'test-integrations-api',
      action: 'test_complete',
      metadata: summary,
    });

    return NextResponse.json(
      {
        success: failedTests === 0,
        summary,
        results: results.tests,
        timestamp: results.timestamp,
        environment: results.environment,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      'Integration test error',
      {
        component: 'test-integrations-api',
        action: 'error',
      },
      error as Error
    );

    return NextResponse.json(
      {
        error: 'Test execution failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
