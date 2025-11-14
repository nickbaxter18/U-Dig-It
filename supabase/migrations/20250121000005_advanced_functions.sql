-- Advanced Database Functions and Business Logic for Kubota Rental Platform
-- This migration adds sophisticated business logic, automated calculations, and triggers
-- Created: 2025-01-21

-- Function to automatically calculate booking pricing based on equipment rates and duration
CREATE OR REPLACE FUNCTION calculate_booking_pricing(
  p_equipment_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  taxes DECIMAL(10,2),
  float_fee DECIMAL(10,2),
  delivery_fee DECIMAL(10,2),
  seasonal_multiplier DECIMAL(4,3),
  total_amount DECIMAL(10,2),
  security_deposit DECIMAL(10,2)
) AS $$
DECLARE
  v_equipment RECORD;
  v_duration_days INTEGER;
  v_duration_weeks DECIMAL(4,2);
  v_duration_months DECIMAL(4,2);
  v_base_rate DECIMAL(10,2);
  v_seasonal_multiplier DECIMAL(4,3) := 1.0;
  v_tax_rate DECIMAL(4,3) := 0.15; -- 15% HST for New Brunswick
  v_float_fee DECIMAL(10,2) := 0;
  v_delivery_fee DECIMAL(10,2) := 0;
  v_security_deposit DECIMAL(10,2);
  v_subtotal DECIMAL(10,2);
