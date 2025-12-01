import { sanitizeBookingID, sanitizeFilename } from '@/lib/input-sanitizer';
import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import { typedInsert } from '@/lib/supabase/typed-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const uploadSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format'),
});

/**
 * POST /api/upload-insurance
 * Upload insurance certificate to Supabase storage and create database record
 * Follows 8-step API route pattern
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Rate limiting (STRICT for file uploads)
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many upload attempts. Please wait before trying again.',
        },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Step 2: Request validation (multipart/form-data for file uploads)
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type must be multipart/form-data',
        },
        { status: 400 }
      );
    }

    // Validate request size (max 20MB for multipart)
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > 20 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: 'Request too large. Maximum size is 20MB.',
          },
          { status: 413 }
        );
      }
    }

    // Step 3: Authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized insurance upload attempt', {
        component: 'api-upload-insurance',
        action: 'unauthorized',
        metadata: { error: authError?.message },
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required to upload insurance documents.',
        },
        { status: 401 }
      );
    }

    // Step 4: Parse and validate FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bookingIdRaw = formData.get('bookingId') as string | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided. Please select a file to upload.',
        },
        { status: 400 }
      );
    }

    if (!bookingIdRaw) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking ID is required.',
        },
        { status: 400 }
      );
    }

    // Step 5: Input sanitization and Zod validation
    const sanitizedBookingId = sanitizeBookingID(bookingIdRaw);
    if (!sanitizedBookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking ID format.',
        },
        { status: 400 }
      );
    }

    const validated = uploadSchema.parse({ bookingId: sanitizedBookingId });

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Please upload a PDF, JPEG, or PNG file.',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeFilename(file.name);
    if (!sanitizedFileName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filename.',
        },
        { status: 400 }
      );
    }

    // Step 6: Business logic - Verify booking ownership
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, bookingNumber, customerId')
      .eq('id', validated.bookingId)
      .single();

    if (bookingError || !booking) {
      logger.warn('Booking not found for insurance upload', {
        component: 'api-upload-insurance',
        action: 'booking_not_found',
        metadata: {
          bookingId: validated.bookingId,
          userId: user.id,
          error: bookingError?.message,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found or you do not have permission to upload documents for this booking.',
        },
        { status: 404 }
      );
    }

    // Verify user owns the booking (or is admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';
    const ownsBooking = booking.customerId === user.id;

    if (!ownsBooking && !isAdmin) {
      logger.warn('Unauthorized insurance upload - user does not own booking', {
        component: 'api-upload-insurance',
        action: 'unauthorized_booking_access',
        metadata: {
          bookingId: validated.bookingId,
          userId: user.id,
          bookingCustomerId: booking.customerId,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to upload documents for this booking.',
        },
        { status: 403 }
      );
    }

    // Generate secure upload path using RPC function
    const { data: uploadPath, error: pathError } = await supabase.rpc(
      'generate_insurance_upload_path',
      {
        p_booking_id: validated.bookingId,
        p_file_name: sanitizedFileName,
      }
    );

    if (pathError || !uploadPath) {
      logger.error(
        'Failed to generate insurance upload path',
        {
          component: 'api-upload-insurance',
          action: 'path_generation_failed',
          metadata: {
            bookingId: validated.bookingId,
            fileName: sanitizedFileName,
            error: pathError?.message,
          },
        },
        pathError || new Error('Path generation returned null')
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate upload path. Please try again.',
        },
        { status: 500 }
      );
    }

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('insurance-documents')
      .upload(uploadPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      logger.error(
        'Failed to upload insurance document to storage',
        {
          component: 'api-upload-insurance',
          action: 'storage_upload_failed',
          metadata: {
            bookingId: validated.bookingId,
            fileName: sanitizedFileName,
            fileSize: file.size,
            fileType: file.type,
            uploadPath,
            error: uploadError.message,
          },
        },
        uploadError
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to upload file. Please try again.',
        },
        { status: 500 }
      );
    }

    // Generate document number
    const documentNumber = `INS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create database record
    const { data: documentData, error: dbError } = await typedInsert(
      supabase,
      'insurance_documents',
      {
        bookingId: validated.bookingId,
        documentNumber,
        fileName: sanitizedFileName,
        originalFileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileUrl: uploadPath,
        type: 'coi',
        status: 'pending',
      }
    ).select('id, documentNumber, fileName, status, createdAt')
      .single();

    if (dbError || !documentData) {
      logger.error(
        'Failed to create insurance document record',
        {
          component: 'api-upload-insurance',
          action: 'database_insert_failed',
          metadata: {
            bookingId: validated.bookingId,
            fileName: sanitizedFileName,
            uploadPath,
            error: dbError?.message,
          },
        },
        dbError || new Error('Database insert returned null')
      );

      // Attempt to delete uploaded file if database insert fails
      try {
        await supabase.storage.from('insurance-documents').remove([uploadPath]);
      } catch (cleanupError) {
        logger.error(
          'Failed to cleanup uploaded file after database error',
          {
            component: 'api-upload-insurance',
            action: 'cleanup_failed',
            metadata: {
              uploadPath,
              error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
            },
          },
          cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError))
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'File uploaded but failed to create record. Please contact support.',
        },
        { status: 500 }
      );
    }

    // Step 7: Structured logging
    logger.info('Insurance certificate uploaded successfully', {
      component: 'api-upload-insurance',
      action: 'upload_success',
      metadata: {
        documentId: documentData.id,
        bookingId: validated.bookingId,
        bookingNumber: booking.bookingNumber,
        fileName: sanitizedFileName,
        fileSize: file.size,
        fileType: file.type,
        uploadPath,
        userId: user.id,
      },
    });

    // Step 8: Return JSON response
    return NextResponse.json(
      {
      success: true,
      message: 'Insurance certificate uploaded successfully',
        document: {
          id: documentData.id,
          documentNumber: documentData.documentNumber,
          fileName: documentData.fileName,
          status: documentData.status,
          createdAt: documentData.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      logger.warn('Insurance upload validation error', {
        component: 'api-upload-insurance',
        action: 'validation_error',
        metadata: {
          errors: error.errors,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data. Please check your input and try again.',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    logger.error(
      'Insurance upload error',
      {
      component: 'api-upload-insurance',
        action: 'unexpected_error',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload insurance certificate. Please try again.',
      },
      { status: 500 }
    );
  }
}
