# 🎉 Monthly Contest System - Implementation Guide

**Status**: 🚧 **IN PROGRESS**
**Current Phase**: Backend Complete, Frontend In Progress
**Completion**: 40% (4/10 major components)

---

## 📊 IMPLEMENTATION STATUS

### ✅ COMPLETED (40%)

#### 1. ✅ Database Schema (6 tables)
- `contest_entrants` - User entries with verification
- `contest_referral_codes` - Unique codes per entrant
- `contest_referrals` - Referral relationships
- `contest_winners` - Winner records with vouchers
- `contest_audit_logs` - Complete audit trail
- `contest_events` - Analytics tracking

#### 2. ✅ Edge Functions (3 functions)
- `contest-entry` - Entry creation with anti-fraud
- `contest-verify-email` - Email verification flow
- `contest-draw-winners` - Admin winner selection

#### 3. ✅ Helper Functions (3 functions)
- `generate_contest_referral_code()` - Generate unique codes
- `is_contest_rate_limited()` - IP-based rate limiting
- `validate_contest_referral()` - Referral validation

### 🚧 IN PROGRESS (60%)

#### 4. ⏳ Edge Functions (Remaining)
- `contest-generate-voucher` - PDF voucher generation
- Email templates integration

#### 5. ⏳ Frontend UI Components
- Contest page (`/contest`)
- Entry form with validation
- Referral sharing UI
- Email verification page
- Winner announcement

#### 6. ⏳ Banner Update
- Convert "SPRING SPECIAL" → "Win Free Machine" CTA

#### 7. ⏳ Admin Dashboard
- View all entries
- Draw winners UI
- Export CSV
- Fraud detection review

#### 8. ⏳ Email Templates
- Verification email
- Confirmation email
- Winner notification
- Reminder emails

#### 9. ⏳ Anti-Fraud Measures
- reCAPTCHA integration
- Device fingerprinting
- Disposable email blocking (✅ in Edge Function)
- IP rate limiting (✅ in database)

#### 10. ⏳ Testing & Verification
- Browser automation tests
- End-to-end flow verification
- Admin tools testing

---

## 🗄️ DATABASE SCHEMA DETAILS

### Table: `contest_entrants`
**Purpose**: Store all contest entries with verification and fraud detection

**Key Columns**:
```sql
- id (UUID) - Primary key
- email (TEXT, UNIQUE per month) - Entry identifier
- verified (BOOLEAN) - Email verification status
- verification_token (TEXT) - One-time verification token
- contest_month (DATE) - Which month's contest
- referral_code (via contest_referral_codes)
- ip_address (INET) - Fraud detection
- device_fingerprint (TEXT) - Duplicate detection
- flagged_for_review (BOOLEAN) - Manual review needed
- disqualified (BOOLEAN) - Admin disqualification
```

**Constraints**:
- One entry per email per month
- Email verification required to be eligible for draw

---

### Table: `contest_referral_codes`
**Purpose**: Generate unique referral codes for sharing

**Format**: `JOHNDOE1234` (First3Last3 + 4 random digits)

**Example Codes**:
```
NICKBAX0847
JANDOE5132
MARJON2941
```

---

### Table: `contest_referrals`
**Purpose**: Track who referred whom

**Validation Rules**:
- Referee must verify email for referral to count
- No self-referrals allowed
- Both referrer and referee entered in Grand Prize #2 pool

---

### Table: `contest_winners`
**Purpose**: Record winners with voucher details

**Workflow**:
1. Admin runs draw → Winner selected randomly
2. Winner record created with unique voucher code
3. Email sent to winner
4. Winner has 7 days to respond
5. Identity verified before voucher issued
6. Voucher valid for 6 months

---

## 🔧 EDGE FUNCTIONS DETAILS

### 1. `contest-entry` (✅ Complete)
**Endpoint**: `/functions/v1/contest-entry`
**Method**: POST
**Auth**: Public (with rate limiting)