BEGIN
  -- Get equipment details
  SELECT * INTO v_equipment FROM equipment WHERE id = p_equipment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipment not found';
  END IF;

  -- Calculate duration
  v_duration_days := EXTRACT(EPOCH FROM (p_end_date - p_start_date)) / 86400;
  v_duration_weeks := v_duration_days / 7.0;
  v_duration_months := v_duration_days / 30.0;

  -- Check for seasonal pricing
  SELECT multiplier INTO v_seasonal_multiplier
  FROM seasonal_pricing
  WHERE equipment_type = v_equipment.type
    AND p_start_date::date BETWEEN start_date AND end_date
    AND is_active = true
  LIMIT 1;

  -- Determine best rate based on duration
  IF v_duration_days >= 30 THEN
    v_base_rate := v_equipment.monthly_rate * v_duration_months;
  ELSIF v_duration_days >= 7 THEN
    v_base_rate := v_equipment.weekly_rate * v_duration_weeks;
  ELSE
    v_base_rate := v_equipment.daily_rate * v_duration_days;
  END IF;

  -- Apply seasonal multiplier
  v_subtotal := v_base_rate * COALESCE(v_seasonal_multiplier, 1.0);

  -- Calculate fees based on customer and delivery
  IF p_customer_id IS NOT NULL THEN
    -- Check if customer has delivery preference
    SELECT COALESCE(u.preferences->'booking'->>'default_delivery', 'false')::boolean
    INTO v_float_fee
    FROM users u WHERE u.id = p_customer_id;

    -- Add delivery fee for delivery bookings (sample calculation)
    IF v_float_fee THEN
      v_delivery_fee := 75.00; -- Base delivery fee
      -- Add distance-based fee (mock calculation)
      v_delivery_fee := v_delivery_fee + (RANDOM() * 50); -- 0-50 additional
    END IF;
  END IF;

  -- Calculate security deposit (typically 1 month's rent or 20% of equipment value)
  v_security_deposit := GREATEST(
    v_equipment.monthly_rate,
    v_equipment.replacement_value * 0.2
  );

  -- Calculate taxes
  v_taxes := (v_subtotal + v_delivery_fee) * v_tax_rate;

  -- Total amount
  v_subtotal := v_base_rate * COALESCE(v_seasonal_multiplier, 1.0);

  RETURN QUERY SELECT
    v_equipment.daily_rate,
    v_equipment.weekly_rate,
    v_equipment.monthly_rate,
    v_subtotal,
    (v_subtotal + v_delivery_fee) * v_tax_rate,
    v_float_fee,
    v_delivery_fee,
    COALESCE(v_seasonal_multiplier, 1.0),
    v_subtotal + v_taxes + v_delivery_fee,
    v_security_deposit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check equipment availability with conflict detection
CREATE OR REPLACE FUNCTION check_equipment_availability(
  p_equipment_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  conflicting_bookings BIGINT,
  next_available_date DATE,
  blackout_dates DATE[]
) AS $$
DECLARE
  v_conflicting_count BIGINT;
  v_next_available DATE;
  v_blackout_dates DATE[];
BEGIN
  -- Count conflicting bookings
  SELECT COUNT(*) INTO v_conflicting_count
  FROM bookings b
  WHERE b.equipment_id = p_equipment_id
    AND b.status NOT IN ('cancelled', 'rejected', 'completed')
    AND b.id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      (b.start_date <= p_end_date AND b.end_date >= p_start_date)
    );

  -- Find next available date
  SELECT MIN(b.start_date::date) INTO v_next_available
  FROM bookings b
  WHERE b.equipment_id = p_equipment_id
    AND b.status NOT IN ('cancelled', 'rejected', 'completed')
    AND b.end_date >= CURRENT_DATE
    AND b.id != COALESCE(p_exclude_booking_id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Get blackout dates (maintenance periods)
  SELECT ARRAY_AGG(em.scheduled_date::date) INTO v_blackout_dates
  FROM equipment_maintenance em
  WHERE em.equipment_id = p_equipment_id
    AND em.status = 'scheduled'
    AND em.scheduled_date::date BETWEEN p_start_date::date AND p_end_date::date;

  RETURN QUERY SELECT
    (v_conflicting_count = 0) AND NOT (p_start_date::date = ANY(COALESCE(v_blackout_dates, ARRAY[]::DATE[]))),
    v_conflicting_count,
    COALESCE(v_next_available, CURRENT_DATE),
    COALESCE(v_blackout_dates, ARRAY[]::DATE[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply discount codes to bookings
CREATE OR REPLACE FUNCTION apply_discount_code(
  p_booking_id UUID,
  p_discount_code TEXT
)
RETURNS TABLE (
  discount_applied DECIMAL(10,2),
  discount_description TEXT,
  new_total DECIMAL(10,2),
  success BOOLEAN
) AS $$
DECLARE
  v_discount RECORD;
  v_booking RECORD;
  v_discount_amount DECIMAL(10,2) := 0;
  v_new_total DECIMAL(10,2);
  v_used_count INTEGER;
BEGIN
  -- Get discount code details
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE code = UPPER(p_discount_code)
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
    AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP);

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::DECIMAL(10,2), 'Invalid or expired discount code', 0::DECIMAL(10,2), false;
    RETURN;
  END IF;

  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::DECIMAL(10,2), 'Booking not found', 0::DECIMAL(10,2), false;
    RETURN;
  END IF;

  -- Check minimum booking amount
  IF v_booking.total_amount < COALESCE(v_discount.min_booking_amount, 0) THEN
    RETURN QUERY SELECT 0::DECIMAL(10,2), 'Booking amount too low for this discount', 0::DECIMAL(10,2), false;
    RETURN;
  END IF;

  -- Check usage limits
  IF v_discount.max_uses IS NOT NULL AND v_discount.used_count >= v_discount.max_uses THEN
    RETURN QUERY SELECT 0::DECIMAL(10,2), 'Discount code usage limit exceeded', 0::DECIMAL(10,2), false;
    RETURN;
  END IF;

  -- Check per-user limits
  IF v_discount.max_uses_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO v_used_count
    FROM bookings b
    WHERE b.customer_id = v_booking.customer_id
      AND b.discount_code = p_discount_code
      AND b.status NOT IN ('cancelled', 'rejected');

    IF v_used_count >= v_discount.max_uses_per_user THEN
      RETURN QUERY SELECT 0::DECIMAL(10,2), 'Discount code per-user limit exceeded', 0::DECIMAL(10,2), false;
      RETURN;
    END IF;
  END IF;

  -- Calculate discount amount
  IF v_discount.type = 'percentage' THEN
    v_discount_amount := v_booking.total_amount * (v_discount.value / 100);
  ELSIF v_discount.type = 'fixed_amount' THEN
    v_discount_amount := LEAST(v_discount.value, v_booking.total_amount);
  END IF;

  -- Calculate new total
  v_new_total := GREATEST(v_booking.total_amount - v_discount_amount, 0);

  -- Update booking with discount
  UPDATE bookings
  SET
    discount_code = p_discount_code,
    discount_amount = v_discount_amount,
    total_amount = v_new_total,
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Increment usage count
  UPDATE discount_codes
  SET used_count = used_count + 1
  WHERE code = UPPER(p_discount_code);

  RETURN QUERY SELECT
    v_discount_amount,
    v_discount.name || ' (' || v_discount.type || ')',
    v_new_total,
    true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update equipment utilization metrics
CREATE OR REPLACE FUNCTION update_equipment_utilization_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when booking status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Insert or update utilization record for each day of the booking
    INSERT INTO equipment_utilization (equipment_id, booking_id, date, hours_used, fuel_consumed, revenue_generated, utilization_percentage)
    SELECT
      NEW.equipment_id,
      NEW.id,
      calendar_date,
      -- Estimate hours used per day (total hours / number of days)
      GREATEST(0, LEAST(8, (COALESCE(NEW.end_engine_hours, 0) - COALESCE(NEW.start_engine_hours, 0)) / NULLIF(date_diff, 0))),
      -- Estimate fuel consumption (mock calculation)
      GREATEST(0, (8 * 2.5) / NULLIF(date_diff, 0)), -- 2.5L per hour estimate
      -- Revenue per day
      NEW.total_amount / NULLIF(date_diff, 0),
      -- Utilization percentage (hours used / 8 hours available)
      LEAST(100, ((COALESCE(NEW.end_engine_hours, 0) - COALESCE(NEW.start_engine_hours, 0)) / NULLIF(date_diff, 0)) / 8 * 100)
    FROM (
      SELECT
        generate_series(
          NEW.actual_start_date::date,
          COALESCE(NEW.actual_end_date::date, NEW.end_date::date),
          '1 day'::interval
        )::date as calendar_date
    ) calendar
    CROSS JOIN (
      SELECT
        EXTRACT(EPOCH FROM (
          COALESCE(NEW.actual_end_date, NEW.end_date) - NEW.actual_start_date
        )) / 86400 as date_diff
    ) date_calc
    ON CONFLICT (equipment_id, date) DO UPDATE SET
      hours_used = EXCLUDED.hours_used,
      fuel_consumed = EXCLUDED.fuel_consumed,
      revenue_generated = EXCLUDED.revenue_generated,
      utilization_percentage = EXCLUDED.utilization_percentage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create notifications for booking events
CREATE OR REPLACE FUNCTION create_booking_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_name TEXT;
  v_equipment_model TEXT;
  v_unit_id TEXT;
  v_notification_id UUID;
BEGIN
  -- Get customer and equipment details
  SELECT u.first_name || ' ' || u.last_name INTO v_customer_name
  FROM users u WHERE u.id = NEW.customer_id;

  SELECT e.model, e.unit_id INTO v_equipment_model, v_unit_id
  FROM equipment e WHERE e.id = NEW.equipment_id;

  -- Create notification based on booking status
  CASE NEW.status
    WHEN 'confirmed' THEN
      INSERT INTO notifications (user_id, type, status, priority, title, message, template_id, template_data)
      VALUES (
        NEW.customer_id,
        'email',
        'pending',
        'medium',
        'Booking Confirmed',
        'Your booking ' || NEW.booking_number || ' has been confirmed for ' || NEW.start_date::date || ' to ' || NEW.end_date::date,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        jsonb_build_object(
          'customer_name', v_customer_name,
          'booking_number', NEW.booking_number,
          'equipment_model', v_equipment_model,
          'unit_id', v_unit_id,
          'start_date', NEW.start_date::date,
          'end_date', NEW.end_date::date,
          'total_amount', NEW.total_amount
        )
      ) RETURNING id INTO v_notification_id;

    WHEN 'active' THEN
      INSERT INTO notifications (user_id, type, status, priority, title, message, template_id, template_data)
      VALUES (
        NEW.customer_id,
        'email',
        'pending',
        'high',
        'Equipment Pickup Reminder',
        'Reminder: Your equipment rental starts tomorrow at ' || NEW.start_date::time,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        jsonb_build_object(
          'customer_name', v_customer_name,
          'booking_number', NEW.booking_number,
          'equipment_model', v_equipment_model,
          'unit_id', v_unit_id,
          'start_date', NEW.start_date::date,
          'start_time', NEW.start_date::time
        )
      ) RETURNING id INTO v_notification_id;

    WHEN 'completed' THEN
      INSERT INTO notifications (user_id, type, status, priority, title, message, template_id, template_data)
      VALUES (
        NEW.customer_id,
        'email',
        'pending',
        'medium',
        'Rental Completed',
        'Your rental period has ended. Please return equipment or contact us to extend.',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        jsonb_build_object(
          'customer_name', v_customer_name,
          'booking_number', NEW.booking_number,
          'equipment_model', v_equipment_model,
          'unit_id', v_unit_id,
          'end_date', NEW.end_date::date
        )
      ) RETURNING id INTO v_notification_id;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create audit logs for sensitive operations
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_action audit_action;
  v_user_id UUID;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_user_id := NEW.customer_id; -- For bookings, use customer as the user
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_user_id := NEW.customer_id; -- For bookings, use customer as the user
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_user_id := OLD.customer_id; -- For bookings, use customer as the user
  END IF;

  -- Only create audit logs for bookings table (most sensitive data)
  IF TG_TABLE_NAME = 'bookings' THEN
    PERFORM log_audit_event(
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      v_action,
      v_user_id,
      CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
      CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update equipment status based on bookings
CREATE OR REPLACE FUNCTION update_equipment_status_from_bookings()
RETURNS TRIGGER AS $$
DECLARE
  v_active_booking_count INTEGER;
  v_maintenance_count INTEGER;
BEGIN
  -- Count active bookings for this equipment
  SELECT COUNT(*) INTO v_active_booking_count
  FROM bookings b
  WHERE b.equipment_id = COALESCE(NEW.equipment_id, OLD.equipment_id)
    AND b.status IN ('confirmed', 'active')
    AND CURRENT_DATE BETWEEN b.start_date::date AND b.end_date::date;

  -- Count active maintenance for this equipment
  SELECT COUNT(*) INTO v_maintenance_count
  FROM equipment_maintenance em
  WHERE em.equipment_id = COALESCE(NEW.equipment_id, OLD.equipment_id)
    AND em.status = 'in_progress'
    AND em.scheduled_date::date <= CURRENT_DATE
    AND (em.completed_date IS NULL OR em.completed_date::date >= CURRENT_DATE);

  -- Update equipment status
  UPDATE equipment
  SET
    status = CASE
      WHEN v_maintenance_count > 0 THEN 'maintenance'
      WHEN v_active_booking_count > 0 THEN 'rented'
      ELSE 'available'
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.equipment_id, OLD.equipment_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate delivery fees based on distance and location
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
  p_booking_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  v_booking RECORD;
  v_equipment_location RECORD;
  v_delivery_distance DECIMAL(8,2);
  v_base_fee DECIMAL(10,2) := 75.00; -- Base delivery fee
  v_distance_fee DECIMAL(10,2) := 0;
BEGIN
  -- Get booking details
  SELECT b.*, e.location INTO v_booking
  FROM bookings b
  JOIN equipment e ON b.equipment_id = e.id
  WHERE b.id = p_booking_id AND b.type = 'delivery';

  IF NOT FOUND THEN
    RETURN 0; -- No delivery fee for pickup bookings
  END IF;

  -- Mock distance calculation (in production, use Google Maps API or similar)
  -- For Saint John area, calculate based on postal code
  v_delivery_distance := CASE
    WHEN v_booking.delivery_postal_code LIKE 'E2K%' THEN 5.0  -- Local area
    WHEN v_booking.delivery_postal_code LIKE 'E2%' THEN 15.0   -- Greater Saint John
    ELSE 25.0 -- Outside Saint John area
  END;

  -- Calculate distance-based fee ($2 per km)
  v_distance_fee := v_delivery_distance * 2.0;

  -- Apply minimum fee and weekend surcharge
  v_base_fee := GREATEST(v_base_fee, v_distance_fee);

  -- Weekend surcharge (20% for Saturday/Sunday delivery)
  IF EXTRACT(DOW FROM v_booking.start_date) IN (0, 6) THEN
    v_base_fee := v_base_fee * 1.2;
  END IF;

  RETURN v_base_fee;
END;
$$ LANGUAGE plpgsql;

-- Function to generate analytics data automatically
CREATE OR REPLACE FUNCTION generate_daily_analytics()
RETURNS void AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - 1;
  v_revenue DECIMAL(15,2);
  v_utilization DECIMAL(5,2);
  v_new_customers INTEGER;
  v_maintenance_costs DECIMAL(10,2);
BEGIN
  -- Calculate daily revenue
  SELECT COALESCE(SUM(total_amount), 0) INTO v_revenue
  FROM bookings
  WHERE start_date::date <= v_yesterday
    AND end_date::date >= v_yesterday
    AND status IN ('confirmed', 'active', 'completed');

  -- Calculate average utilization
  SELECT COALESCE(AVG(utilization_percentage), 0) INTO v_utilization
  FROM equipment_utilization
  WHERE date = v_yesterday;

  -- Count new customers
  SELECT COUNT(*) INTO v_new_customers
  FROM users
  WHERE created_at::date = v_yesterday;

  -- Calculate maintenance costs
  SELECT COALESCE(SUM(cost), 0) INTO v_maintenance_costs
  FROM equipment_maintenance
  WHERE completed_date::date = v_yesterday;

  -- Insert analytics data
  INSERT INTO analytics_data (metric_name, metric_category, date, value, metadata)
  VALUES
    ('daily_revenue', 'revenue', v_yesterday, v_revenue, jsonb_build_object('calculated_at', NOW())),
    ('daily_utilization', 'utilization', v_yesterday, v_utilization, jsonb_build_object('calculated_at', NOW())),
    ('daily_new_customers', 'customer', v_yesterday, v_new_customers, jsonb_build_object('calculated_at', NOW())),
    ('daily_maintenance_costs', 'equipment', v_yesterday, v_maintenance_costs, jsonb_build_object('calculated_at', NOW()))
  ON CONFLICT (metric_name, metric_category, date) DO UPDATE SET
    value = EXCLUDED.value,
    metadata = EXCLUDED.metadata;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE (
  table_name TEXT,
  records_deleted INTEGER,
  space_saved_mb DECIMAL(10,2)
) AS $$
DECLARE
  v_result RECORD;
  v_start_time TIMESTAMP;
  v_end_time TIMESTAMP;
  v_records_deleted INTEGER;
  v_space_before DECIMAL(10,2);
  v_space_after DECIMAL(10,2);
BEGIN
  -- Clean up old audit logs (keep 90 days)
  DELETE FROM audit_logs
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

  GET DIAGNOSTICS v_records_deleted = ROW_COUNT;

  -- Clean up old API usage logs (keep 30 days)
  DELETE FROM api_usage
  WHERE created_at < CURRENT_DATE - INTERVAL '30 days';

  -- Clean up old notifications (keep 60 days)
  DELETE FROM notifications
  WHERE created_at < CURRENT_DATE - INTERVAL '60 days'
    AND status IN ('sent', 'delivered', 'failed');

  -- Clean up old webhook events (keep 30 days)
  DELETE FROM webhook_events
  WHERE created_at < CURRENT_DATE - INTERVAL '30 days';

  -- Return cleanup summary
  RETURN QUERY SELECT
    'audit_logs'::TEXT,
    (SELECT COUNT(*) FROM audit_logs WHERE created_at < CURRENT_DATE - INTERVAL '90 days')::INTEGER,
    0::DECIMAL(10,2);

  RETURN QUERY SELECT
    'api_usage'::TEXT,
    (SELECT COUNT(*) FROM api_usage WHERE created_at < CURRENT_DATE - INTERVAL '30 days')::INTEGER,
    0::DECIMAL(10,2);

  RETURN QUERY SELECT
    'notifications'::TEXT,
    (SELECT COUNT(*) FROM notifications WHERE created_at < CURRENT_DATE - INTERVAL '60 days' AND status IN ('sent', 'delivered', 'failed'))::INTEGER,
    0::DECIMAL(10,2);

  RETURN QUERY SELECT
    'webhook_events'::TEXT,
    (SELECT COUNT(*) FROM webhook_events WHERE created_at < CURRENT_DATE - INTERVAL '30 days')::INTEGER,
    0::DECIMAL(10,2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate booking business rules
CREATE OR REPLACE FUNCTION validate_booking_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_equipment RECORD;
  v_customer RECORD;
  v_conflicting_bookings INTEGER;
BEGIN
  -- Get equipment and customer details
  SELECT * INTO v_equipment FROM equipment WHERE id = NEW.equipment_id;
  SELECT * INTO v_customer FROM users WHERE id = NEW.customer_id;

  -- Validate equipment availability
  SELECT conflicting_bookings INTO v_conflicting_bookings
  FROM check_equipment_availability(NEW.equipment_id, NEW.start_date, NEW.end_date);

  IF v_conflicting_bookings > 0 THEN
    RAISE EXCEPTION 'Equipment is not available for the selected dates. % conflicting bookings found.', v_conflicting_bookings;
  END IF;

  -- Validate booking duration (minimum 1 day, maximum 90 days)
  IF EXTRACT(EPOCH FROM (NEW.end_date - NEW.start_date)) < 86400 THEN
    RAISE EXCEPTION 'Minimum booking duration is 1 day';
  END IF;

  IF EXTRACT(EPOCH FROM (NEW.end_date - NEW.start_date)) > 7776000 THEN -- 90 days
    RAISE EXCEPTION 'Maximum booking duration is 90 days';
  END IF;

  -- Validate customer insurance requirements
  IF NOT EXISTS (
    SELECT 1 FROM insurance_documents id
    JOIN bookings b ON id.booking_id = b.id
    WHERE b.customer_id = NEW.customer_id
      AND id.status = 'verified'
      AND (id.verified_at IS NULL OR id.verified_at > CURRENT_DATE - INTERVAL '30 days')
  ) THEN
    -- Allow booking but mark as requiring insurance verification
    NEW.status := 'pending_insurance';
  END IF;

  -- Auto-calculate pricing if not provided
  IF NEW.total_amount IS NULL OR NEW.total_amount = 0 THEN
    SELECT total_amount INTO NEW.total_amount
    FROM calculate_booking_pricing(NEW.equipment_id, NEW.start_date, NEW.end_date, NEW.customer_id)
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic business logic
CREATE TRIGGER booking_utilization_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_equipment_utilization_metrics();

CREATE TRIGGER booking_notification_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_booking_notifications();

CREATE TRIGGER booking_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER equipment_status_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_equipment_status_from_bookings();

CREATE TRIGGER booking_validation_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_rules();

-- Create indexes for the new functions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_conflict_check ON bookings(equipment_id, start_date, end_date) WHERE status NOT IN ('cancelled', 'rejected', 'completed');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_maintenance_date_check ON equipment_maintenance(equipment_id, scheduled_date) WHERE status = 'scheduled';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discount_codes_validity ON discount_codes(valid_from, valid_until) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_documents_verification ON insurance_documents(status, verified_at) WHERE status = 'verified';

-- Grant permissions for functions
GRANT EXECUTE ON FUNCTION calculate_booking_pricing(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_equipment_availability(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_discount_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_delivery_fee(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_daily_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO authenticated;

-- Create RLS policies for function execution
CREATE POLICY "Users can execute booking functions" ON bookings
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins can execute admin functions" ON equipment
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create a function to get comprehensive booking details with related data
CREATE OR REPLACE FUNCTION get_booking_details(p_booking_id UUID)
RETURNS TABLE (
  booking_id UUID,
  booking_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  equipment_model TEXT,
  equipment_unit_id TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  total_amount DECIMAL(10,2),
  status TEXT,
  payments_total DECIMAL(10,2),
  contract_status TEXT,
  insurance_status TEXT,
  maintenance_due TEXT,
  utilization_hours DECIMAL(8,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.booking_number,
    u.first_name || ' ' || u.last_name,
    u.email,
    e.model,
    e.unit_id,
    b.start_date,
    b.end_date,
    b.total_amount,
    b.status,
    COALESCE(p.total_payments, 0),
    COALESCE(c.status, 'not_generated'),
    COALESCE(id.status, 'not_uploaded'),
    CASE
      WHEN em.next_due_date < CURRENT_DATE THEN 'overdue'
      WHEN em.next_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
      ELSE 'current'
    END,
    COALESCE(eu.total_hours, 0)
  FROM bookings b
  JOIN users u ON b.customer_id = u.id
  JOIN equipment e ON b.equipment_id = e.id
  LEFT JOIN (
    SELECT booking_id, SUM(amount) as total_payments
    FROM payments
    WHERE status = 'completed'
    GROUP BY booking_id
  ) p ON p.booking_id = b.id
  LEFT JOIN contracts c ON c.booking_id = b.id
  LEFT JOIN insurance_documents id ON id.booking_id = b.id
  LEFT JOIN (
    SELECT equipment_id, next_due_date
    FROM equipment_maintenance
    WHERE status = 'scheduled'
    ORDER BY next_due_date
    LIMIT 1
  ) em ON em.equipment_id = e.id
  LEFT JOIN (
    SELECT equipment_id, SUM(hours_used) as total_hours
    FROM equipment_utilization
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY equipment_id
  ) eu ON eu.equipment_id = e.id
  WHERE b.id = p_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to search across all entities
CREATE OR REPLACE FUNCTION global_search(p_search_term TEXT)
RETURNS TABLE (
  result_type search_result_type,
  result_id UUID,
  title TEXT,
  description TEXT,
  metadata JSONB,
  relevance_score DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.result_type,
    si.result_id,
    si.title,
    si.description,
    si.metadata,
    ts_rank(to_tsvector('english', si.searchable_text), plainto_tsquery('english', p_search_term)) as relevance_score
  FROM search_index si
  WHERE to_tsvector('english', si.searchable_text) @@ plainto_tsquery('english', p_search_term)
    AND si.is_active = true
  ORDER BY relevance_score DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for search function
GRANT EXECUTE ON FUNCTION get_booking_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION global_search(TEXT) TO authenticated;

-- Create a function to automatically generate weekly reports
CREATE OR REPLACE FUNCTION generate_weekly_report(p_week_start DATE DEFAULT NULL)
RETURNS TABLE (
  metric_name TEXT,
  metric_value DECIMAL(15,2),
  previous_period DECIMAL(15,2),
  change_percentage DECIMAL(8,2)
) AS $$
DECLARE
  v_week_start DATE := COALESCE(p_week_start, date_trunc('week', CURRENT_DATE - INTERVAL '7 days'));
  v_week_end DATE := v_week_start + INTERVAL '6 days';
  v_prev_week_start DATE := v_week_start - INTERVAL '7 days';
  v_prev_week_end DATE := v_prev_week_start + INTERVAL '6 days';
BEGIN
  RETURN QUERY
  -- Revenue comparison
  SELECT
    'weekly_revenue'::TEXT,
    COALESCE(SUM(b.total_amount), 0),
    COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 0),
    CASE
      WHEN COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 0) = 0 THEN NULL
      ELSE ((COALESCE(SUM(b.total_amount), 0) - COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 0)) /
            COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 1)) * 100
    END
  FROM bookings b
  WHERE b.start_date::date BETWEEN v_week_start AND v_week_end
    AND b.status IN ('confirmed', 'active', 'completed')

  UNION ALL

  -- Booking count comparison
  SELECT
    'weekly_bookings'::TEXT,
    COUNT(*)::DECIMAL(15,2),
    COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 0)::DECIMAL(15,2),
    CASE
      WHEN COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 0) = 0 THEN NULL
      ELSE ((COUNT(*) - COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 0)) /
            GREATEST(COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_prev_week_start AND v_prev_week_end), 0), 1)) * 100
    END
  FROM bookings b
  WHERE b.start_date::date BETWEEN v_week_start AND v_week_end
    AND b.status IN ('confirmed', 'active', 'completed')

  UNION ALL

  -- Utilization comparison
  SELECT
    'weekly_utilization'::TEXT,
    COALESCE(AVG(eu.utilization_percentage), 0),
    COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_prev_week_start AND v_prev_week_end), 0),
    CASE
      WHEN COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_prev_week_start AND v_prev_week_end), 0) = 0 THEN NULL
      ELSE ((COALESCE(AVG(eu.utilization_percentage), 0) - COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_prev_week_start AND v_prev_week_end), 0)) /
            COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_prev_week_start AND v_prev_week_end), 1)) * 100
    END
  FROM equipment_utilization eu
  WHERE eu.date BETWEEN v_week_start AND v_week_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for weekly reports
