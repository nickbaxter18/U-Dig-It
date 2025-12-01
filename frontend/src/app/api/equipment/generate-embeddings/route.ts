/**
 * Generate Embeddings API
 *
 * Generates embeddings for equipment descriptions.
 * This endpoint can be called to populate embeddings for existing equipment.
 */

import { NextRequest, NextResponse } from 'next/server';

import { buildEquipmentText } from '@/lib/embeddings/build-equipment-text';
import { generateEmbedding, embeddingToVectorString } from '@/lib/embeddings/generate';
import { getEquipmentSynonymsBatch } from '@/lib/embeddings/get-synonyms';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/equipment/generate-embeddings
 *
 * Generates embeddings for equipment items.
 *
 * Body:
 * - equipmentIds?: string[] - Optional array of equipment IDs to process
 * - batchSize?: number - Number of items to process per batch (default: 10)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { equipmentIds, batchSize = 10 } = body;

    const supabase = await createServiceClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to create Supabase service client' },
        { status: 500 }
      );
    }

    // Build query to get equipment that needs embeddings
    // Include category information via LEFT JOIN
    let query = supabase
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
      .is('description_embedding', null); // Only get items without embeddings

    // Note: We'll fetch type descriptions separately in batch for better performance

    if (equipmentIds && Array.isArray(equipmentIds) && equipmentIds.length > 0) {
      query = query.in('id', equipmentIds);
    }

    const { data: equipmentList, error: fetchError } = await query;

    if (fetchError) {
      logger.error(
        'Failed to fetch equipment for embedding generation',
        {
          component: 'api-generate-embeddings',
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
        message: 'No equipment found that needs embeddings',
        processed: 0,
        total: 0,
      });
    }

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Fetch all synonyms and type descriptions for all equipment types in batch (optimization)
    const uniqueEquipmentTypes = [...new Set(equipmentList.map((eq: { type: string }) => eq.type))];
    const synonymsMap = await getEquipmentSynonymsBatch(uniqueEquipmentTypes);

    // Fetch type descriptions in batch
    const { data: typeDescriptions, error: typeDescError } = await supabase
      .from('equipment_type_descriptions')
      .select('equipment_type, full_name, description, typical_uses, key_features')
      .in('equipment_type', uniqueEquipmentTypes)
      .eq('is_active', true);

    if (typeDescError) {
      logger.warn('Failed to fetch type descriptions, continuing without them', {
        component: 'api-generate-embeddings',
        action: 'type_desc_fetch_error',
        metadata: { error: typeDescError.message },
      });
    }

    // Create map of type descriptions for quick lookup
    const typeDescMap = new Map<string, { full_name?: string; description?: string; typical_uses?: string[]; key_features?: string[] }>();
    if (typeDescriptions) {
      for (const desc of typeDescriptions) {
        typeDescMap.set(desc.equipment_type, {
          full_name: desc.full_name,
          description: desc.description,
          typical_uses: desc.typical_uses,
          key_features: desc.key_features,
        });
      }
    }

    // Process in batches
    for (let i = 0; i < equipmentList.length; i += batchSize) {
      const batch = equipmentList.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (equipment) => {
          try {
            // Build enhanced searchable text using the text builder
            const category = Array.isArray(equipment.equipment_categories)
              ? equipment.equipment_categories[0]
              : equipment.equipment_categories;

            // Get synonyms and type description for this equipment type (from batch fetch)
            const synonyms = synonymsMap.get(equipment.type) || [];
            const typeDescription = typeDescMap.get(equipment.type);

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
                synonyms, // Pass pre-fetched synonyms
              },
              category,
              typeDescription // Pass type description
            );

            // Validate minimum text length
            if (searchableText.trim().length < 50) {
              logger.warn('Equipment text is too short for quality embedding', {
                component: 'api-generate-embeddings',
                action: 'text_too_short',
                metadata: {
                  equipmentId: equipment.id,
                  textLength: searchableText.trim().length,
                },
              });
              // Continue anyway - the text builder should have added fallback text
            }

            // Generate embedding
            const embedding = await generateEmbedding(searchableText);

            // Convert to PostgreSQL vector format
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
              'Failed to generate embedding for equipment',
              {
                component: 'api-generate-embeddings',
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
      message: 'Embedding generation completed',
      processed: results.processed,
      failed: results.failed,
      total: equipmentList.length,
      errors: results.errors.slice(0, 10), // Limit error details
    });
  } catch (error) {
    logger.error(
      'Embedding generation request error',
      {
        component: 'api-generate-embeddings',
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


