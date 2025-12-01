# Semantic Search Troubleshooting Guide

## Common Issues and Solutions

### Issue: Semantic Search Returns No Results or Falls Back to Keyword Search

#### Symptoms
- Semantic search mode selected but results are the same as keyword search
- Search falls back to keyword search
- No embeddings found in database

#### Diagnosis

1. **Check if embeddings exist:**
   ```sql
   SELECT COUNT(*) as total,
          COUNT(*) FILTER (WHERE description_embedding IS NOT NULL) as with_embeddings
   FROM equipment;
   ```

2. **Check Edge Function is deployed:**
   ```bash
   curl -X POST 'https://<project-ref>.supabase.co/functions/v1/generate-embedding' \
     -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"input": "test"}'
   ```

3. **Check search function exists:**
   ```sql
   SELECT proname, pg_get_function_arguments(oid)
   FROM pg_proc
   WHERE proname = 'search_equipment_hybrid';
   ```

#### Solutions

**Solution 1: Generate Embeddings**

If no embeddings exist, generate them:

```bash
# Option A: Use the API endpoint (requires authentication)
curl -X POST 'http://localhost:3000/api/equipment/generate-embeddings' \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Option B: Use the script
bash scripts/generate-embeddings.sh
```

**Solution 2: Deploy Edge Function**

If Edge Function is not deployed:

```bash
# Link project (if not already linked)
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy generate-embedding
```

**Solution 3: Check Vector Column Dimension**

Ensure vector column is 384 dimensions (for gte-small model):

```sql
SELECT pg_catalog.format_type(atttypid, atttypmod) as column_type
FROM pg_attribute
WHERE attrelid = 'equipment'::regclass
  AND attname = 'description_embedding';
```

Should return: `vector(384)`

### Issue: Edge Function Returns 401 Unauthorized

#### Symptoms
- Embedding generation fails with 401 error
- "Unauthorized" error when calling Edge Function

#### Solution

1. **Check service role key is configured:**
   ```bash
   # In frontend/.env.local
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Verify Edge Function allows service role:**
   - Edge Function should accept `Authorization: Bearer <service-role-key>`
   - Check Edge Function code uses correct authentication

### Issue: Search Function Returns Wrong Results

#### Symptoms
- Semantic search returns irrelevant results
- Similarity scores seem incorrect
- Results don't match query intent

#### Solutions

**Solution 1: Adjust Match Threshold**

Try different threshold values:
- `0.6` - More results, lower precision
- `0.7` - Balanced (default)
- `0.8` - Fewer results, higher precision

**Solution 2: Regenerate Embeddings with Better Text**

The text used for embeddings affects search quality. Ensure:
- Equipment descriptions are detailed
- Specifications are included
- Category information is included
- Use cases are mentioned

**Solution 3: Check Embedding Quality**

```sql
-- Check if embeddings are all zeros or null
SELECT id,
       CASE
         WHEN description_embedding IS NULL THEN 'NULL'
         WHEN description_embedding = '[0,0,0,...]'::vector THEN 'ZEROS'
         ELSE 'OK'
       END as status
FROM equipment
WHERE description_embedding IS NOT NULL
LIMIT 5;
```

### Issue: Search Performance is Slow

#### Symptoms
- Search takes >1 second
- Database queries are slow

#### Solutions

**Solution 1: Check HNSW Index Exists**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'equipment'
  AND indexname LIKE '%embedding%';
```

Should show: `idx_equipment_description_embedding_hnsw`

**Solution 2: Verify Index is Being Used**

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

Look for "Index Scan" on the embedding index.

### Issue: Embedding Generation Fails

#### Symptoms
- API returns error when generating embeddings
- Some equipment items fail to get embeddings

#### Diagnosis

1. **Check API logs:**
   ```bash
   # Check Next.js logs for errors
   # Look for "Failed to generate embedding" messages
   ```

2. **Check Edge Function logs:**
   ```bash
   supabase functions logs generate-embedding
   ```

3. **Test Edge Function directly:**
   ```bash
   curl -X POST 'https://<project-ref>.supabase.co/functions/v1/generate-embedding' \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"input": "Kubota SVL75-2 compact track loader"}'
   ```

#### Solutions

**Solution 1: Check Text Length**

Embeddings require meaningful text (50+ characters recommended):

```sql
SELECT id,
       LENGTH(description) as desc_length,
       description
FROM equipment
WHERE description_embedding IS NULL
  AND description IS NOT NULL
ORDER BY desc_length;
```

**Solution 2: Verify Edge Function is Accessible**

- Check Edge Function is deployed
- Verify SUPABASE_URL is correct
- Check network connectivity

**Solution 3: Check for Rate Limits**

If generating many embeddings:
- Process in smaller batches
- Add delays between batches
- Check Edge Function rate limits

## Verification Checklist

Before reporting issues, verify:

- [ ] Edge Function is deployed and accessible
- [ ] Embeddings exist for equipment (check with SQL query)
- [ ] Vector column is 384 dimensions
- [ ] HNSW index exists on embedding column
- [ ] Search function exists and is callable
- [ ] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured
- [ ] Equipment has descriptions (required for embeddings)
- [ ] Match threshold is appropriate (0.6-0.8)

## Getting Help

If issues persist:

1. Check application logs for detailed error messages
2. Verify all prerequisites from deployment guide
3. Test Edge Function directly with curl
4. Check database schema matches expected structure
5. Review embedding generation logs

## Related Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Embeddings Explained](../EMBEDDINGS_EXPLAINED.md)


