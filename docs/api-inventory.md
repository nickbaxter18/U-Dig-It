# API Endpoints Inventory

Complete inventory of all API endpoints in the codebase, organized by category.

Generated: $(date)

## Admin Endpoints

### System Administration

#### Test Integrations
- **GET** `/api/admin/test-integrations`
  - Purpose: Test Stripe and SendGrid integrations
  - Auth: Admin required
  - Rate Limit: MODERATE

#### Email Diagnostics
- **GET** `/api/admin/diagnose-email`
  - Purpose: Diagnostic endpoint to check email system configuration
  - Auth: Admin required
  - Rate Limit: MODERATE

#### Jobs & Background Processing
- **GET** `/api/admin/jobs/status`
  - Purpose: Get status summary for all background jobs
  - Auth: Admin required
  - Rate Limit: MODERATE
  - Query params: `jobName`, `limit`

- **GET** `/api/admin/jobs/runs`
  - Purpose: Get job runs history
  - Auth: Admin required

- **POST** `/api/admin/jobs/[name]/trigger`
  - Purpose: Trigger a specific background job manually
  - Auth: Admin required

### Permissions Management

- **GET** `/api/admin/permissions`
  - Purpose: Get all permissions
  - Auth: Admin required
  - Rate Limit: MODERATE

- **GET** `/api/admin/permissions/check`
  - Purpose: Check user permissions
  - Auth: Admin required

- **GET** `/api/admin/permissions/audit`
  - Purpose: Get permission audit logs
  - Auth: Admin required

- **GET** `/api/admin/permissions/roles`
  - Purpose: List all roles
  - Auth: Admin required

- **POST** `/api/admin/permissions/roles`
  - Purpose: Create new role
  - Auth: Admin required

- **PATCH** `/api/admin/permissions/roles/[id]`
  - Purpose: Update role
  - Auth: Admin required

- **GET** `/api/admin/permissions/user-roles`
  - Purpose: Get user role assignments
  - Auth: Admin required

- **POST** `/api/admin/permissions/user-roles`
  - Purpose: Assign role to user
  - Auth: Admin required

- **DELETE** `/api/admin/permissions/user-roles/[id]`
  - Purpose: Remove role from user
  - Auth: Admin required

### Bookings Management

- **GET** `/api/admin/bookings`
  - Purpose: List all bookings with filters
  - Auth: Admin required

- **GET** `/api/admin/bookings/[id]`
  - Purpose: Get booking details
  - Auth: Admin required

- **POST** `/api/admin/bookings`
  - Purpose: Create booking (admin)
  - Auth: Admin required

- **PUT** `/api/admin/bookings/[id]`
  - Purpose: Update booking
  - Auth: Admin required

- **POST** `/api/admin/bookings/bulk-update`
  - Purpose: Bulk update bookings (status, delete)
  - Auth: Admin required
  - Rate Limit: VERY_STRICT

- **POST** `/api/admin/bookings/bulk-email`
  - Purpose: Send bulk emails to booking customers
  - Auth: Admin required

- **POST** `/api/admin/bookings/bulk-export`
  - Purpose: Export bookings in bulk
  - Auth: Admin required

- **GET** `/api/admin/bookings/bulk-actions/[id]`
  - Purpose: Get available bulk actions for booking
  - Auth: Admin required

- **POST** `/api/admin/bookings/bulk-actions`
  - Purpose: Execute bulk actions on bookings
  - Auth: Admin required

- **GET** `/api/admin/bookings/conflicts`
  - Purpose: Check for booking conflicts
  - Auth: Admin required

- **POST** `/api/admin/bookings/send-email`
  - Purpose: Send email to booking customer
  - Auth: Admin required

- **POST** `/api/admin/bookings/[id]/notes`
  - Purpose: Add notes to booking
  - Auth: Admin required

- **GET** `/api/admin/bookings/[id]/installments`
  - Purpose: Get booking installments
  - Auth: Admin required

