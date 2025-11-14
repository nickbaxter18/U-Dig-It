# Hold System v4 - Production Deployment Guide

## 🚀 Quick Start Checklist

Before deploying to production, complete these steps:

- [ ] 1. Configure environment variables
- [ ] 2. Set up Stripe webhook endpoint
- [ ] 3. Configure cron job for T-48 holds
- [ ] 4. Test with Stripe test cards
- [ ] 5. Clear test bookings from database
- [ ] 6. Deploy to production
- [ ] 7. Verify webhooks are working
- [ ] 8. Test end-to-end booking flow

---

## 1️⃣ Environment Variables

### Add to `.env.local` (local development):
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Get from Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # Get after creating webhook (step 2)

# Internal Service Authentication
INTERNAL_SERVICE_KEY=generate_random_32_char_string_here
CRON_SECRET=generate_another_random_32_char_string

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generate Random Secrets:
```bash
# Generate INTERNAL_SERVICE_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Add to Production Environment (Vercel/Railway/etc):
- Use the same variables but with **LIVE** Stripe keys (`sk_live_...` and `pk_live_...`)
- Set `NEXT_PUBLIC_APP_URL` to your production domain

---

## 2️⃣ Configure Stripe Webhook

### Step-by-Step:

1. **Go to Stripe Dashboard** → [Developers > Webhooks](https://dashboard.stripe.com/test/webhooks)

2. **Click "Add endpoint"**

3. **Configure Endpoint:**
   - **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
   - **Description**: U-Dig It Rentals - Hold System v4
   - **Events to send**:
     ```
     setup_intent.succeeded
     payment_intent.succeeded
     payment_intent.canceled
     payment_intent.payment_failed
     charge.dispute.created
     charge.dispute.updated
     ```

4. **Click "Add endpoint"**

5. **Copy Webhook Secret**:
   - Click "Reveal" next to "Signing secret"
   - Copy the value (starts with `whsec_...`)
   - Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

6. **Test the webhook**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Forward webhooks to local dev
   stripe listen --forward-to localhost:3000/api/webhooks/stripe

   # Test with Stripe CLI
   stripe trigger setup_intent.succeeded
   stripe trigger payment_intent.succeeded
   ```

---

## 3️⃣ Configure Cron Job

The system needs to check for T-48 holds every 5 minutes.

### Option A: Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/jobs/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option B: External Cron Service (cron-job.org)

