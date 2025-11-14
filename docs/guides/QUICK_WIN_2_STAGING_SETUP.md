# 🚀 Quick Win #2: Staging Environment Setup

**Time Required:** 30 minutes (faster than estimated!)  
**Impact:** HIGH - Safe production deployments  
**Difficulty:** Easy ⭐⭐

---

## 🎯 What This Does

Creates a **staging environment** that mirrors production:
- Supabase staging branch (isolated database)
- Vercel staging deployment (auto-deploy on PR)
- Separate environment variables
- Safe testing before production

**Result:** Test changes safely without affecting live customers!

---

## ✅ Step-by-Step Setup

### Part 1: Supabase Staging Branch (15 minutes)

#### 1. Create Development Branch via MCP

```typescript
// Use Supabase MCP to create branch
await mcp_supabase_create_branch({
  name: 'staging',
  confirm_cost_id: '[get from confirm_cost first]'
});
```

**What this creates:**
- Isolated database (copy of production schema)
- Separate project ref (for API calls)
- Independent migrations
- Fresh data (production data NOT copied)

---

#### 2. Get Staging Branch Credentials

```typescript
// List branches to get staging project ref
await mcp_supabase_list_branches();

// Result will show:
// {
//   id: "branch-xxx",
//   name: "staging",
//   project_ref: "staging-project-ref",
//   status: "active"
// }
```

**Save these for Vercel:**
- Staging project URL
- Staging anon key
- Staging service role key

---

### Part 2: Vercel Staging Environment (15 minutes)

#### 1. Create Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

