# AI Coding Reference - Quick Index

**Purpose**: Single source of truth for AI coding assistance on this project.

---

## 🚀 Systematic Workflow (NEW!)

**IMPORTANT**: Before starting any development task, follow the systematic workflow:

1. **Pre-Implementation** → Search codebase, check indexes, consult docs
2. **Implementation** → Reuse patterns, follow standards, build incrementally
3. **Post-Implementation** → Check lints, run advisors, verify in browser
4. **Quality Gate** → All checks passed, issues fixed, ready for review

📖 **Full Workflow Guide**: See `docs/reference/AI_WORKFLOW_GUIDE.md` for comprehensive details
📋 **Quick Checklists**: See `docs/reference/AI_WORKFLOW_CHECKLISTS.md` for quick reference

**Key Workflow Files:**
- `docs/reference/AI_WORKFLOW_GUIDE.md` - Complete workflow documentation
- `docs/reference/AI_WORKFLOW_CHECKLISTS.md` - Quick reference checklists
- `.cursor/rules/ai-workflow-optimization.mdc` - Workflow rules (always applied)

---

## 🎯 Project Overview

- **Stack**: Next.js 16 + React 19 + Supabase + TypeScript
- **Frontend**: `frontend/src/` (Port 3000)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Package Manager**: pnpm 9+
- **Start Command**: `bash start-frontend-clean.sh` (MANDATORY)

---

## 📁 Key Directories

```
frontend/src/
├── app/              # Next.js App Router pages & API routes
│   ├── api/          # API endpoints (Next.js route handlers)
│   ├── admin/        # Admin dashboard pages
│   ├── auth/         # Authentication pages
│   └── book/         # Booking flow pages
├── components/       # React components
│   ├── admin/        # Admin-specific components
│   ├── auth/         # Auth components
│   ├── booking/      # Booking flow components
│   └── contracts/   # Contract-related components
├── lib/              # Utilities & configurations
│   ├── supabase/     # Supabase client setup
│   ├── logger.ts     # Structured logging
│   └── rate-limiter.ts # Rate limiting
└── hooks/            # Custom React hooks
```

---

## 🔌 API Routes Quick Reference

### Public Endpoints
- `GET /api/availability` - Check equipment availability
- `GET /api/equipment` - List equipment
- `POST /api/lead-capture` - Capture lead information
- `POST /api/contact` - Contact form submission

### Authenticated Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings
- `POST /api/contracts/generate` - Generate contract PDF
- `POST /api/discount-codes/validate` - Validate discount code

### Admin Endpoints
- `GET /api/admin/contracts` - List all contracts
- `POST /api/admin/contracts/generate` - Generate contract (admin)
- `GET /api/admin/bookings` - List all bookings

### Payment Endpoints
- `POST /api/stripe/place-security-hold` - Place security hold
- `POST /api/stripe/release-security-hold` - Release security hold
- `POST /api/create-payment-intent` - Create Stripe payment intent

### Spin Wheel Endpoints
- `POST /api/spin/start` - Start spin session
- `POST /api/spin/roll` - Roll the wheel

---

## 🧩 Component Categories

### Core Components
- `EquipmentShowcase.tsx` - Main equipment display
- `EnhancedBookingFlow.tsx` - Booking wizard
- `UserDashboard.tsx` - User dashboard
- `AdminDashboard.tsx` - Admin dashboard

### Booking Components (`components/booking/`)
- `PaymentSection.tsx` - Payment form
- `InsuranceUploadSection.tsx` - Insurance upload
- `ContractSigningSection.tsx` - Contract signing
- `BookingDetailsCard.tsx` - Booking summary

### Admin Components (`components/admin/`)
- `BookingsTable.tsx` - Bookings management
- `HoldManagementDashboard.tsx` - Hold management
- `RevenueChart.tsx` - Revenue analytics
- `StatsCard.tsx` - Statistics cards

### Auth Components (`components/auth/`)
- `SignInForm.tsx` - Sign in form
- `SignUpForm.tsx` - Sign up form
- `OAuthButtons.tsx` - OAuth providers

---

## 🗄️ Database Schema Quick Reference

### Core Tables
- `users` - User accounts (extends Supabase auth.users)
- `equipment` - Rental equipment inventory
- `bookings` - Rental bookings
- `payments` - Payment records
- `rental_contracts` - Contract documents
- `insurance_documents` - Insurance COIs

### Key Relationships
```
users (1) ──< (many) bookings
equipment (1) ──< (many) bookings
bookings (1) ──< (1) rental_contracts
bookings (1) ──< (many) payments
```

### Important Columns
- `bookings.customerId` → `users.id` (FK)
- `bookings.equipmentId` → `equipment.id` (FK)
- `bookings.status` - 'pending' | 'confirmed' | 'cancelled' | 'completed'
- `payments.type` - 'payment' | 'refund' | 'hold' | 'release'

---

## 🔐 Authentication Patterns

