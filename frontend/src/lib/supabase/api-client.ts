import type { TablesInsert, TablesUpdate } from '@/../../supabase/types';

import { logger } from '@/lib/logger';

import { supabase } from './client';
import { typedInsert, typedUpdate } from './typed-helpers';

// Type-safe API client
export class SupabaseApiClient {
  // Equipment operations
  async getEquipment(id: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        'id, unitId, serialNumber, make, model, year, status, location, dailyRate, weeklyRate, monthlyRate, nextMaintenanceDue, lastMaintenanceDate, totalEngineHours, specifications, createdAt, updatedAt, type, description, replacementValue, overageHourlyRate, images, notes, hourly_rate, half_day_rate, minimum_rental_hours, dailyHourAllowance, weeklyHourAllowance'
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getEquipmentList(params?: {
    category?: string;
    available?: boolean;
    page?: number;
    limit?: number;
  }) {
    let query = supabase
      .from('equipment')
      .select(
        'id, unitId, serialNumber, make, model, year, status, location, dailyRate, weeklyRate, monthlyRate, nextMaintenanceDue, lastMaintenanceDate, totalEngineHours, specifications, createdAt, updatedAt, type, description, replacementValue, overageHourlyRate, images, notes, hourly_rate, half_day_rate, minimum_rental_hours, dailyHourAllowance, weeklyHourAllowance'
      );

    if (params?.category) {
      query = query.eq('type', params.category);
    }

    if (params?.available !== undefined) {
      query = query.eq('status', params.available ? 'available' : 'unavailable');
    }

    if (params?.limit) {
      query = query.limit(params.limit);
      if (params.page && params.page > 1) {
        query = query.range((params.page - 1) * params.limit, params.page * params.limit - 1);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || []; // Return empty array if null
  }

  // Check availability (most critical for rental platform)
  async checkAvailability(equipmentId: string, startDate: string, endDate: string) {
    try {
      // Direct query implementation since RPC might not be working
      const { data: conflictingBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, startDate, endDate')
        .eq('equipmentId', equipmentId)
        .neq('status', 'cancelled')
        .or(`startDate.lte.${endDate},endDate.gte.${startDate}`);

      if (bookingError) throw bookingError;

      const isAvailable = !conflictingBookings || conflictingBookings.length === 0;

      return {
        available: isAvailable,
        message: isAvailable
          ? 'Equipment is available for the selected dates'
          : 'Equipment is not available for these dates',
        alternatives: [], // TODO: implement alternative date suggestions
        pricing: {
          dailyRate: 450, // TODO: get from equipment table
          currency: 'CAD',
          taxes: 0.15,
        },
      };
    } catch (error) {
      logger.error(
        'Availability check error',
        {
          component: 'api-client',
          action: 'error',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  // Booking operations
  async createBooking(bookingData: TablesInsert<'bookings'>) {
    const { data, error } = await typedInsert(supabase, 'bookings', bookingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getBookings(filters?: { status?: string; userId?: string; page?: number; limit?: number }) {
    let query = supabase.from('bookings').select(`
        *,
        balance_amount,
        equipment:equipmentId (
          id,
          model,
          make,
          year,
          dailyRate,
          images
        ),
        customer:customerId (
          id,
          firstName,
          lastName,
          email
        )
      `);

    if (filters?.status) {
      // Type-safe status filter - status is a string that matches booking status enum
      query = query.eq('status', filters.status);
    }

    if (filters?.userId) {
      query = query.eq('customerId', filters.userId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
      if (filters.page && filters.page > 1) {
        query = query.range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);
      }
    }

    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Payment operations
  async createPayment(paymentData: TablesInsert<'payments'>) {
    const { data, error } = await typedInsert(supabase, 'payments', paymentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPayments(bookingId?: string) {
    let query = supabase
      .from('payments')
      .select(
        'id, amount, amountRefunded, stripePaymentIntentId, stripeCheckoutSessionId, processedAt, failedAt, failureReason, createdAt, updatedAt, refundedAt, refundReason, type, status, method, bookingId, paymentNumber, description, notes, stripeChargeId, stripeRefundId, stripeMetadata, webhookEvents, billingAddress'
      );

    if (bookingId) {
      query = query.eq('bookingId', bookingId);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return data;
  }

  // User operations
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  async updateUserProfile(userData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyName?: string;
  }) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    // Update auth.users metadata (this is what the profile page reads from)
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: userData,
    });

    if (updateError) throw updateError;

    // Also update public.users table for consistency
    const { error: publicUpdateError } = await typedUpdate(
      supabase,
      'users',
      userData as TablesUpdate<'users'>
    )
      .eq('id', user.id);

    // Don't throw error if public.users update fails (metadata is source of truth)
    if (publicUpdateError && process.env.NODE_ENV === 'development') {
      logger.error(
        'Failed to update public.users table:',
        {
          component: 'api-client',
          action: 'warning',
        },
        publicUpdateError instanceof Error
          ? publicUpdateError
          : new Error(String(publicUpdateError))
      );
    }

    return data.user;
  }

  // Contract operations
  async getContracts(bookingId?: string) {
    let query = supabase
      .from('contracts')
      .select(
        'id, bookingId, type, status, signedAt, signedDocumentUrl, createdAt, updatedAt, contractNumber, documentUrl, sentAt, sentForSignatureAt, completedAt, declinedAt, expiresAt, voidedAt, voidedBy, voidReason, notes, documentContent, signedDocumentContent, signedDocumentPath, documentId, documentMetadata, signatures, initialsCapture, auditTrail, legalVersions, docusignEnvelopeId, docusignData, opensign_envelope_id, opensign_document_id, opensign_status, opensign_data, equipment_rider_url, equipment_rider_signed_url, equipment_rider_data'
      );

    if (bookingId) {
      query = query.eq('bookingId', bookingId);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Insurance operations
  async getInsuranceDocuments(bookingId?: string) {
    let query = supabase
      .from('insurance_documents')
      .select(
        'id, bookingId, type, status, fileUrl, createdAt, updatedAt, documentNumber, fileName, originalFileName, fileSize, mimeType, policyNumber, insuranceCompany, effectiveDate, expiresAt, reviewedAt, reviewedBy, reviewNotes, description, deductible, equipmentLimit, generalLiabilityLimit, additionalInsuredIncluded, lossPayeeIncluded, waiverOfSubrogationIncluded, extractedData, validationResults, metadata'
      );

    if (bookingId) {
      query = query.eq('bookingId', bookingId);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Health check
  async healthCheck() {
    const { data: _data, error } = await supabase.from('equipment').select('id').limit(1);

    if (error) throw error;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
}

// Export singleton instance
export const supabaseApi = new SupabaseApiClient();
