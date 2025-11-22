import { randomUUID } from 'crypto';
import { ZodError } from 'zod';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  equipmentMediaCreateSchema,
  equipmentMediaDeleteSchema,
} from '@/lib/validators/admin/equipment';

const BUCKET_ID = 'equipment-media';

function buildStoragePath(equipmentId: string, fileName: string) {
  // Sanitize filename: remove spaces, keep only safe characters
  const sanitized = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
  // Build path: equipmentId/uuid-sanitized-filename
  const path = `${equipmentId}/${randomUUID()}-${sanitized}`;
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Built storage path', {
      component: 'admin-equipment-media',
      metadata: { equipmentId, fileName, sanitized, path },
    });
  }
  return path;
}

export const GET = withRateLimit(
  RateLimitPresets.MODERATE,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const resolvedParams = await Promise.resolve(params);
      const equipmentId = resolvedParams.id;

      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      // Use service client to bypass RLS since we've already verified admin access
      // Service client loads service role key from Supabase secrets or system_config
      const supabaseAdmin = await createServiceClient();
      if (!supabaseAdmin) {
        logger.error('Service client not available for fetching equipment media', {
          component: 'admin-equipment-media',
          action: 'service_client_missing',
          metadata: { equipmentId },
        });
        return NextResponse.json(
          { error: 'Service configuration error - service role key not available' },
          { status: 500 }
        );
      }

      // Get pagination parameters
      const { searchParams } = new URL(request.url);
      const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
      const pageSize = Math.min(
        Math.max(parseInt(searchParams.get('pageSize') || '50', 10), 1),
        100
      );
      const rangeStart = (page - 1) * pageSize;
      const rangeEnd = rangeStart + pageSize - 1;

      const {
        data,
        error: fetchError,
        count,
      } = await supabaseAdmin
        .from('equipment_media')
        .select(
          `
          id,
          equipment_id,
          media_type,
          storage_path,
          caption,
          metadata,
          is_primary,
          uploaded_by,
          uploaded_at,
          created_at,
          updated_at
        `,
          { count: 'exact' }
        )
        .eq('equipment_id', equipmentId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);

      if (fetchError) {
        logger.error(
          'Failed to fetch equipment media',
          {
            component: 'admin-equipment-media',
            action: 'fetch_failed',
            metadata: { equipmentId },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load equipment media' }, { status: 500 });
      }

      // Generate signed URLs for images and videos
      const mediaWithUrls = await Promise.all(
        (data ?? []).map(async (item) => {
          // Only generate URLs for images and videos
          if (item.media_type !== 'image' && item.media_type !== 'video') {
            // Debug log removed to reduce noise
            return { ...item, url: undefined };
          }

          if (!item.storage_path) {
            logger.warn('Media item missing storage_path', {
              component: 'admin-equipment-media',
              metadata: { mediaId: item.id, equipmentId },
            });
            return { ...item, url: undefined };
          }

          // Try to generate signed URL directly - if file doesn't exist, this will fail
          // We'll catch the error and mark as fileMissing

          // Generate signed URL
          try {
            // Debug log removed to reduce noise

            const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
              .from(BUCKET_ID)
              .createSignedUrl(item.storage_path, 3600);

            if (signedUrlError || !signedUrlData?.signedUrl) {
              logger.warn('Failed to create signed URL for equipment media', {
                component: 'admin-equipment-media',
                action: 'signed_url_failed',
                metadata: {
                  equipmentId,
                  mediaId: item.id,
                  storagePath: item.storage_path,
                  error: signedUrlError?.message || 'No signed URL returned',
                  errorCode: signedUrlError?.statusCode,
                  errorName: signedUrlError?.name,
                  errorDetails: JSON.stringify(signedUrlError),
                },
              });
              return { ...item, url: undefined, fileMissing: true };
            }

            // Debug log removed to reduce noise

            return { ...item, url: signedUrlData.signedUrl };
          } catch (err) {
            logger.warn('Error generating signed URL', {
              component: 'admin-equipment-media',
              action: 'signed_url_error',
              metadata: {
                equipmentId,
                mediaId: item.id,
                storagePath: item.storage_path,
                error: err instanceof Error ? err.message : String(err),
                errorStack: err instanceof Error ? err.stack : undefined,
              },
            });
            return { ...item, url: undefined, fileMissing: true };
          }
        })
      );

      return NextResponse.json({
        media: mediaWithUrls,
        pagination: {
          page,
          pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / pageSize),
        },
      });
    } catch (err) {
      logger.error(
        'Unexpected error fetching equipment media',
        {
          component: 'admin-equipment-media',
          action: 'fetch_unexpected',
          metadata: { equipmentId: resolvedParams.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    let equipmentId: string | undefined;
    try {
      const resolvedParams = await Promise.resolve(params);
      equipmentId = resolvedParams.id;

      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        logger.error('Supabase client not configured', {
          component: 'admin-equipment-media',
          action: 'supabase_missing',
          metadata: { equipmentId },
        });
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      // Get user for logging
      const { user } = adminResult;

      // Accept FormData with file upload
      logger.debug('Receiving file upload request', {
        component: 'admin-equipment-media',
        metadata: {
          equipmentId,
          contentType: request.headers.get('content-type'),
          contentLength: request.headers.get('content-length'),
        },
      });

      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (formDataError) {
        logger.error(
          'Failed to parse FormData',
          {
            component: 'admin-equipment-media',
            action: 'formdata_parse_error',
            metadata: { equipmentId },
          },
          formDataError instanceof Error ? formDataError : new Error(String(formDataError))
        );
        return NextResponse.json(
          {
            error: 'Failed to parse form data',
            details: formDataError instanceof Error ? formDataError.message : String(formDataError),
          },
          { status: 400 }
        );
      }

      // Log all form data keys for debugging
      const formDataKeys = Array.from(formData.keys());
      logger.debug('FormData received', {
        component: 'admin-equipment-media',
        metadata: {
          equipmentId,
          keys: formDataKeys,
          hasFile: formData.has('file'),
        },
      });

      const fileEntry = formData.get('file');
      const file = fileEntry instanceof File ? fileEntry : null;
      const fileName = formData.get('fileName') as string | null;
      const contentType = formData.get('contentType') as string | null;
      const mediaType = formData.get('mediaType') as string | null;
      const caption = formData.get('caption') as string | null;
      const isPrimary = formData.get('isPrimary') === 'true';

      logger.debug('Parsed form data', {
        component: 'admin-equipment-media',
        metadata: {
          equipmentId,
          hasFile: !!file,
          fileEntryType: fileEntry ? typeof fileEntry : 'null',
          isFileInstance: fileEntry instanceof File,
          fileName,
          contentType,
          mediaType,
          fileSize: file?.size,
          fileType: file?.type,
          formDataContentType: contentType,
        },
      });

      if (!file) {
        logger.warn('No file in FormData or file is not a File instance', {
          component: 'admin-equipment-media',
          metadata: {
            equipmentId,
            formDataKeys,
            fileEntryType: fileEntry ? typeof fileEntry : 'null',
            fileEntryIsFile: fileEntry instanceof File,
          },
        });
        return NextResponse.json(
          {
            error: 'No file provided or invalid file format',
            details: fileEntry ? `File entry type: ${typeof fileEntry}` : 'No file entry found',
          },
          { status: 400 }
        );
      }

      if (!fileName) {
        logger.warn('No fileName in FormData', {
          component: 'admin-equipment-media',
          metadata: { equipmentId },
        });
        return NextResponse.json({ error: 'File name required' }, { status: 400 });
      }

      if (!mediaType || !['image', 'video'].includes(mediaType)) {
        logger.warn('Invalid media type', {
          component: 'admin-equipment-media',
          metadata: { equipmentId, mediaType },
        });
        return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        logger.warn('File too large', {
          component: 'admin-equipment-media',
          metadata: { equipmentId, fileSize: file.size },
        });
        return NextResponse.json(
          { error: 'File too large. Maximum size is 10MB.' },
          { status: 400 }
        );
      }

      let serviceClient;
      try {
        // Debug log removed to reduce noise

        serviceClient = await createServiceClient();

        if (!serviceClient) {
          logger.error('Service role client unavailable for equipment media upload', {
            component: 'admin-equipment-media',
            action: 'service_client_missing',
            metadata: { equipmentId },
          });
          return NextResponse.json(
            {
              error: 'Storage configuration not available - service role key not configured',
              details:
                process.env.NODE_ENV === 'development'
                  ? 'createServiceClient() returned null - check service role key configuration'
                  : undefined,
            },
            { status: 500 }
          );
        }

        // Debug log removed to reduce noise
      } catch (serviceClientError) {
        logger.error(
          'Failed to create service client',
          {
            component: 'admin-equipment-media',
            action: 'service_client_error',
            metadata: {
              equipmentId,
              errorMessage:
                serviceClientError instanceof Error
                  ? serviceClientError.message
                  : String(serviceClientError),
              errorName:
                serviceClientError instanceof Error
                  ? serviceClientError.name
                  : typeof serviceClientError,
              errorStack:
                serviceClientError instanceof Error
                  ? serviceClientError.stack?.substring(0, 500)
                  : undefined,
            },
          },
          serviceClientError instanceof Error
            ? serviceClientError
            : new Error(String(serviceClientError))
        );
        return NextResponse.json(
          {
            error: 'Storage configuration not available',
            details:
              process.env.NODE_ENV === 'development'
                ? serviceClientError instanceof Error
                  ? serviceClientError.message
                  : String(serviceClientError)
                : undefined,
          },
          { status: 500 }
        );
      }

      // Note: We'll unset primary media after serviceClient is created
      // This prevents unique constraint violation on equipment_media_primary_idx

      const storagePath = buildStoragePath(equipmentId, fileName);

      logger.info('Uploading file directly to storage', {
        component: 'admin-equipment-media',
        action: 'direct_upload',
        metadata: { equipmentId, fileName, storagePath, fileSize: file.size },
      });

      // Determine content type - use formData contentType if available, fallback to file.type
      const uploadContentType = contentType || file.type || 'application/octet-stream';

      logger.debug('Uploading with content type', {
        component: 'admin-equipment-media',
        metadata: {
          equipmentId,
          uploadContentType,
          fileType: file.type,
          formDataContentType: contentType,
        },
      });

      // Upload file directly to storage using service client
      let uploadData;
      let uploadError;
      try {
        logger.debug('Attempting storage upload', {
          component: 'admin-equipment-media',
          metadata: {
            equipmentId,
            storagePath,
            fileSize: file.size,
            contentType: uploadContentType,
            bucketId: BUCKET_ID,
          },
        });

        const uploadResult = await serviceClient.storage.from(BUCKET_ID).upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: uploadContentType,
        });

        uploadData = uploadResult.data;
        uploadError = uploadResult.error;

        if (uploadError) {
          logger.error(
            'Storage upload returned error',
            {
              component: 'admin-equipment-media',
              action: 'upload_error',
              metadata: {
                equipmentId,
                fileName,
                storagePath,
                errorMessage: uploadError.message,
                errorName: uploadError.name,
                errorStatus: uploadError.statusCode,
              },
            },
            uploadError
          );
        }
      } catch (uploadException) {
        logger.error(
          'Exception during storage upload',
          {
            component: 'admin-equipment-media',
            action: 'upload_exception',
            metadata: {
              equipmentId,
              fileName,
              storagePath,
              errorMessage:
                uploadException instanceof Error
                  ? uploadException.message
                  : String(uploadException),
              errorName:
                uploadException instanceof Error ? uploadException.name : typeof uploadException,
            },
          },
          uploadException instanceof Error ? uploadException : new Error(String(uploadException))
        );
        return NextResponse.json(
          {
            error: 'Failed to upload file to storage',
            details:
              process.env.NODE_ENV === 'development'
                ? uploadException instanceof Error
                  ? uploadException.message
                  : String(uploadException)
                : undefined,
          },
          { status: 500 }
        );
      }

      if (uploadError || !uploadData) {
        logger.error(
          'Failed to upload file to storage',
          {
            component: 'admin-equipment-media',
            action: 'upload_failed',
            metadata: {
              equipmentId,
              fileName,
              storagePath,
              error: uploadError?.message || 'Upload failed',
              errorName: uploadError?.name,
              errorStatus: uploadError?.statusCode,
            },
          },
          uploadError ?? new Error('Upload failed')
        );
        return NextResponse.json(
          {
            error: 'Failed to upload file to storage',
            details: process.env.NODE_ENV === 'development' ? uploadError?.message : undefined,
          },
          { status: 500 }
        );
      }

      logger.debug('File uploaded successfully', {
        component: 'admin-equipment-media',
        metadata: {
          equipmentId,
          storagePath: uploadData.path,
          fileName,
        },
      });

      // Use the path returned from storage (might differ from what we built)
      const actualStoragePath = uploadData.path || storagePath;

      // Debug log removed to reduce noise

      // If this is marked as primary, unset all other primary media for this equipment first
      // This prevents unique constraint violation on equipment_media_primary_idx
      // Use serviceClient to bypass RLS
      if (isPrimary) {
        // Debug log removed to reduce noise

        const { error: unsetError } = await serviceClient
          .from('equipment_media')
          .update({ is_primary: false })
          .eq('equipment_id', equipmentId)
          .eq('is_primary', true);

        if (unsetError) {
          logger.warn('Failed to unset other primary media', {
            component: 'admin-equipment-media',
            metadata: {
              equipmentId,
              error: unsetError.message,
              errorCode: unsetError.code,
            },
          });
          // Continue anyway - the unique constraint will catch it if there's still a primary
        }
      }

      // Create database record using serviceClient to bypass RLS
      let mediaRow;
      let insertError;
      try {
        // Debug log removed to reduce noise

        const insertResult = await serviceClient
          .from('equipment_media')
          .insert({
            equipment_id: equipmentId,
            media_type: mediaType,
            storage_path: actualStoragePath,
            caption: caption ?? null,
            metadata: {},
            is_primary: isPrimary,
            uploaded_by: user?.id || 'unknown',
          })
          .select()
          .single();

        mediaRow = insertResult.data;
        insertError = insertResult.error;

        if (insertError) {
          logger.error(
            'Database insert returned error',
            {
              component: 'admin-equipment-media',
              action: 'insert_error',
              metadata: {
                equipmentId,
                fileName,
                storagePath: actualStoragePath,
                errorMessage: insertError.message,
                errorCode: insertError.code,
                errorDetails: insertError.details,
                errorHint: insertError.hint,
              },
            },
            insertError
          );
        }
      } catch (insertException) {
        logger.error(
          'Exception during database insert',
          {
            component: 'admin-equipment-media',
            action: 'insert_exception',
            metadata: {
              equipmentId,
              fileName,
              storagePath: actualStoragePath,
              errorMessage:
                insertException instanceof Error
                  ? insertException.message
                  : String(insertException),
              errorName:
                insertException instanceof Error ? insertException.name : typeof insertException,
            },
          },
          insertException instanceof Error ? insertException : new Error(String(insertException))
        );

        // Try to clean up the uploaded file
        try {
          await serviceClient.storage.from(BUCKET_ID).remove([uploadData.path]);
          // Debug log removed to reduce noise
        } catch (cleanupError) {
          logger.warn('Failed to clean up uploaded file after insert exception', {
            component: 'admin-equipment-media',
            metadata: {
              equipmentId,
              storagePath: uploadData.path,
              cleanupError:
                cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
            },
          });
        }

        return NextResponse.json(
          {
            error: 'Failed to create equipment media record',
            details:
              process.env.NODE_ENV === 'development'
                ? insertException instanceof Error
                  ? insertException.message
                  : String(insertException)
                : undefined,
          },
          { status: 500 }
        );
      }

      if (insertError || !mediaRow) {
        // If database insert fails, try to clean up the uploaded file
        try {
          await serviceClient.storage.from(BUCKET_ID).remove([uploadData.path]);
          // Debug log removed to reduce noise
        } catch (cleanupError) {
          logger.warn('Failed to clean up uploaded file after insert error', {
            component: 'admin-equipment-media',
            metadata: {
              equipmentId,
              storagePath: uploadData.path,
              cleanupError:
                cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
            },
          });
        }

        const errorDetails = {
          errorMessage: insertError?.message,
          errorCode: insertError?.code,
          errorDetails: insertError?.details,
          errorHint: insertError?.hint,
          hasData: !!mediaRow,
          hasError: !!insertError,
        };

        logger.error(
          'Failed to create equipment media record',
          {
            component: 'admin-equipment-media',
            action: 'insert_failed',
            metadata: {
              equipmentId,
              fileName,
              storagePath: actualStoragePath,
              ...errorDetails,
            },
          },
          insertError ?? new Error('Missing media row')
        );

        // Return detailed error message to help diagnose the issue
        const errorMessage = insertError?.message || 'Database insert returned no data';
        const errorCode = insertError?.code || 'UNKNOWN_ERROR';
        const errorHint = insertError?.hint || undefined;

        return NextResponse.json(
          {
            error: 'Unable to create equipment media record',
            details:
              process.env.NODE_ENV === 'development'
                ? {
                    message: errorMessage,
                    code: errorCode,
                    hint: errorHint,
                    storagePath: actualStoragePath,
                  }
                : errorMessage,
          },
          { status: 500 }
        );
      }

      if (isPrimary) {
        const { error: updateEquipmentError } = await serviceClient
          .from('equipment')
          .update({ primary_media_id: mediaRow.id })
          .eq('id', equipmentId);

        if (updateEquipmentError) {
          logger.warn('Failed to update equipment primary_media_id', {
            component: 'admin-equipment-media',
            metadata: {
              equipmentId,
              mediaId: mediaRow.id,
              error: updateEquipmentError.message,
              errorCode: updateEquipmentError.code,
            },
          });
          // Continue anyway - the media was uploaded successfully
        }
      }

      logger.info('Equipment media uploaded successfully', {
        component: 'admin-equipment-media',
        action: 'media_uploaded',
        metadata: { equipmentId, mediaId: mediaRow.id, adminId: user?.id || 'unknown' },
      });

      return NextResponse.json({
        media: mediaRow,
        success: true,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request body', details: err.issues },
          { status: 400 }
        );
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      const errorName = err instanceof Error ? err.name : typeof err;

      logger.error(
        'Unexpected error creating equipment media',
        {
          component: 'admin-equipment-media',
          action: 'create_unexpected',
          metadata: {
            equipmentId: equipmentId || 'unknown',
            errorMessage,
            errorName,
            errorStack: errorStack?.substring(0, 500), // Limit stack trace length
          },
        },
        err instanceof Error ? err : new Error(String(err))
      );

      // Ensure we return a valid JSON response even if there's an error
      try {
        return NextResponse.json(
          {
            error: 'Internal server error while creating equipment media',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          },
          { status: 500 }
        );
      } catch (responseError) {
        // If even creating the response fails, log it
        logger.error(
          'Failed to create error response',
          {
            component: 'admin-equipment-media',
            action: 'response_error',
            metadata: { equipmentId: equipmentId || 'unknown' },
          },
          responseError instanceof Error ? responseError : new Error(String(responseError))
        );
        // Return a minimal response
        return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }
);

export const PATCH = withRateLimit(
  RateLimitPresets.STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    const resolvedParams = await Promise.resolve(params);
    const equipmentId = resolvedParams.id;
    try {
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      const body = await request.json();
      const { mediaId, isPrimary, caption } = body;

      if (!mediaId) {
        return NextResponse.json({ error: 'mediaId is required' }, { status: 400 });
      }

      // If setting as primary, unset all other primary media for this equipment
      if (isPrimary === true) {
        await supabase
          .from('equipment_media')
          .update({ is_primary: false })
          .eq('equipment_id', equipmentId);

        // Update equipment primary_media_id
        await supabase
          .from('equipment')
          .update({ primary_media_id: mediaId })
          .eq('id', equipmentId);
      }

      // Update the media record
      const updates: Record<string, unknown> = {};
      if (isPrimary !== undefined) updates.is_primary = isPrimary;
      if (caption !== undefined) updates.caption = caption;

      const { data, error: updateError } = await supabase
        .from('equipment_media')
        .update(updates)
        .eq('id', mediaId)
        .eq('equipment_id', equipmentId)
        .select()
        .single();

      if (updateError) {
        logger.error(
          'Failed to update equipment media',
          {
            component: 'admin-equipment-media',
            action: 'update_failed',
            metadata: { mediaId, equipmentId },
          },
          updateError
        );
        return NextResponse.json({ error: 'Unable to update media' }, { status: 500 });
      }

      return NextResponse.json({ media: data });
    } catch (err) {
      logger.error(
        'Unexpected error updating equipment media',
        {
          component: 'admin-equipment-media',
          action: 'update_unexpected',
          metadata: { equipmentId: resolvedParams.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const DELETE = withRateLimit(
  RateLimitPresets.VERY_STRICT,
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
  ) => {
    try {
      const resolvedParams = await Promise.resolve(params);
      const equipmentId = resolvedParams.id;
      const adminResult = await requireAdmin(request);

      if (adminResult.error) return adminResult.error;

      const supabase = adminResult.supabase;

      if (!supabase) {
        return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
      }

      const payload = equipmentMediaDeleteSchema.safeParse(await request.json());
      if (!payload.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: payload.error.issues },
          { status: 400 }
        );
      }

      const serviceClient = await createServiceClient();
      if (!serviceClient) {
        logger.error('Service role client unavailable for equipment media deletion', {
          component: 'admin-equipment-media',
          action: 'service_client_missing',
        });
        return NextResponse.json(
          { error: 'Storage configuration not available - service role key not configured' },
          { status: 500 }
        );
      }

      const { data: mediaRow, error: fetchError } = await supabase
        .from('equipment_media')
        .select(
          'id, equipment_id, media_type, storage_path, caption, metadata, is_primary, uploaded_by, uploaded_at, created_at, updated_at'
        )
        .eq('id', payload.data.mediaId)
        .eq('equipment_id', equipmentId)
        .maybeSingle();

      if (fetchError) {
        logger.error(
          'Failed to load equipment media for deletion',
          {
            component: 'admin-equipment-media',
            action: 'fetch_for_delete_failed',
            metadata: { mediaId: payload.data.mediaId },
          },
          fetchError
        );
        return NextResponse.json({ error: 'Unable to load equipment media' }, { status: 500 });
      }

      if (!mediaRow) {
        return NextResponse.json({ error: 'Media not found' }, { status: 404 });
      }

      const { error: storageError } = await serviceClient.storage
        .from(BUCKET_ID)
        .remove([mediaRow.storage_path]);

      if (storageError) {
        logger.warn('Failed to remove equipment media object from storage', {
          component: 'admin-equipment-media',
          action: 'storage_remove_failed',
          metadata: {
            mediaId: mediaRow.id,
            path: mediaRow.storage_path,
            error: storageError?.message,
          },
        });
      }

      const { error: deleteError } = await supabase
        .from('equipment_media')
        .delete()
        .eq('id', mediaRow.id);

      if (deleteError) {
        logger.error(
          'Failed to delete equipment media record',
          {
            component: 'admin-equipment-media',
            action: 'delete_failed',
            metadata: { mediaId: mediaRow.id },
          },
          deleteError
        );
        return NextResponse.json({ error: 'Unable to delete equipment media' }, { status: 500 });
      }

      if (mediaRow.is_primary) {
        await supabase.from('equipment').update({ primary_media_id: null }).eq('id', equipmentId);
      }

      logger.info('Equipment media deleted', {
        component: 'admin-equipment-media',
        action: 'media_deleted',
        metadata: { equipmentId, mediaId: mediaRow.id },
      });

      return NextResponse.json({ success: true });
    } catch (err) {
      logger.error(
        'Unexpected error deleting equipment media',
        {
          component: 'admin-equipment-media',
          action: 'delete_unexpected',
          metadata: { equipmentId: resolvedParams.id },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json(
        { error: 'Internal server error while deleting equipment media' },
        { status: 500 }
      );
    }
  }
);
