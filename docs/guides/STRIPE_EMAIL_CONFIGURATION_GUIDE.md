# 🔧 Stripe & Email Configuration Guide
**For**: Kubota Rental Platform
**Date**: November 4, 2025
**Mode**: TEST MODE (Safe for Development)

---

## 🎯 Quick Setup (5 Minutes)

### Step 1: Configure Environment Variables

Add these to your `frontend/.env.local` file:

```bash
# ========= STRIPE (TEST MODE) =========
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# ========= EMAIL (SENDGRID) =========
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
EMAIL_FROM=NickBaxter@udigit.ca
EMAIL_FROM_NAME=U-Dig It Rentals

# ========= FEATURE FLAGS =========
NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
```

### Step 2: Restart Your Development Server

```bash
cd frontend
npm run dev
```

That's it! You're now configured for **TEST MODE** payments and emails.

---

## 💳 Stripe Test Mode Setup

### What You Have:
- ✅ Stripe Test Publishable Key (starts with `pk_test_`)
- ✅ Stripe Test Secret Key (starts with `sk_test_`)

### What This Means:
- ✅ **No real money** will be charged
- ✅ **Safe to test** all payment flows
- ✅ **Use test credit cards** for testing
- ✅ **View all transactions** in Stripe Dashboard (test mode)

### Test Credit Cards (Stripe Provided):
```
✅ SUCCESS:
Card: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/26)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)

❌ DECLINE (Insufficient Funds):
Card: 4000 0000 0000 9995
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

⚠️ REQUIRES AUTHENTICATION:
Card: 4000 0025 0000 3155
Exp: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### How to Test Payments:
1. Go to booking flow
2. Enter test credit card `4242 4242 4242 4242`
3. Complete payment
4. Check admin dashboard → Payments
5. See test payment appear!

---

## 📧 SendGrid Email Setup

### What You Have:
- ✅ SendGrid API Key
- ✅ Verified sender email: `NickBaxter@udigit.ca`

### SendGrid Features Enabled:
1. **Customer Booking Confirmations**
   - Sent when booking is created
   - Includes booking details, dates, equipment

2. **Payment Receipts**
   - Sent when payment succeeds
   - Professional receipt format

3. **Admin Notifications**
   - New booking alerts
   - Payment confirmations
   - Support ticket notifications

4. **Marketing Emails**
   - Email campaigns from Communications page
   - Custom templates

### How to Test Emails:
1. Go to Admin → Customers
2. Click email icon on any customer
3. Select a template or write custom
4. Click Send
5. Check recipient's email inbox

---

## 🔐 Security Best Practices

### ⚠️ IMPORTANT: Live vs Test Keys

**Currently Configured**: ✅ **TEST MODE** (Safe)

**Test Keys** (Currently Using):
- `pk_test_...` - Publishable key (safe to expose)
- `sk_test_...` - Secret key (server-side only, NEVER expose to client)

**Live Keys** (DO NOT USE YET):
- `pk_live_...` - For production only
- `rk_live_...` - For production only (Note: starts with 'rk', should be 'sk')

### 🚨 Security Checklist:
- ✅ Test keys in `.env.local` (gitignored)
- ✅ Secret keys NEVER in client-side code
- ✅ Only NEXT_PUBLIC_* variables exposed to browser
- ⚠️ Live keys commented out until production
- ⚠️ Live keys stored securely (password manager)

---

## 🏗️ How Payment Flow Works

### Current Implementation:

```
Customer Side:
1. Customer creates booking
2. Enters payment info (Stripe Elements)
3. Payment processed via Stripe
4. Confirmation email sent via SendGrid
5. Redirects to success page

