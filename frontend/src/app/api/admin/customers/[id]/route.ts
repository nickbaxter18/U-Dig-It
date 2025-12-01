import { z, ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';

// Schema for customer update
// Note: All fields are optional to allow partial updates
const customerUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
});

/**
 * PATCH /api/admin/customers/[id]
 * Update customer details (admin only)
 */
export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      // Parse and validate request body
      const body = await request.json();
      const validatedData = customerUpdateSchema.parse(body);

      // Check if any fields provided
      if (Object.keys(validatedData).length === 0) {
        return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
      }

      // Create service role client for privileged operations
      const supabaseAdmin = await createServiceClient();

      // Update customer with service role
      const { data, error: customerUpdateError } = await supabaseAdmin
        .from('users')
        .update(validatedData)
        .eq('id', params.id)
        .select('id, email, firstName, lastName, phone, companyName, address, city, province, postalCode')
        .single();

      if (customerUpdateError) {
        logger.error(
          'Failed to update customer',
          {
            component: 'admin-customers-api',
            action: 'update_error',
            metadata: { customerId: params.id, adminId: user?.id || 'unknown' },
          },
          customerUpdateError
        );
        return NextResponse.json(
          { error: 'Failed to update customer', details: customerUpdateError.message },
          { status: 500 }
        );
      }

      logger.info('Customer updated by admin', {
        component: 'admin-customers-api',
        action: 'customer_updated',
        metadata: {
          customerId: params.id,
          adminId: user?.id || 'unknown',
          updates: Object.keys(validatedData),
        },
      });

      return NextResponse.json({ data });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: err.issues },
          { status: 400 }
        );
      }

      logger.error(
        'Unexpected error in admin customers API',
        {
          component: 'admin-customers-api',
          action: 'unexpected_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);


