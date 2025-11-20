import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/equipment/search/filters
 * Returns available filter options for equipment search
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all equipment to extract unique filter values
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select('make, model, type, status, location')
      .order('make');

    if (error) {
      logger.error(
        '[Equipment Search API] Database error',
        {
          component: 'api-filters',
          action: 'error',
          metadata: { error: error.message },
        },
        error
      );
      return NextResponse.json(
        { error: 'Failed to fetch equipment filters', details: error.message },
        { status: 500 }
      );
    }

    // Extract unique values for each filter
    const makes = [...new Set(equipment?.map((e) => e.make).filter(Boolean))] as string[];
    const models = [...new Set(equipment?.map((e) => e.model).filter(Boolean))] as string[];
    const types = [...new Set(equipment?.map((e) => e.type).filter(Boolean))] as string[];
    const statuses = [...new Set(equipment?.map((e) => e.status).filter(Boolean))] as string[];

    // Extract locations (assuming location is stored as JSON with address/city fields)
    const cities = [
      ...new Set(
        equipment
          ?.map((e) => {
            if (e.location && typeof e.location === 'object') {
              return (e.location as any).city;
            }
            return null;
          })
          .filter(Boolean)
      ),
    ] as string[];

    return NextResponse.json({
      filters: {
        makes: makes.sort(),
        models: models.sort(),
        types: types.sort(),
        statuses: statuses.sort(),
        locations: cities.sort(),
      },
      total: equipment?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    logger.error(
      '[Equipment Search API] Unexpected error',
      {
        component: 'api-filters',
        action: 'error',
        metadata: { error: error.message },
      },
      error
    );
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
