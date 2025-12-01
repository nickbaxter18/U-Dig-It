# UI Pages Inventory

Complete inventory of all UI pages in the codebase, organized by category.

Generated: $(date)

## Admin Pages

### Main Admin
- **Route**: `/admin`
  - **File**: `frontend/src/app/admin/page.tsx`
  - **Purpose**: Main admin page/profile display
  - **APIs Used**:
    - `GET /api/auth/profile`

### Dashboard
- **Route**: `/admin/dashboard`
  - **File**: `frontend/src/app/admin/dashboard/page.tsx`
  - **Purpose**: Admin dashboard with overview, stats, charts, alerts
  - **APIs Used**:
    - `GET /api/admin/dashboard/overview`
    - `POST /api/admin/dashboard/export`
    - `GET /api/admin/dashboard/alerts`
    - `POST /api/admin/dashboard/alerts/[id]/acknowledge`
    - `POST /api/admin/dashboard/alerts/[id]/resolve`

### Bookings Management
- **Route**: `/admin/bookings`
  - **File**: `frontend/src/app/admin/bookings/page.tsx`
  - **Purpose**: List and manage all bookings
  - **APIs Used**:
    - Direct Supabase queries: `bookings` table
    - `POST /api/admin/bookings/bulk-update`
    - `POST /api/admin/bookings/bulk-export`
    - `POST /api/admin/bookings/bulk-email`
    - `GET /api/admin/bookings/[id]` (for details)

- **Route**: `/admin/bookings/[id]`
  - **File**: `frontend/src/app/admin/bookings/[id]/page.tsx`
  - **Purpose**: Booking details page
  - **APIs Used**: Booking detail queries

### Customers Management
- **Route**: `/admin/customers`
  - **File**: `frontend/src/app/admin/customers/page.tsx`
  - **Purpose**: List and manage customers
  - **APIs Used**:
    - Direct Supabase queries: `users` table
    - Customer-related API endpoints (to be verified)

### Equipment Management
- **Route**: `/admin/equipment`
  - **File**: `frontend/src/app/admin/equipment/page.tsx`
  - **Purpose**: List and manage equipment
  - **APIs Used**:
    - Direct Supabase queries: `equipment` table
    - `GET /api/admin/equipment/[id]`
    - `PUT /api/admin/equipment/[id]`
    - `POST /api/admin/equipment` (create)
    - `POST /api/admin/equipment/bulk-update`

### Contracts Management
- **Route**: `/admin/contracts`
  - **File**: `frontend/src/app/admin/contracts/page.tsx`
  - **Purpose**: List and manage contracts
  - **APIs Used**:
    - `GET /api/admin/contracts`
    - `POST /api/admin/contracts/generate`
    - `PATCH /api/admin/contracts/[id]/status`
    - `POST /api/admin/contracts/[id]/send`
    - `GET /api/admin/contracts/[id]/download`
    - `POST /api/admin/contracts/export`

### Payments Management
- **Route**: `/admin/payments`
  - **File**: `frontend/src/app/admin/payments/page.tsx`
  - **Purpose**: Manage payments, refunds, disputes
  - **APIs Used**:
    - Direct Supabase queries: `payments` table
    - `GET /api/admin/payments/receipt/[id]`
    - `POST /api/admin/payments/refund`
    - Payment-related API endpoints (to be verified)

### Analytics
- **Route**: `/admin/analytics`
  - **File**: `frontend/src/app/admin/analytics/page.tsx`
  - **Purpose**: Analytics dashboard with reports
  - **APIs Used**:
    - Direct Supabase queries: `bookings` table for analytics
    - `GET /api/admin/analytics/export`
    - `POST /api/admin/analytics/generate-report`
    - `GET /api/admin/analytics/export-data`
    - `POST /api/admin/analytics/schedule-report`

### Growth Metrics
- **Route**: `/admin/growth-metrics`
  - **File**: `frontend/src/app/admin/growth-metrics/page.tsx`
  - **Purpose**: Growth metrics dashboard
  - **APIs Used**:
    - Direct Supabase queries: `users` table

