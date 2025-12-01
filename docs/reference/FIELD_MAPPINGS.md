# Field Mapping Documentation

## Overview

This document maps frontend field names to API route field names to database column names across the Kubota Rental Platform. This helps maintain consistency and avoid confusion when working with different naming conventions.

**Last Updated**: 2025-01-22

---

## Naming Conventions

### Database Columns
- **camelCase**: Used in `users`, `bookings`, `equipment`, `contracts` tables
- **snake_case**: Used in `drivers`, `support_tickets`, `system_settings` tables
- **Mixed**: Some tables use a mix (e.g., `payments` table)

### API Route Fields
- **camelCase**: Matches database column names for consistency
- **Transformations**: Some fields require transformation (e.g., location: string → JSON)

### Frontend Fields
- **camelCase**: Matches API route fields for consistency

---

## Table: `users` (camelCase)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| firstName | firstName | firstName | string | Required |
| lastName | lastName | lastName | string | Required |
| email | email | email | string | Unique, read-only (auth) |
| phone | phone | phone | string | Optional |
| company | companyName | companyName | string | Optional |
| address | address | address | string | Optional |
| city | city | city | string | Optional |
| province | province | province | string | Optional |
| postalCode | postalCode | postalCode | string | Optional |
| avatarUrl | avatar_url | avatar_url | string | Optional, URL |

**Notes**:
- Email cannot be changed (authentication field)
- `company` in frontend maps to `companyName` in database
- `avatar_url` uses snake_case in database but camelCase in API

---

## Table: `bookings` (camelCase)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| bookingNumber | bookingNumber | bookingNumber | string | Unique |
| customerId | customerId | customerId | UUID | FK to users |
| equipmentId | equipmentId | equipmentId | UUID | FK to equipment |
| startDate | startDate | startDate | timestamp | Scheduled start |
| endDate | endDate | endDate | timestamp | Scheduled end |
| actualStartDate | actualStartDate | actualStartDate | timestamp | Actual rental start |
| actualEndDate | actualEndDate | actualEndDate | timestamp | Actual rental end |
| status | status | status | enum | bookings_status_enum |
| deliveryAddress | deliveryAddress | deliveryAddress | string | Optional |
| deliveryCity | deliveryCity | deliveryCity | string | Optional |
| deliveryProvince | deliveryProvince | deliveryProvince | string | Optional |
| deliveryPostalCode | deliveryPostalCode | deliveryPostalCode | string | Optional |
| deliveryFee | deliveryFee | deliveryFee | numeric | Optional, default 0 |
| specialInstructions | specialInstructions | specialInstructions | string | Optional |
| internalNotes | internalNotes | internalNotes | string | Optional, admin-only |
| couponCode | couponCode | couponCode | string | Optional |
| depositAmount | depositAmount | depositAmount | numeric | Optional |
| balanceAmount | balanceAmount | balance_amount | numeric | Optional (snake_case in DB) |
| balanceDueAt | balanceDueAt | balance_due_at | date | Optional (snake_case in DB) |
| billingStatus | billingStatus | billing_status | string | Optional (snake_case in DB) |
| financeNotes | financeNotes | finance_notes | string | Optional (snake_case in DB) |
| cancelledAt | cancelledAt | cancelledAt | timestamp | Optional |
| cancellationReason | cancellationReason | cancellationReason | string | Optional |

**Notes**:
- Some financial fields use snake_case in database (`balance_amount`, `balance_due_at`, `billing_status`, `finance_notes`)
- Cannot change `startDate`/`endDate` if booking is active/completed
- Use `actualStartDate`/`actualEndDate` for tracking actual rental dates

---

## Table: `equipment` (camelCase)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| unitId | unitId | unitId | string | Unique |
| serialNumber | serialNumber | serialNumber | string | Unique |
| make | make | make | string | Required |
| model | model | model | string | Required |
| year | year | year | integer | Required |
| type | type | type | string | Required |
| dailyRate | dailyRate | dailyRate | numeric | Required |
| weeklyRate | weeklyRate | weeklyRate | numeric | Required |
| monthlyRate | monthlyRate | monthlyRate | numeric | Required |
| status | status | status | string | Required |
| location | location | location | JSON | **Transformation: string → { name: string }** |
| lastMaintenanceDate | lastMaintenanceDate | lastMaintenanceDate | timestamp | Optional |
| nextMaintenanceDue | nextMaintenanceDue | nextMaintenanceDue | timestamp | Optional |
| totalEngineHours | totalEngineHours | totalEngineHours | numeric | Optional |
| description | description | description | text | Optional |
| replacementValue | replacementValue | replacementValue | numeric | Optional |
| overageHourlyRate | overageHourlyRate | overageHourlyRate | numeric | Optional |
| specifications | specifications | specifications | JSON | Optional |

**Notes**:
- `location` field: Frontend sends string, database stores JSON `{ name: "location" }`
- Transformation handled in API route: `if (typeof location === 'string') { location = { name: location } }`
- See `frontend/src/app/api/admin/equipment/[id]/route.ts:63-65`

---

