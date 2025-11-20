/**
 * GET /api/admin/diagnose-email
 *
 * Diagnostic endpoint to check email system configuration
 * Helps identify why emails aren't sending
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);
    if (adminResult.error) return adminResult.error;

    const diagnostics: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      status: 'checking',
      checks: {},
    };

    // Check 1: Environment variables
    const hasEmailApiKey = !!process.env.EMAIL_API_KEY;
    const hasSendgridApiKey = !!process.env.SENDGRID_API_KEY;
    const emailApiKeyLength = process.env.EMAIL_API_KEY?.length || 0;
    const sendgridApiKeyLength = process.env.SENDGRID_API_KEY?.length || 0;
    const emailApiKeyPrefix = process.env.EMAIL_API_KEY?.substring(0, 10) || 'not set';
    const sendgridApiKeyPrefix = process.env.SENDGRID_API_KEY?.substring(0, 10) || 'not set';

    diagnostics.checks.environmentVariables = {
      EMAIL_API_KEY: {
        exists: hasEmailApiKey,
        length: emailApiKeyLength,
        prefix: emailApiKeyPrefix + '...',
        startsWithSG: process.env.EMAIL_API_KEY?.startsWith('SG.') || false,
      },
      SENDGRID_API_KEY: {
        exists: hasSendgridApiKey,
        length: sendgridApiKeyLength,
        prefix: sendgridApiKeyPrefix + '...',
        startsWithSG: process.env.SENDGRID_API_KEY?.startsWith('SG.') || false,
      },
    };

    // Check 2: Try to load API key using the secrets loader
    try {
      const { getSendGridApiKey } = await import('@/lib/secrets/email');
      const apiKey = await getSendGridApiKey();
      diagnostics.checks.secretsLoader = {
        success: true,
        keyLength: apiKey.length,
        keyPrefix: apiKey.substring(0, 10) + '...',
        startsWithSG: apiKey.startsWith('SG.'),
      };
    } catch (err) {
      diagnostics.checks.secretsLoader = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Check 3: Try to initialize SendGrid
    try {
      const sgMail = await import('@sendgrid/mail');
      const { getSendGridApiKey } = await import('@/lib/secrets/email');
      const apiKey = await getSendGridApiKey();
      sgMail.default.setApiKey(apiKey);
      diagnostics.checks.sendGridInitialization = {
        success: true,
        message: 'SendGrid initialized successfully',
      };
    } catch (err) {
      diagnostics.checks.sendGridInitialization = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      };
    }

    // Check 4: FROM_EMAIL configuration
    diagnostics.checks.fromEmail = {
      EMAIL_FROM: process.env.EMAIL_FROM || 'NickBaxter@udigit.ca (default)',
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'U-Dig It Rentals (default)',
    };

    // Determine overall status
    const hasValidApiKey =
      (hasEmailApiKey && process.env.EMAIL_API_KEY?.startsWith('SG.')) ||
      (hasSendgridApiKey && process.env.SENDGRID_API_KEY?.startsWith('SG.')) ||
      diagnostics.checks.secretsLoader.success;

    diagnostics.status = hasValidApiKey ? 'configured' : 'misconfigured';
    diagnostics.summary = {
      hasApiKey: hasValidApiKey,
      recommendation: hasValidApiKey
        ? 'Email system appears configured. Check logs for actual send errors.'
        : 'API key not found. Set EMAIL_API_KEY in .env.local or Supabase secrets.',
    };

    logger.info('Email system diagnostic completed', {
      component: 'diagnose-email',
      action: 'diagnostic_complete',
      metadata: diagnostics,
    });

    return NextResponse.json(diagnostics);
  } catch (err) {
    logger.error(
      'Email diagnostic failed',
      {
        component: 'diagnose-email',
        action: 'diagnostic_error',
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
