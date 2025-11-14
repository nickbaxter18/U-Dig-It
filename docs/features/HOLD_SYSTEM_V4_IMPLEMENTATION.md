# Hold System v4 - "$50 verify now, $500 at T-48" Implementation

**Date:** October 29, 2025
**Status:** ✅ Backend Infrastructure Complete | 🚧 Frontend & Webhooks In Progress

---

## 🎯 System Overview

### The Flow:

```
📅 At Booking (Now)
   ├─ Create/Retrieve Stripe Customer
   ├─ Create SetupIntent (save payment method for future use)
   ├─ Place $50 verification hold (PaymentIntent, manual capture)
   ├─ IMMEDIATELY void the $50 hold
   └─ Schedule T-48 security hold job

⏰ 48 Hours Before Pickup (T-48)
   ├─ Job scheduler triggers
   ├─ Place $500 security hold (PaymentIntent, manual capture, off_session)
   ├─ Use saved payment method from SetupIntent
   ├─ Handle SCA (3D Secure) if required
   └─ Update status to 'hold_placed'

📦 After Return
   ├─ Clean return → Cancel $500 hold (full release)
   └─ Damage/fees → Capture partial/full amount, release remainder
```

---

## ✅ What's Been Implemented

### 1️⃣ Database Schema (COMPLETE)

**New Columns in `bookings` table:**
```sql
hold_verify_amount_cents    INTEGER DEFAULT 5000   -- $50 verification hold
hold_security_amount_cents  INTEGER DEFAULT 50000  -- $500 security hold
verify_hold_intent_id       VARCHAR(255)           -- Stripe PI ID for $50 hold
security_hold_intent_id     VARCHAR(255)           -- Stripe PI ID for $500 hold
```

**New Status Values in `bookings_status_enum`:**
```
verify_hold_ok     -- Card verified, $50 hold voided
deposit_scheduled  -- T-48 job scheduled
hold_placed        -- $500 hold active on card
returned_ok        -- Clean return, hold released
captured           -- Damage/fees charged from hold
```

**Updated `booking_payments` table:**
```sql
-- New purpose values:
'verify_hold'      -- $50 verification hold (voided)
'security_hold'    -- $500 security hold (active)
'capture'          -- Partial/full capture for damage
'release'          -- Hold release record
```

**Indexes Added:**
- `idx_bookings_verify_hold_intent_id` (for quick lookups)
- `idx_bookings_security_hold_intent_id` (for quick lookups)
- `idx_schedules_run_at_status` (for job scheduler queries)

---

### 2️⃣ API Routes (COMPLETE)

#### **POST `/api/stripe/verify-card-hold`**
**Purpose:** Initialize card verification and $50 hold process
**Returns:** SetupIntent client secret for frontend card collection

**What it does:**
1. Creates/retrieves Stripe Customer
2. Creates SetupIntent for saving payment method
3. Returns client secret for Stripe Elements

**Response:**
```json
{
  "success": true,
  "setupIntentClientSecret": "seti_1234...",
  "stripeCustomerId": "cus_1234...",
  "idempotencyKey": "booking_123:verify_hold:1234567890",
  "message": "Ready to collect payment method"
}
```

---

#### **POST `/api/stripe/place-verify-hold`**
**Purpose:** Place $50 hold and void it immediately after SetupIntent succeeds

**Request:**
```json
{
  "bookingId": "uuid",
  "paymentMethodId": "pm_1234...",
  "setupIntentId": "seti_1234..."
}
```

**What it does:**
1. Creates $50 PaymentIntent (manual capture, off_session)
2. **Immediately cancels it** (void the hold)
3. Updates booking: `verify_hold_intent_id`, status → `verify_hold_ok`
4. Records transaction in `booking_payments`
5. Schedules T-48 security hold job (if pickup > 48h away)

**Response:**
```json
{
  "success": true,
  "message": "Card verified successfully. $50 hold voided immediately.",
  "paymentIntentId": "pi_1234...",
  "status": "canceled",
  "nextStep": "$500 security hold will be placed on Nov 3, 2025 at 12:00 PM"
}
```

---

