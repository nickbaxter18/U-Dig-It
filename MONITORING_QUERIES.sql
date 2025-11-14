-- 📊 MONITORING QUERIES FOR GROWTH FEATURES
-- Run these queries weekly to track performance
-- Date: November 4, 2025

-- ============================================
-- 🎯 WEEKLY GROWTH SNAPSHOT
-- ============================================

-- Run this every Monday morning for complete weekly overview
SELECT
  'Weekly Growth Snapshot - ' || TO_CHAR(NOW(), 'Mon DD, YYYY') as report_title,
  json_build_object(
    '📊 This Week Stats', json_build_object(
      'total_bookings', (
        SELECT COUNT(*) FROM bookings
        WHERE "createdAt" >= DATE_TRUNC('week', NOW())
        AND status IN ('confirmed', 'completed')
      ),
      'total_revenue', (
        SELECT COALESCE(SUM("totalAmount"), 0) FROM bookings
        WHERE "createdAt" >= DATE_TRUNC('week', NOW())
        AND status IN ('confirmed', 'completed')
      ),
      'attachment_rentals', (
        SELECT COUNT(DISTINCT booking_id) FROM booking_attachments
        WHERE created_at >= DATE_TRUNC('week', NOW())
      ),
      'hourly_rentals', (
        SELECT COUNT(*) FROM bookings
        WHERE "createdAt" >= DATE_TRUNC('week', NOW())
        AND EXTRACT(EPOCH FROM ("endDate" - "startDate")) / 3600 <= 8
      )
    ),
    '🎯 Action Items', json_build_object(
      'pending_credit_apps', (SELECT COUNT(*) FROM credit_applications WHERE status = 'pending'),
      'unverified_certs', (SELECT COUNT(*) FROM operator_certifications WHERE is_verified = false),
      'open_damage_reports', (SELECT COUNT(*) FROM damage_reports WHERE repair_status NOT IN ('completed', 'deferred')),
      'overdue_payments', (SELECT COUNT(*) FROM payment_schedules WHERE status IN ('pending', 'overdue') AND due_date < NOW()::date)
    ),
    '📈 Equipment Health', json_build_object(
      'avg_utilization', (SELECT ROUND(AVG(COALESCE(utilization_rate, 0)), 1) FROM equipment),
      'available_units', (SELECT COUNT(*) FROM equipment WHERE status = 'available'),
      'total_units', (SELECT COUNT(*) FROM equipment)
    )
  ) as weekly_snapshot;

-- ============================================
-- 🔧 ATTACHMENT PERFORMANCE (Run Weekly)
-- ============================================

SELECT
  a.name,
  a.attachment_type,
  a.daily_rate,
  (a.quantity_available - a.quantity_in_use) as available_now,
  COUNT(ba.id) FILTER (WHERE ba.created_at > NOW() - INTERVAL '30 days') as rentals_last_30_days,
  COALESCE(SUM(ba.total_amount) FILTER (WHERE ba.created_at > NOW() - INTERVAL '30 days'), 0) as revenue_last_30_days,
  ROUND(
    COALESCE(SUM(ba.total_amount) FILTER (WHERE ba.created_at > NOW() - INTERVAL '30 days'), 0) /
    NULLIF(COUNT(ba.id) FILTER (WHERE ba.created_at > NOW() - INTERVAL '30 days'), 0),
    2
  ) as avg_revenue_per_rental
FROM equipment_attachments a
LEFT JOIN booking_attachments ba ON ba.attachment_id = a.id
WHERE a.is_active = true
GROUP BY a.id, a.name, a.attachment_type, a.daily_rate, a.quantity_available, a.quantity_in_use
ORDER BY revenue_last_30_days DESC;

-- ============================================
-- 📈 EQUIPMENT UTILIZATION (Run Weekly)
-- ============================================

SELECT
  e.model,
  e."unitId",
  COALESCE(e.utilization_rate, 0) || '%' as utilization,
  COALESCE(e.total_rental_days, 0) as total_days_rented,
  '$' || COALESCE(e.revenue_generated, 0)::text as lifetime_revenue,
  e.last_rental_date::date,
  DATE_PART('day', NOW() - COALESCE(e.last_rental_date, e."createdAt")) as days_since_last_rental,
  CASE
    WHEN COALESCE(e.utilization_rate, 0) >= 80 THEN '🟢 Excellent'
    WHEN COALESCE(e.utilization_rate, 0) >= 60 THEN '🟡 Good'
    WHEN COALESCE(e.utilization_rate, 0) >= 40 THEN '🟠 Fair'
    WHEN COALESCE(e.utilization_rate, 0) >= 20 THEN '🔴 Poor'
    ELSE '⚫ Critical'
  END as performance,
  CASE
    WHEN COALESCE(e.utilization_rate, 0) < 40 THEN 'Consider pricing adjustment or marketing push'
    WHEN DATE_PART('day', NOW() - COALESCE(e.last_rental_date, e."createdAt")) > 30 THEN 'Idle >30 days - investigate'
    ELSE 'On track'
  END as recommendation