### Audit
- **Route**: `/admin/audit`
  - **File**: `frontend/src/app/admin/audit/page.tsx`
  - **Purpose**: Audit logs viewer
  - **APIs Used**:
    - `GET /api/admin/audit`
    - `POST /api/admin/audit/export`

### Communications
- **Route**: `/admin/communications`
  - **File**: `frontend/src/app/admin/communications/page.tsx`
  - **Purpose**: Email campaigns and templates management
  - **APIs Used**:
    - `GET /api/admin/communications/campaigns`
    - `GET /api/admin/communications/templates`

- **Route**: `/admin/communications/new-campaign`
  - **File**: `frontend/src/app/admin/communications/new-campaign/page.tsx`
  - **Purpose**: Create new email campaign
  - **APIs Used**:
    - `GET /api/admin/communications/templates`
    - `POST /api/admin/communications/campaigns`

- **Route**: `/admin/communications/campaign/[id]`
  - **File**: `frontend/src/app/admin/communications/campaign/[id]/page.tsx`
  - **Purpose**: View/edit campaign
  - **APIs Used**:
    - `GET /api/admin/communications/campaigns/[id]`

- **Route**: `/admin/communications/new-template`
  - **File**: `frontend/src/app/admin/communications/new-template/page.tsx`
  - **Purpose**: Create new email template
  - **APIs Used**:
    - `POST /api/admin/communications/templates`

- **Route**: `/admin/communications/template/[id]`
  - **File**: `frontend/src/app/admin/communications/template/[id]/page.tsx`
  - **Purpose**: View/edit template
  - **APIs Used**:
    - `GET /api/admin/communications/templates/[id]`
    - `PATCH /api/admin/communications/templates/[id]`

### Operations
- **Route**: `/admin/operations`
  - **File**: `frontend/src/app/admin/operations/page.tsx`
  - **Purpose**: Operations dashboard (deliveries, logistics)
  - **APIs Used**:
    - `GET /api/admin/drivers/[id]`
    - `GET /api/admin/bookings/[id]`
    - `PATCH /api/admin/delivery-assignments/[id]`
    - `POST /api/admin/deliveries/[id]/notify`
    - Direct Supabase queries: `delivery_assignments` table

- **Route**: `/admin/operations/drivers`
  - **File**: `frontend/src/app/admin/operations/drivers/page.tsx`
  - **Purpose**: Drivers management
  - **APIs Used**:
    - `GET /api/admin/drivers`
    - `POST /api/admin/drivers`
    - `GET /api/admin/drivers/[id]`
    - `PUT /api/admin/drivers/[id]` (implied)

### Insurance
- **Route**: `/admin/insurance`
  - **File**: `frontend/src/app/admin/insurance/page.tsx`
  - **Purpose**: Insurance documents management
  - **APIs Used**:
    - Direct Supabase queries: `insurance_documents` table
    - Insurance-related API endpoints (to be verified)

### Support & Tickets
- **Route**: `/admin/support`
  - **File**: `frontend/src/app/admin/support/page.tsx`
  - **Purpose**: Support tickets management
  - **APIs Used**:
    - Direct Supabase queries: `support_tickets` table
    - `POST /api/admin/support/bulk-update`

### Promotions
- **Route**: `/admin/promotions`
  - **File**: `frontend/src/app/admin/promotions/page.tsx`
  - **Purpose**: Promotions/discount codes management
  - **APIs Used**:
    - Direct Supabase queries: `discount_codes` table
    - `POST /api/admin/promotions/export`

### Security
- **Route**: `/admin/security/id-verification`
  - **File**: `frontend/src/app/admin/security/id-verification/page.tsx`
  - **Purpose**: ID verification management
  - **APIs Used**:
    - Direct Supabase queries: `id_verification_audits`, `users` tables

### Settings
- **Route**: `/admin/settings`
  - **File**: `frontend/src/app/admin/settings/page.tsx`
  - **Purpose**: Admin settings
  - **APIs Used**: TBD

## User-Facing Pages

