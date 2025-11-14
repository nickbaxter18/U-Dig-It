-- Storage configuration for ID verification artefacts

-- Ensure bucket exists with secure defaults
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'idkit-intake',
  'idkit-intake',
  FALSE,
  10 * 1024 * 1024, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Convenience helper to read the first segment of the storage object key
CREATE OR REPLACE FUNCTION storage_first_segment(path TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT NULLIF(split_part(path, '/', 1), '')
$$;

GRANT EXECUTE ON FUNCTION storage_first_segment(TEXT) TO authenticated;

-- User policies
CREATE POLICY "Users can upload ID artefacts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'idkit-intake'
    AND storage_first_segment(name) = auth.uid()::text
  );

CREATE POLICY "Users can read their ID artefacts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'idkit-intake'
    AND storage_first_segment(name) = auth.uid()::text
  );

CREATE POLICY "Users can update their ID artefacts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'idkit-intake'
    AND storage_first_segment(name) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'idkit-intake'
    AND storage_first_segment(name) = auth.uid()::text
  );

CREATE POLICY "Users can delete their ID artefacts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'idkit-intake'
    AND storage_first_segment(name) = auth.uid()::text
  );

-- Admin override
CREATE POLICY "Admins can manage all ID artefacts"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'idkit-intake'
    AND is_admin_user()
  )
  WITH CHECK (
    bucket_id = 'idkit-intake'
    AND is_admin_user()
  );

-- Scheduled cleanup helper (call via pg_cron or Supabase scheduled task)
CREATE OR REPLACE FUNCTION purge_expired_idkit_objects(max_age INTERVAL DEFAULT INTERVAL '72 hours')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'idkit-intake'
    AND created_at < NOW() - max_age;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN COALESCE(deleted_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION purge_expired_idkit_objects(INTERVAL) TO service_role;