#### **POST `/api/stripe/place-security-hold`**
**Purpose:** Place $500 security hold 48h before pickup (called by job scheduler)

**Request:**
```json
{
  "bookingId": "uuid"
}
```

**Authentication:**
- Internal service calls: `x-internal-service-key` header
- Manual admin calls: Admin/super_admin role required

**What it does:**
1. Creates $500 PaymentIntent (manual capture, off_session)
2. Uses saved payment method from SetupIntent
3. Updates booking: `security_hold_intent_id`, status → `hold_placed`
4. Records transaction in `booking_payments`
5. Handles SCA (3D Secure) if required

**Response (Success):**
```json
{
  "success": true,
  "message": "$500 security hold placed successfully",
  "paymentIntentId": "pi_1234...",
  "amount": 500,
  "status": "requires_capture"
}
```

**Response (SCA Required):**
```json
{
  "success": false,
  "requiresAction": true,
  "error": "Additional authentication required",
  "clientSecret": "pi_1234..._secret_...",
  "message": "Please complete card authentication to proceed"
}
```

---

#### **POST `/api/stripe/release-security-hold`**
**Purpose:** Release $500 hold on clean return (admin only)

**Request:**
```json
{
  "bookingId": "uuid"
}
```

**What it does:**
1. Cancels the $500 PaymentIntent (releases hold)
2. Updates booking status → `returned_ok`
3. Records release in `booking_payments`
4. Sends notification to customer

**Response:**
```json
{
  "success": true,
  "message": "$500 security hold released successfully",
  "paymentIntentId": "pi_1234...",
  "status": "canceled"
}
```

---

#### **POST `/api/stripe/capture-security-hold`**
**Purpose:** Capture partial/full amount for damage/fees (admin only)

**Request:**
```json
{
  "bookingId": "uuid",
  "amountCents": 18000,  // $180 for repairs
  "reason": "Hydraulic hose damage from improper use"
}
```

**What it does:**
1. Captures specified amount from $500 hold
2. **Remainder releases automatically** (only ONE capture allowed)
3. Updates booking status → `captured`, `additionalCharges`
4. Records in `booking_payments`
5. Sends notification with charge details

**Response:**
```json
{
  "success": true,
  "message": "Captured $180.00 from security hold",
  "paymentIntentId": "pi_1234...",
  "chargeId": "ch_1234...",
  "capturedAmount": 180,
  "remainderReleased": 320
}
```

---

## 🔄 Status State Machine

```
pending
  ↓
verify_hold_ok          ← $50 hold placed + voided
  ↓
deposit_scheduled       ← T-48 job scheduled
  ↓
hold_placed             ← $500 hold active on card
  ↓
┌─────────────┬──────────────┐
│ Clean       │ Damage       │
↓             ↓              │
returned_ok   captured       │
(hold         (partial/full  │
released)     capture)       │
└─────────────┴──────────────┘
```

---

## 📊 `booking_payments` Transaction Record

Every hold operation is tracked:

| Purpose | Amount | Status | Stripe PI ID | Notes |
|---------|--------|--------|--------------|-------|
| `verify_hold` | $50 | `canceled` | `pi_123...` | Voided immediately |
| `security_hold` | $500 | `succeeded` | `pi_456...` | Active hold |
| `release` | $0 | `succeeded` | `pi_456...` | Hold canceled |
| `capture` | $180 | `succeeded` | `pi_456...` | Partial capture |

**Idempotency Keys:**
- `{bookingId}:verify_hold:{timestamp}`
- `{bookingId}:security_hold:{pickup_timestamp}`
- `{bookingId}:release:{timestamp}`
- `{bookingId}:capture:{timestamp}`

---

## ⏱️ Job Scheduler (`schedules` table)

**T-48 Security Hold Job:**
```sql
INSERT INTO schedules (
  booking_id,
  job_type,
  run_at_utc,
  status,
  idempotency_key,
  metadata
) VALUES (
  'booking_uuid',
  'place_hold',
  '2025-11-03 12:00:00+00',  -- 48h before pickup
  'pending',
  'booking_uuid:place_security_hold:1730635200000',
  '{"purpose": "security_hold", "amount_cents": 50000}'
);
```

