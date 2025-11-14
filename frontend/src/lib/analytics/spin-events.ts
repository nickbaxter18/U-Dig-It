/**
 * Spin Wheel Analytics Events
 *
 * Tracks all spin wheel interactions for conversion funnel analysis.
 * Supports Google Tag Manager, Segment, and custom analytics.
 *
 * Key Events:
 * 1. spin_modal_view - Modal opened
 * 2. spin_modal_close - Modal closed (track abandonment)
 * 3. spin_email_captured - Guest provided email
 * 4. spin_session_created - Backend session created
 * 5. spin_started - User clicked spin button
 * 6. spin_completed - Spin animation finished
 * 7. coupon_issued - Prize won (3rd spin)
 * 8. coupon_copied - User copied coupon code
 * 9. coupon_applied - Coupon used at checkout
 * 10. booking_completed - Full conversion
 * 11. coupon_expired - Coupon expired unused
 * 12. fraud_flagged - Suspicious activity detected
 */

import { logger } from '@/lib/logger';

// Google Tag Manager / Google Analytics
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: any[];
  }
}

interface SpinEventData {
  sessionId?: string;
  userId?: string;
  email?: string;
  spinNumber?: number;
  outcome?: string;
  discountPercent?: number;
  couponCode?: string;
  value?: number;
  [key: string]: any;
}

/**
 * Track spin wheel event
 */
export function trackSpinEvent(eventName: string, data: SpinEventData = {}) {
  try {
    // Add common properties
    const enrichedData = {
      ...data,
      timestamp: new Date().toISOString(),
      source: 'spin_to_win',
      platform: 'web',
    };

    // Google Tag Manager / GA4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, enrichedData);
    }

    // Segment (if installed)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(eventName, enrichedData);
    }

    // Server-side logging for backup
    logger.info(`[Analytics] ${eventName}`, {
      component: 'spin-analytics',
      action: 'event_tracked',
      metadata: enrichedData,
    });
  } catch (error) {
    // Don't let analytics failures break the app
    logger.error('[Analytics] Failed to track event', {
      component: 'spin-analytics',
      action: 'event_track_failed',
      metadata: { eventName },
    }, error as Error);
  }
}

/**
 * 1. Modal View Event
 */
export function trackSpinModalView() {
  trackSpinEvent('spin_modal_view', {
    event_category: 'engagement',
    event_label: 'modal_opened',
  });
}

/**
 * 2. Modal Close Event (abandonment tracking)
 */
export function trackSpinModalClose(sessionId?: string, spinsCompleted?: number) {
  trackSpinEvent('spin_modal_close', {
    sessionId,
    spinsCompleted,
    event_category: 'engagement',
    event_label: 'modal_closed',
    abandoned: spinsCompleted === 0 || spinsCompleted === undefined,
  });
}

/**
 * 3. Email Captured (guest conversion)
 */
export function trackSpinEmailCaptured(email: string, phone?: string) {
  trackSpinEvent('spin_email_captured', {
    email,
    hasPhone: !!phone,
    event_category: 'lead_generation',
    event_label: 'email_provided',
  });
}

/**
 * 4. Session Created
 */
export function trackSpinSessionCreated(sessionId: string, userId?: string) {
  trackSpinEvent('spin_session_created', {
    sessionId,
    userId,
    event_category: 'engagement',
    event_label: 'session_started',
  });
}

/**
 * 5. Spin Started (button clicked)
 */
export function trackSpinStarted(sessionId: string, spinNumber: number, isGuaranteedWin: boolean) {
  trackSpinEvent('spin_started', {
    sessionId,
    spinNumber,
    isGuaranteedWin,
    event_category: 'engagement',
    event_label: `spin_${spinNumber}_started`,
  });
}

/**
 * 6. Spin Completed
 */
export function trackSpinCompleted(
  sessionId: string,
  spinNumber: number,
  outcome: string,
  won: boolean
) {
  trackSpinEvent('spin_completed', {
    sessionId,
    spinNumber,
    outcome,
    won,
    event_category: 'engagement',
    event_label: won ? 'spin_won' : 'spin_lost',
    value: won ? 1 : 0,
  });
}

/**
 * 7. Coupon Issued (prize won)
 */
export function trackCouponIssued(
  sessionId: string,
  couponCode: string,
  discountPercent: number
) {
  trackSpinEvent('coupon_issued', {
    sessionId,
    couponCode,
    discountPercent,
    event_category: 'conversion',
    event_label: `coupon_${discountPercent}pct_issued`,
    value: discountPercent,
  });
}

/**
 * 8. Coupon Copied (user interaction)
 */
export function trackCouponCopied(couponCode: string) {
  trackSpinEvent('coupon_copied', {
    couponCode,
    event_category: 'engagement',
    event_label: 'coupon_copied_to_clipboard',
  });
}

/**
 * 9. Coupon Applied (at checkout)
 */
export function trackCouponApplied(
  couponCode: string,
  discountPercent: number,
  orderValue: number,
  discountAmount: number
) {
  trackSpinEvent('coupon_applied', {
    couponCode,
    discountPercent,
    orderValue,
    discountAmount,
    event_category: 'conversion',
    event_label: 'coupon_used_at_checkout',
    value: discountAmount,
  });
}

/**
 * 10. Booking Completed (full conversion)
 */
export function trackBookingCompleted(
  couponCode: string,
  bookingId: string,
  totalValue: number,
  discountAmount: number
) {
  trackSpinEvent('booking_completed_with_spin_coupon', {
    couponCode,
    bookingId,
    totalValue,
    discountAmount,
    event_category: 'purchase',
    event_label: 'spin_conversion',
    value: totalValue,
  });
}

/**
 * 11. Coupon Expired
 */
export function trackCouponExpired(couponCode: string, discountPercent: number) {
  trackSpinEvent('coupon_expired', {
    couponCode,
    discountPercent,
    event_category: 'abandonment',
    event_label: 'coupon_expired_unused',
  });
}

/**
 * 12. Fraud Flagged
 */
export function trackFraudFlagged(sessionId: string, flagType: string, severity: string) {
  trackSpinEvent('fraud_flagged', {
    sessionId,
    flagType,
    severity,
    event_category: 'security',
    event_label: `fraud_${flagType}`,
  });
}

/**
 * Helper: Track conversion funnel stage
 */
export function trackFunnelStage(
  stage: 'view' | 'start' | 'complete' | 'win' | 'apply' | 'purchase',
  data: SpinEventData = {}
) {
  const stageMap = {
    view: 'spin_modal_view',
    start: 'spin_session_created',
    complete: 'spin_completed',
    win: 'coupon_issued',
    apply: 'coupon_applied',
    purchase: 'booking_completed_with_spin_coupon',
  };

  trackSpinEvent(stageMap[stage], {
    ...data,
    funnel_stage: stage,
  });
}
