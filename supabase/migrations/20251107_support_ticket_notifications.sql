CREATE OR REPLACE FUNCTION notify_support_ticket_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_status TEXT := COALESCE(NEW.status, 'open');
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.customer_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        status,
        priority,
        title,
        message,
        category,
        action_url,
        cta_label,
        template_id,
        template_data,
        metadata
      ) VALUES (
        NEW.customer_id,
        'in_app',
        'sent',
        'medium',
        'Support ticket created',
        'We received your ticket "' || COALESCE(NEW.subject, 'Support request') || '". Our team will respond shortly.',
        'support',
        '/support?tab=tickets',
        'View ticket',
        'support_ticket_created_customer',
        jsonb_build_object(
          'ticket_id', NEW.id,
          'ticket_number', NEW.ticket_number,
          'status', NEW.status,
          'priority', NEW.priority
        ),
        jsonb_build_object(
          'event', 'support_ticket_created',
          'ticket_id', NEW.id,
          'ticket_number', NEW.ticket_number
        )
      );
    END IF;

    INSERT INTO notifications (
      user_id,
      type,
      status,
      priority,
      title,
      message,
      category,
      action_url,
      cta_label,
      template_id,
      template_data,
      metadata
    )
    SELECT
      u.id,
      'in_app',
      'sent',
      'medium',
      'New support ticket ' || NEW.ticket_number,
      'Ticket "' || COALESCE(NEW.subject, 'Support request') || '" needs attention.',
      'support',
      '/admin/support?ticket=' || NEW.id,
      'Open ticket',
      'support_ticket_created_admin',
      jsonb_build_object(
        'ticket_id', NEW.id,
        'ticket_number', NEW.ticket_number,
        'status', NEW.status,
        'priority', NEW.priority
      ),
      jsonb_build_object(
        'event', 'support_ticket_created_admin',
        'ticket_id', NEW.id,
        'ticket_number', NEW.ticket_number
      )
    FROM users u
    WHERE u.role IN ('admin', 'super_admin');
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.customer_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        status,
        priority,
        title,
        message,
        category,
        action_url,
        cta_label,
        template_id,
        template_data,
        metadata
      ) VALUES (
        NEW.customer_id,
        'in_app',
        'sent',
        CASE WHEN NEW.status = 'resolved' THEN 'low' ELSE 'medium' END,
        'Support ticket update',
        'Ticket ' || NEW.ticket_number || ' is now ' || v_status || '.',
        'support',
        '/support?tab=tickets',
        'View updates',
        'support_ticket_status_update',
        jsonb_build_object(
          'ticket_id', NEW.id,
          'ticket_number', NEW.ticket_number,
          'status', NEW.status,
          'priority', NEW.priority
        ),
        jsonb_build_object(
          'event', 'support_ticket_status_update',
          'ticket_id', NEW.id,
          'ticket_number', NEW.ticket_number,
          'status', NEW.status
        )
      );
    END IF;

    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        status,
        priority,
        title,
        message,
        category,
        action_url,
        cta_label,
        template_id,
        template_data,
        metadata
      ) VALUES (
        NEW.assigned_to,
        'in_app',
        'sent',
        'medium',
        'New ticket assigned',
        'Ticket ' || NEW.ticket_number || ' has been assigned to you.',
        'support',
        '/admin/support?ticket=' || NEW.id,
        'Review ticket',
        'support_ticket_assigned',
        jsonb_build_object(
          'ticket_id', NEW.id,
          'ticket_number', NEW.ticket_number,
          'status', NEW.status,
          'priority', NEW.priority
        ),
        jsonb_build_object(
          'event', 'support_ticket_assigned',
          'ticket_id', NEW.id,
          'ticket_number', NEW.ticket_number
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_ticket_notify ON support_tickets;
CREATE TRIGGER support_ticket_notify
  AFTER INSERT OR UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_support_ticket_changes();