### Dashboard
- **Route**: `/dashboard`
  - **File**: `frontend/src/app/dashboard/page.tsx`
  - **Purpose**: User dashboard
  - **APIs Used**: User booking queries

- **Route**: `/dashboard/bookings`
  - **File**: `frontend/src/app/dashboard/bookings/page.tsx`
  - **Purpose**: User bookings list
  - **APIs Used**:
    - `GET /api/bookings`

- **Route**: `/dashboard/bookings/[id]`
  - **File**: `frontend/src/app/dashboard/bookings/[id]/page.tsx`
  - **Purpose**: User booking details
  - **APIs Used**:
    - `GET /api/bookings/[id]`

- **Route**: `/dashboard/promotions`
  - **File**: `frontend/src/app/dashboard/promotions/page.tsx`
  - **Purpose**: User promotions
  - **APIs Used**: TBD

- **Route**: `/dashboard/promotions/[code]`
  - **File**: `frontend/src/app/dashboard/promotions/[code]/page.tsx`
  - **Purpose**: Promotion details
  - **APIs Used**: TBD

### Booking Flow
- **Route**: `/book`
  - **File**: `frontend/src/app/book/page.tsx`
  - **Purpose**: Booking flow
  - **APIs Used**:
    - `POST /api/bookings`
    - Booking-related APIs

- **Route**: `/booking/[id]`
  - **File**: `frontend/src/app/booking/[id]/page.tsx`
  - **Purpose**: Booking confirmation/details
  - **APIs Used**: Booking queries

- **Route**: `/booking/[id]/details`
  - **File**: `frontend/src/app/booking/[id]/details/page.tsx`
  - **Purpose**: Booking details
  - **APIs Used**: Booking queries

- **Route**: `/booking/[id]/manage`
  - **File**: `frontend/src/app/booking/[id]/manage/page.tsx`
  - **Purpose**: Manage booking
  - **APIs Used**: Booking management APIs

- **Route**: `/booking/[id]/sign-simple`
  - **File**: `frontend/src/app/booking/[id]/sign-simple/page.tsx`
  - **Purpose**: Sign contract
  - **APIs Used**: Contract APIs

- **Route**: `/booking/[id]/confirmed`
  - **File**: `frontend/src/app/booking/[id]/confirmed/page.tsx`
  - **Purpose**: Booking confirmed
  - **APIs Used**: TBD

- **Route**: `/booking-mobile`
  - **File**: `frontend/src/app/booking-mobile/page.tsx`
  - **Purpose**: Mobile booking flow
  - **APIs Used**: Booking APIs

- **Route**: `/bookings/[id]`
  - **File**: `frontend/src/app/bookings/[id]/page.tsx`
  - **Purpose**: Booking view
  - **APIs Used**: Booking queries

### Equipment
- **Route**: `/equipment`
  - **File**: `frontend/src/app/equipment/page.tsx`
  - **Purpose**: Equipment listing
  - **APIs Used**:
    - `GET /api/equipment`
    - `GET /api/equipment/search`

### Profile
- **Route**: `/profile`
  - **File**: `frontend/src/app/profile/page.tsx`
  - **Purpose**: User profile
  - **APIs Used**: Profile APIs

### Contact
- **Route**: `/contact`
  - **File**: `frontend/src/app/contact/page.tsx`
  - **Purpose**: Contact form
  - **APIs Used**:
    - `POST /api/contact`

### Contest
- **Route**: `/contest`
  - **File**: `frontend/src/app/contest/page.tsx`
  - **Purpose**: Contest page
  - **APIs Used**:
    - `POST /api/contest/enter`

- **Route**: `/contest/rules`
  - **File**: `frontend/src/app/contest/rules/page.tsx`
  - **Purpose**: Contest rules
  - **APIs Used**: None

- **Route**: `/contest/verify`
  - **File**: `frontend/src/app/contest/verify/page.tsx`
  - **Purpose**: Verify contest entry
  - **APIs Used**:
    - `GET /api/contest/verify`

### Insurance
- **Route**: `/insurance`
  - **File**: `frontend/src/app/insurance/page.tsx`
  - **Purpose**: Insurance information
  - **APIs Used**: None (static content)

