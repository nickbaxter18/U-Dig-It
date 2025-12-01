import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import { contractNumberFromBooking, generatePaymentNumber } from '@/lib/utils';
import { checkAndCompleteBookingIfReady } from '@/lib/check-and-complete-booking';

const completionStepSchema = z.object({
  step: z.enum(['contract_signed', 'insurance_uploaded', 'license_uploaded', 'payment_completed', 'deposit_paid']),
  completed: z.boolean(),
  notes: z.string().optional(),
  paymentAmount: z.number().optional(),
  paymentMethod: z.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'debit_card']).optional(),
});

export const POST = withRateLimit(
  RateLimitPresets.STRICT,
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: bookingId } = await params;

      // Authenticate admin
      const adminResult = await requireAdmin(request);
      if (adminResult.error) {
        return adminResult.error;
      }

      const { user } = adminResult;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user details for admin signature
      const supabase = adminResult.supabase;
      const { data: userData } = await supabase
        .from('users')
        .select('firstName, lastName, email')
        .eq('id', user.id)
        .single();

      if (!userData) {
        logger.error(
          'Admin user data not found',
          {
            component: 'admin-completion-steps-api',
            action: 'user_data_not_found',
            metadata: { adminId: user.id, bookingId },
          },
          new Error('User data not found')
        );
        return NextResponse.json({ error: 'User data not found' }, { status: 500 });
      }

      // Get admin name and email for use throughout
      const adminName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || user.email || 'Admin';
      const adminEmail = userData.email || user.email || '';

      // Create service client for privileged operations
      const supabaseAdmin = await createServiceClient();
      if (!supabaseAdmin) {
        logger.error(
          'Service client creation failed',
          {
            component: 'admin-completion-steps-api',
            action: 'service_client_failed',
            metadata: { adminId: user.id, bookingId },
          },
          new Error('Service client not available')
        );
        return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
      }

      // Check if request has file (FormData) or is JSON
      // Note: When using FormData with fetch(), the browser automatically sets Content-Type
      // to multipart/form-data with a boundary. We need to check for this.
      const contentType = request.headers.get('content-type') || '';
      const hasFile = contentType.includes('multipart/form-data');

      logger.info('Request received', {
        component: 'admin-completion-steps-api',
        action: 'request_received',
        metadata: {
          bookingId,
          contentType,
          hasFile,
          contentLength: request.headers.get('content-length'),
        },
      });

      let step: string;
      let completed: boolean;
      let notes: string | undefined;
      let paymentAmount: number | undefined;
      let paymentMethod: string | undefined;
      let file: File | null = null;

      if (hasFile) {
        // Handle FormData with file upload
        try {
          const formData = await request.formData();

          // Log all form data keys for debugging
          const formDataKeys: string[] = [];
          for (const key of formData.keys()) {
            formDataKeys.push(key);
          }

          logger.info('FormData parsed', {
            component: 'admin-completion-steps-api',
            action: 'formdata_parsed',
            metadata: {
              bookingId,
              keys: formDataKeys,
            },
          });

          file = formData.get('file') as File | null;
          step = formData.get('step') as string;
          const completedStr = formData.get('completed');
          completed = completedStr === 'true' || completedStr === true;
          notes = (formData.get('notes') as string) || undefined;
          paymentAmount = formData.get('paymentAmount') ? Number(formData.get('paymentAmount')) : undefined;
          paymentMethod = (formData.get('paymentMethod') as string) || undefined;

          // Validate required fields
          if (!step) {
            logger.warn('Step missing in FormData', {
              component: 'admin-completion-steps-api',
              action: 'validation_error',
              metadata: { bookingId, formDataKeys },
            });
            return NextResponse.json({ error: 'Step is required' }, { status: 400 });
          }

          // Validate step enum
          if (!['contract_signed', 'insurance_uploaded', 'license_uploaded', 'payment_completed', 'deposit_paid'].includes(step)) {
            logger.warn('Invalid step in FormData', {
              component: 'admin-completion-steps-api',
              action: 'validation_error',
              metadata: { bookingId, step, formDataKeys },
            });
            return NextResponse.json({ error: `Invalid step: ${step}` }, { status: 400 });
          }

          // Validate file if provided
          if (file) {
            // Verify file is actually a File object
            if (!(file instanceof File)) {
              logger.error('File is not a File object', {
                component: 'admin-completion-steps-api',
                action: 'file_validation_error',
                metadata: {
                  bookingId,
                  step,
                  fileType: typeof file,
                  fileConstructor: file?.constructor?.name,
                },
              });
              return NextResponse.json({ error: 'Invalid file object' }, { status: 400 });
            }

            // Verify file has content
            if (file.size === 0) {
              logger.warn('Empty file provided', {
                component: 'admin-completion-steps-api',
                action: 'file_validation_error',
                metadata: {
                  bookingId,
                  step,
                  fileName: file.name,
                },
              });
              return NextResponse.json({ error: 'File is empty (0 bytes)' }, { status: 400 });
            }

            logger.info('File validated successfully', {
              component: 'admin-completion-steps-api',
              action: 'file_validated',
              metadata: {
                bookingId,
                step,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                lastModified: file.lastModified,
              },
            });
          } else {
            logger.warn('FormData request but no file provided', {
              component: 'admin-completion-steps-api',
              action: 'no_file_in_formdata',
              metadata: { bookingId, step, contentType, formDataKeys },
            });
          }
        } catch (formDataError) {
          logger.error(
            'Failed to parse FormData',
            {
              component: 'admin-completion-steps-api',
              action: 'formdata_parse_error',
              metadata: { bookingId, contentType },
            },
            formDataError instanceof Error ? formDataError : new Error(String(formDataError))
          );
          return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
        }
      } else {
        // Handle JSON (existing behavior)
        const body = await request.json().catch(() => ({}));
        const validationResult = completionStepSchema.safeParse(body);

        if (!validationResult.success) {
          logger.warn('Invalid request body', {
            component: 'admin-completion-steps-api',
            action: 'validation_error',
            metadata: { bookingId, errors: validationResult.error.errors },
          });
          return NextResponse.json(
            { error: 'Invalid request', details: validationResult.error.errors },
            { status: 400 }
          );
        }

        ({ step, completed, notes, paymentAmount, paymentMethod } = validationResult.data);
      }

      // Handle marking as incomplete - reverse the step completion
      if (!completed) {
        // Fetch booking to verify it exists
        const { data: booking, error: bookingError } = await supabaseAdmin
          .from('bookings')
          .select('id, bookingNumber, customerId, status')
          .eq('id', bookingId)
          .single();

        if (bookingError || !booking) {
          logger.error(
            'Booking not found',
            {
              component: 'admin-completion-steps-api',
              action: 'booking_not_found',
              metadata: { bookingId, error: bookingError?.message },
            },
            bookingError
          );
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        let updatedRecords: Record<string, unknown> = {};

        try {
          switch (step) {
            case 'contract_signed': {
              // Set contract status back to draft
              const { data: existingContract } = await supabaseAdmin
                .from('contracts')
                .select('id, status')
                .eq('bookingId', bookingId)
                .maybeSingle();

              if (existingContract) {
                const { data: updatedContract, error: contractError } = await supabaseAdmin
                  .from('contracts')
                  .update({
                    status: 'draft',
                    signedAt: null,
                    completedAt: null,
                    updatedAt: new Date().toISOString(),
                  })
                  .eq('id', existingContract.id)
                  .select()
                  .single();

                if (contractError) {
                  throw contractError;
                }

                updatedRecords.contract = updatedContract;
              }
              break;
            }

            case 'insurance_uploaded': {
              // Set insurance document status back to pending
              const { data: existingDoc } = await supabaseAdmin
                .from('insurance_documents')
                .select('id, status')
                .eq('bookingId', bookingId)
                .order('createdAt', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (existingDoc) {
                const { data: updatedDoc, error: docError } = await supabaseAdmin
                  .from('insurance_documents')
                  .update({
                    status: 'pending',
                    reviewedBy: null,
                    reviewedAt: null,
                    reviewNotes: (existingDoc.reviewNotes || '') + `\n\nMarked as incomplete by ${adminName} on ${new Date().toISOString()}. ${notes || ''}`,
                    updatedAt: new Date().toISOString(),
                  })
                  .eq('id', existingDoc.id)
                  .select()
                  .single();

                if (docError) {
                  throw docError;
                }

                updatedRecords.insurance = updatedDoc;
              }
              break;
            }

            case 'license_uploaded': {
              // Set verification status back to pending
              const { data: verificationRequest } = await supabaseAdmin
                .from('id_verification_requests')
                .select('id, status')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (verificationRequest) {
                const { data: updatedRequest, error: requestError } = await supabaseAdmin
                  .from('id_verification_requests')
                  .update({
                    status: 'pending',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', verificationRequest.id)
                  .select()
                  .single();

                if (requestError) {
                  throw requestError;
                }

                updatedRecords.verification = updatedRequest;
              } else {
                // If no verification request, clear user's license verification
                if (booking.customerId) {
                  const { error: userError } = await supabaseAdmin
                    .from('users')
                    .update({
                      drivers_license_verified_at: null,
                      updatedAt: new Date().toISOString(),
                    })
                    .eq('id', booking.customerId);

                  if (userError) {
                    throw userError;
                  }

                  updatedRecords.user = { id: booking.customerId, drivers_license_verified_at: null };
                }
              }
              break;
            }

            case 'payment_completed': {
              // Set payment status back to pending (don't delete payment records)
              const { data: existingPayment } = await supabaseAdmin
                .from('payments')
                .select('id, status')
                .eq('bookingId', bookingId)
                .eq('type', 'payment')
                .order('createdAt', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (existingPayment) {
                const { data: updatedPayment, error: paymentError } = await supabaseAdmin
                  .from('payments')
                  .update({
                    status: 'pending',
                    processedAt: null,
                    description: (existingPayment.description || '') + `\nMarked as incomplete by ${adminName} on ${new Date().toISOString()}. ${notes || ''}`,
                    updatedAt: new Date().toISOString(),
                  })
                  .eq('id', existingPayment.id)
                  .select()
                  .single();

                if (paymentError) {
                  throw paymentError;
                }

                updatedRecords.payment = updatedPayment;
              }
              break;
            }

            case 'deposit_paid': {
              // Clear deposit payment method (but keep payment records)
              const { data: bookingData } = await supabaseAdmin
                .from('bookings')
                .select('stripe_payment_method_id, depositPaid')
                .eq('id', bookingId)
                .single();

              if (bookingData?.stripe_payment_method_id?.startsWith('admin_override_')) {
                // Only clear admin override payment methods, not real Stripe payment methods
                await supabaseAdmin
                  .from('bookings')
                  .update({
                    stripe_payment_method_id: null,
                    depositPaid: false,
                    depositPaidAt: null,
                    lastModifiedBy: user.id,
                    updatedAt: new Date().toISOString(),
                  })
                  .eq('id', bookingId);
              }
              break;
            }
          }

          // Log audit trail
          try {
            await supabaseAdmin
              .from('audit_logs')
              .insert({
                table_name: 'bookings',
                record_id: bookingId,
                action: 'admin_step_incomplete',
                user_id: user.id,
                old_values: { [step]: true },
                new_values: { [step]: false },
                metadata: {
                  step: step,
                  notes: notes,
                  marked_incomplete_by: adminName,
                  marked_incomplete_at: new Date().toISOString(),
                },
              });
          } catch (auditError) {
            logger.warn('Failed to create audit log', {
              component: 'admin-completion-steps-api',
              action: 'audit_log_failed',
              metadata: { bookingId, step },
            });
          }

          logger.info('Step marked as incomplete successfully', {
            component: 'admin-completion-steps-api',
            action: 'step_incomplete',
            metadata: {
              bookingId,
              step,
              adminId: user.id,
              adminName,
            },
          });

          return NextResponse.json({
            success: true,
            step,
            completed: false,
            updatedRecords,
          });
        } catch (error) {
          logger.error(
            'Failed to mark step as incomplete',
            {
              component: 'admin-completion-steps-api',
              action: 'step_incomplete_error',
              metadata: { bookingId, step, adminId: user.id },
            },
            error instanceof Error ? error : new Error(String(error))
          );

          return NextResponse.json(
            {
              error: 'Failed to mark step as incomplete',
              details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
          );
        }
      }

      // Fetch booking to verify it exists
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('id, bookingNumber, customerId, totalAmount, balanceDue, securityDeposit, status, stripe_payment_method_id, depositPaid, depositPaidAt')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        logger.error(
          'Booking not found',
          {
            component: 'admin-completion-steps-api',
            action: 'booking_not_found',
            metadata: { bookingId, error: bookingError?.message },
          },
          bookingError
        );
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Validate booking status - don't allow step completion for cancelled/completed bookings
      if (booking.status === 'cancelled' || booking.status === 'completed') {
        logger.warn('Attempted to complete step on invalid booking status', {
          component: 'admin-completion-steps-api',
          action: 'invalid_booking_status',
          metadata: { bookingId, status: booking.status, step },
        });
        return NextResponse.json(
          { error: `Cannot complete steps for booking with status: ${booking.status}` },
          { status: 400 }
        );
      }

      let updatedRecords: Record<string, unknown> = {};
      let uploadedFileUrl: string | null = null;

      // Handle file upload if file is provided
      if (file) {
        // Validate file type and size
        const stepFileConfig: Record<string, { accept: string[]; maxSize: number; bucket: string; rpcFunction: string }> = {
          contract_signed: {
            accept: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxSize: 50 * 1024 * 1024, // 50MB
            bucket: 'contracts',
            rpcFunction: 'generate_contract_upload_path',
          },
          insurance_uploaded: {
            accept: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxSize: 50 * 1024 * 1024, // 50MB
            bucket: 'insurance-documents',
            rpcFunction: 'generate_insurance_upload_path',
          },
          license_uploaded: {
            accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxSize: 10 * 1024 * 1024, // 10MB
            bucket: 'driver-licenses',
            rpcFunction: 'generate_license_upload_path',
          },
        };

        const config = stepFileConfig[step];
        if (!config) {
          return NextResponse.json({ error: 'File upload not supported for this step' }, { status: 400 });
        }

        // Validate file type
        if (!config.accept.includes(file.type)) {
          return NextResponse.json(
            { error: `Invalid file type. Allowed: ${config.accept.join(', ')}` },
            { status: 400 }
          );
        }

        // Validate file size
        if (file.size > config.maxSize) {
          return NextResponse.json(
            { error: `File too large. Maximum size: ${(config.maxSize / 1024 / 1024).toFixed(0)}MB` },
            { status: 400 }
          );
        }

        try {
          // Generate secure upload path
          let pathData: string | null = null;
          let pathError: Error | null = null;

          if (step === 'contract_signed') {
            // For contracts, we need to get or create contract first to get contract_id
            const { data: existingContract } = await supabaseAdmin
              .from('contracts')
              .select('id')
              .eq('bookingId', bookingId)
              .maybeSingle();

            if (existingContract) {
              const { data: path, error: err } = await supabaseAdmin.rpc('generate_contract_upload_path', {
                p_booking_id: bookingId,
                p_contract_id: existingContract.id,
              } as never);
              pathData = path;
              pathError = err;
            } else {
              // Create contract first to get ID
              const contractNumber = contractNumberFromBooking(booking.bookingNumber);
              const { data: newContract, error: contractErr } = await supabaseAdmin
                .from('contracts')
                .insert({
                  bookingId: bookingId,
                  contractNumber: contractNumber,
                  status: 'draft',
                  legalVersions: {},
                })
                .select('id')
                .single();

              if (contractErr || !newContract) {
                pathError = contractErr || new Error('Failed to create contract');
              } else {
                const { data: path, error: err } = await supabaseAdmin.rpc('generate_contract_upload_path', {
                  p_booking_id: bookingId,
                  p_contract_id: newContract.id,
                } as never);
                pathData = path;
                pathError = err;
              }
            }
          } else if (step === 'insurance_uploaded') {
            const { data: path, error: err } = await supabaseAdmin.rpc('generate_insurance_upload_path', {
              p_booking_id: bookingId,
              p_file_name: file.name,
            } as never);
            pathData = path;
            pathError = err;
          } else if (step === 'license_uploaded') {
            // Get customer ID from booking
            const { data: bookingData } = await supabaseAdmin
              .from('bookings')
              .select('customerId')
              .eq('id', bookingId)
              .single();

            if (!bookingData?.customerId) {
              pathError = new Error('Customer ID not found');
            } else {
              const { data: path, error: err } = await supabaseAdmin.rpc('generate_license_upload_path', {
                p_user_id: bookingData.customerId,
                p_file_name: file.name,
              } as never);
              pathData = path;
              pathError = err;
            }
          }

          if (pathError || !pathData) {
            logger.error(
              'Failed to generate upload path',
              {
                component: 'admin-completion-steps-api',
                action: 'path_generation_failed',
                metadata: { bookingId, step, error: pathError?.message },
              },
              pathError || new Error('Path generation failed')
            );
            return NextResponse.json({ error: 'Failed to generate upload path' }, { status: 500 });
          }

          // Convert File to ArrayBuffer for upload
          logger.info('Converting file to buffer', {
            component: 'admin-completion-steps-api',
            action: 'file_conversion_start',
            metadata: {
              bookingId,
              step,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            },
          });

          let arrayBuffer: ArrayBuffer;
          try {
            arrayBuffer = await file.arrayBuffer();
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              throw new Error('File arrayBuffer is empty');
            }
            logger.info('File converted to ArrayBuffer', {
              component: 'admin-completion-steps-api',
              action: 'file_converted',
              metadata: {
                bookingId,
                step,
                bufferSize: arrayBuffer.byteLength,
                originalSize: file.size,
              },
            });
          } catch (bufferError) {
            logger.error(
              'Failed to convert file to ArrayBuffer',
              {
                component: 'admin-completion-steps-api',
                action: 'file_conversion_error',
                metadata: { bookingId, step, fileName: file.name, fileSize: file.size },
              },
              bufferError instanceof Error ? bufferError : new Error(String(bufferError))
            );
            return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
          }

          const fileBuffer = Buffer.from(arrayBuffer);

          // Verify buffer size matches file size
          if (fileBuffer.length !== file.size) {
            logger.warn('Buffer size mismatch', {
              component: 'admin-completion-steps-api',
              action: 'buffer_size_mismatch',
              metadata: {
                bookingId,
                step,
                fileSize: file.size,
                bufferSize: fileBuffer.length,
              },
            });
          }

          // Upload to Storage
          logger.info('Uploading file to storage', {
            component: 'admin-completion-steps-api',
            action: 'storage_upload_start',
            metadata: {
              bookingId,
              step,
              bucket: config.bucket,
              path: pathData,
              fileSize: fileBuffer.length,
            },
          });

          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(config.bucket)
            .upload(pathData, fileBuffer, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            logger.error(
              'File upload failed',
              {
                component: 'admin-completion-steps-api',
                action: 'upload_failed',
                metadata: {
                  bookingId,
                  step,
                  bucket: config.bucket,
                  path: pathData,
                  fileSize: fileBuffer.length,
                  error: uploadError.message,
                  errorCode: uploadError.statusCode,
                },
              },
              uploadError
            );
            return NextResponse.json(
              { error: `Failed to upload file: ${uploadError.message}` },
              { status: 500 }
            );
          }

          if (!uploadData || !uploadData.path) {
            logger.error('Upload succeeded but no path returned', {
              component: 'admin-completion-steps-api',
              action: 'upload_no_path',
              metadata: {
                bookingId,
                step,
                bucket: config.bucket,
                uploadData,
              },
            });
            return NextResponse.json({ error: 'File uploaded but path not returned' }, { status: 500 });
          }

          uploadedFileUrl = uploadData.path;

          logger.info('File uploaded successfully to storage', {
            component: 'admin-completion-steps-api',
            action: 'file_uploaded',
            metadata: {
              bookingId,
              step,
              bucket: config.bucket,
              path: uploadData.path,
              fileSize: fileBuffer.length,
            },
          });
        } catch (uploadErr) {
          logger.error(
            'File upload error',
            {
              component: 'admin-completion-steps-api',
              action: 'upload_error',
              metadata: { bookingId, step },
            },
            uploadErr instanceof Error ? uploadErr : new Error(String(uploadErr))
          );
          return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
        }
      }

      // Handle each step
      try {
        switch (step) {
          case 'contract_signed': {
            // Check if contract exists
            const { data: existingContract } = await supabaseAdmin
              .from('contracts')
              .select('id, status, contractNumber, signatures')
              .eq('bookingId', bookingId)
              .maybeSingle();

            if (existingContract) {
              // Update existing contract
              const signatures = existingContract.signatures || {};
              const adminSignature = {
                name: adminName,
                email: adminEmail,
                timestamp: new Date().toISOString(),
                method: 'admin_override',
                notes: notes || 'Completed by admin in person',
              };

              const updateData: Record<string, unknown> = {
                status: 'signed',
                signedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                signatures: { ...signatures, admin: adminSignature },
                updatedAt: new Date().toISOString(),
              };

              // Add file URL if file was uploaded
              if (uploadedFileUrl) {
                updateData.signedDocumentPath = uploadedFileUrl;
                // Generate signed URL for display
                const { data: signedUrlData } = await supabaseAdmin.storage
                  .from('contracts')
                  .createSignedUrl(uploadedFileUrl, 3600 * 24 * 365); // 1 year
                if (signedUrlData?.signedUrl) {
                  updateData.signedDocumentUrl = signedUrlData.signedUrl;
                }
              }

              const { data: updatedContract, error: contractError } = await supabaseAdmin
                .from('contracts')
                .update(updateData)
                .eq('id', existingContract.id)
                .select()
                .single();

              if (contractError) {
                throw contractError;
              }

              updatedRecords.contract = updatedContract;
            } else {
              // Create new contract
              const contractNumber = contractNumberFromBooking(booking.bookingNumber);
              const insertData: Record<string, unknown> = {
                bookingId: bookingId,
                contractNumber: contractNumber,
                status: 'signed',
                signedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                legalVersions: {},
                signatures: {
                  admin: {
                    name: adminName,
                    email: adminEmail,
                    timestamp: new Date().toISOString(),
                    method: 'admin_override',
                    notes: notes || 'Completed by admin in person',
                  },
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              // Add file URL if file was uploaded
              if (uploadedFileUrl) {
                insertData.signedDocumentPath = uploadedFileUrl;
                // Generate signed URL for display
                const { data: signedUrlData } = await supabaseAdmin.storage
                  .from('contracts')
                  .createSignedUrl(uploadedFileUrl, 3600 * 24 * 365); // 1 year
                if (signedUrlData?.signedUrl) {
                  insertData.signedDocumentUrl = signedUrlData.signedUrl;
                }
              }

              const { data: newContract, error: contractError } = await supabaseAdmin
                .from('contracts')
                .insert(insertData)
                .select()
                .single();

              if (contractError) {
                throw contractError;
              }

              updatedRecords.contract = newContract;
            }
            break;
          }

          case 'insurance_uploaded': {
            // Check if insurance document exists
            const { data: existingDoc } = await supabaseAdmin
              .from('insurance_documents')
              .select('id, status, reviewedBy, reviewNotes, fileUrl')
              .eq('bookingId', bookingId)
              .maybeSingle();

            if (existingDoc) {
              // Update existing document
              const updateData: Record<string, unknown> = {
                status: 'approved',
                reviewedBy: adminName,
                reviewedAt: new Date().toISOString(),
                reviewNotes: (existingDoc.reviewNotes ? existingDoc.reviewNotes + '\n\n' : '') +
                  `Admin approval: ${uploadedFileUrl ? 'with file upload' : (notes || 'in person')}`,
                updatedAt: new Date().toISOString(),
              };

              // Add file URL if file was uploaded (always update if file was uploaded)
              if (uploadedFileUrl) {
                // Normalize storage path: remove leading slash, ensure it's not a full URL
                let storagePath = uploadedFileUrl.trim();

                // If it's a full URL, try to extract path (but this shouldn't happen)
                if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
                  logger.warn('Upload returned full URL instead of path', {
                    component: 'admin-completion-steps-api',
                    action: 'unexpected_url_format',
                    metadata: { bookingId, step, uploadedFileUrl: storagePath.substring(0, 100) },
                  });
                  // Try to extract path from Supabase storage URL
                  if (storagePath.includes('/storage/v1/object/')) {
                    try {
                      const url = new URL(storagePath);
                      const pathSegments = url.pathname.split('/').filter(Boolean);
                      const objectIndex = pathSegments.findIndex((segment) => segment === 'object');
                      if (objectIndex !== -1 && pathSegments.length > objectIndex + 2) {
                        storagePath = decodeURIComponent(pathSegments.slice(objectIndex + 3).join('/'));
                      }
                    } catch (urlError) {
                      logger.error('Failed to extract path from URL', {
                        component: 'admin-completion-steps-api',
                        action: 'url_extraction_failed',
                        metadata: { bookingId, step, error: urlError instanceof Error ? urlError.message : String(urlError) },
                      });
                    }
                  }
                }

                // Remove leading slash if present
                if (storagePath.startsWith('/')) {
                  storagePath = storagePath.substring(1);
                }

                updateData.fileUrl = storagePath;
                updateData.fileName = file?.name || `admin_uploaded_${Date.now()}.${file?.name?.split('.').pop() || 'pdf'}`;
                updateData.originalFileName = file?.name || 'admin_uploaded.pdf';
                updateData.mimeType = file?.type || 'application/pdf';
                updateData.fileSize = file?.size || 0;

                logger.info('Updating insurance document with file URL', {
                  component: 'admin-completion-steps-api',
                  action: 'insurance_doc_update_with_file',
                  metadata: {
                    bookingId,
                    documentId: existingDoc.id,
                    fileUrl: storagePath.substring(0, 50) + (storagePath.length > 50 ? '...' : ''),
                    fileName: file?.name,
                    fileSize: file?.size,
                  },
                });
              } else {
                // No file uploaded - ensure fileUrl is set to empty if it was previously empty
                // Don't overwrite existing fileUrl if one exists
                if (!existingDoc.fileUrl || existingDoc.fileUrl.trim() === '') {
                  updateData.fileUrl = '';
                }
              }

              logger.info('Updating insurance document in database', {
                component: 'admin-completion-steps-api',
                action: 'insurance_doc_db_update',
                metadata: {
                  bookingId,
                  documentId: existingDoc.id,
                  updateDataKeys: Object.keys(updateData),
                  hasFileUrl: !!updateData.fileUrl,
                  fileUrl: updateData.fileUrl ? String(updateData.fileUrl).substring(0, 50) + '...' : 'none',
                },
              });

              const { data: updatedDoc, error: docError } = await supabaseAdmin
                .from('insurance_documents')
                .update(updateData)
                .eq('id', existingDoc.id)
                .select('id, fileUrl, fileName, status, reviewedBy, reviewNotes')
                .single();

              if (docError) {
                logger.error(
                  'Failed to update insurance document',
                  {
                    component: 'admin-completion-steps-api',
                    action: 'insurance_doc_update_failed',
                    metadata: {
                      bookingId,
                      documentId: existingDoc.id,
                      error: docError.message,
                      errorCode: docError.code,
                      updateData: {
                        ...updateData,
                        fileUrl: updateData.fileUrl ? String(updateData.fileUrl).substring(0, 50) + '...' : 'none',
                      },
                    },
                  },
                  docError
                );
                throw docError;
              }

              logger.info('Insurance document updated in database', {
                component: 'admin-completion-steps-api',
                action: 'insurance_doc_updated',
                metadata: {
                  bookingId,
                  documentId: existingDoc.id,
                  hasFileUrl: !!updatedDoc?.fileUrl,
                  fileUrl: updatedDoc?.fileUrl ? String(updatedDoc.fileUrl).substring(0, 50) + '...' : 'none',
                },
              });

              // Verify fileUrl was saved correctly
              if (uploadedFileUrl && updatedDoc) {
                const savedFileUrl = updatedDoc.fileUrl;
                const expectedFileUrl = updateData.fileUrl as string;

                if (!savedFileUrl || savedFileUrl.trim() === '') {
                  logger.error(
                    'File uploaded but fileUrl not saved to database (empty)',
                    {
                      component: 'admin-completion-steps-api',
                      action: 'fileurl_not_saved',
                      metadata: {
                        bookingId,
                        documentId: existingDoc.id,
                        uploadedFileUrl,
                        expectedFileUrl,
                        savedFileUrl: savedFileUrl || 'EMPTY',
                        updateDataFileUrl: updateData.fileUrl,
                      },
                    },
                    new Error('File URL mismatch after database update')
                  );

                  // Try to fix it by updating again with explicit fileUrl
                  const { error: fixError } = await supabaseAdmin
                    .from('insurance_documents')
                    .update({
                      fileUrl: expectedFileUrl,
                      updatedAt: new Date().toISOString(),
                    })
                    .eq('id', existingDoc.id);

                  if (fixError) {
                    logger.error(
                      'Failed to fix fileUrl after initial update',
                      {
                        component: 'admin-completion-steps-api',
                        action: 'fileurl_fix_failed',
                        metadata: {
                          bookingId,
                          documentId: existingDoc.id,
                          error: fixError.message,
                          errorCode: fixError.code,
                        },
                      },
                      fixError
                    );
                    // Don't throw - continue with what we have
                  } else {
                    logger.info('FileUrl fixed after retry', {
                      component: 'admin-completion-steps-api',
                      action: 'fileurl_fixed',
                      metadata: {
                        bookingId,
                        documentId: existingDoc.id,
                        fileUrl: expectedFileUrl.substring(0, 50) + '...',
                      },
                    });

                    // Refetch the updated document
                    const { data: fixedDoc } = await supabaseAdmin
                      .from('insurance_documents')
                      .select('id, fileUrl, fileName, status, reviewedBy, reviewNotes')
                      .eq('id', existingDoc.id)
                      .single();
                    updatedRecords.insurance = fixedDoc || updatedDoc;
                  }
                } else if (savedFileUrl !== expectedFileUrl && !savedFileUrl.includes(expectedFileUrl) && !expectedFileUrl.includes(savedFileUrl)) {
                  logger.warn(
                    'FileUrl saved but may not match expected path',
                    {
                      component: 'admin-completion-steps-api',
                      action: 'fileurl_path_mismatch',
                      metadata: {
                        bookingId,
                        documentId: existingDoc.id,
                        expectedFileUrl: expectedFileUrl.substring(0, 50),
                        savedFileUrl: savedFileUrl.substring(0, 50),
                      },
                    }
                  );
                  updatedRecords.insurance = updatedDoc;
                } else {
                  updatedRecords.insurance = updatedDoc;
                }
              } else {
                updatedRecords.insurance = updatedDoc;
              }
            } else {
              // Create new document record
              // Ensure fileUrl is the storage path (not a signed URL)
              // Normalize storage path: remove leading slash, ensure it's not a full URL
              let storagePath = uploadedFileUrl ? uploadedFileUrl.trim() : '';

              if (storagePath) {
                // If it's a full URL, try to extract path (but this shouldn't happen)
                if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
                  logger.warn('Upload returned full URL instead of path (new document)', {
                    component: 'admin-completion-steps-api',
                    action: 'unexpected_url_format_new',
                    metadata: { bookingId, step, uploadedFileUrl: storagePath.substring(0, 100) },
                  });
                  // Try to extract path from Supabase storage URL
                  if (storagePath.includes('/storage/v1/object/')) {
                    try {
                      const url = new URL(storagePath);
                      const pathSegments = url.pathname.split('/').filter(Boolean);
                      const objectIndex = pathSegments.findIndex((segment) => segment === 'object');
                      if (objectIndex !== -1 && pathSegments.length > objectIndex + 2) {
                        storagePath = decodeURIComponent(pathSegments.slice(objectIndex + 3).join('/'));
                      }
                    } catch (urlError) {
                      logger.error('Failed to extract path from URL (new document)', {
                        component: 'admin-completion-steps-api',
                        action: 'url_extraction_failed_new',
                        metadata: { bookingId, step, error: urlError instanceof Error ? urlError.message : String(urlError) },
                      });
                    }
                  }
                }

                // Remove leading slash if present
                if (storagePath.startsWith('/')) {
                  storagePath = storagePath.substring(1);
                }
              }

              const insertData: Record<string, unknown> = {
                bookingId: bookingId,
                documentNumber: `ADMIN-${Date.now()}`,
                fileName: uploadedFileUrl
                  ? (file?.name || `admin_uploaded_${Date.now()}.${file?.name?.split('.').pop() || 'pdf'}`)
                  : `admin_approved_${booking.bookingNumber}_${Date.now()}.pdf`,
                originalFileName: file?.name || 'admin_approved_in_person.pdf',
                mimeType: file?.type || 'application/pdf',
                fileSize: file?.size || 0,
                fileUrl: storagePath, // Use storage path (not signed URL)
                type: 'coi',
                status: 'approved',
                reviewedBy: adminName,
                reviewedAt: new Date().toISOString(),
                reviewNotes: `Approved by admin${uploadedFileUrl ? ' with file upload' : ' - in-person submission'}. ${notes || ''}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              logger.info('Creating new insurance document', {
                component: 'admin-completion-steps-api',
                action: 'insurance_doc_create',
                metadata: {
                  bookingId,
                  hasFile: !!uploadedFileUrl,
                  fileUrl: storagePath.substring(0, 50) + (storagePath.length > 50 ? '...' : ''),
                  fileName: file?.name,
                  fileSize: file?.size,
                },
              });

              const { data: newDoc, error: docError } = await supabaseAdmin
                .from('insurance_documents')
                .insert(insertData)
                .select('id, fileUrl, fileName, status, reviewedBy, reviewNotes')
                .single();

              if (docError) {
                logger.error(
                  'Failed to create insurance document',
                  {
                    component: 'admin-completion-steps-api',
                    action: 'insurance_doc_create_failed',
                    metadata: {
                      bookingId,
                      error: docError.message,
                      insertData,
                    },
                  },
                  docError
                );
                throw docError;
              }

              logger.info('Insurance document created', {
                component: 'admin-completion-steps-api',
                action: 'insurance_doc_created',
                metadata: {
                  bookingId,
                  documentId: newDoc.id,
                  hasFileUrl: !!newDoc?.fileUrl,
                  fileUrl: newDoc?.fileUrl ? String(newDoc.fileUrl).substring(0, 50) + '...' : 'none',
                },
              });

              // Verify fileUrl was saved correctly
              if (uploadedFileUrl && newDoc) {
                const savedFileUrl = newDoc.fileUrl;

                if (!savedFileUrl || savedFileUrl.trim() === '') {
                  logger.error(
                    'File uploaded but fileUrl not saved to database (new document)',
                    {
                      component: 'admin-completion-steps-api',
                      action: 'fileurl_not_saved_new',
                      metadata: {
                        bookingId,
                        documentId: newDoc.id,
                        uploadedFileUrl,
                        expectedFileUrl: storagePath,
                        savedFileUrl: savedFileUrl || 'EMPTY',
                      },
                    },
                    new Error('File URL mismatch after database insert')
                  );

                  // Try to fix it by updating
                  const { error: fixError } = await supabaseAdmin
                    .from('insurance_documents')
                    .update({
                      fileUrl: storagePath,
                      updatedAt: new Date().toISOString(),
                    })
                    .eq('id', newDoc.id);

                  if (fixError) {
                    logger.error(
                      'Failed to fix fileUrl after initial insert',
                      {
                        component: 'admin-completion-steps-api',
                        action: 'fileurl_fix_failed_new',
                        metadata: {
                          bookingId,
                          documentId: newDoc.id,
                          error: fixError.message,
                          errorCode: fixError.code,
                        },
                      },
                      fixError
                    );
                    // Don't throw - continue with what we have
                  } else {
                    logger.info('FileUrl fixed after retry (new document)', {
                      component: 'admin-completion-steps-api',
                      action: 'fileurl_fixed_new',
                      metadata: {
                        bookingId,
                        documentId: newDoc.id,
                        fileUrl: storagePath.substring(0, 50) + '...',
                      },
                    });

                    // Refetch the updated document
                    const { data: fixedDoc } = await supabaseAdmin
                      .from('insurance_documents')
                      .select('id, fileUrl, fileName, status, reviewedBy, reviewNotes')
                      .eq('id', newDoc.id)
                      .single();
                    updatedRecords.insurance = fixedDoc || newDoc;
                  }
                } else {
                  updatedRecords.insurance = newDoc;
                }
              } else {
                updatedRecords.insurance = newDoc;
              }
            }
            break;
          }

          case 'license_uploaded': {
            // Check for existing verification request
            const { data: verificationRequest } = await supabaseAdmin
              .from('id_verification_requests')
              .select('id, status, metadata, attempt_number')
              .eq('booking_id', bookingId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (verificationRequest) {
              // Update existing request
              const metadata = verificationRequest.metadata || {};
              const updateMetadata: Record<string, unknown> = {
                ...metadata,
                admin_override: {
                  approved_by: user.id,
                  approved_at: new Date().toISOString(),
                  notes: notes || 'Approved in person by admin',
                  method: uploadedFileUrl ? 'file_upload' : 'in_person_verification',
                },
              };

              // Add file URL if file was uploaded
              if (uploadedFileUrl) {
                updateMetadata.fileUrl = uploadedFileUrl;
                updateMetadata.fileName = file?.name || 'driver_license.jpg';
              }

              const { data: updatedRequest, error: requestError } = await supabaseAdmin
                .from('id_verification_requests')
                .update({
                  status: 'approved',
                  metadata: updateMetadata,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', verificationRequest.id)
                .select()
                .single();

              if (requestError) {
                throw requestError;
              }

              updatedRecords.verification = updatedRequest;

              // Create audit record if table exists
              try {
                await supabaseAdmin
                  .from('id_verification_audits')
                  .insert({
                    request_id: verificationRequest.id,
                    action: 'override_approved',
                    performed_by: user.id,
                    notes: notes || 'Approved by admin in person',
                    metadata: {
                      previous_status: verificationRequest.status,
                    },
                  });
              } catch (auditError) {
                // Audit table might not exist, log but don't fail
                logger.warn('Failed to create audit record', {
                  component: 'admin-completion-steps-api',
                  action: 'audit_record_failed',
                  metadata: { bookingId, step },
                });
              }
            } else {
              // No verification request exists - update user directly
              if (booking.customerId) {
                const { error: userError } = await supabaseAdmin
                  .from('users')
                  .update({
                    drivers_license_verified_at: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  })
                  .eq('id', booking.customerId);

                if (userError) {
                  throw userError;
                }

                updatedRecords.user = { id: booking.customerId, drivers_license_verified_at: new Date().toISOString() };
              }
            }
            break;
          }

          case 'payment_completed': {
            // Check for existing payment
            const { data: existingPayment } = await supabaseAdmin
              .from('payments')
              .select('id, status, amount, type, paymentNumber')
              .eq('bookingId', bookingId)
              .eq('type', 'payment')
              .maybeSingle();

            if (existingPayment) {
              // Update existing payment
              const { data: updatedPayment, error: paymentError } = await supabaseAdmin
                .from('payments')
                .update({
                  status: 'completed',
                  processedAt: new Date().toISOString(),
                  method: paymentMethod || 'cash',
                  description: (existingPayment.description || '') +
                    `\nCompleted by admin: ${notes || 'In-person payment'}`,
                  updatedAt: new Date().toISOString(),
                })
                .eq('id', existingPayment.id)
                .select()
                .single();

              if (paymentError) {
                throw paymentError;
              }

              updatedRecords.payment = updatedPayment;
            } else {
              // Create new payment record
              const paymentNumber = generatePaymentNumber();
              const amount = paymentAmount || booking.totalAmount || booking.balanceDue || 0;

              const { data: newPayment, error: paymentError } = await supabaseAdmin
                .from('payments')
                .insert({
                  bookingId: bookingId,
                  amount: amount,
                  paymentNumber: paymentNumber,
                  type: 'payment',
                  status: 'completed',
                  method: paymentMethod || 'cash',
                  description: `Payment completed by admin - ${notes || 'in-person payment'}`,
                  processedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
                .select()
                .single();

              if (paymentError) {
                throw paymentError;
              }

              updatedRecords.payment = newPayment;
            }

            // Update booking status if needed
            if (booking.status !== 'paid') {
              await supabaseAdmin
                .from('bookings')
                .update({
                  status: 'paid',
                  lastModifiedBy: user.id,
                  updatedAt: new Date().toISOString(),
                })
                .eq('id', bookingId);
            }
            break;
          }

          case 'deposit_paid': {
            // Set payment method ID if not set
            if (!booking.stripe_payment_method_id) {
              await supabaseAdmin
                .from('bookings')
                .update({
                  stripe_payment_method_id: `admin_override_${bookingId}_${Date.now()}`,
                  depositPaid: true,
                  depositPaidAt: new Date().toISOString(),
                  lastModifiedBy: user.id,
                  updatedAt: new Date().toISOString(),
                })
                .eq('id', bookingId);
            }

            // Also create deposit payment record if doesn't exist
            const { data: depositPayment } = await supabaseAdmin
              .from('payments')
              .select('id')
              .eq('bookingId', bookingId)
              .eq('type', 'deposit')
              .maybeSingle();

            if (!depositPayment && booking.securityDeposit) {
              const paymentNumber = generatePaymentNumber();
              const { data: newDeposit, error: depositError } = await supabaseAdmin
                .from('payments')
                .insert({
                  bookingId: bookingId,
                  amount: booking.securityDeposit,
                  paymentNumber: paymentNumber,
                  type: 'deposit',
                  status: 'completed',
                  method: paymentMethod || 'cash',
                  description: `Security deposit verified by admin - ${notes || ''}`,
                  processedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
                .select()
                .single();

              if (depositError) {
                throw depositError;
              }

              updatedRecords.deposit = newDeposit;
            }
            break;
          }
        }

        // Log audit trail
        try {
          await supabaseAdmin
            .from('audit_logs')
            .insert({
              table_name: 'bookings',
              record_id: bookingId,
              action: 'admin_step_completion',
              user_id: user.id,
              old_values: { [step]: false },
              new_values: { [step]: true },
              metadata: {
                step: step,
                notes: notes,
                completed_by: adminName,
                completed_at: new Date().toISOString(),
              },
            });
        } catch (auditError) {
          // Audit logging failure shouldn't break the operation
          logger.warn('Failed to create audit log', {
            component: 'admin-completion-steps-api',
            action: 'audit_log_failed',
            metadata: { bookingId, step },
          });
        }

        // Check if booking should be auto-confirmed
        try {
          await checkAndCompleteBookingIfReady(bookingId, step);
        } catch (completionError) {
          // Auto-completion failure shouldn't break the operation
          logger.warn('Failed to check booking completion', {
            component: 'admin-completion-steps-api',
            action: 'completion_check_failed',
            metadata: { bookingId, step },
          });
        }

        // Fetch updated booking
        const { data: updatedBooking } = await supabaseAdmin
          .from('bookings')
          .select('id, bookingNumber, status')
          .eq('id', bookingId)
          .single();

        logger.info('Step completed successfully', {
          component: 'admin-completion-steps-api',
          action: 'step_completed',
          metadata: {
            bookingId,
            step,
            adminId: user.id,
            adminName,
          },
        });

        // Generate signed URL for file if uploaded
        let fileUrl: string | null = null;
        if (uploadedFileUrl) {
          const bucketMap: Record<string, string> = {
            contract_signed: 'contracts',
            insurance_uploaded: 'insurance-documents',
            license_uploaded: 'driver-licenses',
          };
          const bucket = bucketMap[step];
          if (bucket) {
            try {
              const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
                .from(bucket)
                .createSignedUrl(uploadedFileUrl, 3600 * 24 * 365); // 1 year

              if (signedUrlError) {
                logger.warn('Failed to generate signed URL', {
                  component: 'admin-completion-steps-api',
                  action: 'signed_url_failed',
                  metadata: { bookingId, step, bucket, path: uploadedFileUrl, error: signedUrlError.message },
                });
                // Fall back to storage path if signed URL fails
                fileUrl = uploadedFileUrl;
              } else if (signedUrlData?.signedUrl) {
                fileUrl = signedUrlData.signedUrl;
              } else {
                fileUrl = uploadedFileUrl;
              }
            } catch (signedUrlErr) {
              logger.warn('Error generating signed URL', {
                component: 'admin-completion-steps-api',
                action: 'signed_url_error',
                metadata: { bookingId, step, bucket, path: uploadedFileUrl },
              });
              fileUrl = uploadedFileUrl;
            }
          } else {
            fileUrl = uploadedFileUrl;
          }
        }

        return NextResponse.json({
          success: true,
          step,
          completed,
          booking: updatedBooking,
          updatedRecords,
          fileUrl: fileUrl || uploadedFileUrl || null,
        });
      } catch (error) {
        logger.error(
          'Failed to complete step',
          {
            component: 'admin-completion-steps-api',
            action: 'step_completion_error',
            metadata: { bookingId, step, adminId: user.id },
          },
          error instanceof Error ? error : new Error(String(error))
        );

        return NextResponse.json(
          {
            error: 'Failed to complete step',
            details: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    } catch (error) {
      logger.error(
        'Unexpected error in completion steps API',
        {
          component: 'admin-completion-steps-api',
          action: 'unexpected_error',
        },
        error instanceof Error ? error : new Error(String(error))
      );

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

