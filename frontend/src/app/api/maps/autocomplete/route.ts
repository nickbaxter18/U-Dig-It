import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { getGoogleMapsApiKey } from '@/lib/secrets/maps';

/**
 * API Route: Google Maps Places Autocomplete Proxy
 *
 * Proxies requests to Google Maps Places Autocomplete API to avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    // Load API key using secrets loader
    const GOOGLE_MAPS_API_KEY = await getGoogleMapsApiKey();

    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input || input.length < 3) {
      return NextResponse.json({ predictions: [] });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&components=country:ca&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    logger.error(
      'Autocomplete API error',
      {
        component: 'api-autocomplete',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