- **POST** `/api/admin/bookings/[id]/installments`
  - Purpose: Create installment for booking
  - Auth: Admin required

- **POST** `/api/admin/bookings/[id]/resend-invoice-email`
  - Purpose: Resend invoice email
  - Auth: Admin required

- **POST** `/api/admin/bookings/wizard/start`
  - Purpose: Start booking wizard session
  - Auth: Admin required

- **GET** `/api/admin/bookings/wizard/[id]`
  - Purpose: Get booking wizard state
  - Auth: Admin required

- **POST** `/api/admin/bookings/wizard/[id]/commit`
  - Purpose: Commit booking wizard session
  - Auth: Admin required

### Contracts Management

- **GET** `/api/admin/contracts`
  - Purpose: List all contracts
  - Auth: Admin required

- **POST** `/api/admin/contracts/generate`
  - Purpose: Generate contract PDF
  - Auth: Admin required

- **GET** `/api/admin/contracts/[id]/download`
  - Purpose: Download contract PDF
  - Auth: Admin required
  - Rate Limit: MODERATE

- **POST** `/api/admin/contracts/[id]/send`
  - Purpose: Send contract via email
  - Auth: Admin required
  - Rate Limit: STRICT

- **PATCH** `/api/admin/contracts/[id]/status`
  - Purpose: Update contract status
  - Auth: Admin required
  - Rate Limit: STRICT

- **POST** `/api/admin/contracts/export`
  - Purpose: Export contracts
  - Auth: Admin required

### Customers Management

- **GET** `/api/admin/customers`
  - Purpose: List customers
  - Auth: Admin required

- **GET** `/api/admin/customers/[id]`
  - Purpose: Get customer details
  - Auth: Admin required

- **POST** `/api/admin/customers/bulk-update`
  - Purpose: Bulk update customers
  - Auth: Admin required

- **POST** `/api/admin/customers/bulk-email`
  - Purpose: Send bulk emails to customers
  - Auth: Admin required
  - Rate Limit: VERY_STRICT

- **POST** `/api/admin/customers/bulk-export`
  - Purpose: Export customers in bulk
  - Auth: Admin required

- **POST** `/api/admin/customers/export`
  - Purpose: Export customers
  - Auth: Admin required

- **GET** `/api/admin/customers/[id]/timeline`
  - Purpose: Get customer activity timeline
  - Auth: Admin required

- **GET** `/api/admin/customers/[id]/consent`
  - Purpose: Get customer consent preferences
  - Auth: Admin required

- **PATCH** `/api/admin/customers/[id]/consent`
  - Purpose: Update customer consent preferences
  - Auth: Admin required

- **POST** `/api/admin/customers/[id]/notes`
  - Purpose: Add notes to customer
  - Auth: Admin required

- **GET** `/api/admin/customers/[id]/tags`
  - Purpose: Get customer tags
  - Auth: Admin required

- **POST** `/api/admin/customers/[id]/tags`
  - Purpose: Add tags to customer
  - Auth: Admin required

- **DELETE** `/api/admin/customers/[id]/tags`
  - Purpose: Remove tag from customer
  - Auth: Admin required

- **GET** `/api/admin/customers/segments`
  - Purpose: List customer segments
  - Auth: Admin required

- **POST** `/api/admin/customers/segments`
  - Purpose: Create customer segment
  - Auth: Admin required

- **PATCH** `/api/admin/customers/segments/[id]`
  - Purpose: Update customer segment
  - Auth: Admin required

- **DELETE** `/api/admin/customers/segments/[id]`
  - Purpose: Delete customer segment
  - Auth: Admin required
  - Rate Limit: VERY_STRICT

### Customer Tags

- **GET** `/api/admin/customer-tags`
  - Purpose: List all customer tags
  - Auth: Admin required

- **POST** `/api/admin/customer-tags`
  - Purpose: Create customer tag
  - Auth: Admin required

- **PATCH** `/api/admin/customer-tags/[id]`
  - Purpose: Update customer tag
  - Auth: Admin required

