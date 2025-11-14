# 🚀 Quick Start: Test Deposit Payments

**Everything is ready!** Just follow these steps:

---

## ✅ What's Already Done

- [x] Database migration applied (deposit tracking fields added)
- [x] Webhook processing implemented  
- [x] Webhook signature verification added
- [x] Stripe CLI installed (v1.19.5)
- [x] Setup script created

---

## 🎯 3-Step Setup (5 minutes)

### Step 1: Login to Stripe CLI
```bash
stripe login
```
- This opens your browser to authorize the CLI
- Click "Allow access" in Stripe Dashboard
- Return to terminal and see "Done!"

---

### Step 2: Start Webhook Forwarding
```bash
cd /home/vscode/Kubota-rental-platform
./setup-stripe-webhook.sh
```

**You'll see:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ COPY THAT SECRET!** (starts with `whsec_`)

---

### Step 3: Add Webhook Secret to .env.local

```bash
cd /home/vscode/Kubota-rental-platform/frontend

# Create .env.local file
cat > .env.local << 'EOF'
STRIPE_WEBHOOK_SECRET=whsec_paste_your_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

**Replace `whsec_paste_your_secret_here` with the secret from Step 2**

---

## 🧪 Test It!

### 1. Restart Frontend (if needed)
```bash
cd /home/vscode/Kubota-rental-platform
./start-frontend-clean.sh
```

### 2. Open Booking Page
```
http://localhost:3000/booking/aaa3f115-1bb5-427e-b58b-48ceab8398c9/manage
```

### 3. Click "Pay Security Deposit"

### 4. Use Test Card
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

### 5. Watch the Magic! ✨

**In the webhook terminal**, you'll see:
```
--> checkout.session.completed [evt_xxxxx]
--> payment_intent.succeeded [evt_xxxxx]
```

**In your database:**
```sql
-- Run this in Supabase SQL Editor:
SELECT 
  "bookingNumber",
  "depositPaid",      -- Should be TRUE ✅
  "depositPaidAt",    -- Should have timestamp ✅
  status              -- May change to 'confirmed' ✅
FROM bookings
WHERE "bookingNumber" = 'BK-372786-0XASG2';
```

**Expected Result:**
```
depositPaid: TRUE
depositPaidAt: 2025-10-28 13:32:45.123456+00
status: 'pending' or 'confirmed'
```

---

## 🎉 Success Indicators

✅ **Webhook terminal shows:**
```
--> checkout.session.completed
--> payment_intent.succeeded
```

✅ **Database shows:**
```
depositPaid = TRUE
depositPaidAt = [current timestamp]
stripeDepositPaymentIntentId = pi_...
```

✅ **Payment record shows:**
```
status = 'completed'
processedAt = [current timestamp]
```

---

## 🐛 Troubleshooting

### Webhook says "Signature verification failed"
**Fix:** Make sure STRIPE_WEBHOOK_SECRET in .env.local matches the secret from `stripe listen`

### Deposit not marked as paid
**Check:**
1. Webhook terminal - are events arriving?
2. Browser console - any errors?
3. Check logs: `stripe listen --print-json`

### Can't find the booking
**Try this booking ID:**
```
aaa3f115-1bb5-427e-b58b-48ceab8398c9
```

---

## 📊 Verify Everything Works

Run this SQL query in Supabase:

```sql
-- Check deposit payment system
SELECT 
  b."bookingNumber",
  b."securityDeposit" as deposit_amount,
  b."depositPaid",
  b."depositPaidAt",
  b."stripeDepositPaymentIntentId",
  b.status as booking_status,
  p.status as payment_status,
  p.amount as payment_amount,
  p."processedAt" as payment_processed
FROM bookings b
LEFT JOIN payments p ON p."bookingId" = b.id AND p.type = 'deposit'
WHERE b."bookingNumber" = 'BK-372786-0XASG2';
```

**Expected when payment completes:**
```
depositPaid: TRUE
depositPaidAt: [timestamp]
stripeDepositPaymentIntentId: pi_...
booking_status: 'confirmed' (if contract signed) or 'pending'
payment_status: 'completed'
payment_processed: [timestamp]
```

---

## 🎯 Current Status

✅ **Implementation:** COMPLETE  
✅ **Database:** READY  
✅ **Webhook:** READY  
✅ **Stripe CLI:** INSTALLED  
🟡 **Testing:** Waiting for webhook secret  

---

**Next:** Run `stripe login` and `./setup-stripe-webhook.sh` to start testing!

**Time to complete:** ~5 minutes  
**Difficulty:** Easy 😊





