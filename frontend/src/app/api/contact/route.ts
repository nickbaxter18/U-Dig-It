import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { sanitizeContactFormData, detectMaliciousInput } from '@/lib/input-sanitizer';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Contact form validation schema
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per minute per IP (prevents spam)
  const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: Math.ceil(((rateLimitResult.reset - Date.now())) / 1000),
      },
      {
        status: 429,
        headers: rateLimitResult.headers,
      }
    );
  }

  try {
    const body = await request.json();

    // Sanitize inputs first to prevent XSS/injection
    const sanitizedData = sanitizeContactFormData({
      name: `${body.firstName} ${body.lastName}`,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
    });

    // Validate the sanitized data
    const validatedData = contactSchema.parse({
      firstName: body.firstName,
      lastName: body.lastName,
      email: sanitizedData.email,
      phone: sanitizedData.phone,
      subject: sanitizedData.subject,
      message: sanitizedData.message,
    });

    // Check for malicious content
    const maliciousCheck = detectMaliciousInput(validatedData.message);
    if (maliciousCheck.isMalicious) {
      logger.error('Malicious content detected in contact form', {
        component: 'contact-api',
        action: 'malicious_content',
        metadata: { reason: maliciousCheck.reason },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid content detected' },
        { status: 400 }
      );
    }

    // Log the contact form submission (in production, you'd send this to your backend/database)
    logger.info('Contact form submission received', {
      component: 'contact-api',
      action: 'form_submission',
      metadata: {
        email: validatedData.email,
        subject: validatedData.subject,
        messageLength: validatedData.message.length,
      },
    });

    // In a real application, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Send confirmation email to customer

    // For now, we'll simulate a successful submission
    const response = {
      success: true,
      message: 'Thank you for your message! We will get back to you within 24 hours.',
      submissionId: `contact-${Date.now()}`,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error(
      'Contact form submission failed',
      {
        component: 'contact-api',
        action: 'form_submission_error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      },
      error instanceof Error ? error : undefined
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please check your form data and try again.',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while processing your request. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ message: 'Contact API endpoint is working' });
}