GRANT EXECUTE ON FUNCTION generate_weekly_report(DATE) TO authenticated;

-- Create RLS policy for weekly reports
CREATE POLICY "Admins can generate weekly reports" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create a function to handle equipment maintenance scheduling
CREATE OR REPLACE FUNCTION schedule_maintenance_reminders()
RETURNS TABLE (
  maintenance_id UUID,
  equipment_id UUID,
  customer_name TEXT,
  maintenance_type TEXT,
  scheduled_date DATE,
  days_until_due INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    em.id,
    em.equipment_id,
    u.first_name || ' ' || u.last_name,
    em.maintenance_type::TEXT,
    em.scheduled_date::date,
    (em.scheduled_date::date - CURRENT_DATE)
  FROM equipment_maintenance em
  JOIN bookings b ON b.equipment_id = em.equipment_id
  JOIN users u ON b.customer_id = u.id
  WHERE em.status = 'scheduled'
    AND em.scheduled_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    AND b.status IN ('confirmed', 'active')
  ORDER BY em.scheduled_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for maintenance reminders
GRANT EXECUTE ON FUNCTION schedule_maintenance_reminders() TO authenticated;

-- Create a comprehensive function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_date_range TEXT DEFAULT '30 days')
RETURNS TABLE (
  metric_name TEXT,
  current_value DECIMAL(15,2),
  previous_value DECIMAL(15,2),
  change_percentage DECIMAL(8,2),
  trend TEXT
) AS $$
DECLARE
  v_days INTEGER := CASE
    WHEN p_date_range = '7 days' THEN 7
    WHEN p_date_range = '30 days' THEN 30
    WHEN p_date_range = '90 days' THEN 90
    ELSE 30
  END;
  v_current_start DATE := CURRENT_DATE - v_days + 1;
  v_current_end DATE := CURRENT_DATE;
  v_previous_start DATE := CURRENT_DATE - (v_days * 2) + 1;
  v_previous_end DATE := CURRENT_DATE - v_days;
