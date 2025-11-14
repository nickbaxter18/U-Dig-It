# API Routes Index

Quick reference for all API endpoints in the project.

---

## 🔓 Public Endpoints

### Equipment & Availability
- **`GET /api/equipment`** - List all equipment
  - Query params: `?status=available`, `?category=track-loader`
  - Returns: Equipment list with pricing

- **`GET /api/availability`** - Check equipment availability
  - Query params: `?equipmentId=uuid&startDate=ISO&endDate=ISO`
  - Returns: Availability status and conflicts

### Contact & Leads
- **`POST /api/contact`** - Submit contact form
  - Body: `{ name, email, phone, message }`
  - Rate limited: STRICT

- **`POST /api/lead-capture`** - Capture lead information
  - Body: `{ email, name, phone?, source? }`
  - Rate limited: STRICT

- **`GET /api/leads`** - List leads (admin only)
  - Query params: `?status=pending&limit=20`

### Maps & Distance
- **`GET /api/maps/distance`** - Calculate delivery distance
  - Query params: `?from=address&to=address`
  - Returns: Distance in km and estimated delivery fee

---

## 🔐 Authenticated Endpoints

### Bookings
- **`POST /api/bookings`** - Create new booking
  - Body: `{ equipmentId, startDate, endDate, deliveryAddress, ... }`
  - Auth: Required
  - Rate limited: STRICT

- **`GET /api/bookings`** - Get user bookings
  - Query params: `?status=confirmed&limit=20`
  - Auth: Required
  - Returns: User's bookings (RLS enforced)

- **`GET /api/bookings/[id]`** - Get booking details
  - Auth: Required
  - Returns: Full booking with equipment and customer data

### Contracts
- **`POST /api/contracts/generate`** - Generate contract PDF
  - Body: `{ bookingId, templateType? }`
  - Auth: Required
  - Returns: Contract PDF URL

### Discount Codes
- **`POST /api/discount-codes/validate`** - Validate discount code
  - Body: `{ code, bookingId? }`
  - Auth: Optional (guest checkout supported)
  - Returns: Discount details and validity

---

## 👨‍💼 Admin Endpoints

### Admin Bookings
- **`GET /api/admin/bookings`** - List all bookings
  - Query params: `?status=confirmed&customerId=uuid&limit=50`
  - Auth: Admin required
  - Returns: All bookings with customer data

- **`PUT /api/admin/bookings/[id]`** - Update booking
  - Body: `{ status?, notes?, ... }`
  - Auth: Admin required

- **`DELETE /api/admin/bookings/[id]`** - Cancel booking
  - Auth: Admin required

### Admin Contracts
- **`GET /api/admin/contracts`** - List all contracts
  - Query params: `?status=signed&limit=50`
  - Auth: Admin required
  - Returns: All contracts with booking data

- **`POST /api/admin/contracts/generate`** - Generate contract (admin)
  - Body: `{ bookingId, templateType? }`
  - Auth: Admin required

### Admin Equipment
- **`GET /api/admin/equipment`** - List all equipment
  - Auth: Admin required

- **`POST /api/admin/equipment`** - Create equipment
  - Body: `{ make, model, serialNumber, ... }`
  - Auth: Admin required

- **`PUT /api/admin/equipment/[id]`** - Update equipment
  - Auth: Admin required

### Admin Payments
- **`GET /api/admin/payments`** - List all payments
  - Query params: `?status=completed&limit=50`
  - Auth: Admin required

- **`POST /api/admin/payments/refund`** - Process refund
  - Body: `{ paymentId, amount?, reason? }`
  - Auth: Admin required

---

## 💳 Payment Endpoints

### Stripe Integration
- **`POST /api/create-payment-intent`** - Create Stripe payment intent
  - Body: `{ bookingId, amount, currency? }`
  - Auth: Required
  - Returns: `clientSecret` for Stripe Elements

- **`POST /api/stripe/place-security-hold`** - Place security hold
  - Body: `{ bookingId, amount }`
  - Auth: Required
  - Returns: Hold payment intent details

- **`POST /api/stripe/release-security-hold`** - Release security hold
  - Body: `{ bookingId, holdId }`
  - Auth: Required (admin or booking owner)