FROM equipment e
ORDER BY e.utilization_rate DESC NULLS LAST;

-- ============================================
-- 💳 CREDIT ACCOUNT HEALTH (Run Weekly)
-- ============================================

SELECT
  u."firstName" || ' ' || u."lastName" as customer,
  u."companyName" as company,
  u.credit_limit,
  u.credit_used,
  (u.credit_limit - u.credit_used) as available_credit,
  ROUND((u.credit_used / NULLIF(u.credit_limit, 0)) * 100, 1) || '%' as utilization,
  u.payment_terms_days || ' days' as terms,
  COUNT(b.id) FILTER (WHERE b."createdAt" > NOW() - INTERVAL '30 days') as bookings_last_30_days,
  COALESCE(SUM(b."totalAmount") FILTER (WHERE b."createdAt" > NOW() - INTERVAL '30 days'), 0) as revenue_last_30_days,
  CASE
    WHEN u.credit_used / NULLIF(u.credit_limit, 0) >= 0.9 THEN '🔴 Critical - Near Limit'
    WHEN u.credit_used / NULLIF(u.credit_limit, 0) >= 0.7 THEN '🟡 Warning - 70%+ Used'
    ELSE '🟢 Healthy'
  END as status
FROM users u
LEFT JOIN bookings b ON b."customerId" = u.id
WHERE u.credit_limit > 0
GROUP BY u.id, u."firstName", u."lastName", u."companyName", u.credit_limit, u.credit_used, u.payment_terms_days
ORDER BY (u.credit_used / NULLIF(u.credit_limit, 0)) DESC;

-- ============================================
-- 🎓 CERTIFICATION EXPIRY ALERTS (Run Weekly)
-- ============================================

SELECT
  u.email,
  u."firstName" || ' ' || u."lastName" as customer,
  oc.certification_type,
  oc.expiry_date,
  CASE
    WHEN oc.expiry_date IS NULL THEN '✅ No Expiry'
    WHEN oc.expiry_date < NOW()::date THEN '🔴 EXPIRED (' || DATE_PART('day', NOW()::date - oc.expiry_date)::text || ' days ago)'
    WHEN oc.expiry_date < NOW()::date + INTERVAL '30 days' THEN '🟡 Expiring Soon (' || DATE_PART('day', oc.expiry_date - NOW()::date)::text || ' days)'
    WHEN oc.expiry_date < NOW()::date + INTERVAL '90 days' THEN '🟢 Valid (' || DATE_PART('day', oc.expiry_date - NOW()::date)::text || ' days)'
    ELSE '✅ Valid'
  END as status,
  CASE
    WHEN oc.expiry_date < NOW()::date THEN 'Contact customer immediately - certification expired'
    WHEN oc.expiry_date < NOW()::date + INTERVAL '30 days' THEN 'Send renewal reminder email'
    ELSE 'No action needed'
  END as action_required
FROM operator_certifications oc
JOIN users u ON u.id = oc.customer_id
WHERE oc.is_verified = true
  AND (
    oc.expiry_date IS NULL
    OR oc.expiry_date >= NOW()::date - INTERVAL '90 days'
  )
ORDER BY oc.expiry_date NULLS LAST;

-- ============================================
-- 🚨 DAMAGE REPORTS (Run Daily)
-- ============================================

SELECT
  dr.report_number,
  dr.reported_at::date as date,
  dr.severity,
  dr.repair_status,
  e.model || ' (' || e."unitId" || ')' as equipment,
  dr.estimated_repair_cost,
  dr.customer_liable_amount,
  CASE
    WHEN dr.severity = 'critical' THEN '🔴 IMMEDIATE ACTION REQUIRED'
    WHEN dr.severity = 'severe' THEN '🟠 HIGH PRIORITY'
    WHEN dr.severity = 'major' THEN '🟡 MODERATE PRIORITY'
    ELSE '🟢 LOW PRIORITY'
  END as urgency
