import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { validateRequest } from '@/lib/request-validator';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Google Maps Distance Matrix API Proxy
 *
 * Calculates actual DRIVING distance and duration between two locations
 * using Google Maps Distance Matrix API (not straight-line Haversine).
 *
 * This ensures accurate delivery pricing based on real road distances.
 */

// ✅ SECURE: API key loaded from environment variable (never commit!)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const YARD_LOCATION = '945 Golden Grove Road, Saint John, NB E2H 2X1, Canada';

export async function GET(request: NextRequest) {
  // 1. Validate API key is configured
  if (!GOOGLE_MAPS_API_KEY) {
    logger.error('Google Maps API key not configured', {
      component: 'distance-api',
      action: 'missing_api_key',
    });
    return NextResponse.json(
      { error: 'Maps service unavailable' },
      { status: 503 }
    );
  }

  // 2. Request validation
  const validation = await validateRequest(request, {
    maxSize: 1024, // 1 KB max
    allowedContentTypes: ['application/json', 'text/html'],
  });
  if (!validation.valid) return validation.error!;

  // 3. Rate limiting (moderate for distance checks)
  const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  // 4. Extract parameters
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');

  if (!destination) {
    return NextResponse.json(
      { error: 'Missing destination parameter' },
      { status: 400 }
    );
  }

  try {
    // 5. Call Google Maps Distance Matrix API optimized for SHORTEST distance
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', YARD_LOCATION);
    url.searchParams.append('destinations', destination);
    url.searchParams.append('mode', 'driving'); // DRIVING distance, not straight-line
    url.searchParams.append('units', 'metric'); // Kilometers

    // IMPORTANT: DO NOT use traffic_model or departure_time
    // Without these, Google Maps defaults to SHORTEST DISTANCE route (not fastest time)
    // This ensures customers get the best price by using the shortest available route

    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    logger.debug('Calling Google Maps Distance Matrix API', {
      component: 'distance-api',
      action: 'api_call',
      metadata: { destination },
    });

    const response = await fetch(url.toString());
    const data = await response.json();

    // 6. Handle API errors
    if (data.status !== 'OK') {
      logger.error('Distance Matrix API error', {
        component: 'distance-api',
        action: 'error',
        metadata: { status: data.status, errorMessage: data.error_message },
      });

      return NextResponse.json(
        {
          error: 'Unable to calculate distance',
          details: data.error_message || data.status,
        },
        { status: 500 }
      );
    }

    // 7. Extract distance and duration
    const element = data.rows[0]?.elements[0];

    if (!element || element.status !== 'OK') {
      logger.warn('No route found', {
        component: 'distance-api',
        action: 'warning',
        metadata: { destination, status: element?.status },
      });

      return NextResponse.json(
        {
          error: 'No route found to destination',
          status: element?.status || 'UNKNOWN',
        },
        { status: 400 }
      );
    }

    // 8. Return driving distance and duration
    const distanceMeters = element.distance.value; // meters
    const distanceKm = distanceMeters / 1000; // convert to km
    const durationSeconds = element.duration.value; // seconds

    logger.info('Distance calculated successfully', {
      component: 'distance-api',
      action: 'success',
      metadata: {
        destination,
        distanceKm: distanceKm.toFixed(2),
        durationMinutes: Math.round(durationSeconds / 60),
      },
    });

    return NextResponse.json({
      status: 'OK',
      origin: YARD_LOCATION,
      destination: data.destination_addresses[0],
      distance: {
        meters: distanceMeters,
        kilometers: distanceKm,
        text: element.distance.text,
      },
      duration: {
        seconds: durationSeconds,
        minutes: Math.round(durationSeconds / 60),
        text: element.duration.text,
      },
    });
  } catch (error) {
    logger.error('Distance calculation error', {
      component: 'distance-api',
      action: 'error',
      metadata: { destination },
    }, error instanceof Error ? error : undefined);

    return NextResponse.json(
      { error: 'Failed to calculate distance' },
      { status: 500 }
    );
  }
}

