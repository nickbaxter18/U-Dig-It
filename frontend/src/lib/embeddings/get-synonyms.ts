/**
 * Equipment Synonym Lookup Utility
 *
 * Fetches equipment synonyms from the database for enhanced semantic search.
 * Falls back to hardcoded mappings if database unavailable.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

interface Synonym {
  synonym: string;
  synonym_type: 'primary_name' | 'alias' | 'abbreviation' | 'common_search_term' | 'cross_reference';
  priority: number;
}

/**
 * Get synonyms for an equipment type from database
 * 
 * @param equipmentType - Equipment type code (e.g., 'svl75')
 * @param includeCrossReferences - Whether to include cross-references (default: true)
 * @returns Array of synonym strings, sorted by priority
 */
export async function getEquipmentSynonymsFromDB(
  equipmentType: string,
  includeCrossReferences: boolean = true
): Promise<string[]> {
  try {
    const supabase = await createServiceClient();
    
    if (!supabase) {
      logger.warn('Supabase service client unavailable, using fallback synonyms', {
        component: 'get-synonyms',
        action: 'fallback',
        metadata: { equipmentType },
      });
      return getEquipmentSynonymsFallback(equipmentType);
    }

    let query = supabase
      .from('equipment_synonyms')
      .select('synonym, synonym_type, priority')
      .eq('equipment_type', equipmentType)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (!includeCrossReferences) {
      query = query.neq('synonym_type', 'cross_reference');
    }

    const { data, error } = await query;

    if (error) {
      logger.warn('Failed to fetch synonyms from database, using fallback', {
        component: 'get-synonyms',
        action: 'fetch_error',
        metadata: { equipmentType, error: error.message },
      });
      return getEquipmentSynonymsFallback(equipmentType);
    }

    if (!data || data.length === 0) {
      // No synonyms in database, use fallback
      return getEquipmentSynonymsFallback(equipmentType);
    }

    // Return synonyms sorted by priority (already sorted by query, but ensure order)
    return data.map((s: Synonym) => s.synonym);
  } catch (error) {
    logger.warn('Error fetching synonyms from database, using fallback', {
      component: 'get-synonyms',
      action: 'error',
      metadata: {
        equipmentType,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return getEquipmentSynonymsFallback(equipmentType);
  }
}

/**
 * Fallback hardcoded synonym mapping
 * Used when database is unavailable or has no entries
 */
function getEquipmentSynonymsFallback(equipmentType: string): string[] {
  const typeLower = equipmentType.toLowerCase();
  const synonyms: string[] = [];

  // Compact Track Loader synonyms
  if (typeLower.includes('track') && typeLower.includes('loader')) {
    synonyms.push('CTL', 'compact track loader', 'tracked loader');
  }
  if (typeLower.includes('svl')) {
    synonyms.push('compact track loader', 'CTL', 'skid steer', 'track loader', 'tracked loader');
  }

  // Excavator synonyms
  if (typeLower.includes('excavator')) {
    if (typeLower.includes('mini')) {
      synonyms.push('mini excavator', 'compact excavator');
    }
  }

  // Skid Steer synonyms
  if (typeLower.includes('skid') || typeLower.includes('steer')) {
    synonyms.push('skid steer loader', 'SSL');
  }

  return synonyms;
}

/**
 * Batch fetch synonyms for multiple equipment types
 * Useful when processing multiple equipment items
 */
export async function getEquipmentSynonymsBatch(
  equipmentTypes: string[]
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();

  try {
    const supabase = await createServiceClient();
    
    if (!supabase) {
      // Fallback to individual lookups
      for (const type of equipmentTypes) {
        results.set(type, getEquipmentSynonymsFallback(type));
      }
      return results;
    }

    const { data, error } = await supabase
      .from('equipment_synonyms')
      .select('equipment_type, synonym, priority')
      .in('equipment_type', equipmentTypes)
      .eq('is_active', true)
      .order('equipment_type')
      .order('priority', { ascending: false });

    if (error) {
      logger.warn('Failed to fetch batch synonyms, using fallback', {
        component: 'get-synonyms',
        action: 'batch_fetch_error',
        metadata: { error: error.message },
      });
      // Fallback
      for (const type of equipmentTypes) {
        results.set(type, getEquipmentSynonymsFallback(type));
      }
      return results;
    }

    // Group by equipment_type
    const synonymMap = new Map<string, string[]>();
    for (const row of data || []) {
      const type = row.equipment_type;
      if (!synonymMap.has(type)) {
        synonymMap.set(type, []);
      }
      synonymMap.get(type)!.push(row.synonym);
    }

    // Ensure all types have entries (use fallback if missing)
    for (const type of equipmentTypes) {
      if (synonymMap.has(type)) {
        results.set(type, synonymMap.get(type)!);
      } else {
        results.set(type, getEquipmentSynonymsFallback(type));
      }
    }

    return results;
  } catch (error) {
    logger.warn('Error fetching batch synonyms, using fallback', {
      component: 'get-synonyms',
      action: 'batch_error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    // Fallback
    for (const type of equipmentTypes) {
      results.set(type, getEquipmentSynonymsFallback(type));
    }
    return results;
  }
}



