import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface SearchSuggestion {
  suggestion: string;
  similarity: number;
  sourceType: 'make' | 'model' | 'unit_id' | 'type';
}

/**
 * GET /api/equipment/search/suggestions?query=...
 * Returns "Did you mean?" suggestions based on trigram similarity
 * Uses pg_trgm extension for typo tolerance
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const supabase = await createClient();

    // Call the suggest_search_terms database function
    const { data: suggestions, error } = await supabase.rpc('suggest_search_terms', {
      search_query: query.trim(),
      similarity_threshold: 0.2, // Lower threshold for more suggestions
      max_suggestions: 5,
    });

    if (error) {
      logger.warn('Failed to fetch search suggestions', {
        component: 'api-search-suggestions',
        action: 'suggest_error',
        metadata: { error: error.message, query },
      });
      // Don't fail the request if suggestions fail - just return empty
      return NextResponse.json({ suggestions: [] });
    }

    // Transform database results to match frontend interface
    const transformedSuggestions: SearchSuggestion[] = (suggestions || []).map((s: {
      suggestion: string;
      similarity: number;
      source_type: string;
    }) => ({
      suggestion: s.suggestion,
      similarity: s.similarity,
      sourceType: s.source_type as 'make' | 'model' | 'unit_id' | 'type',
    }));

    return NextResponse.json({
      suggestions: transformedSuggestions,
      query: query.trim(),
    });
  } catch (error) {
    logger.error(
      'Search suggestions request error',
      {
        component: 'api-search-suggestions',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



