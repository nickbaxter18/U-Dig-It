import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SearchFilters {
  query?: string;
  equipmentType?: string;
  make?: string;
  model?: string;
  status?: string;
  location?: string;
  minDailyRate?: number;
  maxDailyRate?: number;
  minWeeklyRate?: number;
  maxWeeklyRate?: number;
  minMonthlyRate?: number;
  maxMonthlyRate?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface SearchResults {
  data: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function POST(request: NextRequest) {
  try {
    const filters: SearchFilters = await request.json();
    const supabase = await createClient();

    // Extract pagination parameters
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Start building the query
    let query = supabase
      .from('equipment')
      .select(
        'id, model, year, make, description, notes, unitId, serialNumber, replacementValue, dailyRate, weeklyRate, monthlyRate, overageHourlyRate, dailyHourAllowance, weeklyHourAllowance, lastMaintenanceDate, nextMaintenanceDue, totalEngineHours, createdAt, updatedAt, type, specifications, status, attachments, location, images, documents, rider_template_id',
        { count: 'exact' }
      );

    // Apply search query filter (searches across multiple fields)
    if (filters.query) {
      query = query.or(
        `unitId.ilike.%${filters.query}%,` +
          `make.ilike.%${filters.query}%,` +
          `model.ilike.%${filters.query}%,` +
          `equipmentType.ilike.%${filters.query}%,` +
          `location.ilike.%${filters.query}%`
      );
    }

    // Apply individual filters
    if (filters.equipmentType) {
      query = query.eq('equipmentType', filters.equipmentType);
    }

    if (filters.make) {
      query = query.eq('make', filters.make);
    }

    if (filters.model) {
      query = query.eq('model', filters.model);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.location) {
      query = query.eq('location', filters.location);
    }

    // Apply rate filters
    if (filters.minDailyRate !== undefined) {
      query = query.gte('dailyRate', filters.minDailyRate);
    }

    if (filters.maxDailyRate !== undefined) {
      query = query.lte('dailyRate', filters.maxDailyRate);
    }

    if (filters.minWeeklyRate !== undefined) {
      query = query.gte('weeklyRate', filters.minWeeklyRate);
    }

    if (filters.maxWeeklyRate !== undefined) {
      query = query.lte('weeklyRate', filters.maxWeeklyRate);
    }

    if (filters.minMonthlyRate !== undefined) {
      query = query.gte('monthlyRate', filters.minMonthlyRate);
    }

    if (filters.maxMonthlyRate !== undefined) {
      query = query.lte('monthlyRate', filters.maxMonthlyRate);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'unitId';
    const sortOrder = filters.sortOrder || 'ASC';
    query = query.order(sortBy, { ascending: sortOrder === 'ASC' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      logger.error(
        'Equipment search error',
        {
          component: 'api-search',
          action: 'error',
          metadata: { error: error.message },
        },
        error
      );
      return NextResponse.json(
        { error: 'Failed to search equipment', details: error.message },
        { status: 500 }
      );
    }

    // Calculate total pages
    const totalPages = count ? Math.ceil(count / limit) : 0;

    const results: SearchResults = {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json(results);
  } catch (error) {
    logger.error(
      'Equipment search request error',
      {
        component: 'api-search',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: 'Invalid search request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
