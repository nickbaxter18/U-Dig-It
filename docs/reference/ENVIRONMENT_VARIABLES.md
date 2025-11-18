# Environment Variables Reference

**Purpose**: Comprehensive reference for all environment variables used in the Kubota Rental Platform.

**Last Updated**: 2025-01-21

---

## 📚 Table of Contents

- [Supabase Configuration](#supabase-configuration)
- [Stripe Configuration](#stripe-configuration)
- [Email Configuration](#email-configuration)
- [Google Maps Configuration](#google-maps-configuration)
- [Feature Flags](#feature-flags)
- [Application Configuration](#application-configuration)
- [Security Notes](#security-notes)

---

## Supabase Configuration

### `NEXT_PUBLIC_SUPABASE_URL`
**Type**: Public (exposed to browser)
**Required**: Yes
**Example**: `https://bnimazxnqligusckahab.supabase.co`

Supabase project URL. Used by both client and server.

**Usage:**
```typescript
// Client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

---

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Type**: Public (exposed to browser)
**Required**: Yes
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Supabase anonymous (public) API key. Safe to expose to browser. Enforced by RLS policies.

**⚠️ Security**: This key is public but RLS policies protect data access.

---

### `SUPABASE_SERVICE_ROLE_KEY`
**Type**: Private (server-only)
**Required**: Yes (for admin operations)
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Supabase service role key. **NEVER expose to browser!** Bypasses RLS policies.

**Usage:**
```typescript
// Server-side only
import { createServiceClient } from '@/lib/supabase/service';
const supabase = createServiceClient(); // Uses service role key
```

**⚠️ Security**:
- Only use in server-side code
- Only use for admin operations
- Never commit to git
- Never expose to client

---

### `NEXT_PUBLIC_SUPABASE_ALLOW_LOCAL`
**Type**: Public
**Required**: No
**Default**: `false`
**Example**: `false`

Allow local Supabase instance (development only).

---

### `NEXT_PUBLIC_SUPABASE_FALLBACK_URL`
**Type**: Public
**Required**: No
**Example**: `https://bnimazxnqligusckahab.supabase.co`

Fallback Supabase URL if primary URL fails.

---

### `NEXT_PUBLIC_SUPABASE_FALLBACK_ANON_KEY`
**Type**: Public
**Required**: No
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Fallback Supabase anonymous key.

---

### `SUPABASE_FALLBACK_SERVICE_ROLE_KEY`
**Type**: Private
**Required**: No
**Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

Fallback Supabase service role key.

---

## Stripe Configuration

### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
**Type**: Public (exposed to browser)
**Required**: Yes
**Example**: `pk_test_51S2N0TFYCEvui16J...` (test) or `pk_live_...` (production)

Stripe publishable key. Used for client-side payment processing.

**Usage:**
```typescript
// Client-side
import { loadStripe } from '@stripe/stripe-js';
const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

**⚠️ Security**:
- Test keys start with `pk_test_`
- Live keys start with `pk_live_`
- Safe to expose to browser

---

### `STRIPE_SECRET_KEY`
**Type**: Private (server-only)
**Required**: Yes
**Example**: `sk_test_51S2N0TFYCEvui16J...` (test) or `sk_live_...` (production)

Stripe secret key. **NEVER expose to browser!**

**Usage:**
```typescript
// Server-side only
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

**⚠️ Security**:
- Test keys start with `sk_test_`
- Live keys start with `sk_live_`
- Never commit to git
- Never expose to client

---

### `STRIPE_WEBHOOK_SECRET`
**Type**: Private (server-only)
**Required**: Yes (for webhooks)
**Example**: `whsec_...`

Stripe webhook signing secret. Used to verify webhook requests.

**Usage:**
```typescript
// Server-side webhook handler
const signature = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  signature!,
  process.env.STRIPE_WEBHOOK_SECRET!
);
```

**⚠️ Security**:
- Never expose to browser
- Keep secret
- Rotate if compromised

---

## Email Configuration

### `EMAIL_PROVIDER`
**Type**: Private
**Required**: Yes
**Default**: `sendgrid`
**Example**: `sendgrid`

Email service provider. Currently only `sendgrid` is supported.

---

### `SENDGRID_API_KEY`
**Type**: Private (server-only)
**Required**: Yes
**Example**: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

SendGrid API key for sending emails.

**Usage:**
```typescript
// Server-side only
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
```

**⚠️ Security**:
- Never expose to browser
- Never commit to git
- Rotate if compromised

---

### `EMAIL_FROM`
**Type**: Private
**Required**: Yes
**Example**: `NickBaxter@udigit.ca`

Default sender email address.

---

### `EMAIL_FROM_NAME`
**Type**: Private
**Required**: Yes
**Example**: `U-Dig It Rentals`

Default sender name.

---

## Google Maps Configuration

### `GOOGLE_MAPS_API_KEY`
**Type**: Private (server-only)
**Required**: Yes
**Example**: `AIzaSy...`

Google Maps API key for geocoding, distance calculation, and address autocomplete.

**Usage:**
```typescript
// Server-side only
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.GOOGLE_MAPS_API_KEY}`
);
```

**⚠️ Security**:
- **CRITICAL**: Add API restrictions immediately after creating
- Restrict to specific HTTP referrers
- Restrict to specific APIs (Geocoding, Distance Matrix, Places)
- Never expose to browser (use server-side proxy)
- Set up billing alerts

**API Restrictions:**
- Enable only: Geocoding API, Distance Matrix API, Places API
- HTTP referrer restrictions: `localhost:3000`, `udigit.ca`, `*.udigit.ca`

---

## Feature Flags

### `NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS`
**Type**: Public
**Required**: No
**Default**: `true`
**Example**: `true`

Enable/disable Stripe payment processing.

**Usage:**
```typescript
if (process.env.NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS === 'true') {
  // Show payment options
}
```

---

### `NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS`
**Type**: Public
**Required**: No
**Default**: `true`
**Example**: `true`

Enable/disable email notifications.

---

## Application Configuration

### `NODE_ENV`
**Type**: Private
**Required**: Yes
**Values**: `development` | `production` | `test`

Node.js environment. Controls logging, error handling, and feature flags.

---

### `PORT`
**Type**: Private
**Required**: No
**Default**: `3000`
**Example**: `3000`

Server port (Next.js).

---

### `HOST`
**Type**: Private
**Required**: No
**Default**: `localhost`
**Example**: `0.0.0.0`

Server host.

---

## IDKit Configuration (Optional)

### `IDKIT_API_URL`
**Type**: Private
**Required**: No
**Example**: `https://your-idkit-instance.example.com`

IDKit API URL for identity verification.

---

### `IDKIT_API_KEY`
**Type**: Private
**Required**: No
**Example**: `your-idkit-api-key-here`

IDKit API key.

---

### `IDKIT_WEBHOOK_SECRET`
**Type**: Private
**Required**: No
**Example**: `your-idkit-webhook-secret-here`

IDKit webhook signing secret.

---

## Security Notes

### Public vs Private Variables

**Public Variables** (exposed to browser):
- Prefixed with `NEXT_PUBLIC_`
- Accessible via `process.env.NEXT_PUBLIC_*`
- Safe to expose (but still protect from abuse)

**Private Variables** (server-only):
- No `NEXT_PUBLIC_` prefix
- Only accessible server-side
- Never exposed to browser
- Keep secret!

### Best Practices

1. **Never Commit Secrets**
   - Add `.env.local` to `.gitignore`
   - Use `.env.example` for templates
   - Use Vercel/other platform secrets

2. **Rotate Keys Regularly**
   - Rotate API keys every 90 days
   - Rotate immediately if compromised
   - Document rotation process

3. **Use Different Keys for Environments**
   - Development: Test keys
   - Staging: Test keys
   - Production: Live keys

4. **Set Up Billing Alerts**
   - Google Maps API
   - Stripe
   - SendGrid
   - Supabase

5. **Restrict API Keys**
   - HTTP referrer restrictions
   - IP restrictions (if applicable)
   - API restrictions (only enable needed APIs)

---

## Environment File Template

```bash
# ========= SUPABASE =========
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SUPABASE_ALLOW_LOCAL=false

# ========= STRIPE =========
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ========= EMAIL (SENDGRID) =========
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG....
EMAIL_FROM=NickBaxter@udigit.ca
EMAIL_FROM_NAME=U-Dig It Rentals

# ========= GOOGLE MAPS =========
GOOGLE_MAPS_API_KEY=AIza...

# ========= FEATURE FLAGS =========
NEXT_PUBLIC_ENABLE_STRIPE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_EMAIL_NOTIFICATIONS=true

# ========= APPLICATION =========
NODE_ENV=development
PORT=3000
```

---

## Quick Reference

### Required Variables

**Production:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`
- `GOOGLE_MAPS_API_KEY`

**Development:**
- All production variables (can use test keys)

---

**Remember**:
- 🔒 **Never commit `.env.local`**
- 🛡️ **Restrict API keys**
- 🔑 **Rotate keys regularly**
- 📊 **Set up billing alerts**
- ✅ **Use different keys per environment**



