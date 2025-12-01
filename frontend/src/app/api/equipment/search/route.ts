import { NextRequest, NextResponse } from 'next/server';

import { expandQuery } from '@/lib/embeddings/expand-query';
import { generateEmbedding } from '@/lib/embeddings/generate';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// Simple in-memory cache for search optimization
const searchCache = new Map<string, { data: unknown; expiry: number }>();

function getCached<T>(key: string): T | null {
  const entry = searchCache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T;
  }
  searchCache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T, ttlMs: number): void {
  searchCache.set(key, { data, expiry: Date.now() + ttlMs });
}

export const dynamic = 'force-dynamic';

interface SearchFilters {
  query?: string;
  equipmentType?: string;
  make?: string;
  model?: string;
  status?: string;
  location?: string;
  minDailyRate?: number;
  maxDailyRate?: number;
  minWeeklyRate?: number;
  maxWeeklyRate?: number;
  minMonthlyRate?: number;
  maxMonthlyRate?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  searchMode?: 'keyword' | 'semantic' | 'hybrid';
  matchThreshold?: number;
}

interface SearchResults {
  equipment: unknown[]; // Changed from 'data' to 'equipment' to match frontend
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  searchMode?: 'keyword' | 'semantic' | 'hybrid';
  responseTimeMs?: number;
  fallbackReason?: string;
}

/**
 * SemanticResult interface matches the actual return type from search_equipment_hybrid
 * Based on supabase/types.ts definition which shows the function returns:
 * dailyRate (camelCase), description, id, model, rank, semantic_score
 *
 * Note: Additional fields may be returned if the database function has been updated
 * but types haven't been regenerated. We handle optional fields gracefully.
 */
interface SemanticResult {
  id: string;
  model: string;
  description: string;
  dailyRate: number; // camelCase per supabase/types.ts
  rank: number;
  semantic_score: number;
  // Optional fields that may be returned by updated function
  unitId?: string;
  make?: string;
  year?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  status?: string;
  similarity?: number;
  keyword_match?: boolean;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let actualSearchMode: 'keyword' | 'semantic' | 'hybrid' = 'keyword';
  let fallbackReason: string | null = null;

