# 🚀 **VERCEL DEPLOYMENT GUIDE**

**Purpose**: Deploy to Vercel with email system and cron jobs
**Last Updated**: November 4, 2025

---

## 🎯 **PREREQUISITES**

Before deploying:
- [x] Email system implemented ✅
- [x] SendGrid configured ✅
- [x] Test emails sent successfully ✅
- [x] Performance optimizations applied ✅
- [ ] Vercel account created
- [ ] Vercel CLI installed

---

## 📦 **STEP 1: INSTALL VERCEL CLI**

```bash
npm install -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel
```

---

## 🔐 **STEP 2: ENVIRONMENT VARIABLES**

You'll need to add these to Vercel (Project Settings → Environment Variables):

### **Required Variables**:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bnimazxnqligusckahab.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SendGrid (Email)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=NickBaxter@udigit.ca

# Stripe (Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=production

# Cron Security
CRON_SECRET=udigit-cron-secure-2025

# Optional: Sentry (Error Tracking)
SENTRY_DSN=your_sentry_dsn (if using)
```

---

## 🚀 **STEP 3: DEPLOYMENT COMMANDS**

### **Option A: Deploy via CLI** (Recommended)
```bash
cd /home/vscode/Kubota-rental-platform/frontend

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### **Option B: Deploy via GitHub**
1. Push code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables
6. Click "Deploy"

---

## ⏰ **STEP 4: VERIFY CRON JOB**

After deployment, verify the cron job is configured:

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your project
   - Click "Cron Jobs" tab

2. **Verify Schedule**:
   - Path: `/api/cron/spin-reminders`
   - Schedule: `0 * * * *` (every hour)
   - Status: Should show "Active"

3. **Test Cron Endpoint**:
   ```bash
   curl -X GET https://your-domain.vercel.app/api/cron/spin-reminders \
     -H "Authorization: Bearer udigit-cron-secure-2025"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "sent": {
       "twentyFourHour": X,
       "fourHour": Y,
       "total": X+Y
     }
   }
   ```

---

## 🧪 **STEP 5: POST-DEPLOYMENT TESTING**

### **Test 1: Health Check**
```bash
curl https://your-domain.vercel.app/api/health
```
Expected: `{"status":"healthy",...}`

### **Test 2: Email Delivery** (Admin Only)
```bash
curl -X POST https://your-domain.vercel.app/api/test-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"toEmail": "NickBaxter@udigit.ca", "type": "spin-winner"}'
```

### **Test 3: Booking Flow**
1. Go to https://your-domain.vercel.app/book
2. Create a test booking
3. Complete all steps
4. Check email for confirmation

### **Test 4: Spin-to-Win**
1. Go to https://your-domain.vercel.app/contest
2. Play the wheel
3. Win a prize
4. Check email for winner notification

---

## 📊 **STEP 6: MONITORING SETUP**

### **Vercel Analytics**
- Enable in Vercel dashboard
- Track page views, performance
- Monitor error rates

### **SendGrid Dashboard**
- Monitor email delivery
- Track opens and clicks
- Watch for bounces/spam

### **Supabase Dashboard**
- Monitor database performance
- Check RLS policy efficiency
- Review query logs

---

## 🔒 **STEP 7: SECURITY CHECKLIST**

Before going live:

- [ ] All environment variables in Vercel (not in code)
- [ ] `.env.local` in `.gitignore`
- [ ] Cron endpoint secured with `CRON_SECRET`
- [ ] Admin endpoints require authentication
- [ ] Rate limiting enabled on all APIs
- [ ] CORS configured properly
- [ ] Content Security Policy headers set

---

## 🌐 **STEP 8: CUSTOM DOMAIN (Optional)**

1. **Add Domain in Vercel**:
   - Project Settings → Domains
   - Add your domain (e.g., udigitrentals.com)

2. **Configure DNS**:
   - Add A/CNAME records as instructed by Vercel
   - Wait for DNS propagation (5-60 minutes)

3. **SSL Certificate**:
   - Vercel automatically provisions SSL
   - HTTPS enabled by default

4. **Update Environment Variables**:
   ```bash
   NEXT_PUBLIC_BASE_URL=https://udigitrentals.com
   SENDGRID_FROM_EMAIL=noreply@udigitrentals.com
   ```

5. **Verify SendGrid Domain**:
   - SendGrid → Sender Authentication
   - Verify udigitrentals.com domain
   - Add DNS records (SPF, DKIM, DMARC)

---

## ⚡ **QUICK DEPLOYMENT (10 MINUTES)**

For fastest deployment:

```bash
# 1. Login
vercel login

# 2. Link project (first time only)
cd frontend
vercel link

# 3. Add environment variables via CLI
vercel env add SENDGRID_API_KEY
# Paste: SG.your_sendgrid_api_key_here

vercel env add SENDGRID_FROM_EMAIL
# Paste: NickBaxter@udigit.ca

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://bnimazxnqligusckahab.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add CRON_SECRET
# Paste: udigit-cron-secure-2025

# 4. Deploy to production
vercel --prod
```

---

## 📈 **POST-DEPLOYMENT MONITORING**

### **First Hour**:
- Check Vercel deployment logs
- Verify cron job activated
- Test one email flow
- Monitor for errors

### **First Day**:
- Check SendGrid dashboard
- Verify email delivery rates
- Monitor redemption tracking
- Review any error logs

### **First Week**:
- Track redemption rates daily
- Monitor email metrics
- Adjust timing if needed
- Celebrate first redemptions!

---

## 🎯 **EXPECTED RESULTS AFTER DEPLOYMENT**

### **Immediate** (First Hour):
- ✅ Cron job runs every hour
- ✅ Reminder emails send automatically
- ✅ Booking confirmations automated
- ✅ Winner notifications instant

### **First Week**:
- ✅ 2-3 redemptions from 12 emails sent
- ✅ $900-1,350 revenue from spin codes
- ✅ Email delivery rate >95%
- ✅ Customer satisfaction improved

### **First Month**:
- ✅ 20%+ redemption rate overall
- ✅ $3-5K revenue from spin-to-win
- ✅ Email system fully automated
- ✅ Zero manual email sending

---

## 🆘 **TROUBLESHOOTING**

### **Deployment Fails**
- Check build logs in Vercel dashboard
- Verify all environment variables set
- Check for TypeScript errors
- Review package.json dependencies

### **Cron Job Not Running**
- Verify `vercel.json` in root
- Check Vercel → Cron Jobs tab
- Ensure deployed to production (not preview)
- Check cron execution logs

### **Emails Not Sending**
- Verify environment variables in Vercel
- Check SendGrid dashboard for errors
- Review application logs in Vercel
- Test endpoint manually

---

## 🎊 **SUCCESS CHECKLIST**

After deployment verify:

- [ ] Application loads at Vercel URL
- [ ] Health endpoint returns 200
- [ ] Can create a booking
- [ ] Booking confirmation email received
- [ ] Can play spin-to-win
- [ ] Winner email received
- [ ] Cron job shows in Vercel dashboard
- [ ] First hourly cron execution successful
- [ ] SendGrid dashboard shows emails
- [ ] No errors in Vercel logs

---

**Deployment Time**: 10-30 minutes
**Testing Time**: 30-60 minutes
**Total Time to Production**: 1-2 hours

**Then watch the redemptions roll in! 💰📧🎉**

