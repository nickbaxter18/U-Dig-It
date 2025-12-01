-- Equipment Type Descriptions Table
-- Maps equipment type codes (e.g., "svl75") to full names, descriptions, and metadata
-- Used to enhance embedding text generation with more descriptive context

CREATE TABLE IF NOT EXISTS equipment_type_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_type VARCHAR(100) NOT NULL UNIQUE,
  full_name VARCHAR(200) NOT NULL,
  description TEXT,
  typical_uses TEXT[], -- Array of typical use cases/job types
  key_features TEXT[], -- Array of key features/capabilities
  category_id UUID REFERENCES equipment_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_type_descriptions_type ON equipment_type_descriptions(equipment_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_equipment_type_descriptions_category ON equipment_type_descriptions(category_id) WHERE category_id IS NOT NULL;

-- Add updated_at trigger
CREATE TRIGGER update_equipment_type_descriptions_updated_at
BEFORE UPDATE ON equipment_type_descriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE equipment_type_descriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access (needed for search and embedding generation)
CREATE POLICY "equipment_type_descriptions_select_public" ON equipment_type_descriptions
FOR SELECT TO public
USING (is_active = true);

-- RLS Policy: Admins can manage type descriptions
CREATE POLICY "equipment_type_descriptions_admin_all" ON equipment_type_descriptions
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND role IN ('admin', 'super_admin')
  )
);

-- Seed initial type descriptions
INSERT INTO equipment_type_descriptions (equipment_type, full_name, description, typical_uses, key_features) VALUES
  (
    'svl75',
    'Compact Track Loader',
    'A versatile compact track loader (CTL) with tracks instead of wheels, providing superior traction and flotation on soft ground. Similar to skid steer loaders but with tracks for better stability and minimal ground disturbance.',
    ARRAY[
      'digging',
      'material handling',
      'grading',
      'landscaping',
      'earthmoving',
      'construction site preparation',
      'demolition',
      'snow removal',
      'backfilling',
      'trenching'
    ],
    ARRAY[
      'Tracked undercarriage for superior traction',
      'Auxiliary hydraulics for attachments',
      'Compact size for tight spaces',
      'High lift capacity',
      'Excellent flotation on soft ground',
      'Zero tail swing capability'
    ]
  )
ON CONFLICT (equipment_type) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  description = EXCLUDED.description,
  typical_uses = EXCLUDED.typical_uses,
  key_features = EXCLUDED.key_features,
  updated_at = now();

-- Add comment
COMMENT ON TABLE equipment_type_descriptions IS 'Provides rich metadata about equipment types for enhanced embedding text generation and search context. Maps type codes to full names, descriptions, use cases, and features.';
COMMENT ON COLUMN equipment_type_descriptions.typical_uses IS 'Common job types and applications for this equipment type (e.g., "digging", "material handling")';
COMMENT ON COLUMN equipment_type_descriptions.key_features IS 'Key capabilities and features that distinguish this equipment type';



