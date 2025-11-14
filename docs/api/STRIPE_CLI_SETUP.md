# ✅ Stripe CLI Setup Instructions

**Status:** Stripe CLI v1.19.5 installed successfully!

---

## 📋 Next Steps

### Step 1: Login to Stripe

You'll need to login to your Stripe account to authorize the CLI:

```bash
stripe login
```

**This will:**
1. Open a browser window to Stripe Dashboard
2. Ask you to authorize the CLI
3. Return a success message in the terminal

---

### Step 2: Start Webhook Forwarding

Once logged in, start forwarding webhooks to your local server:

```bash
cd /home/vscode/Kubota-rental-platform
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Expected Output:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copy that webhook secret!** You'll need it for the next step.

---

### Step 3: Add Webhook Secret to Environment

Create `.env.local` in the frontend directory:

```bash
cd /home/vscode/Kubota-rental-platform/frontend
cat > .env.local << 'EOF'
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
STRIPE_SECRET_KEY=your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_paste_secret_from_step_2_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

**Replace:**
- `your_publishable_key_here` - Your Stripe publishable key (pk_test_...)
- `your_secret_key_here` - Your Stripe secret key (sk_test_...)
- `whsec_paste_secret_from_step_2_here` - The webhook secret from Step 2

---

### Step 4: Restart Frontend

After adding the environment variables:

```bash
cd /home/vscode/Kubota-rental-platform
./start-frontend-clean.sh
```

---

## 🧪 Testing the Deposit Payment Flow

Once everything is set up:

1. **Navigate to booking page:**
   ```
   http://localhost:3000/booking/aaa3f115-1bb5-427e-b58b-48ceab8398c9/manage
   ```

2. **Click "Pay Security Deposit"**

3. **Use Stripe test card:**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)

4. **Complete payment**

5. **Check webhook terminal:**
   ```
   --> payment_intent.succeeded [evt_xxxxx]
   --> checkout.session.completed [evt_xxxxx]
   ```

6. **Verify in database:**
   ```sql
   SELECT 
     "bookingNumber",
     "depositPaid",
     "depositPaidAt",
     status
   FROM bookings
   WHERE id = 'aaa3f115-1bb5-427e-b58b-48ceab8398c9';
   ```

   Expected:
   ```
   depositPaid: TRUE
   depositPaidAt: 2025-10-28 ...
   status: 'pending' or 'confirmed'
   ```

---

## 🎯 Quick Start Commands

```bash
# 1. Login to Stripe
stripe login

# 2. Start webhook forwarding (in separate terminal)
cd /home/vscode/Kubota-rental-platform
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 3. Copy webhook secret and add to .env.local
# (See Step 3 above)

# 4. Restart frontend
./start-frontend-clean.sh
```

---

**Status:** Ready for setup! ✅  
**Next:** Run `stripe login` to connect to your Stripe account