**Add for "Preview" environment:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[staging-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[staging-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[staging-service-role-key]

# Stripe (use test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# SendGrid (use test account or staging list)
SENDGRID_API_KEY=[your-sendgrid-key]
SENDGRID_FROM_EMAIL=staging@udigit.ca

# Other env vars (same as production)
NEXT_PUBLIC_APP_URL=https://kubota-rental-git-[branch]-your-team.vercel.app
```

---

#### 2. Configure Auto-Deploy

Vercel automatically deploys preview environments!

**Configuration:**
- Every PR automatically gets a preview deployment
- URL: `https://kubota-rental-git-[branch-name]-[team].vercel.app`
- Uses "Preview" environment variables
- Auto-deploys on every push

**No additional config needed!** ✅

---

### Part 3: Workflow Configuration (Optional - 5 minutes)

Create `.github/workflows/staging-deploy.yml`:

```yaml
name: Deploy to Staging

on:
  pull_request:
    branches: [develop]
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd frontend
          pnpm install
          
      - name: Run tests
        run: |
          cd frontend
          pnpm test:run
          
      - name: Build
        run: |
          cd frontend
          pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        run: echo "Vercel auto-deploys preview! ✅"
```

**Note:** Vercel auto-deploys previews, so this is optional!

---

## 📊 Staging Workflow

### Development Flow:

```
1. Create feature branch
   git checkout -b feature/new-feature

2. Make changes and commit
   git add .
   git commit -m "feat: add new feature"

3. Push to GitHub
   git push origin feature/new-feature

4. Create Pull Request
   → Vercel auto-deploys preview ✅
   → Preview URL: https://kubota-rental-git-feature-new-feature-team.vercel.app

5. Test in preview environment
   → Uses staging Supabase branch
   → Uses Stripe test mode
   → Safe to test without affecting production

6. If tests pass, merge PR
   → Auto-deploys to production ✅

7. If tests fail, fix and push
   → Preview auto-updates ✅
```

**Result:** Safe, automated deployments! 🚀

---

## 🔍 Testing in Staging

### What to Test:

1. **Database Changes:**
   - Run migrations in staging branch first
   - Test with real data
   - Verify no breaking changes

2. **API Changes:**
   - Test with staging Supabase
   - Verify auth works
   - Check rate limiting

3. **UI Changes:**
   - Visual regression testing
   - Mobile responsiveness
   - Cross-browser testing

4. **Payment Flow:**
   - Use Stripe test cards
   - Verify webhook handling
   - Check payment status updates

5. **Email Notifications:**
   - SendGrid test mode
   - Verify templates render
   - Check tracking

---

## 🛡️ Safety Benefits

### Before Staging:
- Changes go directly to production ⚠️
- No testing in production-like environment
- Risk of breaking changes
- Customer impact if bugs

### With Staging:
- Test in isolated environment ✅
- Catch bugs before production ✅
- Safe migration testing ✅
- Zero customer impact ✅

---

## 💰 Cost

**Supabase Staging Branch:**
- Free tier: $0/month
- Pro plan: Included (no extra cost)

**Vercel Preview Deployments:**
- Hobby: Unlimited previews (free)
- Pro: Unlimited previews (included)

**Total Extra Cost:** $0/month! ✅

---

## 🎯 Environment Comparison

| Environment | Database | Stripe | URL | Purpose |
|-------------|----------|--------|-----|---------|
| **Local** | Supabase local | Test mode | localhost:3000 | Development |
| **Staging** | Staging branch | Test mode | vercel.app/git-branch | QA Testing |
| **Production** | Production DB | Live mode | kubota-rental.com | Customers |

---

## ✅ Verification

### After setup, verify:

```bash
# 1. Check Supabase branches
mcp_supabase_list_branches()
# Should show: staging branch (active)

# 2. Check Vercel preview
# Create a PR → should auto-deploy
# URL format: https://kubota-rental-git-[branch]-[team].vercel.app

# 3. Test staging environment
curl https://[staging-url]/api/health
# Should return: { "status": "ok", "environment": "staging" }
```

---

## 🚀 Quick Start Commands

### Create Staging Branch:
```bash
# Via Supabase CLI (if installed locally)
supabase branches create staging

# Or use MCP tool (recommended)
mcp_supabase_create_branch({ name: 'staging' })
```

### Seed Staging Data:
```bash
# Copy production data to staging (optional)
supabase db dump -f staging-seed.sql
supabase db push staging-seed.sql --branch staging

# Or use fresh test data
cat supabase/seed_equipment_inventory.sql | supabase db execute --branch staging
```

### Deploy to Staging:
```bash
# Just push to develop branch or create PR
git push origin develop

# Vercel auto-deploys! ✅
```

---

## 📋 Environment Variables Checklist

### Staging Environment Needs:

- [x] `NEXT_PUBLIC_SUPABASE_URL` (staging project)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (staging anon key)
- [x] `SUPABASE_SERVICE_ROLE_KEY` (staging service key)
- [x] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (test mode)
- [x] `STRIPE_SECRET_KEY` (test mode)
- [x] `STRIPE_WEBHOOK_SECRET` (staging webhook)
- [x] `SENDGRID_API_KEY` (same or test account)
- [x] `SENDGRID_FROM_EMAIL` (staging email)
- [x] `NEXT_PUBLIC_APP_URL` (staging URL)

**Add all in Vercel → Settings → Environment Variables → Preview**

---

## 🎉 Benefits

### Immediate:
✅ Safe testing environment  
✅ Catch bugs before production  
✅ Test migrations safely  
✅ Automated preview deployments  

### Long-term:
✅ Better code quality  
✅ Faster development  
✅ Less production bugs  
✅ Confidence in deployments  

---

## 🚀 Next Steps

### After Setup:
1. Create a test PR
2. Verify auto-deploy works
3. Test staging environment
4. Document staging workflow

### Then:
→ Move to Quick Win #3: Bundle Optimization

---

## ✅ Success Checklist

- [ ] Supabase staging branch created
- [ ] Staging credentials obtained
- [ ] Vercel environment variables configured
- [ ] Test PR deployed successfully
- [ ] Staging URL accessible
- [ ] Database migrations work in staging
- [ ] Stripe test mode configured
- [ ] Email notifications working

**When all checked:** ✅ Staging environment ready!

---

**Time Investment:** 30 minutes  
**Impact:** HIGH  
**Difficulty:** Easy ⭐⭐  
**Status:** Ready to implement!

**Next:** [QUICK_WIN_3_BUNDLE_OPTIMIZATION.md](./QUICK_WIN_3_BUNDLE_OPTIMIZATION.md)

---

**Let's set up staging for safer deployments!** 🚀


