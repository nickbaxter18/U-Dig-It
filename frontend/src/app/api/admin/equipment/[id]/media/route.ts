import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { createServiceClient } from '@/lib/supabase/service';
import {
  equipmentMediaCreateSchema,
  equipmentMediaDeleteSchema,
} from '@/lib/validators/admin/equipment';

const BUCKET_ID = 'equipment-media';

function buildStoragePath(equipmentId: string, fileName: string) {
  const sanitized = fileName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
  return `${equipmentId}/${randomUUID()}-${sanitized}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const { data, error: fetchError } = await supabase
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
      `
      )
      .eq('equipment_id', params.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error(
        'Failed to fetch equipment media',
        {
          component: 'admin-equipment-media',
          action: 'fetch_failed',
          metadata: { equipmentId: params.id },
        },
        fetchError
      );
      return NextResponse.json({ error: 'Unable to load equipment media' }, { status: 500 });
    }

    return NextResponse.json({ media: data ?? [] });
  } catch (err) {
    logger.error(
      'Unexpected error fetching equipment media',
      {
        component: 'admin-equipment-media',
        action: 'fetch_unexpected',
        metadata: { equipmentId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user, error } = await requireAdmin(request);
    if (error) return error;

    const payload = equipmentMediaCreateSchema.parse(await request.json());
    const serviceClient = createServiceClient();

    if (!serviceClient) {
      logger.error('Service role client unavailable for equipment media upload', {
        component: 'admin-equipment-media',
        action: 'service_client_missing',
      });
      return NextResponse.json(
        { error: 'Storage configuration not available' },
        { status: 500 }
      );
    }

    if (payload.isPrimary) {
      await supabase
        .from('equipment_media')
        .update({ is_primary: false })
        .eq('equipment_id', params.id);
    }

    const storagePath = buildStoragePath(params.id, payload.fileName);
    const { data: signedUpload, error: signedError } = await serviceClient.storage
      .from(BUCKET_ID)
      .createSignedUploadUrl(storagePath, {
        contentType: payload.contentType,
        upsert: false,
      });

    if (signedError || !signedUpload) {
      logger.error(
        'Failed to create signed upload URL for equipment media',
        {
          component: 'admin-equipment-media',
          action: 'signed_url_failed',
          metadata: { equipmentId: params.id, fileName: payload.fileName },
        },
        signedError ?? new Error('Missing upload data')
      );
      return NextResponse.json(
        { error: 'Unable to create signed upload URL' },
        { status: 500 }
      );
    }

    const { data: mediaRow, error: insertError } = await supabase
      .from('equipment_media')
      .insert({
        equipment_id: params.id,
        media_type: payload.mediaType,
        storage_path: storagePath,
        caption: payload.caption ?? null,
        metadata: payload.metadata ?? {},
        is_primary: payload.isPrimary ?? false,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError || !mediaRow) {
      logger.error(
        'Failed to create equipment media record',
        {
          component: 'admin-equipment-media',
          action: 'insert_failed',
          metadata: { equipmentId: params.id, fileName: payload.fileName },
        },
        insertError ?? new Error('Missing media row')
      );
      return NextResponse.json(
        { error: 'Unable to create equipment media record' },
        { status: 500 }
      );
    }

    if (payload.isPrimary) {
      await supabase
        .from('equipment')
        .update({ primary_media_id: mediaRow.id })
        .eq('id', params.id);
    }

    logger.info('Created equipment media upload session', {
      component: 'admin-equipment-media',
      action: 'media_created',
      metadata: { equipmentId: params.id, mediaId: mediaRow.id, adminId: user.id },
    });

    return NextResponse.json({
      upload: signedUpload,
      media: mediaRow,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: err.issues },
        { status: 400 }
      );
    }

    logger.error(
      'Unexpected error creating equipment media',
      {
        component: 'admin-equipment-media',
        action: 'create_unexpected',
        metadata: { equipmentId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Internal server error while creating equipment media' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, error } = await requireAdmin(request);
    if (error) return error;

    const payload = equipmentMediaDeleteSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: payload.error.issues },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Storage configuration not available' },
        { status: 500 }
      );
    }

    const { data: mediaRow, error: fetchError } = await supabase
      .from('equipment_media')
      .select('*')
      .eq('id', payload.data.mediaId)
      .eq('equipment_id', params.id)
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
      return NextResponse.json(
        { error: 'Unable to load equipment media' },
        { status: 500 }
      );
    }

    if (!mediaRow) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const { error: storageError } = await serviceClient.storage
      .from(BUCKET_ID)
      .remove([mediaRow.storage_path]);

    if (storageError) {
      logger.warn(
        'Failed to remove equipment media object from storage',
        {
          component: 'admin-equipment-media',
          action: 'storage_remove_failed',
          metadata: { mediaId: mediaRow.id, path: mediaRow.storage_path },
        },
        storageError
      );
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
      return NextResponse.json(
        { error: 'Unable to delete equipment media' },
        { status: 500 }
      );
    }

    if (mediaRow.is_primary) {
      await supabase
        .from('equipment')
        .update({ primary_media_id: null })
        .eq('id', params.id);
    }

    logger.info('Equipment media deleted', {
      component: 'admin-equipment-media',
      action: 'media_deleted',
      metadata: { equipmentId: params.id, mediaId: mediaRow.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error(
      'Unexpected error deleting equipment media',
      {
        component: 'admin-equipment-media',
        action: 'delete_unexpected',
        metadata: { equipmentId: params.id },
      },
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Internal server error while deleting equipment media' },
      { status: 500 }
    );
  }
}


