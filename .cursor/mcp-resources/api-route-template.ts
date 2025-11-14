// Secure API Route Template
// Route: /api/{resource}
// Method: {GET|POST|PUT|DELETE|PATCH}
// Auth: Required
// Rate Limit: {rate_limit}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limiter';
import { RateLimitPresets } from '@/lib/rate-limiter';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/input-sanitizer';
import { logger } from '@/lib/logger';

// Request validation schema
const {request_schema} = z.object({
  // Add your schema fields here
  // field: z.string().min(1).max(100)
});

// Response type
type {Resource}Response = {
  // Add your response type here
};

export async function {METHOD}(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', {
        ip: request.ip,
        path: request.url
      });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 2. Authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized API access attempt', {
        path: request.url,
        ip: request.ip
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. Request validation (for POST/PUT/PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const body = await request.json();

      // Sanitize input
      const sanitized = sanitizeInput(body);

      // Validate schema
      const validationResult = {request_schema}.safeParse(sanitized);
      if (!validationResult.success) {
        logger.warn('Invalid request data', {
          errors: validationResult.error.errors,
          userId: user.id
        });
        return NextResponse.json(
          { error: 'Invalid request data', details: validationResult.error.errors },
          { status: 400 }
        );
      }

      // 4. Business logic
      // Add your business logic here

      // 5. Return response
      return NextResponse.json(
        { /* your response data */ },
        { status: 200 }
      );
    }

    // GET request handling
    // Add your GET logic here

    return NextResponse.json(
      { /* your response data */ },
      { status: 200 }
    );

  } catch (error) {
    logger.error('API route error', {
      path: request.url,
      method: request.method,
      error
    }, error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

