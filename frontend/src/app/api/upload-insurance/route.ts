import { logger } from '@/lib/logger';
import { RateLimitPresets, rateLimit } from '@/lib/rate-limiter';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for file uploads
    const rateLimitResult = await rateLimit(request, RateLimitPresets.STRICT);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many upload attempts. Please wait before trying again.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const formData = await request.formData();
    const file = formData.get('insurance') as File;
    const bookingNumber = formData.get('bookingNumber') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!bookingNumber) {
      return NextResponse.json({ error: 'Booking number required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Please upload a PDF, JPEG, or PNG file.',
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'File too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'insurance');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${bookingNumber}-${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // In a real application, you would:
    // 1. Save file metadata to database
    // 2. Update booking status
    // 3. Send notification to admin team
    // 4. Trigger insurance review workflow

    logger.debug('Insurance certificate uploaded', {
      component: 'api-upload-insurance',
      action: 'debug',
      metadata: { bookingNumber, fileName },
    });

    return NextResponse.json({
      success: true,
      message: 'Insurance certificate uploaded successfully',
      fileName: fileName,
      bookingNumber: bookingNumber,
    });
  } catch (error) {
    logger.error('Insurance upload error', {
      component: 'api-upload-insurance',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        error: 'Failed to upload file. Please try again.',
      },
      { status: 500 }
    );
  }
}
