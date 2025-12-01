/**
 * Direct Embedding Generation Script
 *
 * Generates embeddings for all equipment using the service client.
 * This bypasses the API endpoint and generates embeddings directly.
 *
 * Run with: npx tsx scripts/generate-embeddings-direct.ts
 */

import { buildEquipmentText } from '../frontend/src/lib/embeddings/build-equipment-text';
import { generateEmbedding, embeddingToVectorString } from '../frontend/src/lib/embeddings/generate';
import { logger } from '../frontend/src/lib/logger';
import { createServiceClient } from '../frontend/src/lib/supabase/service';

async function generateEmbeddings() {
  console.log('🚀 Starting embedding generation...\n');

  const supabase = createServiceClient();
  const batchSize = 10;

  try {
    // Fetch equipment that needs embeddings
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
        homeLocationId,
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
      console.error('❌ Error fetching equipment:', fetchError.message);
      process.exit(1);
    }

    if (!equipmentList || equipmentList.length === 0) {
      console.log('✅ No equipment needs embeddings. All done!');
      return;
    }

    console.log(`📦 Found ${equipmentList.length} equipment items to process\n`);

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process in batches
    for (let i = 0; i < equipmentList.length; i += batchSize) {
      const batch = equipmentList.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)...`);

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

            // Validate minimum text length
            if (searchableText.trim().length < 50) {
              console.warn(`⚠️  Equipment ${equipment.unitId} text is too short (${searchableText.trim().length} chars)`);
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
            console.log(`  ✅ ${equipment.unitId || equipment.model} - embedding generated`);
          } catch (error) {
            results.failed++;
            const errorMsg = error instanceof Error ? error.message : String(error);
            results.errors.push(`${equipment.unitId || equipment.id}: ${errorMsg}`);
            console.error(`  ❌ ${equipment.unitId || equipment.model} - ${errorMsg}`);
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < equipmentList.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log('\n✨ Embedding generation complete!');
    console.log(`   Processed: ${results.processed}`);
    console.log(`   Failed: ${results.failed}`);
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach((err) => console.log(`   - ${err}`));
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
generateEmbeddings()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