  try {
    const filters: SearchFilters = await request.json();
    const supabase = await createClient();
    const serviceSupabase = await createServiceClient(); // For analytics (bypasses RLS)

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const searchMode = filters.searchMode || 'keyword';
    const matchThreshold = filters.matchThreshold || 0.5; // Lower default for better semantic matches

    // Get user for analytics (optional)
    const { data: { user } } = await supabase.auth.getUser();

    // Handle semantic or hybrid search
    if (filters.query && (searchMode === 'semantic' || searchMode === 'hybrid')) {
      try {
        // Check embedding availability (cached for 5 minutes)
        const embeddingCacheKey = 'equipment:embedding-count';
        let embeddingCount: number | null = getCached<number>(embeddingCacheKey);

        if (embeddingCount === null) {
          const { count } = await supabase
            .from('equipment')
            .select('id', { count: 'exact', head: true })
            .not('description_embedding', 'is', null);
          embeddingCount = count || 0;
          setCached(embeddingCacheKey, embeddingCount, 5 * 60 * 1000); // 5 min cache
        }

        logger.debug('Checking embedding availability', {
          component: 'api-search',
          action: 'check_embeddings',
          metadata: { embeddingCount, searchMode, query: filters.query },
        });

        if (embeddingCount && embeddingCount > 0) {
          // Expand query with synonyms for better semantic matching
          const expandedQuery = await expandQuery(filters.query);

          // DRASTICALLY IMPROVE SYNONYM HANDLING:
          // Repeat high-priority synonyms multiple times to boost their importance in the query embedding
          // This makes the embedding more similar to equipment embeddings that contain those synonyms
          const synonymTerms: string[] = [];

          // Add original query multiple times (most important)
          synonymTerms.push(filters.query, filters.query, filters.query);

          // Add expanded terms, repeating high-priority ones more
          expandedQuery.expandedTerms.forEach((term, index) => {
            // Repeat first 5 synonyms 3 times (high priority)
            if (index < 5) {
              synonymTerms.push(term, term, term);
            } else {
              // Repeat others 2 times
              synonymTerms.push(term, term);
            }
          });

          const enhancedQuery = synonymTerms.join(' '); // Repeat synonyms for maximum matching

          logger.debug('Query expansion completed', {
            component: 'api-search',
            action: 'query_expansion',
            metadata: {
              originalQuery: filters.query,
              expandedTerms: expandedQuery.expandedTerms,
              totalTerms: expandedQuery.allTerms.length,
            },
          });

          // Cache embedding generation for repeated queries (5 minutes)
          // Use original query as cache key, but enhanced query for embedding
          const queryEmbeddingCacheKey = `embedding:${filters.query}`;
          let queryEmbedding: number[] | null = getCached<number[]>(queryEmbeddingCacheKey);

          if (queryEmbedding === null) {
            // Generate embedding using enhanced query with synonyms
            // This helps semantic search match related terms
            queryEmbedding = await generateEmbedding(enhancedQuery);
            setCached(queryEmbeddingCacheKey, queryEmbedding, 5 * 60 * 1000); // 5 min cache
          }

          const vectorString = '[' + queryEmbedding.join(',') + ']';

          // Cache search results for identical queries (2 minutes)
          const searchCacheKey = `search:hybrid:${JSON.stringify(filters)}:${matchThreshold}`;
          let semanticResults: SemanticResult[] | null = getCached<SemanticResult[]>(searchCacheKey);

          if (semanticResults === null) {
            logger.debug('Calling search_equipment_hybrid', {
              component: 'api-search',
              action: 'semantic_search_call',
              metadata: {
                query: filters.query,
                enhancedQuery,
                expandedTermsCount: expandedQuery.expandedTerms.length,
                matchThreshold,
                matchCount: Math.max(limit + offset, 50),
                vectorStringLength: vectorString.length,
              },
            });

            // Use enhanced query (original + expanded terms) for keyword matching in hybrid search
            // The database function will use this for both semantic (via embedding) and keyword matching
            const { data, error: semanticError } = await supabase.rpc(
              'search_equipment_hybrid',
              {
                search_query: enhancedQuery, // Pass expanded query for better keyword matching
                query_embedding: vectorString,
                match_threshold: matchThreshold,
                match_count: Math.max(limit + offset, 50), // Get more results for pagination
                filter_status: filters.status || null,
              }
            );

            logger.debug('Semantic search RPC response', {
              component: 'api-search',
              action: 'semantic_search_response',
              metadata: {
                hasError: !!semanticError,
                errorMessage: semanticError?.message,
                resultsCount: data?.length || 0,
                searchMode,
                matchThreshold,
              },
            });

            if (!semanticError && data && data.length > 0) {
              semanticResults = data as SemanticResult[];
              logger.info('Semantic search successful', {
                component: 'api-search',
                action: 'semantic_search_success',
                metadata: {
                  resultsCount: semanticResults.length,
                  searchMode,
                  matchThreshold,
                  query: filters.query,
                },
              });
              setCached(searchCacheKey, semanticResults, 2 * 60 * 1000); // 2 min cache
            } else if (semanticError) {
              logger.warn('Semantic search failed, falling back to keyword search', {
                component: 'api-search',
                action: 'semantic_search_fallback',
                metadata: {
                  error: semanticError.message,
                  code: semanticError.code,
                  details: semanticError.details,
                  hint: semanticError.hint,
                },
              });
              fallbackReason = `Database error: ${semanticError.message}`;
            } else if (data && data.length === 0) {
              logger.info('Semantic search returned no results', {
                component: 'api-search',
                action: 'semantic_search_no_results',
                metadata: {
                  searchMode,
                  matchThreshold,
                  query: filters.query,
                  suggestion: 'Try lowering the match threshold or using a different query',
                },
              });
              fallbackReason = `No semantic matches found above ${(matchThreshold * 100).toFixed(0)}% similarity threshold. Try lowering the threshold.`;
            }
          }

          if (semanticResults && semanticResults.length > 0) {
            // Get full equipment details for semantic results
            const semanticIds = semanticResults.map((r) => r.id);
            const { data: fullEquipment, error: fullError } = await supabase
              .from('equipment')
              .select(
                'id, unitId, serialNumber, model, year, make, description, notes, dailyRate, weeklyRate, monthlyRate, status, location, lastMaintenanceDate, nextMaintenanceDue, totalEngineHours, specifications, createdAt, updatedAt'
              )
              .in('id', semanticIds);

            if (fullError) {
              logger.warn('Failed to fetch full equipment details for semantic results', {
                component: 'api-search',
                action: 'full_equipment_fetch_error',
                metadata: { error: fullError.message },
              });
            }

            // Create a map of full equipment data
            const equipmentMap = new Map(
              (fullEquipment || []).map((eq) => [eq.id, eq])
            );

            // Merge semantic results with full equipment data
            let enrichedResults = semanticResults.map((r) => {
              const full = equipmentMap.get(r.id);

              // Database function returns snake_case, handle both formats
              const unitId = (r as unknown as { unitId?: string; unit_id?: string }).unitId ||
                            (r as unknown as { unitId?: string; unit_id?: string }).unit_id ||
                            full?.unitId || '';

              const dailyRate = (r as unknown as { dailyRate?: number; daily_rate?: number }).dailyRate ??
                               (r as unknown as { dailyRate?: number; daily_rate?: number }).daily_rate ??
                               full?.dailyRate ?? 0;

              const weeklyRate = (r as unknown as { weeklyRate?: number; weekly_rate?: number }).weeklyRate ??
                                (r as unknown as { weeklyRate?: number; weekly_rate?: number }).weekly_rate ??
                                full?.weeklyRate ?? 0;

              const monthlyRate = (r as unknown as { monthlyRate?: number; monthly_rate?: number }).monthlyRate ??
                                 (r as unknown as { monthlyRate?: number; monthly_rate?: number }).monthly_rate ??
                                 full?.monthlyRate ?? 0;

              return {
                id: r.id,
                unitId,
                serialNumber: full?.serialNumber || '',
                model: r.model || full?.model || '',
                make: r.make || full?.make || '',
                year: r.year || full?.year || new Date().getFullYear(),
                description: r.description || full?.description || '',
                dailyRate,
                weeklyRate,
                monthlyRate,
                status: (r.status || full?.status || 'available').toUpperCase(),
                location: full?.location || 'Main Yard',
                lastMaintenance: full?.lastMaintenanceDate || undefined,
                nextMaintenance: full?.nextMaintenanceDue || undefined,
                totalEngineHours: full?.totalEngineHours || undefined,
                specifications: full?.specifications || undefined,
                createdAt: full?.createdAt || new Date().toISOString(),
                updatedAt: full?.updatedAt || new Date().toISOString(),
                similarity: r.similarity ?? r.semantic_score ?? 0,
                keywordMatch: r.keyword_match ?? false,
                rank: r.rank ?? 0,
                semanticScore: r.semantic_score ?? 0,
              };
            });

            // Apply additional filters
            if (filters.minDailyRate !== undefined) {
              enrichedResults = enrichedResults.filter((r) => r.dailyRate >= filters.minDailyRate!);
            }
            if (filters.maxDailyRate !== undefined) {
              enrichedResults = enrichedResults.filter((r) => r.dailyRate <= filters.maxDailyRate!);
            }
            if (filters.make) {
              enrichedResults = enrichedResults.filter((r) => r.make === filters.make);
            }
            if (filters.model) {
              enrichedResults = enrichedResults.filter((r) => r.model === filters.model);
            }

            const paginatedResults = enrichedResults.slice(offset, offset + limit);
            const responseTime = Date.now() - startTime;
            actualSearchMode = searchMode;

            // Log analytics (non-blocking)
            if (serviceSupabase) {
              void (async () => {
                try {
                  await serviceSupabase.from('search_analytics').insert({
                    query: filters.query,
                    search_mode: searchMode,
                    results_count: paginatedResults.length,
                    response_time_ms: responseTime,
                    user_id: user?.id || null,
                    filters: filters,
                  });
                } catch (err: unknown) {
                  // Don't fail request if analytics fails
                  logger.warn('Failed to log search analytics', {
                    component: 'api-search',
                    action: 'analytics_error',
                    metadata: { error: err instanceof Error ? err.message : String(err) },
                  });
                }
              })();
            }

            // Transform location for frontend (extract from JSONB)
            const transformedResults = paginatedResults.map((r) => {
              let locationString = 'Main Yard';
              if (r.location) {
                if (typeof r.location === 'string') {
                  locationString = r.location;
                } else if (typeof r.location === 'object' && r.location !== null) {
                  const loc = r.location as { name?: string; city?: string; address?: string };
                  locationString = loc.name || loc.city || loc.address || 'Main Yard';
                }
              }

              return {
                ...r,
                location: locationString,
              };
            });

            return NextResponse.json({
              equipment: transformedResults,
              total: enrichedResults.length,
              page,
              limit,
              totalPages: Math.ceil(enrichedResults.length / limit),
              searchMode: searchMode,
              responseTimeMs: responseTime,
              ...(fallbackReason && { fallbackReason }),
            });
          }
        } else {
          fallbackReason = 'No embeddings found - embeddings need to be generated';
          logger.warn('Semantic search requested but no embeddings found', {
            component: 'api-search',
            action: 'no_embeddings',
          });
        }
      } catch (embeddingError) {
        fallbackReason = `Embedding generation failed: ${embeddingError instanceof Error ? embeddingError.message : String(embeddingError)}`;
        logger.warn('Failed to generate embedding, falling back to keyword search', {
          component: 'api-search',
          action: 'embedding_fallback',
          metadata: {
            error: embeddingError instanceof Error ? embeddingError.message : String(embeddingError),
          },
        });
      }
    }

    // Keyword search (default or fallback)
    let query = supabase
      .from('equipment')
      .select(
        'id, model, year, make, description, notes, unitId, serialNumber, replacementValue, dailyRate, weeklyRate, monthlyRate, overageHourlyRate, dailyHourAllowance, weeklyHourAllowance, lastMaintenanceDate, nextMaintenanceDue, totalEngineHours, createdAt, updatedAt, type, specifications, status, attachments, location, images, documents, rider_template_id',
        { count: 'exact' }
      );

    if (filters.query) {
      // Use proper Supabase .or() syntax - comma-separated string
      // Search across all searchable fields including description
      query = query.or(
        `unitId.ilike.%${filters.query}%,make.ilike.%${filters.query}%,model.ilike.%${filters.query}%,type.ilike.%${filters.query}%,description.ilike.%${filters.query}%`
      );
    }

    if (filters.equipmentType) {
      query = query.eq('type', filters.equipmentType);
    }
    if (filters.make) {
      query = query.eq('make', filters.make);
    }
    if (filters.model) {
      query = query.eq('model', filters.model);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    if (filters.minDailyRate !== undefined) {
      query = query.gte('dailyRate', filters.minDailyRate);
    }
    if (filters.maxDailyRate !== undefined) {
      query = query.lte('dailyRate', filters.maxDailyRate);
    }
    if (filters.minWeeklyRate !== undefined) {
      query = query.gte('weeklyRate', filters.minWeeklyRate);
    }
    if (filters.maxWeeklyRate !== undefined) {
      query = query.lte('weeklyRate', filters.maxWeeklyRate);
    }
    if (filters.minMonthlyRate !== undefined) {
      query = query.gte('monthlyRate', filters.minMonthlyRate);
    }
    if (filters.maxMonthlyRate !== undefined) {
      query = query.lte('monthlyRate', filters.maxMonthlyRate);
    }

    const sortBy = filters.sortBy || 'unitId';
    const sortOrder = filters.sortOrder || 'ASC';
    query = query.order(sortBy, { ascending: sortOrder === 'ASC' });
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    const responseTime = Date.now() - startTime;

    if (error) {
      logger.error('Equipment search error', {
        component: 'api-search',
        action: 'error',
        metadata: { error: error.message },
      }, error);
      return NextResponse.json(
        { error: 'Failed to search equipment', details: error.message },
        { status: 500 }
      );
    }

    // Log analytics for keyword search (non-blocking)
    if (filters.query && serviceSupabase) {
      void (async () => {
        try {
          await serviceSupabase.from('search_analytics').insert({
            query: filters.query,
            search_mode: actualSearchMode,
            results_count: count || 0,
            response_time_ms: responseTime,
            user_id: user?.id || null,
            filters: filters,
          });
        } catch (err: unknown) {
          logger.warn('Failed to log search analytics', {
            component: 'api-search',
            action: 'analytics_error',
            metadata: { error: err instanceof Error ? err.message : String(err) },
          });
        }
      })();
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    // Transform equipment data to match frontend expectations
    const transformedEquipment = (data || []).map((eq: unknown) => {
      const equipment = eq as {
        id: string;
        unitId: string;
        serialNumber: string;
        model: string;
        year: number;
        make: string;
        dailyRate: number;
        weeklyRate: number;
        monthlyRate: number;
        status: string;
        location: unknown;
        lastMaintenanceDate?: string | null;
        nextMaintenanceDue?: string | null;
        totalEngineHours?: number;
        specifications?: unknown;
        createdAt: string;
        updatedAt: string;
        description?: string;
      };

      // Extract location string from JSONB or string
      let locationString = 'Main Yard';
      if (equipment.location) {
        if (typeof equipment.location === 'string') {
          locationString = equipment.location;
        } else if (typeof equipment.location === 'object' && equipment.location !== null) {
          const loc = equipment.location as { name?: string; city?: string; address?: string };
          locationString = loc.name || loc.city || loc.address || 'Main Yard';
        }
      }

      // Convert status to uppercase
      const status = (equipment.status || 'available').toUpperCase() as 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

      return {
        id: equipment.id,
        unitId: equipment.unitId || '',
        serialNumber: equipment.serialNumber || '',
        model: equipment.model || '',
        year: equipment.year || new Date().getFullYear(),
        make: equipment.make || '',
        dailyRate: equipment.dailyRate || 0,
        weeklyRate: equipment.weeklyRate || 0,
        monthlyRate: equipment.monthlyRate || 0,
        status,
        location: locationString,
        lastMaintenance: equipment.lastMaintenanceDate || undefined,
        nextMaintenance: equipment.nextMaintenanceDue || undefined,
        totalEngineHours: equipment.totalEngineHours || undefined,
        specifications: equipment.specifications || undefined,
        createdAt: equipment.createdAt,
        updatedAt: equipment.updatedAt,
        description: equipment.description || '',
      };
    });

    const results: SearchResults = {
      equipment: transformedEquipment,
      total: count || 0,
      page,
      limit,
      totalPages,
      searchMode: actualSearchMode,
      responseTimeMs: responseTime,
      ...(fallbackReason && { fallbackReason }),
    };

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Equipment search request error', {
      component: 'api-search',
      action: 'error',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    }, error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        error: 'Invalid search request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
