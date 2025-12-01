/**
 * Query Expansion Utility
 *
 * Expands user search queries with synonyms to improve semantic search results.
 * Enables queries like "skid steer" to find "compact track loader" equipment.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { logger } from '@/lib/logger';

interface ExpandedQuery {
  originalQuery: string;
  expandedTerms: string[];
  allTerms: string[]; // original + expanded
}

/**
 * Expand a user query with synonyms from the database
 *
 * @param query - Original user query (e.g., "skid steer")
 * @returns Expanded query with original + synonyms
 */
export async function expandQuery(query: string): Promise<ExpandedQuery> {
  if (!query || query.trim().length === 0) {
    return {
      originalQuery: query,
      expandedTerms: [],
      allTerms: [query],
    };
  }

  const normalizedQuery = query.trim().toLowerCase();
  const expandedTerms: Set<string> = new Set();

  try {
    const supabase = await createServiceClient();

    if (!supabase) {
      logger.warn('Supabase service client unavailable for query expansion', {
        component: 'expand-query',
        action: 'fallback',
        metadata: { query },
      });
      return {
        originalQuery: query,
        expandedTerms: [],
        allTerms: [query],
      };
    }

    // Search for synonyms that match the query
    // This will find synonyms that contain the query or are related
    const { data: matchingSynonyms, error } = await supabase
      .from('equipment_synonyms')
      .select('equipment_type, synonym, synonym_type, priority')
      .eq('is_active', true)
      .or(`synonym.ilike.%${normalizedQuery}%,synonym.ilike.${normalizedQuery}%`)
      .order('priority', { ascending: false })
      .limit(20);

    if (error) {
      logger.warn('Failed to fetch synonyms for query expansion', {
        component: 'expand-query',
        action: 'fetch_error',
        metadata: { query, error: error.message },
      });
      return {
        originalQuery: query,
        expandedTerms: [],
        allTerms: [query],
      };
    }

    if (matchingSynonyms && matchingSynonyms.length > 0) {
      // Found matching synonyms - expand query with all related synonyms for those equipment types
      const equipmentTypes = [...new Set(matchingSynonyms.map((s: { equipment_type: string }) => s.equipment_type))];

      // Fetch all synonyms for the matching equipment types
      const { data: allSynonyms, error: allError } = await supabase
        .from('equipment_synonyms')
        .select('synonym, synonym_type, priority')
        .in('equipment_type', equipmentTypes)
        .eq('is_active', true)
        .neq('synonym_type', 'cross_reference') // Exclude cross-references to avoid over-expansion
        .order('priority', { ascending: false });

      if (!allError && allSynonyms) {
        // Add all synonyms (excluding the original query itself)
        for (const synonym of allSynonyms) {
          const synonymLower = synonym.synonym.toLowerCase();
          if (synonymLower !== normalizedQuery && !synonymLower.includes(normalizedQuery)) {
            expandedTerms.add(synonym.synonym);
          }
        }
      }

      // Also add the matching synonyms directly
      for (const synonym of matchingSynonyms) {
        if (synonym.synonym.toLowerCase() !== normalizedQuery) {
          expandedTerms.add(synonym.synonym);
        }
      }
    }

    // Also check for exact matches that might trigger reverse lookup
    // (e.g., if query is "CTL", find all equipment types that have "CTL" as synonym)
    const { data: exactMatches } = await supabase
      .from('equipment_synonyms')
      .select('equipment_type')
      .ilike('synonym', normalizedQuery)
      .eq('is_active', true)
      .limit(10);

    if (exactMatches && exactMatches.length > 0) {
      const matchedTypes = [...new Set(exactMatches.map((m: { equipment_type: string }) => m.equipment_type))];
      
      // Fetch all synonyms for these types
      const { data: typeSynonyms } = await supabase
        .from('equipment_synonyms')
        .select('synonym')
        .in('equipment_type', matchedTypes)
        .eq('is_active', true)
        .neq('synonym_type', 'cross_reference');

      if (typeSynonyms) {
        for (const synonym of typeSynonyms) {
          if (synonym.synonym.toLowerCase() !== normalizedQuery) {
            expandedTerms.add(synonym.synonym);
          }
        }
      }
    }

    const expandedArray = Array.from(expandedTerms);
    const allTerms = [query, ...expandedArray];

    logger.debug('Query expanded', {
      component: 'expand-query',
      action: 'expand',
      metadata: {
        originalQuery: query,
        expandedCount: expandedArray.length,
        expandedTerms: expandedArray.slice(0, 10), // Log first 10
      },
    });

    return {
      originalQuery: query,
      expandedTerms: expandedArray,
      allTerms,
    };
  } catch (error) {
    logger.warn('Error expanding query', {
      component: 'expand-query',
      action: 'error',
      metadata: {
        query,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return {
      originalQuery: query,
      expandedTerms: [],
      allTerms: [query],
    };
  }
}

/**
 * Expand multiple query terms
 * Useful for complex queries with multiple words
 */
export async function expandQueryTerms(terms: string[]): Promise<ExpandedQuery> {
  if (terms.length === 0) {
    return {
      originalQuery: '',
      expandedTerms: [],
      allTerms: [],
    };
  }

  const originalQuery = terms.join(' ');
  const allExpandedTerms: Set<string> = new Set();

  // Expand each term individually
  for (const term of terms) {
    const expanded = await expandQuery(term);
    for (const expandedTerm of expanded.expandedTerms) {
      allExpandedTerms.add(expandedTerm);
    }
  }

  return {
    originalQuery,
    expandedTerms: Array.from(allExpandedTerms),
    allTerms: [originalQuery, ...Array.from(allExpandedTerms)],
  };
}



