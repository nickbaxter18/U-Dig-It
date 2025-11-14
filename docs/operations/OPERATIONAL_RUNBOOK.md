# 📖 Operational Runbook
**Kubota Rental Platform - Day-to-Day Operations Guide**

**Purpose:** Quick reference for common operational tasks and troubleshooting

---

## 🎯 **Daily Operations**

### **Morning Checklist** (15 min)
```bash
□ Check system health: https://udigitrentals.com/api/health
□ Review overnight bookings (Admin Dashboard)
□ Check email delivery rate (SendGrid Dashboard)
□ Verify payment processing (Stripe Dashboard)
□ Review error logs (Vercel + Supabase)
□ Check disk space and database size
```

### **Throughout the Day**
```bash
□ Monitor new bookings in real-time
□ Respond to customer inquiries
□ Process payment disputes if any
□ Update equipment availability as needed
□ Send contracts when bookings confirmed
```

### **End of Day** (10 min)
```bash
□ Review day's bookings and revenue
□ Check for failed payments or emails
□ Verify all contracts sent
□ Update equipment status if needed
□ Plan tomorrow's deliveries
```

---

## 🔧 **Common Tasks**

### **1. Create Manual Booking (Admin)**

**Via Admin Dashboard:**
1. Go to: https://udigitrentals.com/admin/bookings
2. Click "Create Booking"
3. Fill customer info
4. Select dates
5. Review pricing
6. Submit

**Via Database (if UI fails):**
```sql
-- Use Supabase Dashboard → SQL Editor
INSERT INTO bookings (
  "customerId",
  "equipmentId",
  "startDate",
  "endDate",
  "deliveryAddress",
  "totalAmount",
  status
) VALUES (
  'user-uuid-here',
  (SELECT id FROM equipment LIMIT 1),
  '2025-12-01',
  '2025-12-05',
  '123 Customer St, Saint John, NB',
  895.50,
  'pending'
);
```

### **2. Update Booking Status**

**Via Admin Dashboard:**
1. Admin Dashboard → Bookings
2. Click on booking
3. Update status dropdown
4. Save

**Via Database:**
```sql
UPDATE bookings
SET status = 'confirmed'
WHERE "bookingNumber" = 'BK-XXXXX';
```

### **3. Process Refund**

**Via Admin Dashboard:**
1. Admin → Payments
2. Find payment
3. Click "Refund"
4. Enter amount
5. Confirm

**Via Stripe Dashboard:**
1. Go to Stripe Dashboard → Payments
2. Find payment
3. Click "Refund"
4. Webhook will update database automatically

### **4. Send Contract to Customer**

**Via Admin Dashboard:**
1. Admin → Contracts
2. Find booking
3. Click "Send Contract"
4. Customer receives email notification

**Manual Trigger:**
```sql
-- Mark as ready for contract
UPDATE bookings
SET status = 'confirmed'
WHERE id = 'booking-id-here';

-- Contract generation should trigger automatically
```

### **5. Mark Equipment as Unavailable**

**Quick Method:**
```sql
-- Create availability block
INSERT INTO availability_blocks (
  equipment_id,
  start_at_utc,
  end_at_utc,
  reason,
  notes
) VALUES (
  (SELECT id FROM equipment LIMIT 1),
  '2025-12-01 00:00:00+00',
  '2025-12-10 23:59:59+00',
  'maintenance',
  'Scheduled maintenance'
);
```

**Via Admin (Future):**
- Admin → Equipment
- Click on equipment
- Click "Mark Unavailable"
- Select dates and reason

---

## 🐛 **Troubleshooting**

### **Problem: Emails Not Sending**

**Symptoms:**
- Customer not receiving booking confirmation
- No emails in SendGrid activity feed

**Diagnosis:**
```bash
# 1. Check environment variable
echo $SENDGRID_API_KEY

# 2. Check SendGrid dashboard
# Go to: https://app.sendgrid.com/email_activity
# Filter by recipient email

# 3. Check application logs
# Vercel Dashboard → Logs
# Search for: "email"
```

**Solutions:**
```bash
# If API key expired:
# 1. Generate new key in SendGrid
# 2. Update Vercel env var
# 3. Redeploy

# If domain not verified:
# 1. SendGrid → Sender Authentication
# 2. Verify domain
# 3. Wait for DNS propagation (24-48h)

# If emails going to spam:
# 1. Authenticate domain (SPF/DKIM/DMARC)
# 2. Warm up sending gradually
# 3. Ask customers to whitelist
```

---

### **Problem: Payment Failing**

**Symptoms:**
- Customer reports payment not processing
- Stripe shows "payment_failed" events

**Diagnosis:**
```bash
# 1. Check Stripe Dashboard → Payments
# Look for failed payment

# 2. Check decline code
# Common codes:
# - insufficient_funds
# - card_declined
# - expired_card
```

