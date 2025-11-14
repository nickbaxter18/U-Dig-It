import { sendLeadMagnetEmail } from '@/lib/email-service';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per minute per IP (prevents spam)
  const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait before requesting another checklist.',
        retryAfter: Math.ceil(((rateLimitResult.reset - Date.now())) / 1000),
      },
      {
        status: 429,
        headers: rateLimitResult.headers,
      }
    );
  }

  try {
    const { email, name, company } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Send welcome email with checklist
    try {
      await sendLeadMagnetEmail(email, name);

      logger.debug('Lead captured', {
        component: 'api-lead-capture',
        action: 'debug',
        metadata: { email, name, company },
      });

      return NextResponse.json({
        success: true,
        message: 'Checklist sent to your email!',
        downloadUrl: '/downloads/equipment-rental-checklist.pdf',
      });
    } catch (emailError) {
      logger.error('Failed to send lead magnet email', {
        component: 'api-lead-capture',
        action: 'error',
        metadata: { email, error: emailError instanceof Error ? emailError.message : String(emailError) },
      }, emailError instanceof Error ? emailError : undefined);

      // Still return success to user, but log the error
      return NextResponse.json({
        success: true,
        message: "Thank you! We'll send your checklist shortly.",
        downloadUrl: '/downloads/equipment-rental-checklist.pdf',
      });
    }
  } catch (error) {
    logger.error('Lead capture error', {
      component: 'api-lead-capture',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        error: 'Failed to process request. Please try again.',
      },
      { status: 500 }
    );
  }
}