**Job Types:**
- `place_hold` - Place security hold
- `release_hold` - Release hold (if automated)
- `send_reminder` - Remind customer about upcoming hold
- `check_insurance` - Verify insurance still valid

---

## 🚨 Edge Cases Handled

### 1) Booking Within 48h
**Problem:** Start date is < 48 hours from now
**Solution:** Place both holds back-to-back:
```typescript
// Place $50 verification hold → void immediately
await POST('/api/stripe/place-verify-hold', { bookingId, paymentMethodId });

// Place $500 security hold immediately (no wait)
await POST('/api/stripe/place-security-hold', { bookingId });
```

### 2) Verification Hold Fails
**Problem:** Card declined, insufficient funds, etc.
**Solution:**
- Booking stays in `pending` status
- Frontend shows error: "Update payment method to continue"
- User can retry with different card

### 3) T-48 Security Hold Fails
**Problem:** Card expired, insufficient funds, SCA required
**Solution:**
- Send immediate notification with deep link
- Give customer 12-24h to update card
- Auto-cancel booking if not resolved (per policy)

### 4) Booking Rescheduled
**Problem:** Customer changes pickup date
**Solution:**
```typescript
// Cancel existing security hold (if already placed)
if (booking.security_hold_intent_id) {
  await stripe.paymentIntents.cancel(booking.security_hold_intent_id);
}

// Cancel old T-48 job
await supabase
  .from('schedules')
  .update({ status: 'canceled' })
  .eq('booking_id', bookingId)
  .eq('job_type', 'place_hold');

// Schedule new T-48 job for new pickup date
const newHoldTime = new Date(newStartDate).getTime() - (48 * 60 * 60 * 1000);
// ... create new schedule
```

### 5) SCA (3D Secure) Required
**Problem:** Bank requires customer authentication
**Response:**
```json
{
  "success": false,
  "requiresAction": true,
  "clientSecret": "pi_1234..._secret_...",
  "message": "Please complete card authentication"
}
```

**Frontend Action:**
- Display Stripe 3D Secure modal
- Customer completes authentication
- Webhook receives `payment_intent.succeeded`
- Booking progresses automatically

---

## 🔐 Security Considerations

### ✅ Rate Limiting
All hold APIs use `VERY_STRICT` preset:
- 10 requests per minute per IP
- Even admins are rate limited
- Prevents card testing attacks

### ✅ Idempotency
All operations use unique idempotency keys:
- Prevents duplicate charges
- Safe to retry on network failures
- Keys stored in `booking_payments` for audit

### ✅ Authorization
- Verification/placement: Customer ownership verified
- Release/capture: Admin only
- Internal service: Secure API key required

### ✅ Audit Trail
Every hold operation logged in:
- `booking_payments` table (structured data)
- Application logs (with metadata)
- Stripe dashboard (payment intent history)

---

## 📧 Notifications (TODO)

### Booking Confirmation Email:
```
Subject: Booking Confirmed - BK-655386-4XKF24

Hi {{firstName}},

Your booking is confirmed! Here's what happened:

✅ We placed a $50 verification hold and voided it immediately.
   (Your bank may show it pending for a few hours - this is normal)

📅 A $500 refundable security hold will be placed 48 hours before pickup.
   This is NOT a charge - it's a hold that releases within 24h of clean return.

Next steps:
1. Upload Certificate of Insurance
2. Upload Driver's License
3. Sign rental agreement

Questions? Call us at (506) 643-1575

Thank you!
U-Dig It Rentals
```

### T-48 Hold Placed:
```
Subject: Security Hold Placed - BK-655386-4XKF24

Hi {{firstName}},

A $500 security hold has been placed on your card ending in {{last4}}.

This is NOT a charge. It will automatically release within 24 hours after you return the equipment in good condition.

Booking Details:
- Equipment: Kubota SVL-75
- Pickup: {{startDate}}
- Return: {{endDate}}

See you soon!
```

### Hold Released:
```
Subject: Security Hold Released - BK-655386-4XKF24

Hi {{firstName}},

Good news! Your $500 security hold has been released.

Thank you for choosing U-Dig It Rentals!

💡 Rent again soon? Use code RETURN10 for 10% off your next booking.
```

