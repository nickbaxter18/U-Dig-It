/**
 * Embedding Generation Utility
 *
 * Generates vector embeddings for text using Supabase's built-in gte-small model via Edge Functions.
 * Used for semantic search functionality with pgvector.
 */

import { logger } from '@/lib/logger';
import { getSupabaseServiceRoleKey } from '@/lib/secrets/supabase';
import { SUPABASE_URL } from '@/lib/supabase/config';

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

/**
 * Generate embedding for text using Supabase Edge Function
 *
 * @param text - Text to generate embedding for
 * @param options - Embedding options (ignored for Supabase, uses gte-small with 384 dimensions)
 * @returns Vector embedding as array of numbers (384 dimensions)
 */
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    // Use Supabase Edge Function for embeddings
    return await generateEmbeddingSupabase(text, options);
  } catch (error) {
    logger.error(
      'Failed to generate embedding',
      {
        component: 'embeddings',
        action: 'generate',
        metadata: { textLength: text.length },
      },
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}

/**
 * Generate embedding using Supabase Edge Function
 *
 * @param text - Text to generate embedding for
 * @param options - Embedding options (not used, but kept for compatibility)
 * @returns Vector embedding as array of numbers (384 dimensions from gte-small)
 */
async function generateEmbeddingSupabase(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('SUPABASE_URL is not configured');
    }

    // Call Supabase Edge Function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/generate-embedding`;

    // Use secrets loader instead of direct process.env access
    const serviceRoleKey = await getSupabaseServiceRoleKey();
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    // Call the Edge Function with service role key for authentication
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Supabase Edge Function error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    if (!data.embedding || !Array.isArray(data.embedding)) {
      throw new Error('Invalid response from Supabase Edge Function');
    }

    // Validate dimensions (gte-small produces 384 dimensions)
    if (data.embedding.length !== 384) {
      logger.warn(
        'Embedding dimensions mismatch',
        {
          component: 'embeddings',
          action: 'generate_supabase',
          metadata: {
            expected: 384,
            received: data.embedding.length,
          },
        }
      );
    }

    logger.info('Successfully generated embedding using Supabase', {
      component: 'embeddings',
      action: 'generate_supabase',
      metadata: {
        textLength: text.length,
        embeddingDimensions: data.embedding.length,
      },
    });

    return data.embedding;
  } catch (error) {
    logger.error(
      'Failed to generate embedding with Supabase',
      {
        component: 'embeddings',
        action: 'generate_supabase',
        metadata: {
          textLength: text.length,
          error: error instanceof Error ? error.message : String(error),
        },
      },
      error instanceof Error ? error : undefined
    );
    throw error;
  }
}

/**
 * Batch generate embeddings for multiple texts
 *
 * @param texts - Array of texts to generate embeddings for
 * @param options - Embedding options
 * @returns Array of embeddings
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  options: EmbeddingOptions = {}
): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text, options))
    );
    embeddings.push(...batchEmbeddings);

    // Small delay between batches to avoid rate limits
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return embeddings;
}

/**
 * Convert embedding array to PostgreSQL vector format string
 *
 * @param embedding - Array of numbers representing the embedding
 * @returns PostgreSQL vector format string
 */
export function embeddingToVectorString(embedding: number[]): string {
  return '[' + embedding.join(',') + ']';
}

/**
 * Validate embedding dimensions
 *
 * @param embedding - Embedding array
 * @param expectedDimensions - Expected number of dimensions (default: 384 for gte-small)
 * @returns True if valid
 */
export function validateEmbedding(
  embedding: number[],
  expectedDimensions: number = 384
): boolean {
  return (
    Array.isArray(embedding) &&
    embedding.length === expectedDimensions &&
    embedding.every((val) => typeof val === 'number' && !isNaN(val))
  );
}
