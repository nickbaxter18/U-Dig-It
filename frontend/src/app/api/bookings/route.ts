import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { handleSupabaseError } from '@/lib/supabase/error-handler';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import {
  detectMaliciousInput,
  sanitizeAddress,
  sanitizeBookingID,
  sanitizeEmail,
  sanitizeNumber,
  sanitizePhone,
  sanitizePostalCode,
  sanitizeTextInput,
} from '@/lib/input-sanitizer';
import { validateRequest } from '@/lib/request-validator';
import {
  calculateBookingPricing,
  calculateDeliveryFee,
  calculateRentalDays,
} from '@/lib/booking/pricing';
import type { TablesInsert } from '@/../../supabase/types';

const MAX_RENTAL_DAYS = 365;
const MAX_NOTES_LENGTH = 2000;
const CANCELLATION_FEE_DEFAULT = 0;

const bookingSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  customerInfo: z
    .object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      email: z.string().email('Invalid email address'),
      phone: z.string().min(1, 'Phone number is required'),
      company: z.string().optional(),
    })
    .optional(),
  deliveryAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    province: z.string().min(1, 'Province is required'),
    distanceKm: z.number().min(0).max(500).optional(),
  }),
  notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  addons: z
    .object({
      includeInsurance: z.boolean().optional(),
      includeOperator: z.boolean().optional(),
    })
    .optional(),
  coupon: z
    .object({
      code: z.string().min(1),
      type: z.enum(['percentage', 'fixed']),
      value: z.number().positive(),
    })
    .optional(),
  idempotencyKey: z.string().max(100).optional(),
});

type BookingPayload = z.infer<typeof bookingSchema>;

interface SanitizedBookingPayload extends BookingPayload {
  equipmentId: string;
  startDate: string;
  endDate: string;
  deliveryAddress: BookingPayload['deliveryAddress'] & { distanceKm?: number };
  notes?: string;
}

export async function POST(request: NextRequest) {
  // Rate limiting: 10 requests per minute per IP (prevents booking abuse)
  const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: 'Too many booking attempts. Please wait before trying again.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: rateLimitResult.headers,
      }
    );
  }

  try {
    const requestValidation = await validateRequest(request.clone(), {
      maxSize: 128 * 1024, // 128KB for booking payloads
      allowedContentTypes: ['application/json'],
    });

    if (!requestValidation.valid) {
      return requestValidation.error!;
    }

    const parsedBody = bookingSchema.parse(rawBody) as BookingPayload;
    const sanitized = sanitizeBookingPayload(parsedBody);

    const startDate = new Date(sanitized.startDate);
    const endDate = new Date(sanitized.endDate);

    validateDates(startDate, endDate);

    const rentalDays = calculateRentalDays(startDate, endDate);
    if (rentalDays > MAX_RENTAL_DAYS) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum rental duration is ${MAX_RENTAL_DAYS} days`,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to create a booking.' },
        { status: 401 }
      );
    }

    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(
        'id, model, dailyRate, weeklyRate, monthlyRate, overageHourlyRate, dailyHourAllowance, weeklyHourAllowance'
      )
      .eq('id', sanitized.equipmentId)
      .single();

    if (equipmentError || !equipment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Equipment not found. Please select a valid equipment.',
        },
        { status: 404 }
      );
    }

    const { data: conflictingBookings, error: availabilityError } = await supabase
      .from('bookings')
      .select('id, startDate, endDate')
      .eq('equipmentId', equipment.id)
      .not('status', 'in', '("cancelled","rejected","no_show")')
      .or(
        `and(startDate.lte.${sanitized.endDate},endDate.gte.${sanitized.startDate})`
      );

    if (availabilityError) {
      throw availabilityError;
    }

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Equipment is not available for the selected dates.',
          conflicts: conflictingBookings,
        },
        { status: 409 }
      );
    }

    const pricing = calculateBookingPricing({
      equipment: {
        dailyRate: Number(equipment.dailyRate ?? 0),
        weeklyRate:
          Number(equipment.weeklyRate ?? 0) || Number(equipment.dailyRate ?? 0) * 5,
        monthlyRate:
          Number(equipment.monthlyRate ?? 0) || Number(equipment.dailyRate ?? 0) * 20,
        overageHourlyRate: Number(equipment.overageHourlyRate ?? 0),
        dailyHourAllowance: equipment.dailyHourAllowance ?? 8,
        weeklyHourAllowance: equipment.weeklyHourAllowance ?? 40,
      },
      startDate,
      endDate,
      delivery: {
        city: sanitized.deliveryAddress.city,
        distanceKm: sanitized.deliveryAddress.distanceKm ?? null,
      },
      includeInsurance: sanitized.addons?.includeInsurance,
      includeOperator: sanitized.addons?.includeOperator,
      coupon: sanitized.coupon
        ? { type: sanitized.coupon.type, value: sanitized.coupon.value }
        : undefined,
    });

    const bookingData = buildBookingInsert({
      sanitized,
      pricing,
      equipmentId: equipment.id,
      userId: user.id,
    });

    const { data: insertedBooking, error: insertError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('id, bookingNumber, status, totalAmount, startDate, endDate, deliveryCity')
      .single();

    if (insertError) {
      throw insertError;
    }

    logger.info('Booking created', {
      component: 'api-bookings',
      action: 'create',
      metadata: {
        bookingId: insertedBooking.id,
        equipmentId: equipment.id,
        customerId: user.id,
        total: pricing.total,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Booking request submitted successfully!',
        bookingRef: insertedBooking.bookingNumber,
        pricing: {
          days: pricing.days,
          subtotal: pricing.subtotal,
          taxes: pricing.taxes,
          deliveryFee: pricing.deliveryFee,
          total: pricing.total,
          deposit: pricing.deposit,
        },
        availability: {
          available: true,
        },
        nextSteps: [
          'Check your email for booking confirmation',
          'Upload your Certificate of Insurance',
          'Complete the security deposit payment',
          'Sign the rental agreement electronically',
        ],
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    logger.error('Booking error', { component: 'api-bookings', action: 'error', metadata: { error: error instanceof Error ? error.message : String(error) } }, error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please check your booking information and try again.',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    const supabaseError = handleSupabaseError(error);
    return NextResponse.json(
      {
        success: false,
        message:
          supabaseError.message ||
          'An error occurred while processing your booking. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ message: 'Bookings API endpoint is working' });
}
