/**
 * Automatic Equipment Embedding Generation Utility
 *
 * Generates embeddings automatically for equipment items.
 * Called automatically when equipment is created or updated.
 */

import { buildEquipmentText } from '@/lib/embeddings/build-equipment-text';
import { generateEmbedding, embeddingToVectorString } from '@/lib/embeddings/generate';
import { getEquipmentSynonymsBatch } from '@/lib/embeddings/get-synonyms';
import { logger } from '@/lib/logger';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Automatically generate and update embedding for a single equipment item
 *
 * @param equipmentId - UUID of the equipment item
 * @returns Promise<void> - Resolves when embedding is generated and saved
 */
export async function generateEquipmentEmbedding(equipmentId: string): Promise<void> {
  const supabase = await createServiceClient();

  if (!supabase) {
    throw new Error('Failed to create Supabase service client');
  }

  try {
    // Fetch equipment with all necessary data
    const { data: equipment, error: fetchError } = await supabase
      .from('equipment')
      .select(
        `
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
      `
      )
      .eq('id', equipmentId)
      .single();

    if (fetchError || !equipment) {
      throw new Error(`Failed to fetch equipment: ${fetchError?.message || 'Not found'}`);
    }

    // Fetch synonyms and type description in batch
    const synonymsMap = await getEquipmentSynonymsBatch([equipment.type]);

    const { data: typeDescriptions } = await supabase
      .from('equipment_type_descriptions')
      .select('equipment_type, full_name, description, typical_uses, key_features')
      .eq('equipment_type', equipment.type)
      .eq('is_active', true)
      .single();

    const category = Array.isArray(equipment.equipment_categories)
      ? equipment.equipment_categories[0]
      : equipment.equipment_categories;

    const synonyms = synonymsMap.get(equipment.type) || [];
    const typeDescription = typeDescriptions || undefined;

    // Build enhanced searchable text
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
        synonyms,
      },
      category,
      typeDescription
    );

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
      .eq('id', equipmentId);

    if (updateError) {
      throw updateError;
    }

    logger.info('Equipment embedding generated automatically', {
      component: 'embeddings-auto-generate',
      action: 'embedding_generated',
      metadata: { equipmentId },
    });
  } catch (error) {
    logger.error(
      'Failed to automatically generate equipment embedding',
      {
        component: 'embeddings-auto-generate',
        action: 'embedding_failed',
        metadata: { equipmentId },
      },
      error instanceof Error ? error : undefined
    );
    // Don't throw - we don't want embedding failures to break equipment updates
    // Embeddings can be regenerated manually if needed
  }
}

