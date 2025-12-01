-- Equipment Synonym Mapping System
-- Creates comprehensive synonym mapping table for semantic search enhancement
-- Enables queries like "skid steer" to find "compact track loader" equipment

-- Create equipment_synonyms table
CREATE TABLE IF NOT EXISTS equipment_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type VARCHAR(100) NOT NULL,
  synonym VARCHAR(200) NOT NULL,
  synonym_type VARCHAR(50) NOT NULL CHECK (synonym_type IN ('primary_name', 'alias', 'abbreviation', 'common_search_term', 'cross_reference')),
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority = more important synonym
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure no duplicate synonyms for same type
  UNIQUE(equipment_type, synonym)
);

-- Create indexes for fast synonym lookups
CREATE INDEX IF NOT EXISTS idx_equipment_synonyms_type ON equipment_synonyms(equipment_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_equipment_synonyms_synonym ON equipment_synonyms(synonym) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_equipment_synonyms_priority ON equipment_synonyms(equipment_type, priority DESC) WHERE is_active = true;

-- Add updated_at trigger
CREATE TRIGGER update_equipment_synonyms_updated_at
BEFORE UPDATE ON equipment_synonyms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE equipment_synonyms ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access for synonyms (needed for search)
CREATE POLICY "equipment_synonyms_select_public" ON equipment_synonyms
FOR SELECT TO public
USING (is_active = true);

-- RLS Policy: Admins can manage synonyms
CREATE POLICY "equipment_synonyms_admin_all" ON equipment_synonyms
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- Seed comprehensive synonym data for common equipment types
-- Compact Track Loader (svl75) synonyms
INSERT INTO equipment_synonyms (equipment_type, synonym, synonym_type, priority) VALUES
  -- Primary names
  ('svl75', 'Compact Track Loader', 'primary_name', 10),
  ('svl75', 'CTL', 'abbreviation', 9),
  ('svl75', 'Compact Track Loader CTL', 'primary_name', 8),
  
  -- Common search terms
  ('svl75', 'skid steer', 'common_search_term', 8),
  ('svl75', 'skidsteer', 'common_search_term', 7),
  ('svl75', 'track loader', 'common_search_term', 9),
  ('svl75', 'tracked loader', 'alias', 8),
  ('svl75', 'compact loader', 'alias', 7),
  ('svl75', 'tracked skid steer', 'common_search_term', 8),
  
  -- Cross-references (related equipment that users might search for)
  ('svl75', 'SSL', 'cross_reference', 5), -- Skid Steer Loader (related but different)
  ('svl75', 'skid steer loader', 'cross_reference', 6),
  
  -- Model-specific
  ('svl75', 'SVL75-3', 'alias', 6),
  ('svl75', 'SVL 75', 'alias', 6),
  ('svl75', 'Kubota CTL', 'alias', 7),
  ('svl75', 'Kubota SVL75', 'alias', 6),
  ('svl75', 'Kubota compact track loader', 'alias', 7),
  
  -- Common use case terms
  ('svl75', 'earthmoving', 'common_search_term', 5),
  ('svl75', 'material handling', 'common_search_term', 5),
  ('svl75', 'landscaping equipment', 'common_search_term', 4),
  ('svl75', 'construction loader', 'common_search_term', 5)
ON CONFLICT (equipment_type, synonym) DO NOTHING;

-- Add comment explaining the system
COMMENT ON TABLE equipment_synonyms IS 'Comprehensive synonym mapping for equipment types to enable semantic search. Queries like "skid steer" will find "compact track loader" equipment through synonym expansion.';
COMMENT ON COLUMN equipment_synonyms.synonym_type IS 'Type of synonym: primary_name (official name), alias (alternative name), abbreviation (CTL, SSL), common_search_term (what users search for), cross_reference (related equipment types)';
COMMENT ON COLUMN equipment_synonyms.priority IS 'Higher priority synonyms are weighted more heavily in search. Range: 0-10.';