- **DELETE** `/api/admin/customer-tags/[id]`
  - Purpose: Delete customer tag
  - Auth: Admin required

### Equipment Management

- **GET** `/api/admin/equipment`
  - Purpose: List all equipment
  - Auth: Admin required

- **POST** `/api/admin/equipment`
  - Purpose: Create equipment
  - Auth: Admin required

- **GET** `/api/admin/equipment/[id]`
  - Purpose: Get equipment details
  - Auth: Admin required

- **PUT** `/api/admin/equipment/[id]`
  - Purpose: Update equipment
  - Auth: Admin required

- **POST** `/api/admin/equipment/bulk-update`
  - Purpose: Bulk update equipment (status, delete)
  - Auth: Admin required
  - Rate Limit: VERY_STRICT

- **POST** `/api/admin/equipment/bulk-export`
  - Purpose: Export equipment in bulk
  - Auth: Admin required

- **POST** `/api/admin/equipment/export`
  - Purpose: Export equipment
  - Auth: Admin required

- **GET** `/api/admin/equipment/[id]/maintenance`
  - Purpose: Get equipment maintenance history
  - Auth: Admin required
  - Rate Limit: MODERATE

- **POST** `/api/admin/equipment/[id]/maintenance`
  - Purpose: Create maintenance record
  - Auth: Admin required
  - Rate Limit: STRICT

- **GET** `/api/admin/equipment/[id]/telematics`
  - Purpose: Get equipment telematics data
  - Auth: Admin required

- **GET** `/api/admin/equipment/[id]/media`
  - Purpose: Get equipment media files
  - Auth: Admin required

- **POST** `/api/admin/equipment/[id]/media`
  - Purpose: Upload equipment media
  - Auth: Admin required

- **PATCH** `/api/admin/equipment/[id]/media`
  - Purpose: Update equipment media
  - Auth: Admin required

- **DELETE** `/api/admin/equipment/[id]/media`
  - Purpose: Delete equipment media
  - Auth: Admin required

### Payments Management

- **GET** `/api/admin/payments`
  - Purpose: List all payments
  - Auth: Admin required

- **POST** `/api/admin/payments/refund`
  - Purpose: Process refund
  - Auth: Admin required

- **GET** `/api/admin/payments/ledger`
  - Purpose: Get payment ledger entries
  - Auth: Admin required
  - Rate Limit: MODERATE
  - Query params: `bookingId`, `entryType`, `startDate`, `endDate`, `limit`

- **GET** `/api/admin/payments/disputes`
  - Purpose: List payment disputes
  - Auth: Admin required

- **GET** `/api/admin/payments/exports`
  - Purpose: Export payments
  - Auth: Admin required

- **POST** `/api/admin/payments/manual`
  - Purpose: Create manual payment entry
  - Auth: Admin required

- **GET** `/api/admin/payments/manual/[id]`
  - Purpose: Get manual payment entry
  - Auth: Admin required

- **PATCH** `/api/admin/payments/manual/[id]`
  - Purpose: Update manual payment entry
  - Auth: Admin required

- **POST** `/api/admin/payments/reconcile`
  - Purpose: Reconcile Stripe payouts
  - Auth: Admin required

- **GET** `/api/admin/payments/reconcile/[payoutId]`
  - Purpose: Get payout reconciliation details
  - Auth: Admin required

- **GET** `/api/admin/payments/receipt/[id]`
  - Purpose: Get payment receipt
  - Auth: Admin required
  - Rate Limit: MODERATE

- **POST** `/api/admin/payments/stripe/link`
  - Purpose: Link Stripe account
  - Auth: Admin required

### Installments

- **GET** `/api/admin/installments/[id]`
  - Purpose: Get installment details
  - Auth: Admin required

- **PATCH** `/api/admin/installments/[id]/status`
  - Purpose: Update installment status
  - Auth: Admin required
  - Rate Limit: STRICT