- **Route**: `/insurance-upload`
  - **File**: `frontend/src/app/insurance-upload/page.tsx`
  - **Purpose**: Upload insurance documents
  - **APIs Used**:
    - `POST /api/upload-insurance`

- **Route**: `/getting-insurance`
  - **File**: `frontend/src/app/getting-insurance/page.tsx`
  - **Purpose**: Insurance guide
  - **APIs Used**: None (static content)

### Authentication
- **Route**: `/auth/signin`
  - **File**: `frontend/src/app/auth/signin/page.tsx`
  - **Purpose**: Sign in
  - **APIs Used**: Supabase auth

- **Route**: `/auth/signup`
  - **File**: `frontend/src/app/auth/signup/page.tsx`
  - **Purpose**: Sign up
  - **APIs Used**:
    - `POST /api/auth/register`
    - Supabase auth

- **Route**: `/auth/forgot-password`
  - **File**: `frontend/src/app/auth/forgot-password/page.tsx`
  - **Purpose**: Forgot password
  - **APIs Used**: Supabase auth

- **Route**: `/auth/reset-password`
  - **File**: `frontend/src/app/auth/reset-password/page.tsx`
  - **Purpose**: Reset password
  - **APIs Used**: Supabase auth

- **Route**: `/auth/callback`
  - **File**: `frontend/src/app/auth/callback/page.tsx`
  - **Purpose**: OAuth callback
  - **APIs Used**: Supabase auth

- **Route**: `/auth/confirm`
  - **File**: `frontend/src/app/auth/confirm/page.tsx`
  - **Purpose**: Email confirmation
  - **APIs Used**: Supabase auth

- **Route**: `/auth/error`
  - **File**: `frontend/src/app/auth/error/page.tsx`
  - **Purpose**: Auth error page
  - **APIs Used**: None

### Static Pages
- **Route**: `/`
  - **File**: `frontend/src/app/page.tsx`
  - **Purpose**: Home page
  - **APIs Used**: TBD

- **Route**: `/about`
  - **File**: `frontend/src/app/about/page.tsx`
  - **Purpose**: About page
  - **APIs Used**: None

- **Route**: `/safety`
  - **File**: `frontend/src/app/safety/page.tsx`
  - **Purpose**: Safety information
  - **APIs Used**: None

- **Route**: `/faq`
  - **File**: `frontend/src/app/faq/page.tsx`
  - **Purpose**: FAQ page
  - **APIs Used**: None

- **Route**: `/terms`
  - **File**: `frontend/src/app/terms/page.tsx`
  - **Purpose**: Terms of service
  - **APIs Used**: None

- **Route**: `/privacy`
  - **File**: `frontend/src/app/privacy/page.tsx`
  - **Purpose**: Privacy policy
  - **APIs Used**: None

- **Route**: `/support`
  - **File**: `frontend/src/app/support/page.tsx`
  - **Purpose**: Support page
  - **APIs Used**: None

### Blog
- **Route**: `/blog`
  - **File**: `frontend/src/app/blog/page.tsx`
  - **Purpose**: Blog listing
  - **APIs Used**: None

- **Route**: `/blog/*`
  - **File**: `frontend/src/app/blog/*/page.tsx`
  - **Purpose**: Blog posts
  - **APIs Used**: None

### Service Areas
- **Route**: `/service-areas/*`
  - **File**: `frontend/src/app/service-areas/*/page.tsx`
  - **Purpose**: Service area pages
  - **APIs Used**: None (static content)

## Summary

### Admin Pages: 25+
- Dashboard and overview pages: 3
- Management pages (bookings, customers, equipment): 3
- Operations pages: 2
- Analytics and reporting: 2
- Communications: 5
- Other admin features: 10+

### User-Facing Pages: 30+
- Dashboard: 5
- Booking flow: 8+
- Authentication: 7
- Static content: 10+

## Notes

- Many admin pages use direct Supabase queries instead of API endpoints
- Some pages have partial API integration (mixing Supabase queries with API calls)
- API usage patterns vary across pages
- Some pages may need API integration verification