## Table: `system_settings` (snake_case)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| category | category | category | string | Unique, enum |
| settings | settings | settings | JSONB | Category-specific settings |
| updatedBy | updated_by | updated_by | UUID | FK to users, nullable |
| updatedAt | updated_at | updated_at | timestamptz | Auto-updated |

**Settings Categories**:
- `general`: Site name, description, maintenance mode, etc.
- `pricing`: Base rates, multipliers, discounts, etc.
- `notifications`: Email/SMS settings, reminders, etc.
- `integrations`: Stripe, DocuSign, Google Maps API keys
- `security`: Session timeout, login attempts, 2FA, etc.

**Notes**:
- All fields use snake_case in database
- `settings` is JSONB for flexibility
- `category` has CHECK constraint: `category IN ('general', 'pricing', 'notifications', 'integrations', 'security')`

---

## Table: `payments` (mixed)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| bookingId | bookingId | bookingId | UUID | FK to bookings (camelCase) |
| amount | amount | amount | numeric | Required |
| status | status | status | enum | payments_status_enum |
| type | type | type | enum | payments_type_enum |
| method | method | method | enum | payments_method_enum |
| stripePaymentIntentId | stripePaymentIntentId | stripePaymentIntentId | string | Optional (camelCase) |
| stripeChargeId | stripeChargeId | stripeChargeId | string | Optional (camelCase) |
| processedAt | processedAt | processedAt | timestamp | Optional (camelCase) |

**Notes**:
- Mix of camelCase and snake_case naming
- Payment statuses: `pending`, `processing`, `completed`, `failed`, `cancelled`, `refunded`, `partially_refunded`

---

## Table: `contracts` (camelCase)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| bookingId | bookingId | bookingId | UUID | FK to bookings |
| contractNumber | contractNumber | contractNumber | string | Unique |
| type | type | type | enum | contracts_type_enum |
| status | status | status | enum | contracts_status_enum |
| docusignEnvelopeId | docusignEnvelopeId | docusignEnvelopeId | string | Optional |
| sentAt | sentAt | sentAt | timestamp | Optional |
| signedAt | signedAt | signedAt | timestamp | Optional |

---

## Table: `drivers` (snake_case)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| userId | user_id | user_id | UUID | FK to users, optional |
| name | name | name | string | Required |
| phone | phone | phone | string | Optional |
| licenseNumber | license_number | license_number | string | Unique, optional |
| licenseExpiry | license_expiry | license_expiry | date | Optional |
| isAvailable | is_available | is_available | boolean | Default true |
| totalDeliveriesCompleted | total_deliveries_completed | total_deliveries_completed | integer | Default 0 |

**Notes**:
- All fields use snake_case in database
- Frontend/API use camelCase, transformation required

---

## Table: `support_tickets` (snake_case)

| Frontend Field | API Route Field | Database Column | Type | Notes |
|---------------|-----------------|-----------------|------|-------|
| ticketNumber | ticket_number | ticket_number | string | Unique |
| customerId | customer_id | customer_id | UUID | FK to users |
| bookingId | booking_id | booking_id | UUID | FK to bookings, optional |
| subject | subject | subject | string | Required |
| description | description | description | text | Required |
| priority | priority | priority | string | Default 'medium' |
| status | status | status | string | Default 'open' |
| assignedTo | assigned_to | assigned_to | UUID | FK to users, optional |

**Notes**:
- All fields use snake_case in database
- Frontend/API use camelCase, transformation required

---

## Common Transformations

### 1. Location Field (Equipment)
```typescript
// Frontend sends: "Saint John, NB"
// Database stores: { name: "Saint John, NB" }

// Transformation in API route:
if (typeof validatedData.location === 'string') {
  updatePayload.location = { name: validatedData.location };
}
```

### 2. Date/Time Fields
- **Frontend**: ISO 8601 strings (e.g., `"2025-01-22T10:00:00Z"`)
- **Database**: `TIMESTAMP` or `TIMESTAMPTZ`
- **API Route**: Accepts strings, validates with Zod, stores as timestamp

### 3. Nullable Fields
- Use `.nullable().optional()` in Zod schemas
- Frontend sends `null` for empty values
- Database accepts `NULL`

### 4. Enum Fields
- Database uses enum types (e.g., `bookings_status_enum`)
- API routes validate against enum values
- Frontend uses string values matching enum

---

## Field Naming Best Practices

### When Adding New Fields

1. **Check existing table naming convention**:
   - If table uses camelCase → use camelCase
   - If table uses snake_case → use snake_case

2. **Maintain consistency within table**:
   - Don't mix naming conventions in same table
   - Follow existing pattern

3. **API Route fields**:
   - Match database column names exactly
   - No transformation needed if names match

4. **Frontend fields**:
   - Use camelCase for consistency
   - Transform in API route if database uses snake_case

---

## Quick Reference

### camelCase Tables
- `users`
- `bookings`
- `equipment`
- `contracts`

### snake_case Tables
- `drivers`
- `support_tickets`
- `system_settings`
- `equipment_maintenance`

### Mixed Naming Tables
- `payments` (mostly camelCase, some snake_case)

---

**Last Updated**: 2025-01-22
**Maintained By**: Development Team


