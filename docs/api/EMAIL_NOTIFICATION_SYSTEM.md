# 📧 Email Notification System - Booking Completion

## Overview
When a customer completes all 5 required steps for a booking, the system automatically sends notification emails to both the customer and the admin.

---

## 📬 Email Recipients

### 1. Customer Email
**Recipient**: Customer's registered email (from `users.email`)
**Subject**: `Booking Confirmation - [BOOKING_NUMBER]`
**Template**: Professional booking confirmation

**Content Includes**:
- ✅ Booking number & confirmation
- 📅 Rental dates
- 🚜 Equipment details (make, model, unit ID)
- 📍 Delivery address
- 💰 Total amount & payment status
- 🔗 Link to view booking details
- 📞 Support contact information

---

### 2. Admin Email
**Recipient**: `udigitrentalsinc@gmail.com` (hardcoded in email service)
**Subject**: `Admin Alert: BOOKING CONFIRMED`
**Template**: Admin notification with full details

**Content Includes**:
```
✅ Booking CONFIRMED: [Equipment Make Model] ([Booking Number])

Equipment: [Make Model] (Unit [Unit ID])
Customer: [First Last] ([Email], [Phone])
Rental Period: [Start Date] - [End Date]
Delivery Type: [delivery/pickup]
Delivery Address: [Full Address]
Total Amount: $[Amount]

All 5 completion steps verified:
✅ Contract signed
✅ Insurance uploaded
✅ License verified
✅ Invoice paid
✅ Security deposit paid

Status: READY FOR DELIVERY SCHEDULING
```

---

## 🔄 Workflow Trigger

Emails are sent when:

1. **All 5 steps are completed**:
   - ✅ Contract signed
   - ✅ Insurance document uploaded
   - ✅ Driver's license uploaded
   - ✅ Invoice payment completed
   - ✅ Security deposit payment completed

2. **Booking status changes to "confirmed"**

3. **Triggered by**: `BookingCompletionTrigger` component (client-side detection)

4. **Executed by**: `confirmBookingAutomatically()` server action

---

## 📂 File Locations

### Email Service Configuration
```
frontend/src/lib/email-service.ts
```
- Line 271: Admin email address (`udigitrentalsinc@gmail.com`)
- Line 210-223: Customer email method (`sendBookingConfirmation`)
- Line 243-265: Admin email method (`sendAdminNotification`)

### Booking Completion Workflow
```
frontend/src/app/booking/[id]/actions-completion.ts
```
- Line 208-239: Customer email sending
- Line 241-271: Admin email sending

### Client-Side Trigger
```
frontend/src/components/booking/BookingCompletionTrigger.tsx
```
- Monitors completion steps
- Triggers server action when all steps complete

---

## 🧪 Testing the Email System

### Option 1: Development Mode (Mock Emails)
In development, emails are logged to the console instead of sent:

```bash
# Watch the terminal for:
[Mock email send] BOOKING-CONFIRMATION
[Mock email send] ADMIN-NOTIFICATION
```

**To test**:
1. Complete all 5 steps for a booking
2. Check browser console and server logs
3. Look for email mock messages

---

### Option 2: Using Dev Complete-All-Steps API
Quickly set a booking to fully completed status:

```bash
# Get your booking ID from the manage page URL
BOOKING_ID="your-booking-id-here"

# Complete all steps automatically
curl -X POST http://localhost:3000/api/dev/complete-all-steps \
  -H "Content-Type: application/json" \
  -H "Cookie: $(cat ~/.supabase-session-cookie)" \
  -d "{\"bookingId\": \"$BOOKING_ID\"}"
```

**What this does**:
1. Creates/signs contract
2. Uploads dummy insurance
3. Adds dummy driver's license
4. Marks invoice payment as completed
5. Marks security deposit as completed
6. Triggers `confirmBookingAutomatically()` workflow
7. Sends both emails (customer + admin)

---

### Option 3: Manual Step Completion
Complete each step through the UI:

1. **Navigate to**: `/booking/[id]/manage`
2. **Sign contract**: Click "Sign Contract" → Complete DocuSign
3. **Upload insurance**: Click "Upload Insurance" → Upload PDF
4. **Upload license**: Click "Upload License" → Upload image
5. **Pay invoice**: Click "Pay Invoice" → Complete Stripe checkout
6. **Pay deposit**: Click "Pay Deposit" → Complete Stripe checkout

**Expected Result**: After step 5, emails automatically sent