**Solutions:**
```bash
# If card declined:
# → Ask customer to use different card

# If Stripe API error:
# 1. Check Stripe API status: https://status.stripe.com
# 2. Verify webhook secret
# 3. Check Vercel logs for errors

# If security hold failing:
# → Ensure STRIPE_SECRET_KEY is correct live key
```

---

### **Problem: Booking Conflicts**

**Symptoms:**
- Double bookings
- Equipment showing as available when it's not

**Diagnosis:**
```sql
-- Check for overlapping bookings
SELECT
  "bookingNumber",
  "startDate",
  "endDate",
  status
FROM bookings
WHERE status NOT IN ('cancelled', 'rejected')
  AND "equipmentId" = 'equipment-id-here'
ORDER BY "startDate";
```

**Solutions:**
```sql
-- Cancel conflicting booking
UPDATE bookings
SET status = 'cancelled',
    "cancellationReason" = 'Conflict resolved by admin'
WHERE id = 'booking-id-here';

-- OR create availability block
INSERT INTO availability_blocks (
  equipment_id,
  start_at_utc,
  end_at_utc,
  reason
) VALUES (
  'equipment-id',
  '2025-12-01',
  '2025-12-05',
  'booked'
);
```

---

### **Problem: RLS Access Denied**

**Symptoms:**
- User can't see their own bookings
- Admin can't access certain data

**Diagnosis:**
```sql
-- Check user role
SELECT id, email, role
FROM users
WHERE email = 'user@example.com';

-- Verify RLS policies active
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'bookings';
```

**Solutions:**
```sql
-- Grant admin role if needed
UPDATE users
SET role = 'admin'
WHERE email = 'admin@udigitrentals.com';

-- Test RLS bypass with service role
-- Use service role key in server-side code
```

---

### **Problem: Frontend Not Loading**

**Symptoms:**
- White screen
- "Application error" message

**Diagnosis:**
```bash
# 1. Check Vercel deployment status
vercel ls

# 2. Check build logs
vercel logs --since 1h

# 3. Check for JavaScript errors
# Open browser console
```

**Solutions:**
```bash
# If build failed:
vercel --prod # Redeploy

# If environment variable missing:
# Vercel Dashboard → Environment Variables
# Add missing variable
# Redeploy

# If Supabase connection failing:
# Verify NEXT_PUBLIC_SUPABASE_URL
# Check Supabase project status
```

---

## 📊 **Monitoring Dashboards**

### **Daily Monitoring URLs**
- **Frontend:** https://vercel.com/dashboard
- **Database:** https://supabase.com/dashboard
- **Payments:** https://dashboard.stripe.com
- **Emails:** https://app.sendgrid.com
- **Analytics:** https://analytics.google.com (if configured)

### **Key Metrics to Track**
```bash
Daily:
- New bookings: Target 2-5/day
- Revenue: Target $500-2000/day
- Email delivery: Target > 95%
- Uptime: Target > 99.9%

Weekly:
- Total bookings
- Conversion rate
- Average booking value
- Customer retention
- Equipment utilization
```

---

## 🔐 **Security Incidents**

### **If Data Breach Suspected**

**Immediate Actions:**
1. ☐ Disable affected user accounts
2. ☐ Rotate all API keys
3. ☐ Review audit logs
4. ☐ Notify affected customers (if PII compromised)
5. ☐ Document incident

**Investigation:**
```sql
-- Check audit logs
SELECT * FROM audit_logs
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;

-- Check for unusual activity
SELECT
  "customerId",
  COUNT(*) as booking_count
FROM bookings
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
GROUP BY "customerId"
HAVING COUNT(*) > 5; -- Suspicious if > 5 bookings/hour
```

---

## 📞 **Emergency Contacts**

### **Technical Support**
- Vercel Support: https://vercel.com/help
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com/contact

### **Internal Team**
- Developer: [Your contact]
- Admin: [Admin contact]
- Business Owner: [Owner contact]

---

## ✅ **Quick Commands Reference**

### **Check System Health**
```bash
curl https://udigitrentals.com/api/health
```

### **View Recent Bookings**
```sql
SELECT
  "bookingNumber",
  status,
  "totalAmount",
  "createdAt"
FROM bookings
ORDER BY "createdAt" DESC
LIMIT 10;
```

### **Check Email Delivery**
```sql
SELECT
  recipient_email,
  subject,
  status,
  sent_at
FROM email_logs
ORDER BY sent_at DESC
LIMIT 20;
```

### **Monitor Database Size**
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎯 **Success Criteria**

**System is healthy when:**
- ✅ API health check returns 200
- ✅ Database queries < 100ms
- ✅ Email delivery > 95%
- ✅ Payment success > 95%
- ✅ Uptime > 99.9%
- ✅ Error rate < 0.1%
- ✅ No critical security issues

**When to escalate:**
- ❌ Uptime < 99%
- ❌ Error rate > 1%
- ❌ Payment failure > 5%
- ❌ Email delivery < 90%
- ❌ Security incident detected

---

**Remember:** This platform is production-ready! Monitor closely in first week, then it runs itself. 🚀