### Logistics & Deliveries

- **GET** `/api/admin/logistics/tasks`
  - Purpose: List logistics tasks
  - Auth: Admin required
  - Rate Limit: MODERATE
  - Query params: `taskType`, `status`, `driverId`, `bookingId`, `from`, `to`, `page`, `limit`

- **POST** `/api/admin/logistics/tasks`
  - Purpose: Create logistics task
  - Auth: Admin required
  - Rate Limit: STRICT

- **PATCH** `/api/admin/logistics/tasks/[id]/status`
  - Purpose: Update task status
  - Auth: Admin required
  - Rate Limit: STRICT

- **POST** `/api/admin/logistics/assign-driver`
  - Purpose: Assign driver to delivery
  - Auth: Admin required
  - Rate Limit: STRICT

- **POST** `/api/admin/logistics/pickup-checklist`
  - Purpose: Complete pickup checklist
  - Auth: Admin required
  - Rate Limit: STRICT

- **POST** `/api/admin/deliveries/[id]/notify`
  - Purpose: Notify about delivery
  - Auth: Admin required
  - Rate Limit: STRICT

- **GET** `/api/admin/delivery-assignments/[id]`
  - Purpose: Get delivery assignment details
  - Auth: Admin required

- **PATCH** `/api/admin/delivery-assignments/[id]`
  - Purpose: Update delivery assignment
  - Auth: Admin required

### Drivers Management

- **GET** `/api/admin/drivers`
  - Purpose: List all drivers
  - Auth: Admin required
  - Rate Limit: MODERATE
  - Query params: `page`, `limit`

- **POST** `/api/admin/drivers`
  - Purpose: Create driver
  - Auth: Admin required

- **GET** `/api/admin/drivers/[id]`
  - Purpose: Get driver details
  - Auth: Admin required
  - Rate Limit: MODERATE

### Maintenance

- **GET** `/api/admin/maintenance/alerts`
  - Purpose: Get maintenance alerts
  - Auth: Admin required

- **PATCH** `/api/admin/maintenance/logs/[id]`
  - Purpose: Update maintenance log
  - Auth: Admin required
  - Rate Limit: STRICT

- **DELETE** `/api/admin/maintenance/logs/[id]`
  - Purpose: Delete maintenance log
  - Auth: Admin required
  - Rate Limit: VERY_STRICT

### Telematics

- **GET** `/api/admin/telematics/snapshots`
  - Purpose: Get telematics snapshots
  - Auth: Admin required

### Insurance

- **POST** `/api/admin/insurance/export`
  - Purpose: Export insurance data
  - Auth: Admin required

- **GET** `/api/admin/insurance/[id]/activity`
  - Purpose: Get insurance activity history
  - Auth: Admin required

- **POST** `/api/admin/insurance/[id]/request-info`
  - Purpose: Request insurance information
  - Auth: Admin required

- **POST** `/api/admin/insurance/[id]/remind`
  - Purpose: Send insurance reminder
  - Auth: Admin required

### Analytics & Reporting

- **GET** `/api/admin/analytics/export`
  - Purpose: Export analytics data
  - Auth: Admin required
  - Rate Limit: MODERATE

- **GET** `/api/admin/analytics/export-data`
  - Purpose: Export analytics data (alternative endpoint)
  - Auth: Admin required

- **POST** `/api/admin/analytics/generate-report`
  - Purpose: Generate analytics report
  - Auth: Admin required

- **POST** `/api/admin/analytics/schedule-report`
  - Purpose: Schedule analytics report
  - Auth: Admin required

- **GET** `/api/admin/reports/scheduled`
  - Purpose: List scheduled reports
  - Auth: Admin required
  - Rate Limit: MODERATE

- **POST** `/api/admin/reports/scheduled`
  - Purpose: Create scheduled report
  - Auth: Admin required
  - Rate Limit: STRICT

- **PATCH** `/api/admin/reports/scheduled/[id]`
  - Purpose: Update scheduled report
  - Auth: Admin required