---

## 📊 Email Delivery Logs

Check if emails were sent:

```bash
# View server logs
tail -f frontend/.next/server.log | grep -i email

# Look for:
✅ "Confirmation email sent to customer"
✅ "Admin notification sent"
```

**In Database**: Emails are logged in `audit_logs` table:
```sql
SELECT * FROM audit_logs
WHERE action IN ('email_sent', 'admin_notified')
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔧 Configuration

### Change Admin Email
Edit `frontend/src/lib/email-service.ts`:

```typescript
// Line 271
const adminEmail = 'udigitrentalsinc@gmail.com'; // Change this
```

### Add CC Recipients
Currently supports single recipient. To add CC:

**Option A**: Modify `sendAdminNotification` to accept array:
```typescript
const adminEmails = [
  'udigitrentalsinc@gmail.com',
  'support@udigit.ca',
  'operations@udigit.ca'
];
```

**Option B**: Send separate emails:
```typescript
for (const email of adminEmails) {
  await emailService.sendAdminNotification({ ...data, to: email });
}
```

---

## 🐛 Troubleshooting

### ❌ Emails Not Sending

**Check 1**: Is booking status changing to "confirmed"?
```sql
SELECT id, booking_number, status
FROM bookings
WHERE id = 'your-booking-id';
```

**Check 2**: Are all 5 steps completed?
```typescript
// In browser console on /booking/[id]/manage page:
console.log(completionSteps);
// Should see: { contract: true, insurance: true, license: true, payment: true, deposit: true }
```

**Check 3**: Check server logs for errors:
```bash
# Look for email errors
tail -f frontend/.next/server.log | grep -i "email\|error"
```

**Check 4**: Verify email service is initialized:
```typescript
// In frontend/src/lib/email-service.ts
// Should NOT throw errors on initialization
```

---

### ❌ Admin Email Going to Wrong Address

**Fix**: Update `frontend/src/lib/email-service.ts` line 271:
```typescript
const adminEmail = 'udigitrentalsinc@gmail.com';
```

Then restart the frontend:
```bash
cd frontend
npm run dev
```

---

### ❌ Customer Email Not Sent

**Check**: Customer has valid email in database:
```sql
SELECT email FROM users WHERE id = (
  SELECT customer_id FROM bookings WHERE id = 'your-booking-id'
);
```

**Fix**: Update customer email:
```sql
UPDATE users
SET email = 'customer@example.com'
WHERE id = 'user-id';
```

---

## 📈 Production Deployment

### Email Provider Setup

When deploying to production, configure a real email provider:

**Option 1: Supabase Edge Function** (recommended for MVP)
- Already configured in `email-service.ts`
- Uses Supabase built-in email functionality
- No additional setup required

**Option 2: SendGrid**
```env
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=no-reply@udigit.ca
```

**Option 3: AWS SES**
```env
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your_key
AWS_SES_SECRET_KEY=your_secret
```

**Option 4: Resend** (modern, developer-friendly)
```env
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=bookings@udigit.ca
```

---

## 📋 Email Templates

### Customer Confirmation Email Template
Located in: `email-service.ts` (lines 90-107)

**Customization**:
- Company name: "U-Dig It Rentals"
- Support email: "support@udigit.ca"
- Confirmation URL: Links to `/bookings/[booking_number]`

### Admin Notification Email Template
Located in: `actions-completion.ts` (lines 248-264)

**Contains**:
- Detailed booking info
- Customer contact details
- Equipment details
- Delivery logistics
- Completion checklist
- Next action required (delivery scheduling)

---

## 🎯 Success Criteria

When the workflow completes successfully, you should see:

1. ✅ Booking status = "confirmed" in database
2. ✅ Customer receives confirmation email
3. ✅ Admin receives detailed notification at udigitrentalsinc@gmail.com
4. ✅ Availability block created for equipment
5. ✅ Audit logs show both emails sent
6. ✅ Customer redirected to `/booking/[id]/confirmed` page
7. ✅ Server logs show: "Booking confirmation workflow completed"

---

## 📞 Support

If emails are not being received:

1. Check spam/junk folders
2. Verify email addresses in database are correct
3. Check server logs for errors
4. Ensure email service is properly configured
5. Contact: Nick Baxter (nickbaxter@udigit.ca)

---

**Last Updated**: January 2025
**Status**: ✅ Active and tested
**Admin Email**: udigitrentalsinc@gmail.com