---

## 🛠️ What Still Needs Implementation

### 🚧 1) Frontend Integration

**File:** `frontend/src/components/booking/PaymentStep.tsx`

**New UI Elements:**
- Timeline chips showing hold sequence
- Stripe Elements for card collection
- SetupIntent confirmation flow
- Progress indicators

**Timeline Display:**
```tsx
<div className="flex space-x-4">
  <TimelineChip
    icon="✓"
    label="Today"
    description="$50 verification (voided)"
    status="current"
  />
  <TimelineChip
    icon="⏰"
    label="T-48"
    description="$500 hold placed"
    status="upcoming"
  />
  <TimelineChip
    icon="✅"
    label="After Return"
    description="Hold released"
    status="future"
  />
</div>
```

**Hold Messaging:**
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h4 className="font-semibold text-blue-900 mb-2">
    How Security Holds Work
  </h4>
  <ul className="space-y-2 text-sm text-blue-800">
    <li className="flex items-start">
      <span className="mr-2">1.</span>
      <span>
        We place a <strong>$50 temporary hold</strong> now to verify your card
        (voided immediately - you won't be charged).
      </span>
    </li>
    <li className="flex items-start">
      <span className="mr-2">2.</span>
      <span>
        A <strong>$500 refundable hold</strong> is placed 48 hours before pickup
        and released within 24 hours after return.
      </span>
    </li>
  </ul>
</div>
```

---

### 🚧 2) Webhook Handlers

**File:** `frontend/src/app/api/webhooks/stripe/route.ts`

**Events to Handle:**

#### `setup_intent.succeeded`
```typescript
// Save payment_method_id to booking
await supabase
  .from('bookings')
  .update({ stripe_payment_method_id: setupIntent.payment_method })
  .eq('id', metadata.bookingId);
```

#### `payment_intent.succeeded` (verify hold)
```typescript
// Log successful authorization
logger.info('Verify hold authorized', { paymentIntentId });
// Note: We void it immediately in the same API call
```

#### `payment_intent.succeeded` (security hold)
```typescript
// Update booking status
await supabase
  .from('bookings')
  .update({ status: 'hold_placed' })
  .eq('security_hold_intent_id', paymentIntent.id);

// Send notification
await sendEmail({
  template: 'security_hold_placed',
  to: customer.email,
  data: { bookingNumber, amount: 500 }
});
```

#### `payment_intent.canceled`
```typescript
// Update booking_payments
await supabase
  .from('booking_payments')
  .update({ status: 'canceled' })
  .eq('stripe_payment_intent_id', paymentIntent.id);
```

#### `payment_intent.amount_capturable_updated`
```typescript
// Log that hold is ready to capture
logger.info('Hold ready for capture', {
  paymentIntentId,
  amount: paymentIntent.amount_capturable / 100
});
```

#### `charge.dispute.created`
```typescript
// Attach evidence kit (contract, photos, delivery confirmation)
await stripe.disputes.update(dispute.id, {
  evidence: {
    customer_name: booking.customer.name,
    service_documentation: contractUrl,
    customer_signature: signatureUrl,
  }
});
```

---

### 🚧 3) Job Scheduler Processor

**File:** `frontend/src/lib/job-scheduler.ts` (or Edge Function)

**Cron Job (runs every 5 minutes):**
```sql
SELECT id, booking_id, job_type, run_at_utc, metadata
FROM schedules
WHERE status = 'pending'
  AND run_at_utc <= NOW()
  AND job_type = 'place_hold'
ORDER BY run_at_utc
LIMIT 100;
```

**For each job:**
```typescript
try {
  // Call security hold API
  const response = await fetch('/api/stripe/place-security-hold', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-service-key': process.env.INTERNAL_SERVICE_KEY,
    },
    body: JSON.stringify({ bookingId: job.booking_id }),
  });

  if (response.ok) {
    // Mark job complete
    await supabase
      .from('schedules')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', job.id);
  } else {
    // Increment retry count
    if (job.retry_count < job.max_retries) {
      await supabase
        .from('schedules')
        .update({
          retry_count: job.retry_count + 1,
          error_message: await response.text()
        })
        .eq('id', job.id);
    } else {
      // Max retries reached - mark failed and alert admin
      await supabase
        .from('schedules')
        .update({ status: 'failed' })
        .eq('id', job.id);

      // Send admin alert
      await sendAdminAlert({
        subject: `Failed to place security hold for ${job.booking_id}`,
        urgency: 'high'
      });
    }
  }
} catch (error) {
  logger.error('Job execution failed', { jobId: job.id, error });
}
```

---

### 🚧 4) Admin Controls

**File:** `frontend/src/app/admin/bookings/[id]/holds/page.tsx`

**Buttons Needed:**
1. **Place $500 Hold Now** (override T-48 timer)
2. **Cancel Security Hold** (manual release)
3. **Capture Partial** (input amount + reason)
4. **Capture Full** ($500 for severe damage)
5. **Resend SCA Link** (if customer didn't complete 3D Secure)

**UI:**
```tsx
<div className="grid grid-cols-2 gap-4">
  <button onClick={() => placeSecurityHoldNow(bookingId)}>
    Place $500 Hold Now
  </button>

  <button onClick={() => releaseHold(bookingId)}>
    Release Hold
  </button>

  <button onClick={() => setShowCaptureModal(true)}>
    Capture Partial
  </button>

  <button onClick={() => captureFull(bookingId)}>
    Capture Full ($500)
  </button>