BEGIN
  RETURN QUERY
  -- Total Revenue
  SELECT
    'total_revenue'::TEXT,
    COALESCE(SUM(b.total_amount), 0),
    COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end), 0),
    CASE
      WHEN COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end), 0) = 0 THEN NULL
      ELSE ((COALESCE(SUM(b.total_amount), 0) - COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end), 0)) /
            COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end), 1)) * 100
    END,
    CASE
      WHEN COALESCE(SUM(b.total_amount), 0) > COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end), 0) THEN 'up'
      WHEN COALESCE(SUM(b.total_amount), 0) < COALESCE((SELECT SUM(total_amount) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end), 0) THEN 'down'
      ELSE 'stable'
    END
  FROM bookings b
  WHERE b.start_date::date BETWEEN v_current_start AND v_current_end
    AND b.status IN ('confirmed', 'active', 'completed')

  UNION ALL

  -- Active Bookings
  SELECT
    'active_bookings'::TEXT,
    COUNT(*)::DECIMAL(15,2),
    COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end AND status IN ('confirmed', 'active', 'completed')), 0)::DECIMAL(15,2),
    CASE
      WHEN COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end AND status IN ('confirmed', 'active', 'completed')), 0) = 0 THEN NULL
      ELSE ((COUNT(*) - COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end AND status IN ('confirmed', 'active', 'completed')), 0)) /
            GREATEST(COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end AND status IN ('confirmed', 'active', 'completed')), 0), 1)) * 100
    END,
    CASE
      WHEN COUNT(*) > COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end AND status IN ('confirmed', 'active', 'completed')), 0) THEN 'up'
      WHEN COUNT(*) < COALESCE((SELECT COUNT(*) FROM bookings WHERE start_date::date BETWEEN v_previous_start AND v_previous_end AND status IN ('confirmed', 'active', 'completed')), 0) THEN 'down'
      ELSE 'stable'
    END
  FROM bookings b
  WHERE b.start_date::date BETWEEN v_current_start AND v_current_end
    AND b.status IN ('confirmed', 'active')

  UNION ALL

  -- Equipment Utilization
  SELECT
    'avg_utilization'::TEXT,
    COALESCE(AVG(eu.utilization_percentage), 0),
    COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_previous_start AND v_previous_end), 0),
    CASE
      WHEN COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_previous_start AND v_previous_end), 0) = 0 THEN NULL
      ELSE ((COALESCE(AVG(eu.utilization_percentage), 0) - COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_previous_start AND v_previous_end), 0)) /
            COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_previous_start AND v_previous_end), 1)) * 100
    END,
    CASE
      WHEN COALESCE(AVG(eu.utilization_percentage), 0) > COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_previous_start AND v_previous_end), 0) THEN 'up'
      WHEN COALESCE(AVG(eu.utilization_percentage), 0) < COALESCE((SELECT AVG(utilization_percentage) FROM equipment_utilization WHERE date BETWEEN v_previous_start AND v_previous_end), 0) THEN 'down'
      ELSE 'stable'
    END
  FROM equipment_utilization eu
  WHERE eu.date BETWEEN v_current_start AND v_current_end

  UNION ALL

  -- Maintenance Costs
  SELECT
    'maintenance_costs'::TEXT,
    COALESCE(SUM(em.cost), 0),
    COALESCE((SELECT SUM(cost) FROM equipment_maintenance WHERE completed_date::date BETWEEN v_previous_start AND v_previous_end), 0),
    CASE
      WHEN COALESCE((SELECT SUM(cost) FROM equipment_maintenance WHERE completed_date::date BETWEEN v_previous_start AND v_previous_end), 0) = 0 THEN NULL
      ELSE ((COALESCE(SUM(em.cost), 0) - COALESCE((SELECT SUM(cost) FROM equipment_maintenance WHERE completed_date::date BETWEEN v_previous_start AND v_previous_end), 0)) /
            COALESCE((SELECT SUM(cost) FROM equipment_maintenance WHERE completed_date::date BETWEEN v_previous_start AND v_previous_end), 1)) * 100
    END,
    CASE
      WHEN COALESCE(SUM(em.cost), 0) > COALESCE((SELECT SUM(cost) FROM equipment_maintenance WHERE completed_date::date BETWEEN v_previous_start AND v_previous_end), 0) THEN 'up'
      WHEN COALESCE(SUM(em.cost), 0) < COALESCE((SELECT SUM(cost) FROM equipment_maintenance WHERE completed_date::date BETWEEN v_previous_start AND v_previous_end), 0) THEN 'down'
      ELSE 'stable'
    END
  FROM equipment_maintenance em
  WHERE em.completed_date::date BETWEEN v_current_start AND v_current_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for dashboard metrics
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(TEXT) TO authenticated;