1. Go to [cron-job.org](https://cron-job.org)
2. Create free account
3. Add new cron job:
   - **URL**: `https://yourdomain.com/api/jobs/process`
   - **Schedule**: `*/5 * * * *` (every 5 minutes)
   - **Method**: POST
   - **Headers**:
     ```
     x-cron-secret: your-generated-cron-secret
     Content-Type: application/json
     ```

### Option C: AWS EventBridge / Google Cloud Scheduler

Configure based on your cloud provider's documentation.

---

## 4️⃣ Test with Stripe Test Cards

### Test Card Numbers:

| Card Number          | Scenario                      |
|----------------------|-------------------------------|
| `4242 4242 4242 4242` | Success (no 3D Secure)        |
| `4000 0025 0000 3155` | Success (with 3D Secure/SCA)  |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Declined (generic decline)    |
| `4000 0000 0000 9987` | Declined (lost card)          |

**For all test cards:**
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### Testing Workflow:

1. **Start a new booking** with dates far in the future (e.g., June 2026)
2. **Click "Confirm Booking"**
3. **Hold Explanation Modal should appear**:
   - Verify timeline chips are visible
   - Verify explanation text is clear
   - Click "Proceed to Card Verification"
4. **Hold Payment Modal should appear**:
   - Verify Stripe Elements loaded
   - Enter test card: `4242 4242 4242 4242`
   - Click "Verify Card & Complete Booking"
5. **Booking Confirmed Modal should appear**:
   - Verify booking number shown
   - Verify success animation
   - Click "View My Booking"
6. **Verify in database**:
   ```sql
   SELECT
     bookingNumber,
     status,
     stripe_customer_id,
     stripe_payment_method_id,
     verify_hold_intent_id
   FROM bookings
   ORDER BY createdAt DESC
   LIMIT 1;
   ```
7. **Check booking_payments table**:
   ```sql
   SELECT * FROM booking_payments
   WHERE booking_id = 'your-booking-id'
   ORDER BY created_at DESC;
   ```

---

## 5️⃣ Clear Test Bookings

Before deploying to production, clear all test bookings:

```sql
-- View all test bookings
SELECT id, bookingNumber, startDate, customerEmail
FROM bookings
WHERE customerEmail LIKE '%test%' OR customerEmail LIKE '%@udigit.ca'
ORDER BY createdAt DESC;

-- Delete test bookings (after confirming the list)
DELETE FROM bookings
WHERE customerEmail IN ('aitest2@udigit.ca', 'nickbaxter18@gmail.com');

-- Verify deletion
SELECT COUNT(*) FROM bookings;
```

---

## 6️⃣ Deploy to Production

### Pre-Deployment Checklist:

- [ ] All environment variables set in production
- [ ] Stripe webhook configured with LIVE keys
- [ ] Cron job configured and tested
- [ ] Database migrations applied to production
- [ ] Test bookings cleared
- [ ] SSL certificate valid
- [ ] Domain configured

### Deployment Steps:

```bash
# 1. Build locally to check for errors
cd frontend
pnpm build

# 2. Fix any build errors

# 3. Commit and push to repository
git add .
git commit -m "feat: Implement Hold System v4 with $50 verify + $500 T-48 holds"
git push origin main

# 4. Deploy (example for Vercel)
vercel --prod

# 5. Apply database migrations to production
# Use Supabase MCP tools to apply migrations
```

---

## 7️⃣ Verify Webhooks Working

### Test Webhook Delivery:

1. **Make a test booking** in production
2. **Check Stripe Dashboard** → Developers → Webhooks → Click your endpoint
3. **Verify events were sent**:
   - `setup_intent.succeeded` ✅
   - `payment_intent.succeeded` (for $50 verify) ✅
   - `payment_intent.canceled` (for $50 void) ✅

4. **Check application logs** for webhook processing:
   ```
   SetupIntent succeeded for booking XXX. PaymentMethod pm_XXX saved.
   Verification hold voided for booking XXX. PaymentIntent pi_XXX.
   ```

5. **Verify database updated**:
   ```sql
   SELECT
     bookingNumber,
     status,
     stripe_payment_method_id,
     verify_hold_intent_id
   FROM bookings
   WHERE id = 'your-test-booking-id';

   -- Should show:
   -- status: verify_hold_ok
   -- stripe_payment_method_id: pm_xxxxx
   -- verify_hold_intent_id: pi_xxxxx
   ```

---

## 8️⃣ Test End-to-End Booking Flow

### Complete Test Scenario:

**Scenario**: Book for 30 days from now to trigger T-48 hold

1. **Start Booking**:
   - Navigate to `/book`
   - Select dates 30+ days in future
   - Enter delivery address
   - Add damage waiver (optional)
   - Click "Confirm Booking"

2. **Hold Explanation Modal**:
   - ✅ Modal appears
   - ✅ Timeline chips show 3 steps
   - ✅ T-48 date calculated correctly
   - ✅ Explanation clear
   - Click "Proceed to Card Verification"

3. **Hold Payment Modal**:
   - ✅ Stripe Elements loaded
   - ✅ Timeline shows current step
   - Enter test card: `4242 4242 4242 4242`
   - ✅ Card validation works
   - Click "Verify Card & Complete Booking"

4. **Verification Hold**:
   - ✅ $50 hold authorized
   - ✅ $50 hold voided immediately
   - ✅ Payment method saved
   - ✅ `setup_intent.succeeded` webhook received
   - ✅ `payment_intent.canceled` webhook received

5. **Booking Confirmed Modal**:
   - ✅ Success animation
   - ✅ Booking number displayed
   - ✅ "What's Next" steps shown
   - Click "View My Booking"

6. **Booking Management Page**:
   - ✅ Booking details correct
   - ✅ Status shows next steps
   - ✅ Upload documents section visible

7. **T-48 Job Scheduled**:
   ```sql
   SELECT * FROM schedules
   WHERE booking_id = 'your-booking-id'
   AND job_type = 'place_hold'
   AND status = 'pending';

   -- Verify run_at_utc is 48 hours before pickup
   ```

8. **Manually Test T-48 (Optional)**:
   ```bash
   # Trigger job processor manually
   curl -X POST https://yourdomain.com/api/jobs/process \
     -H "x-cron-secret: your-cron-secret"

   # Or update job to run immediately
   UPDATE schedules
   SET run_at_utc = NOW() - interval '1 minute'
   WHERE booking_id = 'your-booking-id';

   # Then call processor
   curl -X POST http://localhost:3000/api/jobs/process
   ```

---

## 9️⃣ Monitoring & Alerts

### Key Metrics to Track:

1. **Hold Success Rate**:
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE verify_hold_intent_id IS NOT NULL) AS verify_success,
     COUNT(*) FILTER (WHERE security_hold_intent_id IS NOT NULL) AS security_success,
     COUNT(*) AS total_bookings
   FROM bookings
   WHERE createdAt > NOW() - interval '30 days';
   ```

2. **Hold Failures**:
   ```sql
   SELECT
     booking_id,
     purpose,
     status,
     metadata->'reason' AS failure_reason,
     created_at
   FROM booking_payments
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Job Processing**:
   ```sql
   SELECT
     job_type,
     status,
     COUNT(*) AS count,
     AVG(EXTRACT(EPOCH FROM (completed_at - run_at_utc))) AS avg_processing_seconds
   FROM schedules
   WHERE run_at_utc > NOW() - interval '7 days'
   GROUP BY job_type, status;
   ```