### Webhooks
- **`POST /api/webhook/stripe`** - Stripe webhook handler
  - Handles: `payment_intent.succeeded`, `payment_intent.failed`, etc.
  - Auth: Webhook signature verification

- **`POST /api/webhooks/stripe`** - Alternative webhook endpoint
  - Same as above (legacy route)

---

## 🎰 Spin Wheel Endpoints

- **`POST /api/spin/start`** - Start spin session
  - Body: `{ email? }` (email required for guests)
  - Auth: Optional (guest supported)
  - Rate limited: STRICT
  - Returns: Session token and spin count

- **`POST /api/spin/roll`** - Roll the wheel
  - Body: `{ sessionId, spinNumber }`
  - Auth: Optional (guest supported)
  - Rate limited: STRICT
  - Returns: Prize amount and coupon code

- **`POST /api/spin-wheel`** - Legacy spin wheel endpoint
  - Actions: `create_session`, `update_spin`, `select_prize`
  - Auth: Optional

---

## 🔧 Utility Endpoints

### Health & Status
- **`GET /api/health`** - Health check
  - Returns: `{ status: 'ok', timestamp }`

- **`GET /api/status`** - System status
  - Returns: Database connection, Supabase status

### Debug (Development Only)
- **`GET /api/debug/session`** - Get current session
  - Auth: Required
  - Returns: User session data

- **`POST /api/debug/test-email`** - Send test email
  - Body: `{ to, subject, body }`
  - Auth: Admin required
  - Environment: Development only

### Jobs & Cron
- **`POST /api/jobs/process`** - Process scheduled jobs
  - Auth: Cron secret required
  - Headers: `Authorization: Bearer <CRON_SECRET>` or `X-Cron-Secret: <CRON_SECRET>`
  - Returns: Job processing results

- **`GET /api/cron/process-jobs`** - Vercel cron endpoint
  - Auth: Cron secret required
  - Triggers: Scheduled job processing

### Contest
- **`POST /api/contest/enter`** - Enter contest
  - Body: `{ email, name, phone? }`
  - Rate limited: STRICT

- **`GET /api/contest/winners`** - Get contest winners
  - Query params: `?limit=10`
  - Returns: Public winner list

---

## 📤 File Upload Endpoints

- **`POST /api/upload-insurance`** - Upload insurance COI
  - Body: FormData with `file` and `bookingId`
  - Auth: Required
  - Returns: Upload URL and document ID

---

## 🔄 Request Patterns

### Standard Request Flow
```typescript
// 1. Validate request
const validation = await validateRequest(request, {
  maxSize: 10 * 1024,
  allowedContentTypes: ['application/json'],
});
if (!validation.valid) return validation.error!;

// 2. Rate limit
const rateLimit = await rateLimit(request, RateLimitPresets.STRICT);
if (!rateLimit.success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}

// 3. Authenticate
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 4. Process request
// ...

// 5. Log and return
logger.info('Request processed', { component: 'api-route', action: 'process' });
return NextResponse.json({ success: true, data });
```

### Error Handling
```typescript
try {
  // Request processing
} catch (error: any) {
  logger.error('Request failed', {
    component: 'api-route',
    action: 'error',
    metadata: { error: error.message }
  }, error);

  return NextResponse.json(
    { error: 'Internal server error', details: error.message },
    { status: 500 }
  );
}
```

---

## 📊 Response Formats

### Success Response
```typescript
{
  success: true,
  data: { ... },
  metadata?: { ... }
}
```

### Error Response
```typescript
{
  error: 'Error message',
  details?: 'Additional details',
  code?: 'ERROR_CODE'
}
```

### Paginated Response
```typescript
{
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5
  }
}
```

---

## 🔒 Security Headers

All API routes should include:
```typescript
return NextResponse.json(data, {
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  }
});
```

---

## 📝 Rate Limiting Presets

- **STRICT**: 10 requests per minute
- **MODERATE**: 30 requests per minute
- **LENIENT**: 100 requests per minute
- **VERY_STRICT**: 5 requests per minute (payments)

---

**Last Updated**: November 2025