FROM damage_reports dr
JOIN equipment e ON e.id = dr.equipment_id
WHERE dr.repair_status NOT IN ('completed', 'deferred')
ORDER BY
  CASE dr.severity
    WHEN 'critical' THEN 1
    WHEN 'severe' THEN 2
    WHEN 'major' THEN 3
    WHEN 'moderate' THEN 4
    ELSE 5
  END,
  dr.reported_at DESC;

-- ============================================
-- 📊 MONTH-OVER-MONTH GROWTH (Run Monthly)
-- ============================================

WITH monthly_data AS (
  SELECT
    TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
    DATE_TRUNC('month', "createdAt") as month_date,
    COUNT(*) as bookings,
    COUNT(DISTINCT "customerId") as customers,
    SUM("totalAmount") as revenue,
    ROUND(AVG("totalAmount"), 2) as avg_booking_value
  FROM bookings
  WHERE "createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
    AND status IN ('confirmed', 'completed')
  GROUP BY DATE_TRUNC('month', "createdAt")
),
attachment_data AS (
  SELECT
    TO_CHAR(DATE_TRUNC('month', ba.created_at), 'Mon YYYY') as month,
    COUNT(DISTINCT ba.booking_id) as bookings_with_attachments,
    SUM(ba.total_amount) as attachment_revenue
  FROM booking_attachments ba
  WHERE ba.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
  GROUP BY DATE_TRUNC('month', ba.created_at)
)
SELECT
  md.month,
  md.bookings,
  md.customers,
  '$' || md.revenue::text as revenue,
  '$' || md.avg_booking_value::text as avg_value,
  COALESCE(ad.bookings_with_attachments, 0) as with_attachments,
  CASE
    WHEN md.bookings > 0
    THEN ROUND((COALESCE(ad.bookings_with_attachments, 0)::numeric / md.bookings) * 100, 1) || '%'
    ELSE '0%'
  END as attachment_rate,
  '$' || COALESCE(ad.attachment_revenue, 0)::text as attachment_revenue,
  LAG(md.revenue) OVER (ORDER BY md.month_date) as prev_month_revenue,
  CASE
    WHEN LAG(md.revenue) OVER (ORDER BY md.month_date) IS NOT NULL
    THEN ROUND(((md.revenue - LAG(md.revenue) OVER (ORDER BY md.month_date)) /
      NULLIF(LAG(md.revenue) OVER (ORDER BY md.month_date), 0)) * 100, 1) || '%'
    ELSE 'N/A'
  END as growth_vs_prev_month
FROM monthly_data md
LEFT JOIN attachment_data ad ON ad.month = md.month
ORDER BY md.month_date DESC;

-- ============================================
-- 🎯 REVENUE OPPORTUNITY ANALYSIS (Run Monthly)
-- ============================================

SELECT
  'Revenue Opportunities' as category,
  json_build_object(
    'bookings_without_attachments', (
      SELECT COUNT(*) FROM bookings b
      WHERE b."createdAt" > NOW() - INTERVAL '30 days'
        AND status IN ('confirmed', 'completed')
        AND NOT EXISTS (SELECT 1 FROM booking_attachments ba WHERE ba.booking_id = b.id)
    ),
    'estimated_lost_attachment_revenue', (
      -- Assume 30% would rent $75 auger for avg 3 days
      SELECT ROUND(COUNT(*) * 0.30 * 225, 2) FROM bookings b
      WHERE b."createdAt" > NOW() - INTERVAL '30 days'
        AND status IN ('confirmed', 'completed')
        AND NOT EXISTS (SELECT 1 FROM booking_attachments ba WHERE ba.booking_id = b.id)
    ),
    'customers_ready_for_credit', (
      SELECT COUNT(*) FROM (
        SELECT u.id
        FROM users u
        JOIN bookings b ON b."customerId" = u.id
        WHERE u.role = 'customer'
          AND (u.credit_limit IS NULL OR u.credit_limit = 0)
          AND b.status IN ('confirmed', 'completed')
        GROUP BY u.id
        HAVING COUNT(b.id) >= 3 AND SUM(b."totalAmount") >= 3000
      ) qualified_customers
    ),
    'equipment_below_target_utilization', (
      SELECT COUNT(*) FROM equipment WHERE COALESCE(utilization_rate, 0) < 60
    )
  ) as opportunities;

