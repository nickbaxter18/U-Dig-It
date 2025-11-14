/**
 * GET /api/spin/session/:id
 *
 * Retrieves spin session status and audit trail.
 *
 * Returns:
 * - session: Complete session object
 * - auditLog: Array of audit events (optional)
 * - fraudFlags: Array of fraud flags (admin only)
 */

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 1. AUTHENTICATION
    // ========================================================================
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ========================================================================
    // 2. FETCH SESSION
    // ========================================================================
    const { data: session, error: fetchError } = await supabase
      .from('spin_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // ========================================================================
    // 3. AUTHORIZATION
    // ========================================================================
    const isOwner = session.user_id === user?.id ||
                    session.email === user?.email;

    // Check if user is admin
    const { data: userData } = user
      ? await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
      : { data: null };

    const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ========================================================================
    // 4. FETCH AUDIT LOG (OPTIONAL)
    // ========================================================================
    let auditLog = null;
    if (request.nextUrl.searchParams.get('includeAudit') === 'true') {
      const { data: audit } = await supabase
        .from('spin_audit_log')
        .select('*')
        .eq('spin_session_id', sessionId)
        .order('created_at', { ascending: true });

      auditLog = audit;
    }

    // ========================================================================
    // 5. FETCH COUPON (IF WON)
    // ========================================================================
    let coupon = null;
    if (session.completed && session.coupon_code) {
      const { data: couponData } = await supabase
        .from('spin_coupon_codes')
        .select('*')
        .eq('spin_session_id', sessionId)
        .single();

      coupon = couponData;
    }

    // ========================================================================
    // 6. FETCH FRAUD FLAGS (ADMIN ONLY)
    // ========================================================================
    let fraudFlags = null;
    if (isAdmin && request.nextUrl.searchParams.get('includeFraud') === 'true') {
      const { data: flags } = await supabase
        .from('spin_fraud_flags')
        .select('*')
        .eq('spin_session_id', sessionId);

      fraudFlags = flags;
    }

    // ========================================================================
    // 7. CHECK IF EXPIRED
    // ========================================================================
    const isExpired = new Date(session.expires_at) < new Date();

    // Auto-update expired sessions
    if (isExpired && !session.completed) {
      await supabase
        .from('spin_sessions')
        .update({ completed: true })
        .eq('id', sessionId);

      session.completed = true;
    }

    // ========================================================================
    // 8. RETURN RESPONSE
    // ========================================================================
    logger.info('[Spin Session] Session retrieved', {
      component: 'spin-session-api',
      action: 'session_retrieved',
      metadata: {
        sessionId,
        userId: user?.id || null,
        isAdmin,
      },
    });

    return NextResponse.json({
      session,
      coupon,
      auditLog,
      fraudFlags,
      status: {
        isExpired,
        isCompleted: session.completed,
        spinsRemaining: session.spins_allowed - session.spins_used,
        timeRemaining: isExpired ? 0 : new Date(session.expires_at).getTime() - Date.now(),
      },
    });

  } catch (error) {
    logger.error('[Spin Session] Unexpected error', {
      component: 'spin-session-api',
      action: 'error',
    }, error as Error);

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