### Set Up Alerts:

- **Hold failure rate > 5%**: Alert admin
- **Job failure rate > 10%**: Alert admin
- **Webhook delivery failure**: Alert immediately
- **Dispute created**: Urgent alert + auto-submit evidence

---

## 🔟 Troubleshooting

### Issue: "Module not found: @stripe/stripe-js"

**Solution**: Ensure packages are installed
```bash
cd frontend
pnpm install
# Or specifically:
pnpm add @stripe/stripe-js @stripe/react-stripe-js
```

### Issue: Webhook signature verification failed

**Cause**: Wrong webhook secret or request body modified

**Solution**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Ensure webhook route doesn't parse JSON before verification
3. Check Stripe Dashboard → Webhooks → Logs for details

### Issue: T-48 hold not placed automatically

**Cause**: Cron job not running or job_processor failing

**Solution**:
1. Check cron job is configured and running
2. Manually trigger: `curl -X POST https://yourdomain.com/api/jobs/process`
3. Check `schedules` table for pending jobs:
   ```sql
   SELECT * FROM schedules WHERE status = 'pending' AND run_at_utc <= NOW();
   ```
4. Check for job errors:
   ```sql
   SELECT * FROM schedules WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;
   ```

### Issue: Card verification fails with "insufficient_funds"

**Cause**: Test card doesn't support authorization holds

**Solution**: Use `4242 4242 4242 4242` which supports all hold operations

### Issue: Modal doesn't appear after "Confirm Booking"

**Cause**: Booking creation failed before modal trigger

**Solution**:
1. Check browser console for errors
2. Check server logs for booking creation errors
3. Verify date doesn't conflict with existing bookings
4. Check user is authenticated

---

## 📊 Performance Expectations

### Expected Response Times:

| Operation | Expected Time | Alert If Exceeds |
|-----------|---------------|------------------|
| Create booking | < 2s | 5s |
| Create SetupIntent | < 1s | 3s |
| Place $50 hold | < 2s | 5s |
| Void $50 hold | < 1s | 3s |
| Place $500 hold | < 2s | 5s |
| Release hold | < 1s | 3s |
| Webhook processing | < 500ms | 2s |
| Job processing | < 5s | 15s |

### Database Query Performance:

- Hold status lookups: < 50ms
- Transaction history: < 100ms
- Job queries: < 100ms

If queries exceed these times, add indexes or optimize queries.

---

## 🔐 Security Checklist

- [ ] Stripe webhook signature verification enabled
- [ ] Rate limiting on all payment endpoints
- [ ] Input validation with Zod schemas
- [ ] Sanitization of user inputs
- [ ] HTTPS enforced in production
- [ ] Service role key never exposed to client
- [ ] Internal service key required for privileged operations
- [ ] Cron secret required for job processor
- [ ] Audit logging for all hold operations
- [ ] PCI-DSS compliance maintained (Stripe handles cards)

---

## 📧 Email Configuration

### Update Email Templates:

1. **Edit domain and branding**:
   - Replace `yourdomain.com` with your actual domain
   - Update company information
   - Add logo URL

2. **Configure email service** (e.g., SendGrid, AWS SES):
   ```bash
   # Add to .env.local
   EMAIL_FROM=bookings@udigit.ca
   EMAIL_REPLY_TO=info@udigit.ca
   SENDGRID_API_KEY=SG.xxx...
   ```

3. **Test email sending**:
   - Create test booking
   - Verify confirmation email received
   - Check spam folder if not in inbox

---

## 🧪 Pre-Launch Testing Checklist

### Test Cases:

#### Test 1: Happy Path (Success)
- [ ] Book with valid card
- [ ] $50 hold placed and voided
- [ ] Booking confirmed
- [ ] Payment method saved
- [ ] T-48 job scheduled
- [ ] Confirmation email sent

#### Test 2: Card Declined
- [ ] Book with declined card (`4000 0000 0000 0002`)
- [ ] Error message shows
- [ ] Booking stays in pending
- [ ] Can retry with different card

#### Test 3: 3D Secure Required
- [ ] Book with 3DS card (`4000 0025 0000 3155`)
- [ ] 3DS challenge appears
- [ ] Complete authentication
- [ ] Booking completes successfully

#### Test 4: Booking Within 48h
- [ ] Book for tomorrow
- [ ] Both holds placed immediately
- [ ] No T-48 job scheduled
- [ ] Booking confirmed

