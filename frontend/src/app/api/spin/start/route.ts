/**
 * POST /api/spin/start
 *
 * Creates a new spin session with comprehensive fraud prevention and rate limiting.
 *
 * Request body:
 * - email?: string (required for guests)
 * - phone?: string (optional)
 * - deviceFingerprint?: string (for fraud detection)
 *
 * Returns:
 * - session: SpinSession object
 * - rateLimitInfo: Remaining attempts info
 */
import crypto from 'crypto';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { createClient } from '@/lib/supabase/server';

interface StartSpinRequest {
  email?: string;
  phone?: string;
  deviceFingerprint?: string;
}

interface SpinSession {
  id: string;
  session_token: string;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  spins_allowed: number;
  spins_used: number;
  outcomes: Array<{
    spin: number;
    outcome: string;
    timestamp: string;
  }>;
  prize_pct: number | null;
  coupon_code: string | null;
  completed: boolean;
  expires_at: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. REQUEST VALIDATION
    // ========================================================================
    const validation = await validateRequest(request, {
      maxSize: 10 * 1024, // 10KB max
      allowedContentTypes: ['application/json'],
    });

    if (!validation.valid) {
      logger.warn('[Spin API] Invalid request', {
        component: 'spin-start-api',
        action: 'validation_failed',
        metadata: { reason: validation.error },
      });
      return validation.error!;
    }

    // ========================================================================
    // 2. RATE LIMITING (API-level)
    // ========================================================================
    const apiRateLimit = await rateLimit(request, {
      ...RateLimitPresets.STRICT,
      skipAdmins: false, // Even admins are rate limited
    });