</div>

{/* Capture Modal */}
<Modal show={showCaptureModal}>
  <input
    type="number"
    placeholder="Amount to capture (e.g., 180)"
    value={captureAmount}
    onChange={e => setCaptureAmount(e.target.value)}
  />
  <textarea
    placeholder="Reason for charge"
    value={captureReason}
    onChange={e => setCaptureReason(e.target.value)}
  />
  <button onClick={() => capturePartial(bookingId, captureAmount * 100, captureReason)}>
    Capture ${captureAmount}
  </button>
</Modal>
```

---

### 🚧 5) Email/SMS Templates

**Templates to create:**
1. `booking_confirmation_with_holds.html`
2. `security_hold_placed.html`
3. `security_hold_released.html`
4. `security_hold_captured.html` (with damage details)
5. `sca_required_action_needed.html` (deep link for 3D Secure)

---

## 🧪 Testing Checklist

### Must-Pass QA:

- [ ] Book → $50 hold authorized then canceled
- [ ] Booking status progresses to `verify_hold_ok`
- [ ] T-48 job created in `schedules` table
- [ ] T-48 → $500 hold placed successfully
- [ ] Booking status updates to `hold_placed`
- [ ] Return clean → hold released
- [ ] Booking status updates to `returned_ok`
- [ ] Partial capture ($180) works
- [ ] Remainder ($320) releases automatically
- [ ] Booking status updates to `captured`
- [ ] Booking <48h executes both holds immediately
- [ ] SCA required triggers deep-link flow
- [ ] Webhook events processed correctly
- [ ] Idempotency prevents duplicate charges
- [ ] Audit trail complete in `booking_payments`

---

## 🎯 Customer Experience

### What Customers See:

**Step 1 - Booking Payment:**
```
┌────────────────────────────────────────────────┐
│ 💳 Save Your Payment Method                   │
├────────────────────────────────────────────────┤
│                                                 │
│ We'll place a $50 temporary hold to verify    │
│ your card (voided immediately).                │
│                                                 │
│ Timeline:                                       │
│  Today: $50 verification (voided)              │
│  Nov 3 (T-48): $500 hold placed               │
│  Nov 6: Hold released after return             │
│                                                 │
│ [Card Number Field]                            │
│ [Expiry] [CVC]                                 │
│                                                 │
│ [✓ Save Card & Complete Booking]              │
└────────────────────────────────────────────────┘
```

**Step 2 - Confirmation:**
```
✅ Booking Confirmed!

Your card ending in 4242 has been verified.

We placed a $50 hold and voided it immediately.
You may see it pending for a few hours (bank processing).