-- Create RLS policy for dashboard metrics
CREATE POLICY "Admins can view dashboard metrics" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view maintenance metrics" ON equipment_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view utilization metrics" ON equipment_utilization
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Create a function to handle automated notifications
CREATE OR REPLACE FUNCTION process_pending_notifications()
RETURNS TABLE (
  notification_id UUID,
  user_id UUID,
  type notification_type,
  status notification_status,
  title TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  UPDATE notifications
  SET
    status = 'sent',
    sent_at = NOW()
  WHERE status = 'pending'
    AND scheduled_for <= NOW()
  RETURNING
    id,
    user_id,
    type,
    status,
    title,
    scheduled_for;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for notification processing
GRANT EXECUTE ON FUNCTION process_pending_notifications() TO authenticated;

-- Create final optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_process_pending ON notifications(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_status ON bookings(start_date, end_date, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_maintenance_status_date ON equipment_maintenance(status, scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_discount_codes_active_valid ON discount_codes(is_active, valid_from, valid_until);

-- Create a comprehensive view for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT
  -- Equipment Overview
  (SELECT COUNT(*) FROM equipment WHERE status = 'available') as available_equipment,
  (SELECT COUNT(*) FROM equipment WHERE status = 'rented') as rented_equipment,
  (SELECT COUNT(*) FROM equipment WHERE status = 'maintenance') as maintenance_equipment,

  -- Booking Overview
  (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'active') as active_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND end_date::date >= CURRENT_DATE - INTERVAL '7 days') as completed_this_week,

  -- Financial Overview
  (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status IN ('confirmed', 'active', 'completed') AND start_date::date >= CURRENT_DATE - INTERVAL '7 days') as revenue_this_week,
  (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status IN ('confirmed', 'active', 'completed') AND start_date::date >= CURRENT_DATE - INTERVAL '30 days') as revenue_this_month,
  (SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN bookings b ON p.booking_id = b.id WHERE p.status = 'completed' AND p.created_at::date >= CURRENT_DATE - INTERVAL '7 days') as payments_this_week,

  -- Maintenance Overview
  (SELECT COUNT(*) FROM equipment_maintenance WHERE status = 'scheduled' AND scheduled_date::date <= CURRENT_DATE + INTERVAL '7 days') as maintenance_due_soon,
  (SELECT COUNT(*) FROM equipment_maintenance WHERE status = 'in_progress') as maintenance_in_progress,
  (SELECT COALESCE(SUM(cost), 0) FROM equipment_maintenance WHERE completed_date::date >= CURRENT_DATE - INTERVAL '7 days') as maintenance_costs_this_week,

  -- Customer Overview
  (SELECT COUNT(*) FROM users WHERE role = 'customer' AND status = 'active') as total_customers,
  (SELECT COUNT(*) FROM users WHERE created_at::date >= CURRENT_DATE - INTERVAL '7 days') as new_customers_this_week,
  (SELECT COUNT(*) FROM bookings WHERE created_at::date >= CURRENT_DATE - INTERVAL '24 hours' AND status != 'cancelled') as bookings_today,

  -- System Health
  (SELECT COUNT(*) FROM notifications WHERE status = 'failed' AND created_at::date >= CURRENT_DATE - INTERVAL '24 hours') as failed_notifications_today,
  (SELECT COUNT(*) FROM webhook_events WHERE status = 'failed' AND created_at::date >= CURRENT_DATE - INTERVAL '24 hours') as failed_webhooks_today,
  (SELECT AVG(response_time_ms) FROM api_usage WHERE created_at::date >= CURRENT_DATE - INTERVAL '1 hour') as avg_response_time_1h;

-- Grant access to admin dashboard
GRANT SELECT ON admin_dashboard TO authenticated;

-- Create RLS policy for admin dashboard
CREATE POLICY "Admins can view admin dashboard" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view maintenance dashboard" ON equipment_maintenance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view payment dashboard" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can view api dashboard" ON api_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

ALTER VIEW admin_dashboard SET (security_barrier = true);

-- Create final triggers for data consistency
CREATE TRIGGER equipment_maintenance_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON equipment_maintenance
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER payment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER contract_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- Create a function to handle webhook event processing
CREATE OR REPLACE FUNCTION process_webhook_events()
RETURNS TABLE (
  event_id UUID,
  event_type webhook_event_type,
  payload JSONB,
  processed BOOLEAN
) AS $$
DECLARE
  v_event RECORD;
BEGIN
  -- Process pending webhook events
  FOR v_event IN
    SELECT * FROM webhook_events
    WHERE status = 'pending'
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    ORDER BY created_at
    LIMIT 10
  LOOP
    -- Update event status to processing
    UPDATE webhook_events
    SET
      status = 'processing',
      retry_count = retry_count + 1,
      updated_at = NOW()
    WHERE id = v_event.id;

    -- Process the webhook (this would contain actual webhook processing logic)
    -- For now, just mark as processed
    UPDATE webhook_events
    SET
      status = 'processed',
      processed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_event.id;

    event_id := v_event.id;
    event_type := v_event.event_type;
    payload := v_event.payload;
    processed := true;

    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for webhook processing
GRANT EXECUTE ON FUNCTION process_webhook_events() TO authenticated;

-- Create final comprehensive indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_comprehensive ON bookings(customer_id, equipment_id, status, start_date, end_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_comprehensive ON equipment(status, type, model, year, daily_rate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_comprehensive ON users(role, status, email, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_comprehensive ON notifications(user_id, status, type, scheduled_for);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_comprehensive ON audit_logs(table_name, record_id, user_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_comprehensive ON api_usage(user_id, endpoint, method, status_code, created_at);

-- Set up realtime for all critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE equipment_maintenance;

-- Grant realtime permissions
GRANT SELECT ON bookings TO anon;
GRANT SELECT ON equipment TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON equipment_maintenance TO authenticated;

-- Create a comprehensive system health check function
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT,
  last_checked TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  -- Check database connectivity
  SELECT
    'database_connectivity'::TEXT,
    'healthy'::TEXT,
    'Database connection successful'::TEXT,
    NOW();

  -- Check RLS policies
  RETURN QUERY
  SELECT
    'rls_policies'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'healthy'
      ELSE 'warning'
    END,
    COUNT(*) || ' RLS policies configured'::TEXT,
    NOW()
  FROM pg_policies
  WHERE schemaname = 'public';

  -- Check indexes
  RETURN QUERY
  SELECT
    'database_indexes'::TEXT,
    CASE
      WHEN COUNT(*) > 10 THEN 'healthy'
      WHEN COUNT(*) > 5 THEN 'warning'
      ELSE 'critical'
    END,
    COUNT(*) || ' indexes found'::TEXT,
    NOW()
  FROM pg_indexes
  WHERE schemaname = 'public';

  -- Check recent errors
  RETURN QUERY
  SELECT
    'recent_errors'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'healthy'
      WHEN COUNT(*) < 5 THEN 'warning'
      ELSE 'critical'
    END,
    COUNT(*) || ' errors in last 24 hours'::TEXT,
    NOW()
  FROM audit_logs
  WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours'
    AND action = 'error';

  -- Check API performance
  RETURN QUERY
  SELECT
    'api_performance'::TEXT,
    CASE
      WHEN AVG(response_time_ms) < 500 THEN 'healthy'
      WHEN AVG(response_time_ms) < 1000 THEN 'warning'
      ELSE 'critical'
    END,
    'Avg response time: ' || ROUND(AVG(response_time_ms), 2) || 'ms'::TEXT,
    NOW()
  FROM api_usage
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for health checks
GRANT EXECUTE ON FUNCTION system_health_check() TO authenticated;

-- Create final data validation function
CREATE OR REPLACE FUNCTION validate_system_data()
RETURNS TABLE (
  validation_check TEXT,
  status TEXT,
  details TEXT,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Check for orphaned records
  SELECT
    'orphaned_bookings'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'pass'
      ELSE 'fail'
    END,
    COUNT(*) || ' orphaned booking records found'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'Review and clean up orphaned records'
      ELSE 'No action needed'
    END
  FROM bookings b
  LEFT JOIN auth.users u ON b.customer_id = u.id
  LEFT JOIN equipment e ON b.equipment_id = e.id
  WHERE u.id IS NULL OR e.id IS NULL;

  -- Check for invalid date ranges
  RETURN QUERY
  SELECT
    'invalid_date_ranges'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'pass'
      ELSE 'fail'
    END,
    COUNT(*) || ' bookings with invalid date ranges'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'Review and fix booking date ranges'
      ELSE 'No action needed'
    END
  FROM bookings
  WHERE start_date >= end_date;

  -- Check for missing insurance documents
  RETURN QUERY
  SELECT
    'missing_insurance'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'pass'
      ELSE 'warning'
    END,
    COUNT(*) || ' active bookings without insurance documents'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'Follow up with customers for insurance documentation'
      ELSE 'No action needed'
    END
  FROM bookings b
  LEFT JOIN insurance_documents id ON b.id = id.booking_id
  WHERE b.status IN ('confirmed', 'active')
    AND (id.id IS NULL OR id.status != 'verified');

  -- Check for overdue maintenance
  RETURN QUERY
  SELECT
    'overdue_maintenance'::TEXT,
    CASE
      WHEN COUNT(*) = 0 THEN 'pass'
      ELSE 'warning'
    END,
    COUNT(*) || ' equipment units with overdue maintenance'::TEXT,
    CASE
      WHEN COUNT(*) > 0 THEN 'Schedule maintenance for overdue equipment'
      ELSE 'No action needed'
    END
  FROM equipment_maintenance em
  JOIN equipment e ON em.equipment_id = e.id
  WHERE em.status = 'scheduled'
    AND em.scheduled_date < CURRENT_DATE
    AND e.status != 'maintenance';

  -- Check data consistency
  RETURN QUERY
  SELECT
    'data_consistency'::TEXT,
    'pass'::TEXT,
    'All data validation checks completed'::TEXT,
    'System data is consistent'
  WHERE NOT EXISTS (
    SELECT 1 FROM bookings b
    LEFT JOIN auth.users u ON b.customer_id = u.id
    LEFT JOIN equipment e ON b.equipment_id = e.id
    WHERE u.id IS NULL OR e.id IS NULL
  ) AND NOT EXISTS (
    SELECT 1 FROM bookings WHERE start_date >= end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for data validation
GRANT EXECUTE ON FUNCTION validate_system_data() TO authenticated;

-- Create final comprehensive indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_health ON audit_logs(created_at) WHERE action = 'error';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_overdue ON equipment_maintenance(scheduled_date) WHERE status = 'scheduled' AND scheduled_date < CURRENT_DATE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insurance_missing ON bookings(status) WHERE status IN ('confirmed', 'active');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_date_validation ON bookings(start_date, end_date);

-- Set up comprehensive realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE api_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_events;

-- Grant comprehensive realtime permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON api_usage TO authenticated;
GRANT SELECT ON webhook_events TO authenticated;

-- Final system setup validation
DO $$
DECLARE
  v_table_count INTEGER;
  v_policy_count INTEGER;
  v_function_count INTEGER;
  v_index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  SELECT COUNT(*) INTO v_policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(*) INTO v_function_count FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
  SELECT COUNT(*) INTO v_index_count FROM pg_indexes WHERE schemaname = 'public';

  RAISE NOTICE 'Advanced Functions Setup Complete:';
  RAISE NOTICE '- Tables: %', v_table_count;
  RAISE NOTICE '- RLS Policies: %', v_policy_count;
  RAISE NOTICE '- Functions: %', v_function_count;
  RAISE NOTICE '- Indexes: %', v_index_count;
  RAISE NOTICE '- Real-time enabled for critical tables';

  -- Log setup completion
  INSERT INTO audit_logs (table_name, record_id, action, user_id, metadata)
  VALUES ('system', '00000000-0000-0000-0000-000000000000', 'create', '22222222-2222-2222-2222-222222222222',
          jsonb_build_object('setup_type', 'advanced_functions', 'timestamp', NOW(), 'tables', v_table_count, 'policies', v_policy_count, 'functions', v_function_count));
END $$;