-- ============================================
-- 🚀 FEATURE ADOPTION TRACKING (Run Monthly)
-- ============================================

WITH date_range AS (
  SELECT NOW() - INTERVAL '30 days' as start_date, NOW() as end_date
)
SELECT
  'Feature Adoption - Last 30 Days' as report,
  json_build_object(
    'attachments', json_build_object(
      'bookings_with_attachments', (
        SELECT COUNT(DISTINCT ba.booking_id)
        FROM booking_attachments ba, date_range dr
        WHERE ba.created_at >= dr.start_date
      ),
      'total_bookings', (
        SELECT COUNT(*)
        FROM bookings b, date_range dr
        WHERE b."createdAt" >= dr.start_date
        AND b.status IN ('confirmed', 'completed')
      ),
      'adoption_rate', (
        SELECT CASE
          WHEN COUNT(*) > 0
          THEN ROUND((COUNT(DISTINCT ba.booking_id)::numeric / COUNT(DISTINCT b.id)) * 100, 1) || '%'
          ELSE '0%'
        END
        FROM bookings b, date_range dr
        LEFT JOIN booking_attachments ba ON ba.booking_id = b.id AND ba.created_at >= dr.start_date
        WHERE b."createdAt" >= dr.start_date
        AND b.status IN ('confirmed', 'completed')
      ),
      'revenue_generated', (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM booking_attachments ba, date_range dr
        WHERE ba.created_at >= dr.start_date
      )
    ),
    'hourly_rentals', json_build_object(
      'hourly_bookings', (
        SELECT COUNT(*)
        FROM bookings b, date_range dr
        WHERE b."createdAt" >= dr.start_date
        AND EXTRACT(EPOCH FROM (b."endDate" - b."startDate")) / 3600 <= 8
      ),
      'revenue', (
        SELECT COALESCE(SUM(b."totalAmount"), 0)
        FROM bookings b, date_range dr
        WHERE b."createdAt" >= dr.start_date
        AND EXTRACT(EPOCH FROM (b."endDate" - b."startDate")) / 3600 <= 8
      )
    ),
    'credit_accounts', json_build_object(
      'active_accounts', (SELECT COUNT(*) FROM users WHERE credit_limit > 0),
      'total_credit_extended', (SELECT COALESCE(SUM(credit_limit), 0) FROM users WHERE credit_limit > 0),
      'credit_utilized', (SELECT COALESCE(SUM(credit_used), 0) FROM users WHERE credit_limit > 0),
      'pending_applications', (SELECT COUNT(*) FROM credit_applications WHERE status = 'pending')
    )
  ) as feature_adoption;

-- ============================================
-- 💰 TOP REVENUE OPPORTUNITIES (Run Weekly)
-- ============================================

-- Customers who should be offered credit accounts
SELECT
  'Credit Upgrade Opportunities' as opportunity_type,
  u.id as customer_id,
  u."firstName" || ' ' || u."lastName" as customer_name,
  u.email,
  u."companyName",
  COUNT(b.id) as total_bookings,
  COALESCE(SUM(b."totalAmount"), 0) as lifetime_spend,
  ROUND(COALESCE(AVG(b."totalAmount"), 0), 2) as avg_booking_value,
  CASE
    WHEN COALESCE(SUM(b."totalAmount"), 0) >= 10000 THEN '$25,000'
    WHEN COALESCE(SUM(b."totalAmount"), 0) >= 5000 THEN '$10,000'
    ELSE '$5,000'
  END as recommended_credit_limit,
  '💰 High-value customer - offer credit for larger bookings' as action
FROM users u
JOIN bookings b ON b."customerId" = u.id AND b.status IN ('confirmed', 'completed')
WHERE u.role = 'customer'
  AND (u.credit_limit IS NULL OR u.credit_limit = 0)
GROUP BY u.id, u."firstName", u."lastName", u.email, u."companyName"
HAVING COUNT(b.id) >= 3 AND COALESCE(SUM(b."totalAmount"), 0) >= 3000
ORDER BY lifetime_spend DESC
LIMIT 10;

-- ============================================
-- 🎯 PERFORMANCE TARGETS (Run Weekly)
-- ============================================