- **DELETE** `/api/admin/reports/scheduled/[id]`
  - Purpose: Delete scheduled report
  - Auth: Admin required

- **POST** `/api/admin/reports/scheduled/[id]/run`
  - Purpose: Manually run scheduled report
  - Auth: Admin required

### Dashboard

- **GET** `/api/admin/dashboard/overview`
  - Purpose: Get dashboard overview data
  - Auth: Admin required

- **POST** `/api/admin/dashboard/export`
  - Purpose: Export dashboard data
  - Auth: Admin required

- **GET** `/api/admin/dashboard/alerts`
  - Purpose: Get dashboard alerts
  - Auth: Admin required

- **POST** `/api/admin/dashboard/alerts/[id]/acknowledge`
  - Purpose: Acknowledge alert
  - Auth: Admin required

- **POST** `/api/admin/dashboard/alerts/[id]/resolve`
  - Purpose: Resolve alert
  - Auth: Admin required

### Audit

- **GET** `/api/admin/audit`
  - Purpose: Get audit logs
  - Auth: Admin required

- **POST** `/api/admin/audit/export`
  - Purpose: Export audit logs
  - Auth: Admin required

### Communications

- **GET** `/api/admin/communications/campaigns`
  - Purpose: List email campaigns
  - Auth: Admin required

- **POST** `/api/admin/communications/campaigns`
  - Purpose: Create email campaign
  - Auth: Admin required

- **GET** `/api/admin/communications/campaigns/[id]`
  - Purpose: Get campaign details
  - Auth: Admin required

- **GET** `/api/admin/communications/templates`
  - Purpose: List communication templates
  - Auth: Admin required

- **POST** `/api/admin/communications/templates`
  - Purpose: Create communication template
  - Auth: Admin required

- **GET** `/api/admin/communications/templates/[id]`
  - Purpose: Get template details
  - Auth: Admin required

- **PATCH** `/api/admin/communications/templates/[id]`
  - Purpose: Update template
  - Auth: Admin required

### Support & Tickets

- **GET** `/api/admin/support/tickets`
  - Purpose: List support tickets
  - Auth: Admin required

- **POST** `/api/admin/support/bulk-update`
  - Purpose: Bulk update support tickets
  - Auth: Admin required

- **POST** `/api/admin/support/export`
  - Purpose: Export support tickets
  - Auth: Admin required

- **GET** `/api/admin/support/templates`
  - Purpose: List support templates
  - Auth: Admin required

- **POST** `/api/admin/support/templates`
  - Purpose: Create support template
  - Auth: Admin required

- **PATCH** `/api/admin/support/templates/[id]`
  - Purpose: Update support template
  - Auth: Admin required
  - Rate Limit: STRICT

- **DELETE** `/api/admin/support/templates/[id]`
  - Purpose: Delete support template
  - Auth: Admin required
  - Rate Limit: VERY_STRICT

- **POST** `/api/admin/support/tickets/[id]/assign`
  - Purpose: Assign ticket to agent
  - Auth: Admin required
  - Rate Limit: STRICT

- **GET** `/api/admin/support/tickets/[id]/messages`
  - Purpose: Get ticket messages
  - Auth: Admin required
  - Rate Limit: MODERATE

- **POST** `/api/admin/support/tickets/[id]/messages`
  - Purpose: Add message to ticket
  - Auth: Admin required
  - Rate Limit: STRICT

- **POST** `/api/admin/support/tickets/[id]/remind`
  - Purpose: Send reminder for ticket
  - Auth: Admin required
  - Rate Limit: STRICT

- **GET** `/api/admin/support/tickets/[id]/sla`
  - Purpose: Get ticket SLA information
  - Auth: Admin required
  - Rate Limit: MODERATE

- **PATCH** `/api/admin/support/tickets/[id]/sla`
  - Purpose: Update ticket SLA
  - Auth: Admin required
  - Rate Limit: STRICT

### Notifications

