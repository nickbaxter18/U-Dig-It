-- Supabase Migration Template
-- Migration: {migration_name}
-- Created: {date}
-- Description: {description}

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table
CREATE TABLE IF NOT EXISTS {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Add your columns here
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_{table_name}_created_at ON {table_name}(created_at DESC);
-- Add more indexes as needed

-- Enable Row-Level Security
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT policy
CREATE POLICY "{table_name}_select" ON {table_name}
FOR SELECT TO authenticated
USING (
  -- Add your policy conditions here
  true -- Example: customer_id = (SELECT auth.uid())
);

-- INSERT policy
CREATE POLICY "{table_name}_insert" ON {table_name}
FOR INSERT TO authenticated
WITH CHECK (
  -- Add your policy conditions here
  true
);

-- UPDATE policy
CREATE POLICY "{table_name}_update" ON {table_name}
FOR UPDATE TO authenticated
USING (
  -- Add your policy conditions here
  true
)
WITH CHECK (
  -- Add your policy conditions here
  true
);

-- DELETE policy (if needed)
-- CREATE POLICY "{table_name}_delete" ON {table_name}
-- FOR DELETE TO authenticated
-- USING (
--   -- Add your policy conditions here
-- );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_{table_name}_updated_at
BEFORE UPDATE ON {table_name}
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE {table_name} IS '{table_description}';

