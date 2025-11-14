import { createHash } from 'node:crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

let cachedBuffer: Buffer | null = null;
let cachedEtag: string | null = null;

export async function GET(request: NextRequest) {
  try {
    if (!cachedBuffer) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('email_brand_assets')
        .select('base64')
        .eq('asset_name', 'email_logo_primary')
        .maybeSingle();

      if (error || !data) {
        logger.error(
          'Failed to load email logo from Supabase',
          {
            component: 'email-logo-route',
            action: 'supabase_fetch_error',
          },
          error ?? new Error('Logo not found')
        );
        return NextResponse.json({ error: 'Logo not available' }, { status: 404 });
      }

      cachedBuffer = Buffer.from(data.base64, 'base64');
      cachedEtag = createHash('sha256').update(cachedBuffer).digest('hex');
    }

    if (cachedEtag && request.headers.get('if-none-match') === cachedEtag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          ETag: cachedEtag,
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new NextResponse(cachedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: cachedEtag ?? '',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error(
      'Unexpected error while serving email logo',
      {
        component: 'email-logo-route',
        action: 'unexpected_error',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Logo unavailable' }, { status: 500 });
  }
}
