-- In-app notification channel + RLS enhancements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_category') THEN
    CREATE TYPE notification_category AS ENUM (
      'system',
      'booking',
      'payment',
      'equipment',
      'reminder',
      'support',
      'compliance',
      'marketing'
    );
  END IF;
END $$;

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'in_app';

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS category notification_category NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS action_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_label VARCHAR(100);

UPDATE notifications SET category = 'system' WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update read state" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;

CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage notifications" ON notifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

DROP FUNCTION IF EXISTS mark_notification_read(uuid);

CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_notification notifications;
BEGIN
  UPDATE notifications
  SET
    read_at = COALESCE(read_at, NOW()),
    delivered_at = COALESCE(delivered_at, NOW()),
    status = CASE WHEN status IN ('pending', 'sent') THEN 'delivered' ELSE status END,
    updated_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid()
  RETURNING * INTO v_notification;

  RETURN v_notification;
END;
$$;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS SETOF notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  UPDATE notifications
  SET
    read_at = COALESCE(read_at, NOW()),
    delivered_at = COALESCE(delivered_at, NOW()),
    status = CASE WHEN status IN ('pending', 'sent') THEN 'delivered' ELSE status END,
    updated_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;

REVOKE ALL ON notifications FROM authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT INSERT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;