- **GET** `/api/admin/notifications/rules`
  - Purpose: List notification rules
  - Auth: Admin required

- **POST** `/api/admin/notifications/rules`
  - Purpose: Create notification rule
  - Auth: Admin required

- **PATCH** `/api/admin/notifications/rules/[id]`
  - Purpose: Update notification rule
  - Auth: Admin required

- **DELETE** `/api/admin/notifications/rules/[id]`
  - Purpose: Delete notification rule
  - Auth: Admin required

### Email

- **GET** `/api/admin/email/delivery-logs`
  - Purpose: Get email delivery logs
  - Auth: Admin required

- **GET** `/api/admin/email/delivery-stats`
  - Purpose: Get email delivery statistics
  - Auth: Admin required

### Promotions

- **POST** `/api/admin/promotions/export`
  - Purpose: Export promotions
  - Auth: Admin required

### Users

- **GET** `/api/admin/users`
  - Purpose: List all users
  - Auth: Admin required

- **PATCH** `/api/admin/users/[id]`
  - Purpose: Update user
  - Auth: Admin required

## Public/Authenticated Endpoints

### Bookings

- **POST** `/api/bookings`
  - Purpose: Create new booking
  - Auth: Required
  - Rate Limit: STRICT

- **GET** `/api/bookings`
  - Purpose: Get user bookings
  - Auth: Required
  - Query params: `status`, `limit`

- **GET** `/api/bookings/[id]`
  - Purpose: Get booking details
  - Auth: Required

- **POST** `/api/bookings/export`
  - Purpose: Export user bookings
  - Auth: Required

### Contracts

- **POST** `/api/contracts/generate`
  - Purpose: Generate contract PDF
  - Auth: Required

- **GET** `/api/contracts/download-signed`
  - Purpose: Download signed contract
  - Auth: Required

- **POST** `/api/contracts/equipment-rider`
  - Purpose: Generate equipment rider PDF
  - Auth: Required

- **POST** `/api/contracts/generate-signed-pdf`
  - Purpose: Generate signed PDF contract
  - Auth: Required

- **POST** `/api/contracts/generate-signed-pdf-puppeteer`
  - Purpose: Generate signed PDF using Puppeteer
  - Auth: Required

### Equipment

- **GET** `/api/equipment`
  - Purpose: List all equipment
  - Auth: Public
  - Query params: `status`, `category`

- **GET** `/api/equipment/search`
  - Purpose: Search equipment
  - Auth: Public

### Availability

- **GET** `/api/availability`
  - Purpose: Check equipment availability
  - Auth: Public
  - Query params: `equipmentId`, `startDate`, `endDate`

### Discount Codes

- **POST** `/api/discount-codes/validate`
  - Purpose: Validate discount code
  - Auth: Optional (guest checkout supported)

### Contact & Leads

- **POST** `/api/contact`
  - Purpose: Submit contact form
  - Auth: Public
  - Rate Limit: STRICT

- **POST** `/api/lead-capture`
  - Purpose: Capture lead information
  - Auth: Public
  - Rate Limit: STRICT

- **GET** `/api/leads`
  - Purpose: List leads (admin only)
  - Auth: Admin required
  - Query params: `status`, `limit`

### Maps

- **GET** `/api/maps/distance`
  - Purpose: Calculate delivery distance
  - Auth: Public
  - Query params: `from`, `to`

- **GET** `/api/maps/geocode`
  - Purpose: Geocode address
  - Auth: Public

- **GET** `/api/maps/autocomplete`
  - Purpose: Address autocomplete
  - Auth: Public

### ID Verification

- **POST** `/api/id-verification/submit`
  - Purpose: Submit ID verification documents
  - Auth: Required
  - Rate Limit: STRICT

### Insurance Upload

- **POST** `/api/upload-insurance`
  - Purpose: Upload insurance COI
  - Auth: Required

### Payments

- **POST** `/api/payments/create-intent`
  - Purpose: Create Stripe payment intent
  - Auth: Required

