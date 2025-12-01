-- Semantic Search Infrastructure Migration
-- This migration adds vector search capabilities for equipment using pgvector
-- Enables AI-powered semantic search with hybrid keyword + vector matching

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add description_embedding column to equipment table (384 dimensions for gte-small model)
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS description_embedding vector(384);

-- Create search_analytics table to track search queries and performance
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  search_mode VARCHAR(20) NOT NULL, -- 'keyword', 'semantic', 'hybrid'
  results_count INTEGER NOT NULL DEFAULT 0,
  response_time_ms INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  filters JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for search analytics queries
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_search_mode ON search_analytics(search_mode);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS on search_analytics
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can see their own searches, admins can see all
CREATE POLICY "search_analytics_select_own" ON search_analytics
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- Create HNSW index for fast vector similarity search
-- Using cosine distance for normalized embeddings
CREATE INDEX IF NOT EXISTS idx_equipment_description_embedding_hnsw
ON equipment
USING hnsw (description_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE description_embedding IS NOT NULL;

-- Create function to search equipment using hybrid semantic + keyword search
CREATE OR REPLACE FUNCTION search_equipment_hybrid(
  search_query TEXT,
  query_embedding TEXT DEFAULT NULL,
  match_threshold DECIMAL DEFAULT 0.7,
  match_count INTEGER DEFAULT 20,
  filter_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  unitId TEXT,
  model TEXT,
  make TEXT,
  year INTEGER,
  description TEXT,
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  status TEXT,
  similarity DECIMAL,
  rank INTEGER,
  semantic_score DECIMAL,
  keyword_match BOOLEAN
) AS $$
DECLARE
  v_embedding_vector vector(384);
  v_semantic_results RECORD;
  v_keyword_results RECORD;
  v_combined_results RECORD;
BEGIN
  -- Parse embedding string to vector if provided
  IF query_embedding IS NOT NULL AND query_embedding != '' THEN
    v_embedding_vector := query_embedding::vector;
  END IF;

  -- Build base query
  RETURN QUERY
  WITH semantic_scores AS (
    -- Semantic similarity search (vector cosine distance)
    SELECT
      e.id,
      e.unit_id,
      e.model,
      e.make,
      e.year,
      e.description,
      e.daily_rate,
      e.weekly_rate,
      e.monthly_rate,
      e.status::TEXT,
      CASE
        WHEN e.description_embedding IS NOT NULL AND v_embedding_vector IS NOT NULL THEN
          1 - (e.description_embedding <=> v_embedding_vector) -- Cosine distance to similarity
        ELSE 0
      END as semantic_similarity,
      CASE
        WHEN e.description_embedding IS NOT NULL AND v_embedding_vector IS NOT NULL THEN
          CASE
            WHEN (1 - (e.description_embedding <=> v_embedding_vector)) >= match_threshold THEN 1
            ELSE 0
          END
        ELSE 0
      END as semantic_match,
      -- Keyword matching score using full-text search
      COALESCE(
        ts_rank(
          to_tsvector('english',
            COALESCE(e.description, '') || ' ' ||
            COALESCE(e.make, '') || ' ' ||
            COALESCE(e.model, '') || ' ' ||
            COALESCE(e.unit_id, '') || ' ' ||
            COALESCE(e.type, '')
          ),
          plainto_tsquery('english', search_query)
        ),
        0
      ) as keyword_score,
      CASE
        WHEN to_tsvector('english',
          COALESCE(e.description, '') || ' ' ||
          COALESCE(e.make, '') || ' ' ||
          COALESCE(e.model, '') || ' ' ||
          COALESCE(e.unit_id, '') || ' ' ||
          COALESCE(e.type, '')
        ) @@ plainto_tsquery('english', search_query) THEN true
        ELSE false
      END as keyword_match_bool
    FROM equipment e
    WHERE
      (filter_status IS NULL OR e.status::TEXT = filter_status)
      AND (
        -- Include if semantic match
        (e.description_embedding IS NOT NULL
         AND v_embedding_vector IS NOT NULL
         AND (1 - (e.description_embedding <=> v_embedding_vector)) >= match_threshold)
        OR
        -- Or if keyword match
        to_tsvector('english',
          COALESCE(e.description, '') || ' ' ||
          COALESCE(e.make, '') || ' ' ||
          COALESCE(e.model, '') || ' ' ||
          COALESCE(e.unit_id, '') || ' ' ||
          COALESCE(e.type, '')
        ) @@ plainto_tsquery('english', search_query)
      )
  ),
  ranked_results AS (
    SELECT
      id,
      unit_id,
      model,
      make,
      year,
      description,
      daily_rate,
      weekly_rate,
      monthly_rate,
      status,
      semantic_similarity,
      keyword_score,
      keyword_match_bool,
      -- Combined ranking: 60% semantic + 40% keyword
      (semantic_similarity * 0.6 + LEAST(keyword_score * 10, 1.0) * 0.4) as combined_score
    FROM semantic_scores
    ORDER BY combined_score DESC
    LIMIT match_count
  )
  SELECT
    r.id,
    r.unit_id AS "unitId",
    r.model,
    r.make,
    r.year,
    r.description,
    r.daily_rate AS "dailyRate",
    r.weekly_rate AS "weeklyRate",
    r.monthly_rate AS "monthlyRate",
    r.status,
    r.semantic_similarity AS similarity,
    ROW_NUMBER() OVER (ORDER BY r.combined_score DESC) AS rank,
    r.semantic_similarity AS "semanticScore",
    r.keyword_match_bool AS "keywordMatch"
  FROM ranked_results r
  ORDER BY r.combined_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on search function
GRANT EXECUTE ON FUNCTION search_equipment_hybrid(TEXT, TEXT, DECIMAL, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_equipment_hybrid(TEXT, TEXT, DECIMAL, INTEGER, TEXT) TO anon;

-- Create trigger function to mark embeddings as stale when equipment changes
CREATE OR REPLACE FUNCTION mark_embedding_stale_on_equipment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any embedding-relevant fields changed
  IF (
    OLD.description IS DISTINCT FROM NEW.description
    OR OLD.specifications IS DISTINCT FROM NEW.specifications
    OR OLD.type IS DISTINCT FROM NEW.type
    OR OLD.make IS DISTINCT FROM NEW.make
    OR OLD.model IS DISTINCT FROM NEW.model
    OR OLD.category_id IS DISTINCT FROM NEW.category_id
  ) THEN
    -- Set embedding to NULL to mark it as stale
    NEW.description_embedding = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-mark embeddings as stale
CREATE TRIGGER equipment_mark_embedding_stale
BEFORE UPDATE ON equipment
FOR EACH ROW
EXECUTE FUNCTION mark_embedding_stale_on_equipment_change();

-- Add comment explaining the semantic search system
COMMENT ON COLUMN equipment.description_embedding IS 'Vector embedding (384 dimensions) for semantic search using gte-small model. NULL means embedding needs to be generated.';
COMMENT ON FUNCTION search_equipment_hybrid IS 'Hybrid search combining semantic vector similarity (60%) with keyword full-text search (40%). Returns ranked results with similarity scores.';
COMMENT ON TABLE search_analytics IS 'Tracks search queries, modes, and performance metrics for analytics and optimization.';

-- Create function to suggest similar search terms using trigram similarity
-- Useful for typo tolerance and "Did you mean?" suggestions
CREATE OR REPLACE FUNCTION suggest_search_terms(
  search_query TEXT,
  similarity_threshold DECIMAL DEFAULT 0.3,
  max_suggestions INTEGER DEFAULT 5
)
RETURNS TABLE (
  suggestion TEXT,
  similarity DECIMAL,
  source_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH all_suggestions AS (
    -- Suggestions from makes (most common typos in brand names)
    SELECT DISTINCT
      make as suggestion,
      similarity(make, search_query) as sim,
      'make'::TEXT as source_type
    FROM equipment
    WHERE make IS NOT NULL
      AND similarity(make, search_query) >= similarity_threshold
      AND make ILIKE '%' || search_query || '%'

    UNION ALL

    -- Suggestions from models
    SELECT DISTINCT
      model as suggestion,
      similarity(model, search_query) as sim,
      'model'::TEXT as source_type
    FROM equipment
    WHERE model IS NOT NULL
      AND similarity(model, search_query) >= similarity_threshold
      AND model ILIKE '%' || search_query || '%'

    UNION ALL

    -- Suggestions from unit IDs
    SELECT DISTINCT
      unit_id as suggestion,
      similarity(unit_id, search_query) as sim,
      'unit_id'::TEXT as source_type
    FROM equipment
    WHERE unit_id IS NOT NULL
      AND similarity(unit_id, search_query) >= similarity_threshold
      AND unit_id ILIKE '%' || search_query || '%'

    UNION ALL

    -- Suggestions from equipment types
    SELECT DISTINCT
      type as suggestion,
      similarity(type, search_query) as sim,
      'type'::TEXT as source_type
    FROM equipment
    WHERE type IS NOT NULL
      AND similarity(type, search_query) >= similarity_threshold
      AND type ILIKE '%' || search_query || '%'
  )
  SELECT
    suggestion,
    sim as similarity,
    source_type
  FROM all_suggestions
  ORDER BY sim DESC, suggestion
  LIMIT max_suggestions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION suggest_search_terms(TEXT, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION suggest_search_terms(TEXT, DECIMAL, INTEGER) TO anon;

-- Create trigram indexes for faster fuzzy matching
CREATE INDEX IF NOT EXISTS idx_equipment_make_trgm ON equipment USING gin(make gin_trgm_ops) WHERE make IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_model_trgm ON equipment USING gin(model gin_trgm_ops) WHERE model IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_unit_id_trgm ON equipment USING gin(unit_id gin_trgm_ops) WHERE unit_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_type_trgm ON equipment USING gin(type gin_trgm_ops) WHERE type IS NOT NULL;

COMMENT ON FUNCTION suggest_search_terms IS 'Suggests similar search terms using trigram similarity for typo tolerance and "Did you mean?" functionality.';
