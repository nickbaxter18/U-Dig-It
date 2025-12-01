import { NextRequest, NextResponse } from 'next/server';

import { buildEquipmentText } from '@/lib/embeddings/build-equipment-text';
import { generateEmbedding, embeddingToVectorString } from '@/lib/embeddings/generate';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/equipment/regenerate-stale-embeddings
 *
 * Regenerates embeddings for equipment that have NULL description_embedding
 * (i.e., equipment that was marked as stale by the database trigger)
 *
 * Body:
 * - batchSize?: number - Number of items to process per batch (default: 10)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchSize = 10 } = body;

    const supabase = createServiceClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to create Supabase service client' },
        { status: 500 }
      );
    }

    // Get equipment that needs embeddings (NULL description_embedding)
    const { data: equipmentList, error: fetchError } = await supabase
      .from('equipment')
      .select(`
        id,
        description,
        make,
        model,
        year,
        type,
        unitId,
        notes,
        specifications,
        category_id,
        subcategory,
        location,
        home_location_id,
        equipment_categories (
          id,
          name,
          description,
          typical_applications,
          search_keywords
        )
      `)
      .is('description_embedding', null);

    if (fetchError) {
      logger.error(
        'Failed to fetch equipment for embedding regeneration',
        {
          component: 'api-regenerate-stale-embeddings',
          action: 'fetch_error',
          metadata: { error: fetchError.message },
        },
        fetchError
      );
      return NextResponse.json(
        { error: 'Failed to fetch equipment', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!equipmentList || equipmentList.length === 0) {
      return NextResponse.json({
        message: 'No stale embeddings found - all equipment has embeddings',
        processed: 0,
        failed: 0,
        total: 0,
      });
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process in batches
    for (let i = 0; i < equipmentList.length; i += batchSize) {
      const batch = equipmentList.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (equipment) => {
          try {
            // Build enhanced searchable text
            const category = Array.isArray(equipment.equipment_categories)
              ? equipment.equipment_categories[0]
              : equipment.equipment_categories;

            const searchableText = buildEquipmentText(
              {
                id: equipment.id,
                make: equipment.make,
                model: equipment.model,
                year: equipment.year,
                type: equipment.type,
                unitId: equipment.unitId,
                description: equipment.description || '',
                notes: equipment.notes,
                specifications: equipment.specifications,
                category_id: equipment.category_id,
                subcategory: equipment.subcategory,
                location: equipment.location,
                homeLocationId: equipment.homeLocationId,
              },
              category
            );

            // Generate embedding
            const embedding = await generateEmbedding(searchableText);
            const vectorString = embeddingToVectorString(embedding);

            // Update equipment with embedding
            const { error: updateError } = await supabase
              .from('equipment')
              .update({
                description_embedding: vectorString,
              })
              .eq('id', equipment.id);

            if (updateError) {
              throw updateError;
            }

            results.processed++;
          } catch (error) {
            results.failed++;
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            results.errors.push(`Equipment ${equipment.id}: ${errorMessage}`);

            logger.error(
              'Failed to regenerate embedding for equipment',
              {
                component: 'api-regenerate-stale-embeddings',
                action: 'embedding_error',
                metadata: {
                  equipmentId: equipment.id,
                  error: errorMessage,
                },
              },
              error instanceof Error ? error : undefined
            );
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < equipmentList.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({
      message: 'Stale embedding regeneration completed',
      processed: results.processed,
      failed: results.failed,
      total: equipmentList.length,
      errors: results.errors.slice(0, 10), // Limit error details
    });
  } catch (error) {
    logger.error(
      'Stale embedding regeneration request error',
      {
        component: 'api-regenerate-stale-embeddings',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}



