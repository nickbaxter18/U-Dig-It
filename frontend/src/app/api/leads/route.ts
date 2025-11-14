import { NextRequest, NextResponse } from 'next/server';
import { sendLeadMagnetEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Send the lead magnet email
    await sendLeadMagnetEmail(email);

    return NextResponse.json({ message: 'Lead magnet sent successfully' }, { status: 200 });
  } catch (error) {
    logger.error('Lead capture error', {
      component: 'api-leads',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) }
    }, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Failed to send lead magnet' }, { status: 500 });
  }
}
