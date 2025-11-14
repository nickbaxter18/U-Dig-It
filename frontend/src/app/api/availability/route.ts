import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { supabaseApi } from '@/lib/supabase/api-client';
import { handleSupabaseError } from '@/lib/supabase/error-handler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Rate limiting: 30 requests per minute per IP (prevents DoS attacks)
  const rateLimitResult = await rateLimit(request, RateLimitPresets.MODERATE);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many availability checks. Please wait before trying again.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: rateLimitResult.headers,
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const equipmentId = searchParams.get('equipmentId');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    // ✅ BULLETPROOF FIX: Get equipment without status filter
    // Equipment status reflects CURRENT availability, not future bookings!
    // We'll check date-specific availability separately
    const equipment = await supabaseApi.getEquipmentList({
      limit: 1,
      // ❌ REMOVED: available: true - This blocks future bookings!
    });

    if (!equipment || equipment.length === 0) {
      return NextResponse.json({
        equipmentId: equipmentId || 'kubota-svl75',
        startDate,
        endDate,
        available: false,
        message: 'No equipment configured. Please contact support.',
        alternatives: [],
        pricing: {
          dailyRate: 450,
          currency: 'CAD',
          taxes: 0.15,
        },
      });
    }

    // Type-safe equipment access - equipment is guaranteed to exist here
    const equipmentDetails = equipment[0] as any; // Type assertion for Supabase data
    const targetEquipmentId = equipmentId || equipmentDetails?.id;

    if (!targetEquipmentId) {
      return NextResponse.json({ error: 'No equipment ID available' }, { status: 404 });
    }

    // Check availability using Supabase
    const availabilityResult = await supabaseApi.checkAvailability(
      targetEquipmentId,
      startDate,
      endDate
    );

    const availabilityData = {
      equipmentId: targetEquipmentId,
      startDate,
      endDate,
      available: availabilityResult.available,
      message: availabilityResult.available
        ? 'Equipment is available for the selected dates'
        : availabilityResult.message ||
          'Equipment is not available for these dates. Please select different dates.',
      alternatives: availabilityResult.alternatives || [],
      pricing: {
        dailyRate: equipmentDetails.dailyRate || 450,
        weeklyRate: equipmentDetails.weeklyRate || 2500,
        monthlyRate: equipmentDetails.monthlyRate || 8000,
        currency: 'CAD',
        taxes: 0.15, // 15% HST
        overageHourlyRate: equipmentDetails.overageHourlyRate || 50,
      },
    };

    return NextResponse.json(availabilityData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    });
  } catch (error) {
    logger.error('Availability check error', {
      component: 'api-availability',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    }, error instanceof Error ? error : undefined);
    const supabaseError = handleSupabaseError(error);
    return NextResponse.json(
      {
        error: supabaseError.message || 'Failed to check availability',
        available: false,
        alternatives: [],
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
