import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { generateBookingNumber } from '@/lib/utils';
import {
  BookingWizardCommitInput,
  bookingWizardCommitSchema,
  logisticsTaskInputSchema,
} from '@/lib/validators/admin/bookings';

function isSessionExpired(session: unknown): boolean {
  if (!session?.expires_at) return false;
  return new Date(session.expires_at).getTime() < Date.now();
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function buildPricingBreakdown(commit: BookingWizardCommitInput) {
  const overrideTotals = commit.overrideTotals ?? {};
  const pricing = commit.pricing ?? {};

  return {
    subtotal: overrideTotals.subtotal ?? commit.booking.subtotal ?? null,
    taxes: overrideTotals.taxes ?? commit.booking.taxes ?? null,
    total: overrideTotals.totalAmount ?? commit.booking.totalAmount ?? null,
    pricing,
    payment: commit.payment ?? null,
  };
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const commitData = bookingWizardCommitSchema.parse(body);

    const { data: session, error: sessionError } = await supabase
      .from('booking_wizard_sessions')
      .select('*')
      .eq('id', params.id)
      .maybeSingle();

    if (sessionError) {
      logger.error(
        'Failed to load booking wizard session for commit',
        {
          component: 'admin-bookings-wizard-commit',
          action: 'session_fetch_failed',
          metadata: { sessionId: params.id },
        },
        sessionError
      );
      return NextResponse.json(
        { error: 'Unable to commit booking wizard session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json({ error: 'Wizard session not found' }, { status: 404 });
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Wizard session already completed', bookingId: session.booking_id },
        { status: 409 }
      );
    }

    if (isSessionExpired(session)) {
      await supabase
        .from('booking_wizard_sessions')
        .update({ status: 'expired' })
        .eq('id', params.id);

      return NextResponse.json({ error: 'Wizard session expired' }, { status: 410 });
    }

    const bookingNumber = generateBookingNumber();
    const subtotal = commitData.overrideTotals?.subtotal ?? commitData.booking.subtotal ?? 0;
    const taxes = commitData.overrideTotals?.taxes ?? commitData.booking.taxes ?? 0;
    const totalAmount = commitData.overrideTotals?.totalAmount ?? commitData.booking.totalAmount;

    const deliveryAddress = commitData.booking.deliveryAddress;

    const depositAmount = commitData.payment?.depositAmount ?? null;
    const balanceDue =
      commitData.payment?.balanceDue ?? totalAmount - normalizeNumber(depositAmount ?? 0);

    const insertedBookingPayload: Record<string, unknown> = {
      bookingNumber,
      customerId: commitData.booking.customerId,
      equipmentId: commitData.booking.equipmentId,
      startDate: commitData.booking.startDate,
      endDate: commitData.booking.endDate,
      status: commitData.booking.status ?? 'pending',
      subtotal,
      taxes,
      totalAmount,
      deliveryAddress: deliveryAddress?.addressLine1 ?? null,
      deliveryCity: deliveryAddress?.city ?? null,
      deliveryProvince: deliveryAddress?.province ?? null,
      deliveryPostalCode: deliveryAddress?.postalCode ?? null,
      specialInstructions: commitData.booking.specialInstructions ?? null,
      internalNotes: commitData.booking.notes ?? null,
      couponCode: commitData.booking.couponCode ?? null,
      pricingBreakdown: buildPricingBreakdown(commitData),
      depositAmount,
      balanceDue,
      source: 'admin',
      lastModifiedBy: user?.id || 'unknown',
    };

    const { data: bookingRecord, error: insertError } = await supabase
      .from('bookings')
      .insert(insertedBookingPayload)
      .select()
      .single();

    if (insertError) {
      logger.error(
        'Failed to commit booking wizard session',
        {
          component: 'admin-bookings-wizard-commit',
          action: 'booking_insert_failed',
          metadata: { sessionId: params.id },
        },
        insertError
      );
      return NextResponse.json({ error: 'Unable to create booking from wizard' }, { status: 500 });
    }

    const notes = commitData.notes ?? [];
    if (notes.length > 0) {
      const noteRows = notes.map((note) => ({
        booking_id: bookingRecord.id,
        admin_id: user?.id || 'unknown',
        note: note.note,
        visibility: note.visibility,
      }));

      const { error: notesError } = await supabase.from('booking_notes').insert(noteRows);
      if (notesError) {
        logger.warn('Failed to insert booking notes during wizard commit', {
          component: 'admin-bookings-wizard-commit',
          action: 'notes_insert_failed',
          metadata: { bookingId: bookingRecord.id, error: notesError?.message },
        });
      }
    }

    const logisticsTasks = commitData.logisticsTasks ?? [];
    if (logisticsTasks.length > 0) {
      const taskRows = logisticsTasks.map((task: unknown) => {
        const parsed = logisticsTaskInputSchema.parse(task);
        return {
          booking_id: bookingRecord.id,
          task_type: parsed.taskType,
          status: parsed.driverId ? 'scheduled' : 'pending',
          scheduled_at: parsed.scheduledAt,
          address: parsed.address ?? null,
          driver_id: parsed.driverId ?? null,
          route_url: parsed.routeUrl ?? null,
          eta_minutes: parsed.etaMinutes ?? null,
          special_instructions: parsed.specialInstructions ?? null,
          notes: parsed.notes ?? null,
        };
      });

      const { error: logisticsError } = await supabase.from('logistics_tasks').insert(taskRows);

      if (logisticsError) {
        logger.warn('Failed to create logistics tasks during wizard commit', {
          component: 'admin-bookings-wizard-commit',
          action: 'logistics_insert_failed',
          metadata: { bookingId: bookingRecord.id, error: logisticsError?.message },
        });
      }
    }

    await supabase
      .from('booking_wizard_sessions')
      .update({ status: 'completed', booking_id: bookingRecord.id, payload: session.payload })
      .eq('id', params.id);

    logger.info('Booking wizard session committed', {
      component: 'admin-bookings-wizard-commit',
      action: 'booking_created',
      metadata: {
        sessionId: params.id,
        bookingId: bookingRecord.id,
        adminId: user?.id || 'unknown',
      },
    });

    return NextResponse.json({
      booking: bookingRecord,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error committing booking wizard',
      {
        component: 'admin-bookings-wizard-commit',
        action: 'unexpected_error',
        metadata: { sessionId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );

    return NextResponse.json(
      { error: 'Internal server error while committing booking wizard' },
      { status: 500 }
    );
  }
}