### Client-Side (Browser)
```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Server-Side (API Routes)
```typescript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Admin Check
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (!['admin', 'super_admin'].includes(userData?.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 🛡️ Security Patterns

### Rate Limiting
```typescript
import { rateLimit, RateLimitPresets } from '@/lib/rate-limiter';
const result = await rateLimit(request, RateLimitPresets.STRICT);
if (!result.success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### Input Validation
```typescript
import { sanitizeBookingFormData, detectMaliciousInput } from '@/lib/input-sanitizer';
const sanitized = sanitizeBookingFormData(rawData);
const check = detectMaliciousInput(userInput);
if (check.isMalicious) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

### Request Validation
```typescript
import { validateRequest } from '@/lib/request-validator';
const validation = await validateRequest(request, {
  maxSize: 10 * 1024,
  allowedContentTypes: ['application/json'],
});
if (!validation.valid) return validation.error!;
```

---

## 📝 Logging Pattern

```typescript
import { logger } from '@/lib/logger';

// Info log
logger.info('Booking created', {
  component: 'booking-api',
  action: 'create',
  metadata: { bookingId, customerId }
});

// Error log
logger.error('Payment failed', {
  component: 'payment-api',
  action: 'payment_error',
  metadata: { reason, bookingId }
}, error);

// ❌ NEVER use console.log
```

---

## 🔍 Common Queries

### Get User Bookings
```typescript
const { data: bookings } = await supabase
  .from('bookings')
  .select('*, equipment:equipmentId(*), customer:customerId(*)')
  .eq('customerId', user.id)
  .order('created_at', { ascending: false });
```

### Check Availability
```typescript
const { data: conflicts } = await supabase
  .from('availability_blocks')
  .select('*')
  .eq('equipment_id', equipmentId)
  .or(`and(start_at_utc.lte.${endDate},end_at_utc.gte.${startDate})`);
```

### Get Equipment with Pricing
```typescript
const { data: equipment } = await supabase
  .from('equipment')
  .select('*, seasonal_pricing(*)')
  .eq('id', equipmentId)
  .single();
```

---

## 🎨 Styling Patterns

### Tailwind Classes
- Use Tailwind utility classes
- Custom design system in `tailwind.config.js`
- Component variants with `class-variance-authority`

### Component Styling
```typescript
import { cn } from '@/lib/utils'; // Combines clsx + tailwind-merge
<div className={cn("base-classes", condition && "conditional-classes")} />
```

---

## 🧪 Testing Patterns

### Component Test
```typescript
import { render, screen } from '@testing-library/react';
import { createClient } from '@/lib/supabase/client';

test('renders booking form', () => {
  render(<BookingForm />);
  expect(screen.getByText('Book Equipment')).toBeInTheDocument();
});
```

### API Route Test
```typescript
import { POST } from '@/app/api/bookings/route';
import { NextRequest } from 'next/server';

test('creates booking', async () => {
  const request = new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ equipmentId, startDate, endDate }),
  });
  const response = await POST(request);
  expect(response.status).toBe(200);
});
```

---

## 🚀 Common Commands

```bash
# Start frontend (MANDATORY - use this script)
bash start-frontend-clean.sh

# Type check
pnpm type-check

# Lint
pnpm lint

# Test
pnpm test

# Build
pnpm build

# Supabase operations
pnpm supabase:start
pnpm supabase:status
pnpm supabase:reset
```

---

## 📚 Key Files to Reference

### Core Utilities
- **Supabase Types**: `supabase/types.ts` (auto-generated)
- **Supabase Client**: `frontend/src/lib/supabase/client.ts`
- **Supabase Server**: `frontend/src/lib/supabase/server.ts`
- **Logger**: `frontend/src/lib/logger.ts`
- **Rate Limiter**: `frontend/src/lib/rate-limiter.ts`
- **Input Sanitizer**: `frontend/src/lib/input-sanitizer.ts`
- **Utils**: `frontend/src/lib/utils.ts`

### Reference Documents
- **Coding Savant Memories**: `docs/reference/CODING_SAVANT_MEMORIES.md` - Codebase-specific patterns and rules
- **Quick Cheat Sheet**: `docs/reference/CODING_SAVANT_CHEAT_SHEET.md` - One-page quick reference
- **Business Logic Patterns**: `docs/reference/BUSINESS_LOGIC_PATTERNS.md` - Booking, pricing, payment workflows
- **Error Codes**: `docs/reference/ERROR_CODES.md` - Standardized error handling

---

## ⚠️ Common Mistakes to Avoid

1. ❌ **Never use `console.log`** - Use `logger` instead
2. ❌ **Never expose service_role key** - Only use in server routes
3. ❌ **Never skip input validation** - Always sanitize and validate
4. ❌ **Never skip rate limiting** - Apply to all API routes
5. ❌ **Never use `SELECT *`** - Always specify columns
6. ❌ **Never skip RLS** - All user-facing tables need RLS
7. ❌ **Never use `pnpm dev` directly** - Use `start-frontend-clean.sh`

---

## 🔄 Workflow Patterns

### Creating a New API Route
1. Create file in `frontend/src/app/api/[route]/route.ts`
2. Add rate limiting
3. Add request validation
4. Verify authentication
5. Sanitize inputs
6. Use structured logging
7. Return appropriate status codes

### Creating a New Component
1. Create file in `frontend/src/components/[category]/ComponentName.tsx`
2. Use TypeScript with proper types
3. Add error boundaries if needed
4. Use Tailwind for styling
5. Write tests in `__tests__/` folder

### Database Changes
1. Use `mcp_supabase_apply_migration` (never manual changes)
2. Enable RLS on new tables
3. Create policies for each operation
4. Index foreign keys
5. Generate types: `mcp_supabase_generate_typescript_types`

---

## 🎯 Quick Lookups

### Find Component
→ Search in `frontend/src/components/`

### Find API Route
→ Search in `frontend/src/app/api/`

### Find Database Table
→ Check `supabase/types.ts` or use `mcp_supabase_list_tables`

### Find Type Definition
→ Check `supabase/types.ts` or component file

### Find Utility Function
→ Check `frontend/src/lib/`

---

**Last Updated**: November 2025
**Status**: ✅ Active Reference