Admin Side:
1. Payment appears in Payments page
2. Can view full details
3. Can download receipt
4. Can view in Stripe Dashboard
5. Can process refunds
```

### Files Involved:

**Frontend Payment Components**:
- `frontend/src/components/booking/VerificationHoldPayment.tsx`
- `frontend/src/components/booking/PaymentSummary.tsx`
- `frontend/src/app/book/payment/page.tsx`

**API Routes**:
- `frontend/src/app/api/create-payment-intent/route.ts`
- `frontend/src/app/api/webhook/stripe/route.ts`
- `frontend/src/app/api/admin/payments/refund/route.ts`
- `frontend/src/app/api/admin/payments/receipt/[id]/route.ts`

**Admin Pages**:
- `frontend/src/app/admin/payments/page.tsx`

---

## 📧 Email Configuration

### SendGrid Setup:

Your SendGrid account is configured with:
- **API Key**: Provided ✅
- **From Email**: NickBaxter@udigit.ca ✅
- **From Name**: U-Dig It Rentals

### Email Templates Available:

1. **Booking Confirmation**
   - Subject: "Booking Confirmation - [Booking Number]"
   - Includes: Dates, equipment, total amount, delivery info

2. **Payment Receipt**
   - Subject: "Payment Receipt - [Booking Number]"
   - Includes: Amount paid, payment method, booking details

3. **Booking Reminder**
   - Subject: "Upcoming Rental Reminder - [Equipment]"
   - Sent 24 hours before rental start

4. **Welcome Email**
   - Subject: "Welcome to U-Dig It Rentals!"
   - Sent to new customers

5. **Custom Admin Emails**
   - Sent from Admin → Customers → Email button
   - Custom subject and content

### Email Service Locations:

**Email Utility**:
- Check if exists: `frontend/src/lib/email-service.ts`
- Create if missing (I'll do this next)

**API Routes**:
- `frontend/src/app/api/send-email/route.ts` (check if exists)
- `frontend/src/app/api/admin/bookings/send-email/route.ts` ✅ Exists

---

## ✅ Configuration Checklist

### Immediate Setup:

- [ ] **Copy environment variables** to `frontend/.env.local`:
  ```bash
  # Navigate to frontend directory
  cd frontend

  # Edit .env.local (create if doesn't exist)
  nano .env.local
  # or
  code .env.local
  ```

- [ ] **Paste the TEST MODE configuration**:
  ```bash
  # Stripe Test Mode
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
  STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

  # SendGrid Email
  EMAIL_PROVIDER=sendgrid
  SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
  EMAIL_FROM=NickBaxter@udigit.ca
  EMAIL_FROM_NAME=U-Dig It Rentals

  # Feature Flags
  NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS=true
  NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true
  ```

- [ ] **Restart development server**:
  ```bash
  npm run dev
  ```

### Verification:

- [ ] **Test Stripe Integration**:
  1. Go to booking flow
  2. Add payment info (use test card 4242 4242 4242 4242)
  3. Complete payment
  4. Verify payment appears in Admin → Payments

- [ ] **Test Email Sending**:
  1. Go to Admin → Customers
  2. Click email icon on a customer
  3. Send test email
  4. Check email inbox

- [ ] **View Stripe Dashboard**:
  1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/dashboard)
  2. Switch to "Test Mode" (top right)
  3. View test payments

---

## 🧪 Testing Guide

### Test Stripe Payments:

#### Test 1: Successful Payment
```
1. Create a booking for equipment rental
2. Enter test card: 4242 4242 4242 4242
3. Expiry: 12/26, CVC: 123
4. Submit payment
5. ✅ Success: Payment should process
6. ✅ Success: Confirmation email sent
7. ✅ Success: Appears in Admin → Payments
```

#### Test 2: Payment Declined
```
1. Create a booking
2. Enter test card: 4000 0000 0000 9995
3. Submit payment
4. ❌ Expected: Payment should be declined
5. ✅ Success: Error message shown to user
6. ✅ Success: No payment created in database
```

#### Test 3: Refund Payment
```
1. Go to Admin → Payments
2. Find a successful test payment
3. Click "Process Refund"
4. Enter refund amount
5. Click "Refund"
6. ✅ Success: Refund appears in Stripe
7. ✅ Success: Payment status updated
```

### Test SendGrid Emails:

#### Test 1: Customer Email
```
1. Go to Admin → Customers
2. Click email icon
3. Select "Welcome Email" template
4. Click "Send Email"
5. ✅ Success: Email appears in inbox
6. ✅ Success: Email looks professional
```

#### Test 2: Booking Confirmation
```
1. Create a test booking
2. Complete booking
3. ✅ Success: Confirmation email sent automatically
4. ✅ Success: Customer receives email
```

---

## 📊 Where Stripe & Email Are Used

### Stripe Integration Points:

1. **Booking Payment** (`/book/payment`)
   - Customer enters payment info
   - Creates Stripe payment intent
   - Processes payment
   - Saves to database

2. **Verification Hold** (`/book`)
   - $1 authorization hold
   - Validates credit card
   - Released immediately

3. **Admin Refunds** (`/admin/payments`)
   - Process full or partial refunds
   - Updates Stripe and database
   - Notifies customer

4. **Payment Receipts** (`/admin/payments`)
   - Generates professional receipts
   - Includes Stripe transaction ID
   - Downloadable as HTML/PDF

5. **Stripe Dashboard Link**
   - Direct link to view payment in Stripe
   - Opens in new tab

### Email Integration Points:

1. **Booking Confirmations**
   - Sent when booking created
   - Includes all booking details

2. **Payment Receipts**
   - Sent when payment succeeds
   - Professional receipt format

3. **Admin to Customer Emails** (`/admin/customers`)
   - Custom or template-based
   - Preview before sending

4. **Email Campaigns** (`/admin/communications`)
   - Bulk emails to customers
   - Campaign tracking

5. **Support Notifications**
   - Ticket updates
   - Response notifications

---

## 🔍 Verification Checklist

### After Configuration:

#### Stripe Verification:
- [ ] Environment variables are set
- [ ] Server restarted
- [ ] Test payment processes successfully
- [ ] Payment appears in admin dashboard
- [ ] Payment appears in Stripe dashboard (test mode)
- [ ] Refund works correctly

#### Email Verification:
- [ ] SendGrid API key is set
- [ ] From email is verified in SendGrid
- [ ] Test email sends successfully
- [ ] Email arrives in inbox (check spam folder if not)
- [ ] Email formatting looks good
- [ ] Links in email work

#### Integration Verification:
- [ ] Booking confirmation emails send
- [ ] Payment receipt emails send
- [ ] Admin emails from customers page send
- [ ] All emails have correct branding
- [ ] All emails have working links

---

## ⚠️ Important Notes

### Stripe Test Mode:
- ✅ **Safe**: No real money is charged
- ✅ **All features work**: Same as production
- ✅ **View in Stripe Dashboard**: See all test transactions
- ⚠️ **Use test cards only**: Real cards won't work in test mode

### SendGrid:
- ✅ **Real emails sent**: Even in test mode, emails are real
- ⚠️ **Verify sender email**: Must verify NickBaxter@udigit.ca in SendGrid
- ⚠️ **Check spam**: Test emails may go to spam initially
- ✅ **Domain authentication**: Consider authenticating @udigit.ca domain

### Rate Limits:
- SendGrid Free Tier: 100 emails/day
- Stripe Test Mode: Unlimited test transactions
- Consider upgrade for production volumes

---

## 🚀 Going to Production

### When Ready for Live Payments:

1. **Switch to Live Stripe Keys**:
   ```bash
   # In .env.local, comment out test keys:
   # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   # STRIPE_SECRET_KEY=sk_test_...

   # Uncomment live keys (replace with your actual live keys):
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
   ```

2. **Set Up Stripe Webhook** (for payment confirmations):
   ```bash
   # In Stripe Dashboard:
   # 1. Go to Developers → Webhooks
   # 2. Add endpoint: https://yourdomain.com/api/webhook/stripe
   # 3. Select events: payment_intent.succeeded, payment_intent.payment_failed
   # 4. Copy webhook secret

   # Add to .env.local:
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