**Request**:
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postalCode: string;
  city?: string;
  referralCode?: string;
  marketingConsent: boolean;
  rulesAccepted: boolean;
  deviceFingerprint?: string;
  utmSource?: string;
}
```

**Response**:
```typescript
{
  success: true;
  entrantId: string;
  referralCode: string;
  referralLink: string;
  verificationSent: true;
}
```

**Features**:
- ✅ Anti-fraud: IP rate limiting (3 per hour)
- ✅ Blocks disposable email domains
- ✅ Generates unique referral code
- ✅ Sends verification email
- ✅ Tracks UTM parameters
- ✅ Device fingerprinting
- ✅ Audit logging

---

### 2. `contest-verify-email` (✅ Complete)
**Endpoint**: `/functions/v1/contest-verify-email`
**Method**: POST
**Auth**: Public

**Request**:
```typescript
{
  token: string; // Verification token from email
}
```

**Response**:
```typescript
{
  success: true;
  verified: true;
  referralCode: string;
  referralLink: string;
}
```

**Features**:
- ✅ Marks entrant as verified
- ✅ Validates pending referrals
- ✅ Sends confirmation email
- ✅ Returns referral link for sharing

---

### 3. `contest-draw-winners` (✅ Complete)
**Endpoint**: `/functions/v1/contest-draw-winners`
**Method**: POST
**Auth**: Admin only

**Request**:
```typescript
{
  contestMonth: string; // "2025-11-01"
  prizeType: 'grand_prize_1' | 'grand_prize_2_referral';
}
```

**Response**:
```typescript
{
  success: true;
  winner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    voucherCode: string;
  };
  drawDetails: {
    totalEntries: number;
    selectedIndex: number;
    seed: string; // For audit verification
  };
}
```

**Features**:
- ✅ Admin authentication required
- ✅ Cryptographically secure random selection
- ✅ Complete audit trail (seed, index, total entries)
- ✅ Prevents duplicate draws
- ✅ Automatic winner notification email
- ✅ 7-day response deadline

**Prize Pools**:
- **Grand Prize #1**: ALL verified entrants
- **Grand Prize #2**: Only entrants with validated referrals (both referrer and referee)

---

## 🎯 CONTEST FLOW

### User Journey:

```
1. User clicks banner → Contest page
   ↓
2. Fills entry form (name, email, postal code, referral code)
   ↓
3. Submits → Verification email sent
   ↓
4. Clicks verification link in email
   ↓
5. Email verified → Entry confirmed
   ↓
6. Gets referral link to share with friends
   ↓
7. Friends enter using referral link
   ↓
8. Friends verify → Referral validated
   ↓
9. Both referrer and referee entered in Grand Prize #2 pool
   ↓
10. Month ends → Admin draws 2 winners
   ↓
11. Winners notified → 7 days to respond
   ↓
12. Identity verified → Voucher PDF generated
   ↓
13. Winner books time → Redeems voucher
```

---

## 📋 NEXT STEPS TO COMPLETE

### Phase 1: Frontend UI (Priority: HIGH)
1. Create `/contest` page with entry form
2. Update banner CTA to link to `/contest`
3. Create verification confirmation page
4. Add referral sharing UI (copy link, social share)
5. Create winner announcement section

### Phase 2: Admin Tools (Priority: HIGH)
1. Admin dashboard at `/admin/contest`
2. View all entries (filter by month, verified status)
3. Draw winners UI (select month, prize type, run draw)
4. Export CSV functionality
5. Flag/disqualify entries

### Phase 3: Email Templates (Priority: MEDIUM)
1. Verification email template
2. Confirmation email template
3. Winner notification template
4. Reminder emails (if no response in 5 days)

### Phase 4: Voucher Generation (Priority: MEDIUM)
1. PDF voucher template design
2. Edge Function to generate voucher
3. Store in Supabase Storage (private bucket)
4. Signed URL for winner download

### Phase 5: Testing (Priority: HIGH)
1. Test entry flow end-to-end
2. Test referral mechanics
3. Test winner draw
4. Test fraud prevention
5. Browser automation verification

---

## 🛡️ ANTI-FRAUD MEASURES IMPLEMENTED

### ✅ Already Active:
1. **IP Rate Limiting**: 3 entries max per IP per hour
2. **Disposable Email Blocking**: 8 common disposable domains blocked
3. **Email Verification**: Required before entry counts
4. **Unique Email Constraint**: One entry per email per month
5. **Device Fingerprinting**: Track duplicate devices
6. **Audit Logging**: Every action logged with IP and user agent

### 🚧 To Be Added:
1. reCAPTCHA on entry form
2. Manual review queue for flagged entries
3. Geolocation validation (IP vs postal code)
4. Phone number validation
5. Referral loop detection

---

## 📁 FILES CREATED

### Database:
- ✅ Migration: `20251102000006_create_monthly_contest_system.sql`

### Edge Functions:
- ✅ `supabase/functions/contest-entry/index.ts`
- ✅ `supabase/functions/contest-verify-email/index.ts`
- ✅ `supabase/functions/contest-draw-winners/index.ts`

### Documentation:
- ✅ `CONTEST_SYSTEM_IMPLEMENTATION_GUIDE.md` (this file)

### To Be Created:
- ⏳ `frontend/src/app/contest/page.tsx`
- ⏳ `frontend/src/app/contest/verify/page.tsx`
- ⏳ `frontend/src/app/admin/contest/page.tsx`
- ⏳ `supabase/functions/contest-generate-voucher/index.ts`
- ⏳ Email templates (3-4 templates)

---

## 🎯 MARKETING COPY READY

### Hero Section:
**Headline**: "Win a Free Half-Day Machine + Operator!"
**Subhead**: "Enter & Refer a Friend for Two Chances to Win"

### Prizes:
- **Grand Prize #1**: 4-hour machine + operator voucher (value: $450)
- **Grand Prize #2**: 4-hour machine + operator voucher for referral participants

### Entry Process:
1. Complete quick entry form (2 minutes)
2. Verify your email
3. Share your unique referral link
4. If friends enter using your link, you both get extra chances!

### Rules Summary:
- Free to enter, no purchase necessary
- One entry per person per month
- Must be 18+, New Brunswick resident
- Must verify email to be eligible
- Winners drawn on last day of month
- Voucher valid 6 months, blackout dates apply

---

## 💻 TECHNICAL SPECIFICATIONS

### API Endpoints:
```
POST /functions/v1/contest-entry
POST /functions/v1/contest-verify-email
POST /functions/v1/contest-draw-winners (admin)
POST /functions/v1/contest-generate-voucher (admin)
```

### Frontend Routes:
```
/contest - Main contest page (entry form)
/contest/verify?token=xxx - Email verification
/contest/winners - Winner announcement
/admin/contest - Admin dashboard
```

### Database Tables:
```
contest_entrants (6 tables total)
+ referral_codes
+ referrals
+ winners
+ audit_logs
+ events
```

### RLS Policies:
```
✅ Users can view own entries
✅ Users can view own referral codes
✅ Public can view verified winners
✅ Admins can manage everything
✅ Secure audit logs (admin only)
```

---

## 🔐 SECURITY FEATURES

### Entry Security:
- ✅ Email verification required
- ✅ IP rate limiting (3 per hour)
- ✅ Disposable email blocking
- ✅ One entry per email per month
- ✅ Device fingerprinting
- ✅ Admin disqualification capability

### Referral Security:
- ✅ No self-referrals (database constraint)
- ✅ Referral validation after email verification
- ✅ Unique codes per contest month
- ✅ Referral usage tracking

### Winner Security:
- ✅ Identity verification required
- ✅ Unique voucher codes
- ✅ 6-month expiration
- ✅ Redemption tracking
- ✅ Complete audit trail with random seed

---

## 📧 EMAIL FLOWS

### 1. Verification Email
**Subject**: "Confirm Your Contest Entry - U-Dig It Rentals"

**Content**:
```
Hi [FirstName],

