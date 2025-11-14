#!/usr/bin/env node
/**
 * Cursor Action: Create Secure API Route
 * Usage: node scripts/cursor-actions/create-api-route.js <route-path> [method]
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const [routePath, method = 'POST'] = process.argv.slice(2);

if (!routePath) {
  console.error('Usage: create-api-route.js <route-path> [method]');
  console.error('Example: create-api-route.js bookings/create POST');
  process.exit(1);
}

const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
if (!validMethods.includes(method.toUpperCase())) {
  console.error(`Invalid method: ${method}. Must be one of: ${validMethods.join(', ')}`);
  process.exit(1);
}

// Convert route path to file path
const routeParts = routePath.split('/');
const routeDir = join(process.cwd(), 'frontend', 'src', 'app', 'api', ...routeParts);
const routeFile = join(routeDir, 'route.ts');

// Ensure directory exists
mkdirSync(routeDir, { recursive: true });

// Template for API route
const template = `import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { sanitizeBookingFormData } from '@/lib/input-sanitizer';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request schema
const requestSchema = z.object({
  // Add your schema fields here
});

export async function ${method.toUpperCase()}(request: NextRequest) {
  try {
    // 1. Request validation
    const validation = await validateRequest(request, {
      maxSize: 1024 * 1024, // 1MB
      allowedContentTypes: ['application/json']
    });
    if (!validation.valid) return validation.error!;

    // 2. Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded', { ip: request.ip });
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    ${method.toUpperCase() === 'GET' ? `// 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    // Add your query parameter handling here` : `// 4. Parse and sanitize body
    const body = await request.json();
    const sanitized = sanitizeBookingFormData(body);

    // 5. Validate schema
    const validated = requestSchema.parse(sanitized);`}

    // 6. Business logic
    // Add your logic here

    // 7. Success response
    logger.info('Request processed', {
      component: 'api-route',
      action: '${method.toUpperCase()}',
      route: '${routePath}',
      userId: user.id
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    logger.error('API route error', {
      component: 'api-route',
      route: '${routePath}',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`;

writeFileSync(routeFile, template);

console.log(`✅ API route created: ${routeFile}`);
console.log(`📝 Edit the file to add your route logic`);

// Optionally open in editor
try {
  execSync(`code ${routeFile}`, { stdio: 'ignore' });
} catch (e) {
  // VS Code not available, that's okay
}
