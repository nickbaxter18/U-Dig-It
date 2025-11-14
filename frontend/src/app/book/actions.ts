'use server';

import { sendBookingConfirmationEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';
import { supabaseApi } from '@/lib/supabase/api-client';
import { z } from 'zod';

// Validation schema for booking form
const bookingSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  deliveryCity: z.string().min(1, 'City is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerName: z.string().min(1, 'Customer name is required'),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

const DELIVERY_FEES: Record<string, number> = {
  'Saint John': 300, // $150 each way
  Rothesay: 320, // $160 each way
  Quispamsis: 350, // $175 each way
  'Grand Bay-Westfield': 350, // $175 each way
  Hampton: 380, // $190 each way
  Other: 400, // $200 each way
};

interface BookingResult {
  success: boolean;
  bookingNumber?: string;
  error?: string;
  pricing?: {
    dailyRate: number;
    days: number;
    subtotal: number;
    taxes: number;
    floatFee: number;
    total: number;
  };
}

// Server Action for creating a booking
export async function createBooking(formData: FormData): Promise<BookingResult> {
  try {
    // Extract and validate form data
    const rawData = {
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      deliveryAddress: formData.get('deliveryAddress') as string,
      deliveryCity: formData.get('deliveryCity') as string,
      customerEmail: formData.get('customerEmail') as string,
      customerName: formData.get('customerName') as string,
    };

    const validatedData = bookingSchema.parse(rawData);

    // Validate date logic
    const startDateObj = new Date(validatedData.startDate);
    const endDateObj = new Date(validatedData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateObj < today) {
      return {
        success: false,
        error: 'Start date must be today or later',
      };
    }

    if (endDateObj <= startDateObj) {
      return {
        success: false,
        error: 'End date must be after start date',
      };
    }

    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 365) {
      return {
        success: false,
        error: 'Maximum rental period is 1 year',
      };
    }

    // ✅ BULLETPROOF FIX: Get equipment without status filter
    // Equipment status reflects CURRENT availability, not future bookings!
    // We'll check date-specific availability separately
    const equipmentList = await supabaseApi.getEquipmentList({
      limit: 1,
      // ❌ REMOVED: available: true - This blocks future bookings!
    });

    if (!equipmentList || equipmentList.length === 0) {
      return {
        success: false,
        error: 'No equipment configured. Please contact support.',
      };
    }

    const equipment = equipmentList[0] as any;
    const equipmentId = equipment?.id;

    // Check availability for the selected dates
    const availabilityResponse = await supabaseApi.checkAvailability(
      equipmentId,
      validatedData.startDate,
      validatedData.endDate
    );

    if (!availabilityResponse.available) {
      return {
        success: false,
        error: 'Equipment is not available for these dates. Please select different dates.',
      };
    }

    // Calculate pricing based on equipment rates
    const dailyRate = equipment.dailyRate || 450;
    const subtotal = dailyRate * diffDays;
    const floatFee = validatedData.deliveryCity
      ? (DELIVERY_FEES[validatedData.deliveryCity] ?? 150)
      : 0;
    // Tax should be calculated on subtotal + floatFee (equipment + transport)
    const subtotalBeforeTax = subtotal + floatFee;
    const taxes = subtotalBeforeTax * 0.15; // 15% HST
    const total = subtotalBeforeTax + taxes;

    // Create booking via Supabase
    const booking = await supabaseApi.createBooking({
      bookingNumber: `BK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      equipmentId,
      customerId: 'temp-customer-id', // This should come from authenticated user
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      deliveryAddress: validatedData.deliveryAddress,
      deliveryCity: validatedData.deliveryCity,
      dailyRate,
      weeklyRate: dailyRate * 5, // 5 days per week
      monthlyRate: dailyRate * 20, // 20 days per month
      subtotal,
      taxes,
      floatFee,
      deliveryFee: floatFee,
      totalAmount: total,
      securityDeposit: 500, // Standard deposit
      status: 'pending' as const,
      type: 'delivery' as const,
    });

    // Send confirmation emails
      try {
        const emailData = {
          bookingNumber: (booking as any)?.bookingNumber,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        equipmentName: 'Kubota SVL-75 Compact Track Loader',
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        total: total,
        deliveryAddress: `${validatedData.deliveryAddress}, ${validatedData.deliveryCity}`,
        status: 'confirmed' as const,
      };

      // Send customer confirmation email
      await sendBookingConfirmationEmail(
        {
          id: (booking as any).id,
          bookingNumber: (booking as any).bookingNumber,
          startDate: validatedData.startDate,
          endDate: validatedData.endDate,
          totalAmount: total,
        },
        {
          email: validatedData.customerEmail,
          firstName: validatedData.customerName.split(' ')[0] || validatedData.customerName,
          lastName: validatedData.customerName.split(' ').slice(1).join(' ') || '',
        }
      );

      // Note: sendAdminNotification doesn't exist as an export, commenting out for now
      // TODO: Add admin notification email function if needed
    } catch (emailError) {
      logger.error('Email sending failed', {
        component: 'app-actions',
        action: 'error',
        metadata: { error: emailError instanceof Error ? emailError.message : String(emailError) },
      }, emailError instanceof Error ? emailError : undefined);
      // Don't fail the booking if email fails
    }

    // Revalidate cache tags to update availability - disabled for now
    // TODO: Fix revalidateTag signature issue
    // revalidateTag('equipment-availability');
    // revalidateTag(`equipment-${validatedData.startDate}-${validatedData.endDate}`);

    return {
      success: true,
      bookingNumber: (booking as any)?.bookingNumber,
      pricing: {
        dailyRate,
        days: diffDays,
        subtotal,
        taxes,
        floatFee,
        total,
      },
    };
  } catch (error) {
    logger.error('Booking creation error', {
      component: 'app-actions',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) }
    }, error instanceof Error ? error : undefined);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Please check your form data and try again.',
      };
    }

    return {
      success: false,
      error: 'Failed to create booking. Please try again.',
    };
  }
}

// Server Action for checking equipment availability
export async function checkAvailability(startDate: string, endDate: string) {
  'use server';

  try {
    // ✅ BULLETPROOF FIX: Get equipment without status filter
    // Equipment status reflects CURRENT availability, not future bookings!
    // We'll check date-specific availability separately
    const equipment = await supabaseApi.getEquipmentList({
      limit: 1,
      // ❌ REMOVED: available: true - This blocks future bookings!
    });

    if (!equipment || equipment.length === 0) {
      return {
        available: false,
        message: 'No equipment configured. Please contact support.',
      };
    }

    const equipmentId = (equipment[0] as any)?.id;

    // Check availability for the selected dates
    const availabilityResponse = await supabaseApi.checkAvailability(
      equipmentId,
      startDate,
      endDate
    );

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Availability response', {
        component: 'app-actions',
        action: 'debug',
        metadata: { availabilityResponse },
      });
    }

    return {
      available: availabilityResponse.available,
      message: availabilityResponse.available
        ? 'Equipment is available for these dates'
        : 'Equipment is not available for these dates. Please select different dates.',
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Availability check error', {
        component: 'app-actions',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) }
      }, error instanceof Error ? error : undefined);
    }
    return {
      available: false,
      message: 'Unable to check availability. Please try again.',
    };
  }
}
