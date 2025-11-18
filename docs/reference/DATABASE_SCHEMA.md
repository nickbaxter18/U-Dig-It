# Database Schema Reference

**Purpose**: Complete reference for all database tables, relationships, indexes, RLS policies, and database functions.

**Last Updated**: 2025-01-21

---

## 📊 Table of Contents

- [Core Tables](#core-tables)
- [Enhanced Tables](#enhanced-tables)
- [Custom Types & Enums](#custom-types--enums)
- [Indexes](#indexes)
- [Row-Level Security (RLS)](#row-level-security-rls)
- [Triggers & Functions](#triggers--functions)
- [Foreign Key Relationships](#foreign-key-relationships)

---

## Core Tables

### `equipment`

Equipment inventory and specifications.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique equipment identifier |
| `unit_id` | VARCHAR(50) | UNIQUE, NOT NULL | - | Human-readable unit ID |
| `serial_number` | VARCHAR(100) | UNIQUE, NOT NULL | - | Equipment serial number |
| `type` | VARCHAR(50) | NOT NULL | - | Equipment type (e.g., 'track-loader') |
| `model` | VARCHAR(100) | NOT NULL | - | Equipment model |
| `year` | INTEGER | NOT NULL | - | Manufacturing year |
| `make` | VARCHAR(100) | NOT NULL | - | Manufacturer |
| `description` | TEXT | - | - | Equipment description |
| `replacement_value` | DECIMAL(10,2) | NOT NULL | - | Replacement cost |
| `daily_rate` | DECIMAL(10,2) | NOT NULL | - | Daily rental rate |
| `weekly_rate` | DECIMAL(10,2) | NOT NULL | - | Weekly rental rate |
| `monthly_rate` | DECIMAL(10,2) | NOT NULL | - | Monthly rental rate |
| `overage_hourly_rate` | DECIMAL(10,2) | NOT NULL | - | Hourly rate for overage hours |
| `daily_hour_allowance` | INTEGER | NOT NULL | `8` | Daily hour allowance |
| `weekly_hour_allowance` | INTEGER | NOT NULL | `40` | Weekly hour allowance |
| `specifications` | JSONB | - | - | Equipment specifications |
| `status` | equipment_status | NOT NULL | `'available'` | Equipment status |
| `notes` | TEXT | - | - | Internal notes |
| `attachments` | JSONB | - | - | File attachments |
| `total_engine_hours` | INTEGER | NOT NULL | `0` | Total engine hours |
| `location` | JSONB | - | - | Current location |
| `images` | JSONB | - | - | Equipment images |
| `documents` | JSONB | - | - | Related documents |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_equipment_status` ON `status`
- `idx_equipment_type` ON `type`

**RLS:** Enabled - Public read, admin write

---

### `bookings`

Rental bookings and reservations.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique booking identifier |
| `booking_number` | VARCHAR(50) | UNIQUE, NOT NULL | - | Human-readable booking number |
| `customer_id` | UUID | NOT NULL, FK → `auth.users` | - | Customer user ID |
| `equipment_id` | UUID | NOT NULL, FK → `equipment` | - | Equipment ID |
| `start_date` | TIMESTAMPTZ | NOT NULL | - | Rental start date |
| `end_date` | TIMESTAMPTZ | NOT NULL | - | Rental end date |
| `status` | booking_status | NOT NULL | `'pending'` | Booking status |
| `type` | VARCHAR(50) | NOT NULL | `'pickup'` | 'pickup' or 'delivery' |
| `delivery_address` | TEXT | - | - | Delivery address |
| `delivery_city` | VARCHAR(100) | - | - | Delivery city |
| `delivery_province` | VARCHAR(50) | - | - | Delivery province |
| `delivery_postal_code` | VARCHAR(20) | - | - | Delivery postal code |
| `daily_rate` | DECIMAL(10,2) | NOT NULL | - | Daily rate at booking time |
| `weekly_rate` | DECIMAL(10,2) | NOT NULL | - | Weekly rate at booking time |
| `monthly_rate` | DECIMAL(10,2) | NOT NULL | - | Monthly rate at booking time |
| `subtotal` | DECIMAL(10,2) | NOT NULL | - | Subtotal before taxes |
| `taxes` | DECIMAL(10,2) | NOT NULL | `0` | Tax amount (HST 15%) |
| `float_fee` | DECIMAL(10,2) | NOT NULL | `0` | Float/delivery fee |
| `delivery_fee` | DECIMAL(10,2) | NOT NULL | `0` | Delivery fee |
| `seasonal_multiplier` | DECIMAL(3,2) | NOT NULL | `1.0` | Seasonal pricing multiplier |
| `total_amount` | DECIMAL(10,2) | NOT NULL | - | Total booking amount |
| `security_deposit` | DECIMAL(10,2) | NOT NULL | `0` | Security deposit |
| `additional_charges` | DECIMAL(10,2) | NOT NULL | `0` | Additional charges |
| `refund_amount` | DECIMAL(10,2) | NOT NULL | `0` | Refund amount |
| `actual_start_date` | TIMESTAMPTZ | - | - | Actual pickup date |
| `actual_end_date` | TIMESTAMPTZ | - | - | Actual return date |
| `start_engine_hours` | INTEGER | - | - | Engine hours at start |
| `end_engine_hours` | INTEGER | - | - | Engine hours at end |
| `overage_hours` | INTEGER | NOT NULL | `0` | Overage hours |
| `overage_charges` | DECIMAL(10,2) | NOT NULL | `0` | Overage charges |
| `special_instructions` | TEXT | - | - | Special instructions |
| `internal_notes` | TEXT | - | - | Internal admin notes |
| `attachments` | JSONB | - | - | File attachments |
| `cancelled_at` | TIMESTAMPTZ | - | - | Cancellation timestamp |
| `cancellation_reason` | TEXT | - | - | Cancellation reason |
| `cancellation_fee` | DECIMAL(10,2) | NOT NULL | `0` | Cancellation fee |
| `terms_accepted` | JSONB | - | - | Terms acceptance tracking |
| `signatures` | JSONB | - | - | Digital signatures |
| `documents` | JSONB | - | - | Related documents |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_bookings_customer_id` ON `customer_id`
- `idx_bookings_equipment_id` ON `equipment_id`
- `idx_bookings_status` ON `status`
- `idx_bookings_dates` ON `(start_date, end_date)`

**RLS:** Enabled - Users see own bookings, admins see all

**Foreign Keys:**
- `customer_id` → `auth.users(id)` ON DELETE CASCADE
- `equipment_id` → `equipment(id)` ON DELETE RESTRICT

---

### `payments`

Payment transactions and Stripe integration.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique payment identifier |
| `booking_id` | UUID | NOT NULL, FK → `bookings` | - | Associated booking |
| `amount` | DECIMAL(10,2) | NOT NULL | - | Payment amount |
| `currency` | VARCHAR(3) | NOT NULL | `'CAD'` | Currency code |
| `status` | payment_status | NOT NULL | `'pending'` | Payment status |
| `payment_method` | VARCHAR(50) | NOT NULL | - | Payment method |
| `stripe_payment_intent_id` | VARCHAR(100) | - | - | Stripe payment intent ID |
| `stripe_charge_id` | VARCHAR(100) | - | - | Stripe charge ID |
| `description` | TEXT | - | - | Payment description |
| `metadata` | JSONB | - | - | Additional metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_payments_booking_id` ON `booking_id`
- `idx_payments_status` ON `status`

**RLS:** Enabled - Users see payments for own bookings, admins see all

**Foreign Keys:**
- `booking_id` → `bookings(id)` ON DELETE CASCADE

---

### `contracts`

Rental contracts and agreements.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique contract identifier |
| `booking_id` | UUID | NOT NULL, FK → `bookings` | - | Associated booking |
| `contract_number` | VARCHAR(50) | UNIQUE, NOT NULL | - | Human-readable contract number |
| `status` | contract_status | NOT NULL | `'draft'` | Contract status |
| `template_version` | VARCHAR(20) | NOT NULL | - | Template version |
| `terms_version` | VARCHAR(20) | NOT NULL | - | Terms version |
| `rider_version` | VARCHAR(20) | NOT NULL | - | Rider version |
| `generated_at` | TIMESTAMPTZ | - | - | Generation timestamp |
| `signed_at` | TIMESTAMPTZ | - | - | Signing timestamp |
| `docusign_envelope_id` | VARCHAR(100) | - | - | DocuSign envelope ID |
| `contract_url` | TEXT | - | - | Contract URL |
| `signed_contract_url` | TEXT | - | - | Signed contract URL |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_contracts_booking_id` ON `booking_id`

**RLS:** Enabled - Users see contracts for own bookings, admins see all

**Foreign Keys:**
- `booking_id` → `bookings(id)` ON DELETE CASCADE

---

### `insurance_documents`

Insurance certificate of insurance (COI) documents.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique document identifier |
| `booking_id` | UUID | NOT NULL, FK → `bookings` | - | Associated booking |
| `document_type` | VARCHAR(50) | NOT NULL | - | Document type |
| `file_name` | VARCHAR(255) | NOT NULL | - | File name |
| `file_url` | TEXT | NOT NULL | - | File URL |
| `file_size` | BIGINT | NOT NULL | - | File size in bytes |
| `mime_type` | VARCHAR(100) | NOT NULL | - | MIME type |
| `uploaded_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Upload timestamp |
| `verified_at` | TIMESTAMPTZ | - | - | Verification timestamp |
| `status` | document_status | NOT NULL | `'pending'` | Verification status |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_insurance_documents_booking_id` ON `booking_id`

**RLS:** Enabled - Users see documents for own bookings, admins see all

**Foreign Keys:**
- `booking_id` → `bookings(id)` ON DELETE CASCADE

---

### `users`

User profiles extending Supabase auth.users.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY, FK → `auth.users` | - | User ID (from auth.users) |
| `first_name` | VARCHAR(100) | - | - | First name |
| `last_name` | VARCHAR(100) | - | - | Last name |
| `phone` | VARCHAR(20) | - | - | Phone number |
| `company_name` | VARCHAR(255) | - | - | Company name |
| `date_of_birth` | DATE | - | - | Date of birth |
| `drivers_license` | VARCHAR(50) | - | - | Driver's license number |
| `address` | TEXT | - | - | Street address |
| `city` | VARCHAR(100) | - | - | City |
| `province` | VARCHAR(100) | - | - | Province |
| `postal_code` | VARCHAR(20) | - | - | Postal code |
| `country` | VARCHAR(100) | - | `'Canada'` | Country |
| `role` | VARCHAR(50) | CHECK | `'customer'` | 'customer', 'admin', 'super_admin' |
| `status` | VARCHAR(50) | CHECK | `'active'` | 'active', 'inactive', 'suspended' |
| `email_verified` | BOOLEAN | - | `false` | Email verified |
| `phone_verified` | BOOLEAN | - | `false` | Phone verified |
| `two_factor_secret` | VARCHAR(255) | - | - | 2FA secret |
| `two_factor_enabled` | BOOLEAN | - | `false` | 2FA enabled |
| `stripe_customer_id` | VARCHAR(255) | - | - | Stripe customer ID |
| `preferences` | JSONB | - | `{...}` | User preferences |
| `last_login_at` | TIMESTAMPTZ | - | - | Last login timestamp |
| `last_login_ip` | VARCHAR(45) | - | - | Last login IP |
| `reset_token` | VARCHAR(255) | - | - | Password reset token |
| `reset_token_expires` | TIMESTAMPTZ | - | - | Reset token expiry |
| `email_verification_token` | VARCHAR(255) | - | - | Email verification token |
| `email_verification_expires` | TIMESTAMPTZ | - | - | Verification token expiry |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_users_role` ON `role`
- `idx_users_status` ON `status`
- `idx_users_stripe_customer` ON `stripe_customer_id` WHERE `stripe_customer_id IS NOT NULL`

**RLS:** Enabled - Users see own profile, admins see all

**Foreign Keys:**
- `id` → `auth.users(id)` ON DELETE CASCADE

---

## Enhanced Tables

### `equipment_maintenance`

Equipment maintenance tracking and scheduling.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique maintenance record ID |
| `equipment_id` | UUID | NOT NULL, FK → `equipment` | - | Equipment ID |
| `maintenance_type` | maintenance_type | NOT NULL | - | Type of maintenance |
| `status` | maintenance_status | NOT NULL | `'scheduled'` | Maintenance status |
| `priority` | priority_level | NOT NULL | `'medium'` | Priority level |
| `title` | VARCHAR(255) | NOT NULL | - | Maintenance title |
| `description` | TEXT | - | - | Description |
| `scheduled_date` | TIMESTAMPTZ | NOT NULL | - | Scheduled date |
| `completed_date` | TIMESTAMPTZ | - | - | Completion date |
| `performed_by` | VARCHAR(100) | - | - | Performed by |
| `cost` | DECIMAL(10,2) | - | `0` | Maintenance cost |
| `parts_used` | JSONB | - | - | Parts used |
| `notes` | TEXT | - | - | Notes |
| `next_due_date` | TIMESTAMPTZ | - | - | Next due date |
| `next_due_hours` | INTEGER | - | - | Next due hours |
| `attachments` | JSONB | - | - | Attachments |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_equipment_maintenance_equipment_id` ON `equipment_id`
- `idx_equipment_maintenance_status` ON `status`
- `idx_equipment_maintenance_scheduled_date` ON `scheduled_date`

**Foreign Keys:**
- `equipment_id` → `equipment(id)` ON DELETE CASCADE

---

### `equipment_utilization`

Equipment utilization analytics and tracking.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique utilization record ID |
| `equipment_id` | UUID | NOT NULL, FK → `equipment` | - | Equipment ID |
| `booking_id` | UUID | FK → `bookings` | - | Associated booking |
| `date` | DATE | NOT NULL | - | Date |
| `hours_used` | DECIMAL(8,2) | NOT NULL | `0` | Hours used |
| `fuel_consumed` | DECIMAL(8,2) | - | `0` | Fuel consumed |
| `revenue_generated` | DECIMAL(10,2) | - | `0` | Revenue generated |
| `utilization_percentage` | DECIMAL(5,2) | NOT NULL | - | Utilization % (0-100) |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |

**Unique Constraint:** `(equipment_id, date)`

**Indexes:**
- `idx_equipment_utilization_equipment_id` ON `equipment_id`
- `idx_equipment_utilization_date` ON `date`

**Foreign Keys:**
- `equipment_id` → `equipment(id)` ON DELETE CASCADE
- `booking_id` → `bookings(id)` ON DELETE SET NULL

---

### `analytics_data`

Business analytics and metrics.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique analytics record ID |
| `metric_name` | VARCHAR(100) | NOT NULL | - | Metric name |
| `metric_category` | VARCHAR(50) | NOT NULL | - | Category (revenue, utilization, etc.) |
| `date` | DATE | NOT NULL | - | Date |
| `value` | DECIMAL(15,2) | NOT NULL | - | Metric value |
| `metadata` | JSONB | - | - | Additional metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |

**Unique Constraint:** `(metric_name, metric_category, date)`

**Indexes:**
- `idx_analytics_data_category_date` ON `(metric_category, date)`
- `idx_analytics_data_name_date` ON `(metric_name, date)`

---

### `notifications`

Notification queue and tracking.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique notification ID |
| `user_id` | UUID | FK → `auth.users` | - | Target user |
| `type` | notification_type | NOT NULL | - | Notification type |
| `status` | notification_status | NOT NULL | `'pending'` | Status |
| `priority` | priority_level | NOT NULL | `'medium'` | Priority |
| `title` | VARCHAR(255) | NOT NULL | - | Title |
| `message` | TEXT | NOT NULL | - | Message |
| `template_id` | VARCHAR(100) | - | - | Template ID |
| `template_data` | JSONB | - | - | Template data |
| `scheduled_for` | TIMESTAMPTZ | - | - | Scheduled send time |
| `sent_at` | TIMESTAMPTZ | - | - | Sent timestamp |
| `delivered_at` | TIMESTAMPTZ | - | - | Delivered timestamp |
| `failed_at` | TIMESTAMPTZ | - | - | Failed timestamp |
| `failure_reason` | TEXT | - | - | Failure reason |
| `retry_count` | INTEGER | - | `0` | Retry count |
| `max_retries` | INTEGER | - | `3` | Max retries |
| `external_id` | VARCHAR(255) | - | - | External service ID |
| `metadata` | JSONB | - | - | Metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_notifications_user_id` ON `user_id`
- `idx_notifications_status` ON `status`
- `idx_notifications_scheduled_for` ON `scheduled_for`

**Foreign Keys:**
- `user_id` → `auth.users(id)` ON DELETE CASCADE

---

### `audit_logs`

Comprehensive audit logging for compliance.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique audit log ID |
| `table_name` | VARCHAR(100) | NOT NULL | - | Table name |
| `record_id` | UUID | NOT NULL | - | Record ID |
| `action` | audit_action | NOT NULL | - | Action type |
| `user_id` | UUID | FK → `auth.users` | - | User who performed action |
| `old_values` | JSONB | - | - | Old values |
| `new_values` | JSONB | - | - | New values |
| `ip_address` | INET | - | - | IP address |
| `user_agent` | TEXT | - | - | User agent |
| `session_id` | VARCHAR(255) | - | - | Session ID |
| `metadata` | JSONB | - | - | Additional metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |

**Indexes:**
- `idx_audit_logs_table_record` ON `(table_name, record_id)`
- `idx_audit_logs_user_id` ON `user_id`
- `idx_audit_logs_created_at` ON `created_at`

**Foreign Keys:**
- `user_id` → `auth.users(id)` ON DELETE SET NULL

---

### `discount_codes`

Promotional discount codes.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique discount code ID |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | - | Discount code |
| `name` | VARCHAR(100) | NOT NULL | - | Code name |
| `type` | VARCHAR(50) | NOT NULL | - | 'percentage', 'fixed_amount', 'free_delivery' |
| `value` | DECIMAL(10,2) | NOT NULL | - | Discount value |
| `max_uses` | INTEGER | - | - | Maximum uses |
| `used_count` | INTEGER | - | `0` | Current usage count |
| `max_uses_per_user` | INTEGER | - | `1` | Max uses per user |
| `min_booking_amount` | DECIMAL(10,2) | - | - | Minimum booking amount |
| `valid_from` | TIMESTAMPTZ | - | - | Valid from date |
| `valid_until` | TIMESTAMPTZ | - | - | Valid until date |
| `applicable_equipment_types` | TEXT[] | - | - | Applicable equipment types |
| `is_active` | BOOLEAN | - | `true` | Is active |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_discount_codes_code` ON `code` WHERE `is_active = true`

---

### `seasonal_pricing`

Seasonal pricing rules and multipliers.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | UUID | PRIMARY KEY | `uuid_generate_v4()` | Unique pricing rule ID |
| `name` | VARCHAR(100) | NOT NULL | - | Rule name |
| `equipment_type` | VARCHAR(50) | NOT NULL | - | Equipment type |
| `start_date` | DATE | NOT NULL | - | Start date |
| `end_date` | DATE | NOT NULL | - | End date |
| `multiplier` | DECIMAL(4,3) | NOT NULL | - | Price multiplier (e.g., 1.2 = 20% increase) |
| `is_active` | BOOLEAN | - | `true` | Is active |
| `created_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_seasonal_pricing_equipment_type` ON `(equipment_type, start_date, end_date)` WHERE `is_active = true`

---

## Custom Types & Enums

### `equipment_status`
- `'available'` - Available for rental
- `'rented'` - Currently rented
- `'maintenance'` - In maintenance
- `'retired'` - Retired from service

### `booking_status`
- `'pending'` - Awaiting confirmation
- `'confirmed'` - Confirmed booking
- `'active'` - Currently active rental
- `'completed'` - Rental completed
- `'cancelled'` - Booking cancelled

### `payment_status`
- `'pending'` - Payment pending
- `'processing'` - Payment processing
- `'completed'` - Payment completed
- `'failed'` - Payment failed
- `'refunded'` - Payment refunded

### `contract_status`
- `'draft'` - Draft contract
- `'generated'` - Contract generated
- `'sent'` - Contract sent to customer
- `'signed'` - Contract signed
- `'expired'` - Contract expired

### `document_status`
- `'pending'` - Pending verification
- `'verified'` - Verified
- `'rejected'` - Rejected

### `maintenance_type`
- `'scheduled'` - Scheduled maintenance
- `'preventive'` - Preventive maintenance
- `'repair'` - Repair
- `'emergency'` - Emergency repair
- `'inspection'` - Inspection

### `maintenance_status`
- `'scheduled'` - Scheduled
- `'in_progress'` - In progress
- `'completed'` - Completed
- `'cancelled'` - Cancelled
- `'overdue'` - Overdue

### `notification_type`
- `'email'` - Email notification
- `'sms'` - SMS notification
- `'push'` - Push notification
- `'webhook'` - Webhook notification

### `notification_status`
- `'pending'` - Pending
- `'sent'` - Sent
- `'delivered'` - Delivered
- `'failed'` - Failed
- `'cancelled'` - Cancelled

### `priority_level`
- `'low'` - Low priority
- `'medium'` - Medium priority
- `'high'` - High priority
- `'critical'` - Critical priority

### `audit_action`
- `'create'` - Record created
- `'update'` - Record updated
- `'delete'` - Record deleted
- `'login'` - User login
- `'logout'` - User logout
- `'payment'` - Payment action
- `'booking'` - Booking action
- `'cancel'` - Cancellation action

---

## Indexes

### Performance Indexes

All foreign keys are indexed for join performance:

- `idx_bookings_customer_id` - Fast customer booking lookups
- `idx_bookings_equipment_id` - Fast equipment booking lookups
- `idx_payments_booking_id` - Fast payment lookups
- `idx_contracts_booking_id` - Fast contract lookups
- `idx_insurance_documents_booking_id` - Fast document lookups
- `idx_equipment_maintenance_equipment_id` - Fast maintenance lookups

### Query Optimization Indexes

- `idx_bookings_dates` - Date range queries
- `idx_bookings_status` - Status filtering
- `idx_equipment_status` - Equipment availability queries
- `idx_equipment_type` - Equipment type filtering
- `idx_users_role` - Role-based queries
- `idx_users_status` - User status filtering

### Full-Text Search Indexes

- `idx_search_index_searchable_text` - GIN index for full-text search

---

## Row-Level Security (RLS)

### RLS Patterns

#### Pattern 1: Customer Ownership (Bookings, Payments, Contracts)
- **SELECT**: Users see their own records OR admins see all
- **INSERT**: Users create for self OR admins create for anyone
- **UPDATE**: Users update own OR admins update all
- **DELETE**: Users delete own OR admins delete all

#### Pattern 2: Public Read, Admin Write (Equipment)
- **SELECT**: Public can read all
- **INSERT/UPDATE/DELETE**: Only admins

#### Pattern 3: Admin Only (Analytics, System Config)
- **ALL**: Only admins can access

### RLS Policy Examples

**Bookings - Users see own:**
```sql
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = customer_id);
```

**Bookings - Admins see all:**
```sql
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

**Equipment - Public read:**
```sql
CREATE POLICY "Equipment is viewable by everyone" ON equipment
  FOR SELECT USING (true);
```

---

## Triggers & Functions

### `update_updated_at_column()`

Automatically updates `updated_at` timestamp on row updates.

**Applied to:**
- `equipment`
- `bookings`
- `payments`
- `contracts`
- `insurance_documents`
- `users`
- `equipment_maintenance`
- `notifications`
- All other tables with `updated_at` column

### `handle_new_user()`

Automatically creates user profile in `users` table when new auth user is created.

**Trigger:** `on_auth_user_created` AFTER INSERT ON `auth.users`

---

## Foreign Key Relationships

### Booking Flow Relationships

```
auth.users (id)
  └─> bookings.customer_id (CASCADE)
      ├─> payments.booking_id (CASCADE)
      ├─> contracts.booking_id (CASCADE)
      └─> insurance_documents.booking_id (CASCADE)

equipment (id)
  └─> bookings.equipment_id (RESTRICT)
      └─> equipment_maintenance.equipment_id (CASCADE)
          └─> equipment_utilization.equipment_id (CASCADE)
```

### User Relationships

```
auth.users (id)
  └─> users.id (CASCADE)
      ├─> bookings.customer_id (CASCADE)
      ├─> notifications.user_id (CASCADE)
      ├─> audit_logs.user_id (SET NULL)
      └─> customer_communications.user_id (CASCADE)
```

### Document Relationships

```
documents (id)
  └─> document_relations.document_id (CASCADE)
```

---

## Quick Reference

### Common Queries

**Get user bookings:**
```sql
SELECT * FROM bookings WHERE customer_id = auth.uid();
```

**Get equipment availability:**
```sql
SELECT * FROM equipment WHERE status = 'available';
```

**Get booking payments:**
```sql
SELECT * FROM payments WHERE booking_id = $1;
```

**Get active bookings:**
```sql
SELECT * FROM bookings WHERE status = 'active' AND end_date > NOW();
```

---

**Remember**:
- 🔒 **RLS is enabled on all user-facing tables**
- ⚡ **All foreign keys are indexed**
- 📊 **Use specific columns, not SELECT ***
- 🛡️ **Always validate inputs server-side**
- 📝 **Audit logs track all changes**



