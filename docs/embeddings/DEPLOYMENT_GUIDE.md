# Embedding Generation Deployment Guide

## Overview

This guide covers deploying and testing the Supabase-native embedding generation system for semantic search.

## Prerequisites

1. Supabase CLI installed and authenticated
2. Project linked to Supabase: `supabase link --project-ref <your-project-ref>`
3. Edge Functions enabled in your Supabase project

## Step 1: Deploy Edge Function

Deploy the `generate-embedding` Edge Function to your Supabase project:

```bash
# From project root
supabase functions deploy generate-embedding
```

**Expected Output:**
```
Deploying function generate-embedding...
Function generate-embedding deployed successfully
```

## Step 2: Verify Edge Function

Test the Edge Function directly:

```bash
# Get your project's anon key
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

# Test the function
curl -X POST 'https://<your-project-ref>.supabase.co/functions/v1/generate-embedding' \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Kubota SVL75-2 compact track loader for construction projects"}'
```

**Expected Response:**
```json
{
  "embedding": [0.123, -0.456, 0.789, ...] // 384-dimensional vector
}
```

## Step 3: Generate Embeddings for Equipment

Once the Edge Function is deployed, generate embeddings for all equipment:

### Option A: Via API Endpoint

```bash
# Make authenticated request to generate embeddings endpoint
curl -X POST 'http://localhost:3000/api/equipment/generate-embeddings' \
  -H "Authorization: Bearer <your-auth-token>" \
  -H "Content-Type: application/json"
```

### Option B: Via Frontend Admin Panel

1. Navigate to admin dashboard
2. Go to Equipment Management
3. Click "Generate Embeddings" button (if available)

### Option C: Direct Database Query (for testing)

```sql
-- Check how many equipment items need embeddings
SELECT COUNT(*)
FROM equipment
WHERE description_embedding IS NULL
  AND description IS NOT NULL;

-- After generation, verify embeddings exist
SELECT COUNT(*)
FROM equipment
WHERE description_embedding IS NOT NULL;
```

## Step 4: Test Semantic Search

Test the semantic search functionality:

```bash
# Test semantic search
curl -X GET 'http://localhost:3000/api/equipment/search?query=small%20digging%20machine&searchMode=semantic&matchThreshold=0.7' \
  -H "Content-Type: application/json"
```

**Test Queries:**
- `"small digging machine for my yard"` - Natural language
- `"equipment for residential construction"` - Use case
- `"diesel powered track loader"` - Features
- `"CTL"` - Synonym (should find "compact track loader")

## Step 5: Verify Search Quality

### Check Search Results

1. **Keyword Search**: Should return exact matches
2. **Semantic Search**: Should return semantically similar results even without keyword matches
3. **Hybrid Search**: Should combine both approaches

### Expected Behavior

- Semantic search finds equipment even when keywords don't match exactly
- Synonyms work (e.g., "CTL" finds "compact track loader")
- Natural language queries return relevant results
- Search performance is <50ms for typical queries

## Troubleshooting

### Edge Function Not Deploying

**Error**: `Cannot find project ref`

**Solution**:
```bash
# Link your project
supabase link --project-ref <your-project-ref>

# Or create a new project
supabase projects create <project-name>
```

### Embeddings Not Generating

**Check**:
1. Edge Function is deployed and accessible
2. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly
3. Equipment has descriptions (required for embeddings)
4. Check API logs for errors

### Search Returns No Results

**Check**:
1. Embeddings exist: `SELECT COUNT(*) FROM equipment WHERE description_embedding IS NOT NULL;`
2. Match threshold is appropriate (try 0.6-0.8)
3. Search function is working: Test with `searchMode=keyword` first

### Vector Dimension Mismatch

**Error**: `vector dimension mismatch`

**Solution**: Ensure all embeddings are 384-dimensional (gte-small model):
```sql
-- Check vector dimension
SELECT
  id,
  array_length(string_to_array(description_embedding::text, ','), 1) as dimensions
FROM equipment
WHERE description_embedding IS NOT NULL
LIMIT 5;
```

All should show 384 dimensions.

## Monitoring

### Check Embedding Generation Status

```sql
-- Equipment with embeddings
SELECT
  COUNT(*) FILTER (WHERE description_embedding IS NOT NULL) as with_embeddings,
  COUNT(*) FILTER (WHERE description_embedding IS NULL AND description IS NOT NULL) as needs_embeddings,
  COUNT(*) as total
FROM equipment;
```

### Monitor Search Performance

Check query execution time:
```sql
EXPLAIN ANALYZE
SELECT * FROM search_equipment_hybrid(
  'construction equipment',
  '[0.123, -0.456, ...]'::vector(384),
  0.7,
  20,
  NULL
);
```

## Next Steps

1. **Generate embeddings for all equipment** - Run the generation endpoint
2. **Test search quality** - Try various natural language queries
3. **Optimize match threshold** - Adjust based on search results
4. **Monitor performance** - Track search query times
5. **Set up automatic regeneration** - Create triggers for when equipment data changes

## Related Documentation

- [Embeddings Explained](./EMBEDDINGS_EXPLAINED.md)
- [Text Building Strategy](./text-building-strategy.md) (to be created)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)