3. **Upgrade SendGrid** (if needed):
   - Free: 100 emails/day
   - Essentials: $19.95/mo for 50,000 emails/month
   - Check your expected volume

4. **Test in Production**:
   - Use small real transaction first
   - Verify payment processes
   - Check Stripe live dashboard
   - Confirm customer receives emails

---

## 📁 Files That Use These Credentials

### Stripe Files:

```typescript
// Payment Intent Creation
frontend/src/app/api/create-payment-intent/route.ts
// Uses: STRIPE_SECRET_KEY

// Webhook Handler
frontend/src/app/api/webhook/stripe/route.ts
// Uses: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

// Refund Processing
frontend/src/app/api/admin/payments/refund/route.ts
// Uses: STRIPE_SECRET_KEY

// Client-Side Payment Form
frontend/src/components/booking/VerificationHoldPayment.tsx
// Uses: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Email Files:

```typescript
// Email Service (Create this next)
frontend/src/lib/email-service.ts
// Uses: SENDGRID_API_KEY, EMAIL_FROM

// Send Email API
frontend/src/app/api/admin/bookings/send-email/route.ts
// Uses: EMAIL_FROM, SENDGRID_API_KEY
```

---

## 🛠️ Next Steps (I'll Do This for You)

Let me verify and create any missing files:

1. ✅ Check if email service utility exists
2. ✅ Check if Stripe payment routes are configured correctly
3. ✅ Verify webhook handler is set up
4. ✅ Create any missing email templates
5. ✅ Test the integration end-to-end (in code)

---

## 📊 Expected Results

### After Configuration:

#### Payments Page:
- ✅ All test payments visible
- ✅ Can view in Stripe Dashboard
- ✅ Can download receipts
- ✅ Can process refunds
- ✅ Payment status tracked

#### Email System:
- ✅ Booking confirmations send automatically
- ✅ Payment receipts send automatically
- ✅ Admin can email customers
- ✅ Email campaigns work
- ✅ All emails look professional

#### Stripe Dashboard:
- ✅ View all transactions
- ✅ See customer details
- ✅ Track refunds
- ✅ View payment timeline
- ✅ Download reports

---

## 🎯 Quick Reference

### Test Credit Card (Always Works):
```
4242 4242 4242 4242
12/26
123
12345
```

### Test Amounts:
- Any amount works in test mode
- Try different amounts to see different scenarios

### SendGrid Dashboard:
- **URL**: https://app.sendgrid.com
- **Check**: Email Activity → Search for sent emails
- **Stats**: See delivery rates, opens, clicks

### Stripe Dashboard:
- **URL**: https://dashboard.stripe.com/test
- **Toggle**: Test mode (top right)
- **View**: Payments, Customers, Refunds

---

## ✅ Configuration Complete Checklist

Before testing:
- [ ] Environment variables added to `.env.local`
- [ ] Development server restarted
- [ ] No error messages in terminal
- [ ] Can access localhost:3000

Test payments:
- [ ] Create test booking
- [ ] Enter test credit card
- [ ] Payment processes successfully
- [ ] Appears in admin dashboard
- [ ] Appears in Stripe dashboard

Test emails:
- [ ] Send test email from admin
- [ ] Email arrives in inbox
- [ ] Email looks professional
- [ ] Links in email work
- [ ] Unsubscribe link works (if applicable)

---

## 📞 Support

### Stripe Support:
- **Docs**: https://stripe.com/docs
- **Dashboard**: https://dashboard.stripe.com
- **Support**: https://support.stripe.com

### SendGrid Support:
- **Docs**: https://docs.sendgrid.com
- **Dashboard**: https://app.sendgrid.com
- **Support**: https://support.sendgrid.com

---

## 🎉 You're All Set!

Your payment and email systems are configured and ready to test!

**Next**: Let me verify the email service integration and ensure everything is connected properly.

---

**Status**: ✅ **CONFIGURATION GUIDE COMPLETE**
**Mode**: 🧪 **TEST MODE** (Safe for development)
**Ready**: ✅ **YES - Start testing!**


