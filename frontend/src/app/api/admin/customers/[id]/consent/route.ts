import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { customerConsentPatchSchema } from '@/lib/validators/admin/customers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data, error: fetchError } = await supabase
      .from('customer_consent')
      .select('*')
      .eq('customer_id', params.id);

    if (fetchError) {
      logger.error(
        'Failed to fetch customer consent records',
        {
          component: 'admin-customer-consent',
          action: 'fetch_failed',
          metadata: { customerId: params.id },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Unable to load customer consent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ consent: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching customer consent',
      {
        component: 'admin-customer-consent',
        action: 'fetch_unexpected',
        metadata: { customerId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = customerConsentPatchSchema.parse(await request.json());

    const now = new Date().toISOString();
    const { data, error: upsertError } = await supabase
      .from('customer_consent')
      .upsert({
        customer_id: params.id,
        channel: payload.channel,
        enabled: payload.enabled,
        granted_at: payload.enabled ? now : null,
        revoked_at: payload.enabled ? null : now,
        source: payload.source ?? 'admin_update',
        updated_at: now,
      })
      .select()
      .single();

    if (upsertError) {
      logger.error(
        'Failed to update customer consent',
        {
          component: 'admin-customer-consent',
          action: 'update_failed',
          metadata: { customerId: params.id, channel: payload.channel, adminId: user.id },
        },
        upsertError
      );
      return NextResponse.json(
        { error: 'Unable to update consent preference' },
        { status: 500 }
      );
    }

    logger.info('Customer consent updated', {
      component: 'admin-customer-consent',
      action: 'consent_updated',
      metadata: { customerId: params.id, channel: payload.channel, adminId: user.id },
    });

    return NextResponse.json({ consent: data });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error updating customer consent',
      {
        component: 'admin-customer-consent',
        action: 'update_unexpected',
        metadata: { customerId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


