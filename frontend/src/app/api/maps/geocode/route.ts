import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

// ✅ SECURE: API key loaded from environment variable (never commit!)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * API Route: Google Maps Geocoding Proxy
 *
 * Proxies requests to Google Maps Geocoding API to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key is configured
    if (!GOOGLE_MAPS_API_KEY) {
      logger.error('Google Maps API key not configured', {
        component: 'api-geocode',
        action: 'missing_api_key',
      });
      return NextResponse.json(
        { error: 'Maps service unavailable' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');

    if (!placeId) {
      return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(
        placeId
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Geocoding API error', {
      component: 'api-geocode',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) }
    }, error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Failed to geocode location' }, { status: 500 });
  }
}