- **POST** `/api/payments/mark-completed`
  - Purpose: Mark payment as completed
  - Auth: Required

- **GET** `/api/payments/receipt/[id]`
  - Purpose: Get payment receipt
  - Auth: Required

### Stripe

- **POST** `/api/stripe/create-checkout`
  - Purpose: Create Stripe checkout session
  - Auth: Required

- **POST** `/api/stripe/create-checkout-session`
  - Purpose: Create Stripe checkout session (alternative)
  - Auth: Required

- **POST** `/api/stripe/create-setup-session`
  - Purpose: Create Stripe setup session
  - Auth: Required

- **POST** `/api/stripe/place-security-hold`
  - Purpose: Place security hold
  - Auth: Required

- **POST** `/api/stripe/release-security-hold`
  - Purpose: Release security hold
  - Auth: Required

- **POST** `/api/stripe/place-verify-hold`
  - Purpose: Place verification hold
  - Auth: Required

- **POST** `/api/stripe/verify-card-hold`
  - Purpose: Verify card hold
  - Auth: Required

- **POST** `/api/stripe/complete-card-verification`
  - Purpose: Complete card verification
  - Auth: Required

- **POST** `/api/stripe/capture-security-hold`
  - Purpose: Capture security hold
  - Auth: Required

### Spin Wheel

- **POST** `/api/spin/start`
  - Purpose: Start spin session
  - Auth: Optional (guest supported)
  - Rate Limit: STRICT

- **POST** `/api/spin/roll`
  - Purpose: Roll the wheel
  - Auth: Optional (guest supported)
  - Rate Limit: STRICT

- **GET** `/api/spin/session/[id]`
  - Purpose: Get spin session
  - Auth: Optional

### Contest

- **POST** `/api/contest/enter`
  - Purpose: Enter contest
  - Auth: Public
  - Rate Limit: STRICT

- **GET** `/api/contest/verify`
  - Purpose: Verify contest entry
  - Auth: Public

### Notifications

- **GET** `/api/notifications`
  - Purpose: Get user notifications
  - Auth: Required

- **POST** `/api/notifications/booking-exit`
  - Purpose: Handle booking exit notification
  - Auth: Required

### Health & Debug

- **GET** `/api/health`
  - Purpose: Health check
  - Auth: Public

- **GET** `/api/status`
  - Purpose: System status
  - Auth: Public

- **POST** `/api/test-email`
  - Purpose: Send test email (dev only)
  - Auth: Admin required

### Webhooks

- **POST** `/api/webhooks/stripe`
  - Purpose: Stripe webhook handler
  - Auth: Webhook signature verification

- **POST** `/api/webhooks/idkit`
  - Purpose: IDKit webhook handler
  - Auth: Webhook signature verification

- **POST** `/api/webhooks/sendgrid`
  - Purpose: SendGrid webhook handler
  - Auth: Webhook signature verification

### Cron Jobs

- **POST** `/api/cron/generate-notifications`
  - Purpose: Generate notifications (cron)
  - Auth: Cron secret required

- **POST** `/api/cron/process-notifications`
  - Purpose: Process notifications (cron)
  - Auth: Cron secret required

- **POST** `/api/cron/process-scheduled-reports`
  - Purpose: Process scheduled reports (cron)
  - Auth: Cron secret required

- **POST** `/api/cron/reconcile-stripe-payouts`
  - Purpose: Reconcile Stripe payouts (cron)
  - Auth: Cron secret required

- **POST** `/api/cron/spin-reminders`
  - Purpose: Send spin reminders (cron)
  - Auth: Cron secret required

### Jobs

- **POST** `/api/jobs/process`
  - Purpose: Process scheduled jobs
  - Auth: Cron secret required

## Summary

Total API Endpoints: ~200+
- Admin endpoints: ~150+
- Public/Authenticated endpoints: ~50+
- Webhook endpoints: 3
- Cron endpoints: 5










