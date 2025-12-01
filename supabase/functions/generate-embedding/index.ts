// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

/**
 * Generate Embedding Edge Function
 *
 * Generates text embeddings using Supabase's built-in gte-small model.
 * This function is called by the frontend to generate embeddings for equipment descriptions.
 *
 * Input: { input: string }
 * Output: { embedding: number[] } (384-dimensional vector)
 */

// Create inference session for gte-small model
const session = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Parse request body
    const { input } = await req.json()

    // Validate input
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input. Expected non-empty string in "input" field.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate embedding using gte-small model
    // Options:
    // - mean_pool: true - Uses average pooling to compress token-level embeddings into sentence embedding
    // - normalize: true - Normalizes the vector so it can be used with cosine distance
    const embedding = await session.run(input, {
      mean_pool: true,
      normalize: true,
    })

    // Validate embedding
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 384) {
      return new Response(
        JSON.stringify({
          error: 'Failed to generate embedding. Expected 384-dimensional vector.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Return embedding
    return new Response(
      JSON.stringify({ embedding }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(
      JSON.stringify({
        error: 'Failed to generate embedding',
        details: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})