SELECT
  'Performance vs Targets' as metric,
  json_build_object(
    'equipment_utilization', json_build_object(
      'current', (SELECT ROUND(AVG(COALESCE(utilization_rate, 0)), 1) FROM equipment),
      'target', 70,
      'status', CASE
        WHEN (SELECT AVG(COALESCE(utilization_rate, 0)) FROM equipment) >= 70 THEN '✅ On Target'
        ELSE '🔴 Below Target'
      END
    ),
    'attachment_adoption', json_build_object(
      'current', (
        SELECT CASE
          WHEN COUNT(*) > 0
          THEN ROUND((COUNT(DISTINCT ba.booking_id)::numeric / COUNT(DISTINCT b.id)) * 100, 1)
          ELSE 0
        END
        FROM bookings b
        LEFT JOIN booking_attachments ba ON ba.booking_id = b.id
        WHERE b."createdAt" > NOW() - INTERVAL '30 days'
        AND b.status IN ('confirmed', 'completed')
      ),
      'target', 25,
      'status', CASE
        WHEN (
          SELECT CASE
            WHEN COUNT(*) > 0
            THEN (COUNT(DISTINCT ba.booking_id)::numeric / COUNT(DISTINCT b.id)) * 100
            ELSE 0
          END
          FROM bookings b
          LEFT JOIN booking_attachments ba ON ba.booking_id = b.id
          WHERE b."createdAt" > NOW() - INTERVAL '30 days'
        ) >= 25 THEN '✅ On Target'
        ELSE '🎯 Opportunity'
      END
    ),
    'monthly_revenue', json_build_object(
      'current', (
        SELECT COALESCE(SUM("totalAmount"), 0)
        FROM bookings
        WHERE "createdAt" >= DATE_TRUNC('month', NOW())
        AND status IN ('confirmed', 'completed')
      ),
      'target', 20000,
      'status', CASE
        WHEN (
          SELECT COALESCE(SUM("totalAmount"), 0)
          FROM bookings
          WHERE "createdAt" >= DATE_TRUNC('month', NOW())
        ) >= 20000 THEN '✅ On Target'
        ELSE '📈 Growing'
      END
    )
  ) as targets;

-- ============================================
-- 🎉 SUCCESS METRICS (Run Monthly)
-- ============================================

-- Track month-over-month improvement
WITH this_month AS (
  SELECT
    COUNT(*) as bookings,
    SUM("totalAmount") as revenue,
    ROUND(AVG("totalAmount"), 2) as avg_value
  FROM bookings
  WHERE "createdAt" >= DATE_TRUNC('month', NOW())
    AND status IN ('confirmed', 'completed')
),
last_month AS (
  SELECT
    COUNT(*) as bookings,
    SUM("totalAmount") as revenue,
    ROUND(AVG("totalAmount"), 2) as avg_value
  FROM bookings
  WHERE "createdAt" >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    AND "createdAt" < DATE_TRUNC('month', NOW())
    AND status IN ('confirmed', 'completed')
)
SELECT
  'Monthly Performance Report' as report_type,
  json_build_object(
    'this_month', json_build_object(
      'bookings', (SELECT bookings FROM this_month),
      'revenue', (SELECT revenue FROM this_month),
      'avg_booking_value', (SELECT avg_value FROM this_month)
    ),
    'last_month', json_build_object(
      'bookings', (SELECT bookings FROM last_month),
      'revenue', (SELECT revenue FROM last_month),
      'avg_booking_value', (SELECT avg_value FROM last_month)
    ),
    'growth', json_build_object(
      'booking_growth', CASE
        WHEN (SELECT bookings FROM last_month) > 0
        THEN ROUND((((SELECT bookings FROM this_month) - (SELECT bookings FROM last_month))::numeric /
          (SELECT bookings FROM last_month)) * 100, 1) || '%'
        ELSE 'N/A'
      END,
      'revenue_growth', CASE
        WHEN (SELECT revenue FROM last_month) > 0
        THEN ROUND((((SELECT revenue FROM this_month) - (SELECT revenue FROM last_month)) /
          (SELECT revenue FROM last_month)) * 100, 1) || '%'
        ELSE 'N/A'
      END
    ),
    'feature_impact', json_build_object(
      'attachment_revenue_this_month', (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM booking_attachments
        WHERE created_at >= DATE_TRUNC('month', NOW())
      ),
      'attachment_contribution', CASE
        WHEN (SELECT revenue FROM this_month) > 0
        THEN ROUND(((
          SELECT COALESCE(SUM(total_amount), 0)
          FROM booking_attachments
          WHERE created_at >= DATE_TRUNC('month', NOW())
        ) / (SELECT revenue FROM this_month)) * 100, 1) || '%'
        ELSE '0%'
      END
    )
  ) as performance;

