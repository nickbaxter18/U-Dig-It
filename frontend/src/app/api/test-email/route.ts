/**
 * POST /api/test-email
 *
 * Test email delivery system
 * Use this to verify SendGrid integration is working
 *
 * Request body:
 * - toEmail: string (email address to send test to)
 * - type: 'booking' | 'spin-winner' | 'spin-reminder' | 'basic'
 */

import {
    sendBookingConfirmationEmail,
    sendSpinExpiryReminder,
    sendSpinWinnerEmail,
    sendTestEmail,
} from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { toEmail, type = 'basic' } = body;

    if (!toEmail) {
      return NextResponse.json({ error: 'toEmail is required' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'basic':
        result = await sendTestEmail(toEmail);
        break;

      case 'booking': {
        // Send with mock booking data
        const mockBooking = {
          id: 'test-booking-id',
          bookingNumber: 'BK-TEST-12345',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          totalAmount: '895.85',
          deliveryAddress: '123 Test Street, Saint John, NB',
        };
        const mockCustomer = {
          email: toEmail,
          firstName: 'Test',
          lastName: 'Customer',
        };
        result = await sendBookingConfirmationEmail(mockBooking, mockCustomer);
        break;
      }

      case 'spin-winner':
        result = await sendSpinWinnerEmail(
          toEmail,
          50, // $50 prize
          'UDIG-GOLD50',
          new Date(Date.now() + 48 * 60 * 60 * 1000) // Expires in 48 hours
        );
        break;

      case 'spin-reminder':
        result = await sendSpinExpiryReminder(
          toEmail,
          75, // $75 prize
          'UDIG-SUPER75',
          new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    logger.info('✅ Test email sent successfully', {
      component: 'test-email-api',
      action: 'email_sent',
      metadata: {
        type,
        toEmail,
        sentBy: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${type} email sent to ${toEmail}`,
      result,
    });

  } catch (error) {
    logger.error('❌ Test email failed', {
      component: 'test-email-api',
      action: 'email_error',
    }, error as Error);

    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: (error as Error).message,
    }, { status: 500 });
  }
}