#### Test 5: T-48 Hold Placement
- [ ] Manually trigger T-48 job
- [ ] $500 hold authorized
- [ ] Status updated to `hold_placed`
- [ ] Email sent to customer

#### Test 6: Clean Return (Hold Release)
- [ ] Admin clicks "Release Hold"
- [ ] $500 hold canceled
- [ ] Status updated to `returned_ok`
- [ ] Email sent to customer

#### Test 7: Damage (Partial Capture)
- [ ] Admin enters damage amount ($180)
- [ ] Partial capture succeeds
- [ ] $180 charged, $320 released
- [ ] Status updated to `captured`
- [ ] Email sent with charge details

---

## 📝 Final Pre-Launch Checklist

### Code Quality:
- [ ] No console.log statements (use logger)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All components have proper types
- [ ] Error handling comprehensive

### Database:
- [ ] All migrations applied
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Test data cleared
- [ ] Backup taken

### Integrations:
- [ ] Stripe webhook verified
- [ ] Cron job tested
- [ ] Email sending works
- [ ] SMS notifications (if applicable)

### Documentation:
- [ ] Team trained on admin controls
- [ ] Support docs updated
- [ ] Customer FAQs created
- [ ] Internal runbook created

### Monitoring:
- [ ] Error tracking configured (Sentry/LogRocket)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert channels configured

---

## 🎉 Launch Day Checklist

### Morning of Launch:
1. ✅ Verify all systems green
2. ✅ Test end-to-end booking
3. ✅ Verify webhook endpoint responding
4. ✅ Verify cron job running
5. ✅ Check Stripe dashboard for errors

### Within First Hour:
- Monitor for booking errors
- Check webhook delivery rate
- Verify emails being sent
- Monitor hold success rate

### Within First Day:
- Review all bookings created
- Check for any failed holds
- Verify T-48 jobs scheduled correctly
- Monitor customer feedback

### Within First Week:
- Analyze conversion rate impact
- Review hold success metrics
- Optimize based on real data
- Gather customer feedback

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks:

**Daily**:
- Check for failed holds
- Monitor webhook delivery
- Review error logs

**Weekly**:
- Analyze hold success rates
- Review job processing metrics
- Check for database performance issues

**Monthly**:
- Review Stripe fees and success rates
- Optimize job scheduling if needed
- Update documentation based on learnings

### Emergency Contacts:

- **Stripe Support**: https://support.stripe.com
- **Dev Team**: [your contact]
- **On-Call**: [your on-call process]

---

## 🎓 Training Materials

### For Admins:

**How to Manage Holds:**
1. Go to booking management page
2. Scroll to "Hold Management" section
3. Use buttons:
   - "Place $500 Hold Now" - Override T-48 timer
   - "Release Hold" - Clean return
   - "Capture Partial" - Damage fees
   - "Capture Full ($500)" - Severe damage

**How to Handle Failed Holds:**
1. Customer receives urgent email
2. They update payment method
3. Admin manually places hold
4. OR booking auto-cancels after 12h

### For Support Team:

**Common Customer Questions:**

**Q: Why do I see a $50 charge?**
A: That's a temporary hold to verify your card. It's voided immediately and will disappear from your statement within 1-2 business days.

**Q: When will the $500 hold be placed?**
A: Exactly 48 hours before your scheduled pickup date. You'll receive an email notification.

**Q: Is the $500 hold a charge?**
A: No, it's a temporary authorization on your card. No money leaves your account. It releases within 24 hours of returning the equipment in good condition.

**Q: What if I have damage?**
A: We only charge for damage beyond normal wear and tear. The damage waiver ($29/day) covers minor incidental damage.

---

## 📈 Expected Business Impact

### Conversion Improvements:
- **15-25% increase** in booking completion (projected)
- Lower abandonment at payment step
- Reduced customer friction

### Operational Benefits:
- Automated hold management
- Complete audit trail
- Reduced manual work
- Better cash flow visibility

### Customer Experience:
- Transparent hold timeline
- Clear communication
- Professional experience
- Modern payment flow

---

## 🎯 Success Criteria

Within 30 days of launch, you should see:

- [ ] **Hold success rate > 95%**
- [ ] **Booking completion rate increase by 15%+**
- [ ] **Zero manual hold errors**
- [ ] **Positive customer feedback on transparency**
- [ ] **T-48 jobs 100% automated**
- [ ] **Dispute evidence auto-submitted**

---

## 📞 Need Help?

If you encounter issues:

1. Check this deployment guide
2. Review `HOLD_SYSTEM_V4_IMPLEMENTATION.md`
3. Check Stripe Dashboard → Webhooks → Logs
4. Review application logs
5. Contact support team

---

**Status**: ✅ System Ready for Production Deployment
**Last Updated**: October 29, 2025
**Version**: 4.0.0

---

*Built with ❤️ for U-Dig It Rentals by AI Assistant*




