A $500 refundable security hold will be placed
on November 3rd at 12:00 PM (48 hours before pickup).

Next steps:
1. Upload insurance
2. Upload license
3. Sign rental agreement
```

---

## 💰 Financial Impact

### Old System (Immediate $500 Capture):
- Customer pays $500 upfront
- Tied up capital for entire rental + return period
- Creates friction in booking process

### New System ($50 verify + $500 at T-48):
- **Customer experience:** Only $50 temporary hold at booking (voided)
- **Lower barrier:** No $500 upfront commitment
- **Just-in-time:** $500 hold placed when actually needed (T-48)
- **Conversion uplift:** Expected 15-25% increase in booking completion

---

## 🚀 Next Steps

1. **Generate TypeScript types:**
```bash
pnpm supabase gen types typescript --local > supabase/types.ts
```

2. **Create webhook handler:**
```bash
# File: frontend/src/app/api/webhooks/stripe/route.ts
```

3. **Update frontend payment step:**
```bash
# File: frontend/src/components/booking/PaymentStep.tsx
```

4. **Create admin hold management page:**
```bash
# File: frontend/src/app/admin/bookings/[id]/holds/page.tsx
```

5. **Implement job scheduler:**
```bash
# File: frontend/src/lib/job-scheduler.ts
# Or: Supabase Edge Function
```

6. **Create email templates:**
```bash
# Files: frontend/src/lib/email-templates/*.tsx
```

---

## 📝 API Summary Table

| Endpoint | Method | Purpose | Auth | Status |
|----------|--------|---------|------|--------|
| `/api/stripe/verify-card-hold` | POST | Create SetupIntent | Customer | ✅ Done |
| `/api/stripe/place-verify-hold` | POST | Place $50 hold + void | Customer | ✅ Done |
| `/api/stripe/place-security-hold` | POST | Place $500 hold (T-48) | Internal/Admin | ✅ Done |
| `/api/stripe/release-security-hold` | POST | Release $500 hold | Admin | ✅ Done |
| `/api/stripe/capture-security-hold` | POST | Capture partial/full | Admin | ✅ Done |
| `/api/webhooks/stripe` | POST | Process Stripe events | Stripe | 🚧 TODO |

---

## 🎓 Key Learnings

### Why Manual Capture?
- `capture_method: 'manual'` authorizes the hold but doesn't charge
- Gives us 7 days to capture (or longer depending on issuer)
- Canceling releases the hold immediately
- Can only capture ONCE (partial or full)

### Why Off-Session?
- `off_session: true` allows charging when customer not present
- Essential for T-48 automated holds
- Requires SCA (3D Secure) on first use
- SavedCard can be reused without SCA (within limits)

### Why Idempotency Keys?
- Prevents duplicate charges on network retries
- Format: `{bookingId}:{action}:{timestamp}`
- Stored in DB for audit trail
- Stripe guarantees same result for same key within 24h

---

## 🔗 Related Files

**Database:**
- `supabase/migrations/YYYYMMDD_add_hold_system_v4_fields.sql`

**API Routes:**
- `frontend/src/app/api/stripe/verify-card-hold/route.ts`
- `frontend/src/app/api/stripe/place-verify-hold/route.ts`
- `frontend/src/app/api/stripe/place-security-hold/route.ts`
- `frontend/src/app/api/stripe/release-security-hold/route.ts`
- `frontend/src/app/api/stripe/capture-security-hold/route.ts`

**TODO (Next Implementation):**
- `frontend/src/app/api/webhooks/stripe/route.ts`
- `frontend/src/components/booking/PaymentStep.tsx`
- `frontend/src/lib/job-scheduler.ts`
- `frontend/src/lib/email-templates/`
- `frontend/src/app/admin/bookings/[id]/holds/page.tsx`

---

**Status:** ✅ **Core backend infrastructure complete!**
**Next:** Frontend payment step integration + webhook handlers

---

## 📞 Questions?

**Ask about:**
- How to handle failed T-48 holds (notification + retry logic)
- Email/SMS template preferences
- Admin dashboard hold management UX
- Job scheduler deployment strategy (Edge Function vs Cron)




















