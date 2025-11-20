import { readFile } from 'fs/promises';
import { join } from 'path';

import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  try {
    const filePath = join(process.cwd(), 'public', 'downloads', 'equipment-rental-checklist.pdf');
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="equipment-rental-checklist.pdf"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    logger.error(
      'Error serving PDF',
      {
        component: 'app-route',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }
}