    if (!apiRateLimit.success) {
      logger.warn('[Spin API] Rate limit exceeded', {
        component: 'spin-start-api',
        action: 'rate_limited',
      });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: apiRateLimit.headers }
      );
    }

    // ========================================================================
    // 3. AUTHENTICATION
    // ========================================================================
    const supabase = await createClient();
    const {
      data: { user },
      error: _authError,
    } = await supabase.auth.getUser();

    const body: StartSpinRequest = await request.json();

    // For guests, email is required
    if (!user && !body.email) {
      return NextResponse.json({ error: 'Email is required for guest users' }, { status: 400 });
    }

    // ========================================================================
    // 4. EXTRACT IDENTIFIERS FOR FRAUD DETECTION
    // ========================================================================
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const email = user?.email || body.email;
    const phone = body.phone;

    // Generate device fingerprint hash
    const deviceFingerprint =
      body.deviceFingerprint ||
      crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');

    // ========================================================================
    // 5. BUSINESS RULE: CHECK FOR EXISTING ACTIVE SESSION
    // ========================================================================
    const { data: existingSessions, error: checkError } = await supabase
      .from('spin_sessions')
      .select('*')
      .eq('completed', false)
      .or(user ? `user_id.eq.${user.id}` : `email.eq.${email}`)
      .maybeSingle();

    if (existingSessions && !checkError) {
      logger.info('[Spin API] Returning existing session', {
        component: 'spin-start-api',
        action: 'existing_session',
        metadata: { sessionId: existingSessions.id },
      });

      return NextResponse.json({
        session: existingSessions,
        isExisting: true,
        message: 'You already have an active spin session',
      });
    }

    // ========================================================================
    // 6. RATE LIMITING: CHECK 14-DAY WINDOW
    // ========================================================================
    const rateLimitChecks = [
      { type: 'email', value: email },
      { type: 'phone', value: phone },
      { type: 'device', value: deviceFingerprint },
      { type: 'ip', value: ip },
      ...(user ? [{ type: 'user_id', value: user.id }] : []),
    ].filter((check) => check.value);

    for (const check of rateLimitChecks) {
      const { data: isLimited, error: rpcError } = await supabase.rpc('is_spin_rate_limited', {
        p_identifier_type: check.type,
        p_identifier_value: check.value,
        p_max_attempts: 1,
        p_window_hours: 336, // 14 days
      });

      if (rpcError) {
        logger.warn('[Spin API] Rate limit check failed (non-fatal)', {
          component: 'spin-start-api',
          action: 'rate_limit_check_error',
          metadata: { type: check.type, error: rpcError.message },
        });
        // Continue if RPC function doesn't exist yet
        continue;
      }

      if (isLimited) {
        logger.warn('[Spin API] Rate limit exceeded (14-day window)', {
          component: 'spin-start-api',
          action: 'rate_limit_14day',
          metadata: { type: check.type },
        });

        return NextResponse.json(
          {
            error: 'You can only play once every 14 days',
            rateLimited: true,
            type: check.type,
          },
          { status: 429 }
        );
      }
    }

    // ========================================================================
    // 7. FRAUD DETECTION: CHECK FOR SUSPICIOUS PATTERNS (OPTIMIZED - NON-BLOCKING)
    // ========================================================================
    const suspiciousFlags: Array<{ type: string; severity: string }> = [];

    // ⚡ OPTIMIZATION: Run fraud checks in parallel (don't block session creation)
    // These checks are logged but don't prevent spin from starting
    const fraudChecksPromise = Promise.all([
      // Check for duplicate device
      supabase
        .from('spin_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('device_fingerprint_hash', deviceFingerprint)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Check for duplicate IP
      supabase
        .from('spin_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])
      .then(([deviceResult, ipResult]) => {
        if (deviceResult.count && deviceResult.count > 2) {
          suspiciousFlags.push({ type: 'duplicate_device', severity: 'medium' });
        }
        if (ipResult.count && ipResult.count > 3) {
          suspiciousFlags.push({ type: 'duplicate_ip', severity: 'medium' });
        }
      })
      .catch((error: unknown) => {
        logger.warn('[Spin API] Fraud check failed (non-fatal)', {
          component: 'spin-start-api',
          action: 'fraud_check_error',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        });
      });

    // DON'T await fraud checks - they run in background

    // ========================================================================
    // 8. CREATE SPIN SESSION
    // ========================================================================
    const sessionToken = `spin_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const { data: session, error: createError } = await supabase
      .from('spin_sessions')
      .insert({
        session_token: sessionToken,
        user_id: user?.id || null,
        email: email || null,
        phone: phone || null,
        spins_allowed: 3,
        spins_used: 0,
        outcomes: [],
        expires_at: expiresAt.toISOString(),
        ip_address: ip,
        user_agent: userAgent,
        device_fingerprint_hash: deviceFingerprint,
        is_first_booking_only: true,
        completed: false,
      })
      .select()
      .single();

    if (createError || !session) {
      logger.error(
        '[Spin API] Failed to create session',
        {
          component: 'spin-start-api',
          action: 'create_error',
        },
        createError || new Error('No session returned')
      );

      return NextResponse.json(
        { error: 'Failed to create spin session. Please try again.' },
        { status: 500 }
      );
    }

    // ========================================================================
    // 9. RECORD RATE LIMIT ATTEMPTS (NON-BLOCKING)
    // ========================================================================
    // Record attempts in background - don't block session creation
    for (const check of rateLimitChecks) {
      supabase
        .rpc('record_spin_attempt', {
          p_identifier_type: check.type,
          p_identifier_value: check.value,
          p_window_hours: 336, // 14 days
        })
        .then(({ error }) => {
          if (error) {
            logger.warn('[Spin API] Failed to record rate limit attempt (non-fatal)', {
              component: 'spin-start-api',
              action: 'record_attempt_error',
              metadata: { type: check.type, error: error.message },
            });
          }
        });
    }

    // ========================================================================
    // 10. CREATE AUDIT LOG (NON-BLOCKING - OPTIMIZED)
    // ========================================================================
    // ⚡ OPTIMIZATION: Don't await audit log insert - let it complete in background
    supabase
      .from('spin_audit_log')
      .insert({
        spin_session_id: session.id,
        event_type: 'session_created',
        ip_address: ip,
        user_agent: userAgent,
        device_fingerprint_hash: deviceFingerprint,
        metadata: {
          user_id: user?.id || null,
          email: email || null,
          phone: phone || null,
        },
      })
      .then(({ error }) => {
        if (error) {
          logger.warn('[Spin API] Audit log failed (non-fatal)', {
            component: 'spin-start-api',
            action: 'audit_log_error',
            metadata: { error: error.message },
          });
        }
      });

    // ========================================================================
    // 11. LOG FRAUD FLAGS IF SUSPICIOUS (NON-BLOCKING)
    // ========================================================================
    // Wait for fraud checks to complete, then log (happens after response sent)
    fraudChecksPromise.then(() => {
      if (suspiciousFlags.length > 0) {
        logger.warn('[Spin API] Fraud flags detected (background check)', {
          component: 'spin-start-api',
          action: 'fraud_flagged',
          metadata: {
            sessionId: session.id,
            flags: suspiciousFlags,
            note: 'Detected in background after session creation',
          },
        });
      }
    });

    // ========================================================================
    // 12. ANALYTICS EVENT
    // ========================================================================
    // TODO: Fire analytics event: spin_session_created

    const duration = Date.now() - startTime;
    logger.info('[Spin API] Session created successfully', {
      component: 'spin-start-api',
      action: 'session_created',
      metadata: {
        sessionId: session.id,
        userId: user?.id || null,
        email: email || null,
        duration,
        fraudFlags: suspiciousFlags.length,
      },
    });

    return NextResponse.json({
      session: session as SpinSession,
      isExisting: false,
      message: 'Spin session created successfully',
      fraudWarning:
        suspiciousFlags.length > 0 ? 'Your session is being reviewed for security' : null,
    });
  } catch (error) {
    logger.error(
      '[Spin API] Unexpected error',
      {
        component: 'spin-start-api',
        action: 'error',
      },
      error as Error
    );

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