You're almost entered in our Monthly Machine Giveaway!

Click to confirm your entry:
[Verify Button]

Your Referral Code: [CODE]
Share this link with friends: [Link]

When they enter using your code, you both get entered in the referral prize draw!

Questions? Reply to this email.

U-Dig It Rentals
Saint John, NB
```

### 2. Confirmation Email
**Subject**: "You're Entered! Share to Win More - U-Dig It Rentals"

**Content**:
```
Congratulations [FirstName]!

Your entry is confirmed for this month's contest.

Want another chance to win?
Share your referral link: [Link]

When friends enter using your link, you BOTH get entered in the referral grand prize draw!

Good luck!
```

### 3. Winner Notification
**Subject**: "🎉 YOU WON! Claim Your 4-Hour Machine Voucher"

**Content**:
```
CONGRATULATIONS [FirstName]!

You've won a 4-hour machine + operator voucher (value: $450)!

Your Voucher Code: [CODE]
Expires: [Date]

TO CLAIM YOUR PRIZE:
1. Reply to this email within 7 days
2. Provide photo ID for verification
3. We'll send your printable voucher
4. Schedule your 4-hour service

Questions? Call (506) 643-1575

U-Dig It Rentals Team
```

---

## 🎯 REMAINING WORK

### Immediate (Next 2 hours):
1. Create contest page UI
2. Update banner CTA
3. Add referral sharing component
4. Create verification page

### Soon (Next 4 hours):
5. Build admin dashboard
6. Create email templates
7. Add reCAPTCHA
8. Generate voucher PDFs

### Testing (Next 2 hours):
9. Browser automation testing
10. End-to-end flow verification

**Total Remaining**: ~8 hours of development

---

## 📝 DEPLOYMENT CHECKLIST

### Before Launch:
- [ ] Legal review of contest rules
- [ ] Privacy policy updated
- [ ] Email templates tested
- [ ] reCAPTCHA configured
- [ ] Voucher PDF template designed
- [ ] Admin dashboard tested
- [ ] Browser automation tests passing
- [ ] Production environment variables set

### Launch Day:
- [ ] Deploy Edge Functions
- [ ] Enable contest page
- [ ] Update banner CTA
- [ ] Monitor for fraud
- [ ] Verify email deliverability

### During Contest:
- [ ] Monitor entries daily
- [ ] Review flagged entries
- [ ] Track referral conversions
- [ ] Answer entrant questions

### Month End:
- [ ] Draw winners (both prizes)
- [ ] Notify winners
- [ ] Verify identities
- [ ] Generate vouchers
- [ ] Announce winners publicly

---

## 🎊 PROGRESS UPDATE

**Completed**: Database + Edge Functions backend (40%)
**Next**: Frontend UI + Admin tools (40%)
**Then**: Testing + Polish (20%)

**Estimated Completion**: 8 more hours of focused development

---

**Status**: Backend foundation is solid! Moving to frontend UI next. 🚀













