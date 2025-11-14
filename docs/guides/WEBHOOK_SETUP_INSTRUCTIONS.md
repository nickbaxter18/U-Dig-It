# 🔧 Copy-Paste Webhook Configuration Guide

**Time Required:** 7 minutes total
**Your Credentials:** Already configured in backend

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: Configure Stripe Webhook (5 minutes)**

#### **1.1 - Open Stripe Dashboard**
🔗 **Click here:** https://dashboard.stripe.com/webhooks

#### **1.2 - Add New Endpoint**
Click the **"Add endpoint"** button (top right)

#### **1.3 - Copy-Paste Webhook URL**
**Endpoint URL:** (Copy this exactly)
```
https://bnimazxnqligusckahab.supabase.co/functions/v1/stripe-webhook
```

**Listen to events:**
Select these 4 events:
```
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ charge.refunded
✅ checkout.session.completed
```

#### **1.4 - Save and Get Secret**
1. Click **"Add endpoint"**
2. You'll see a **Signing secret** that starts with `whsec_...`
3. Click **"Reveal"** and copy it
4. Keep this window open (you'll need it in Step 1.5)

#### **1.5 - Set Webhook Secret in Supabase**

**Option A: Via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/bnimazxnqligusckahab/settings/vault
2. Click **"Add new secret"**
3. Name: `STRIPE_WEBHOOK_SECRET`
4. Value: `whsec_...` (paste from Step 1.4)
5. Click **"Add secret"**

**Option B: Via Terminal** (if you have Supabase CLI)
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

✅ **Done!** Stripe webhooks are now configured.

---

### **STEP 2: Verify SendGrid Sender (2 minutes)**

#### **2.1 - Open SendGrid Sender Authentication**
🔗 **Click here:** https://app.sendgrid.com/settings/sender_auth/senders

#### **2.2 - Check if NickBaxter@udigit.ca is Verified**
Look for **NickBaxter@udigit.ca** in the list.

**If it shows "Verified" ✅:**
→ Skip to Step 3!

**If it's NOT in the list or shows "Pending":**
→ Continue to Step 2.3

#### **2.3 - Add/Verify Sender**
1. Click **"Create New Sender"** or **"Verify Single Sender"**
2. Fill in:
   - **From Email:** `NickBaxter@udigit.ca`
   - **From Name:** `U-Dig It Rentals`
   - **Reply To:** `support@udigit.ca` (or same as From Email)
   - **Company Address:** Your business address
   - **Nickname:** `Kubota Rentals`
3. Click **"Create"** or **"Save"**
4. **Check your email** (NickBaxter@udigit.ca)
5. Click the **verification link** in the email from SendGrid
6. Return to dashboard and confirm it shows "Verified" ✅

✅ **Done!** SendGrid is ready to send emails.

---

### **STEP 3: Enable Password Protection (1 minute) - OPTIONAL**

#### **3.1 - Open Supabase Auth Settings**
🔗 **Click here:** https://supabase.com/dashboard/project/bnimazxnqligusckahab/auth/policies

#### **3.2 - Enable Protection**
1. Scroll to **"Password"** section
2. Find **"Leaked Password Protection"**
3. Toggle it **ON** ✅
4. Click **"Save"**

✅ **Done!** Users can't use compromised passwords.

---

## ✅ VERIFICATION CHECKLIST

After completing the steps above, verify everything is working:

### **Test 1: Stripe Webhook (2 minutes)**

**Option A: Using Stripe CLI**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# or download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Test webhook
stripe trigger payment_intent.succeeded
```

**Expected:** Check your Supabase Edge Function logs:
```
✅ Stripe webhook event: payment_intent.succeeded
✅ Payment confirmed for booking: [id]
```

**Option B: Manual Test**
1. Create a test booking in your app
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete payment
4. Check booking status changes to "paid"
5. Check you receive email confirmation

### **Test 2: SendGrid Email (1 minute)**

**Via Terminal:**
```bash
curl -X POST https://bnimazxnqligusckahab.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaW1henhucWxpZ3VzY2thaGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjY0OTksImV4cCI6MjA3NTM0MjQ5OX0.FSURILCc3fVVeBTjFxVu7YsLU0t7PLcnIjEuuvcGDPc" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test from Kubota Platform",
    "html": "<h1>Success!</h1><p>SendGrid working from NickBaxter@udigit.ca</p>"
  }'
```

**Expected:** Email arrives in 5-30 seconds from NickBaxter@udigit.ca

**Via Database:**
```sql
SELECT public.send_email_via_sendgrid(
  'your-email@example.com',
  'Database Test Email',
  '<h1>It works!</h1><p>Sending from database function.</p>'
);
```

### **Test 3: Real-Time Updates (1 minute)**

**Open browser console on your app:**
```javascript
// Subscribe to equipment changes
const { createClient } = supabaseJs;
const supabase = createClient('[URL]', '[ANON_KEY]');

const channel = supabase
  .channel('test-realtime')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'equipment'
  }, (payload) => {
    console.log('✅ Real-time update received!', payload);
  })
  .subscribe();

// In another tab, update equipment:
// Should see console.log immediately
```

---

## 🎯 WHAT HAPPENS AFTER SETUP

### **When a Customer Books:**

1. **Frontend:**
   - User selects equipment
   - Fills booking form
   - Submits

2. **Database:**
   - Booking created with status "pending"
   - Availability block created
   - Search index updated
   - Audit log created

3. **Payment:**
   - Stripe Checkout session created
   - Customer enters card details
   - Payment processed (LIVE)

4. **Webhook (Automatic):**
   - Stripe sends `payment_intent.succeeded`
   - Your Edge Function receives it
   - Payment status → "completed"
   - Booking status → "paid"
   - Notification created

5. **Background Job (Every 2 min):**
   - Cron job runs
   - Finds pending notification
   - Calls `send-email` Edge Function
   - SendGrid sends email
   - Notification status → "sent"

6. **Customer Receives:**
   - ✉️ Professional HTML email from NickBaxter@udigit.ca
   - 📱 Real-time UI update (no refresh needed)
   - 📄 Contract sent (if DocuSign configured)

**Total time:** 5-15 seconds end-to-end! ⚡

---

## 📞 SUPPORT LINKS

**If you get stuck:**

- **Stripe Webhooks Docs:** https://stripe.com/docs/webhooks
- **SendGrid Sender Verification:** https://docs.sendgrid.com/ui/sending-email/sender-verification
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Supabase Secrets:** https://supabase.com/docs/guides/functions/secrets

---

## 🎉 YOU'RE READY!

After these 3 steps (7 minutes), your platform will:
- ✅ Process REAL payments via Stripe LIVE
- ✅ Send professional emails via SendGrid
- ✅ Automate the entire booking workflow
- ✅ Update customers in real-time
- ✅ Be ready for your first paying customer!

**Your complete rental platform is minutes away from launch!** 🚀

