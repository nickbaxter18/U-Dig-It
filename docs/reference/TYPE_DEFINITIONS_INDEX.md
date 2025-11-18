# Type Definitions Index

**Purpose**: Quick reference for key TypeScript types, interfaces, and enums used throughout the application.

**Last Updated**: 2025-01-21

---

## 📚 Table of Contents

- [Database Types](#database-types)
- [Booking Types](#booking-types)
- [Payment Types](#payment-types)
- [User Types](#user-types)
- [Equipment Types](#equipment-types)
- [API Types](#api-types)
- [Dashboard Types](#dashboard-types)
- [Validation Types](#validation-types)
- [Error Types](#error-types)

---

## Database Types

### `Database`
**Location**: `supabase/types.ts`

Main database type definition from Supabase schema.

```typescript
import { Database } from '@/../../supabase/types';

const supabase = createClient<Database>();
```

**Usage:**
- Type-safe Supabase client
- Autocomplete for table names and columns
- Type checking for queries

---

### `Tables<'table_name'>`
**Location**: `supabase/types.ts`

Get table row type.

```typescript
import { Tables } from '@/../../supabase/types';

type Booking = Tables<'bookings'>;
type Equipment = Tables<'equipment'>;
type User = Tables<'users'>;
```

---

### Database Enums

**Booking Status:**
```typescript
type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'insurance_verified'
  | 'ready_for_pickup'
  | 'delivered'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'no_show'
  | 'verify_hold_ok'
  | 'deposit_scheduled'
  | 'hold_placed'
  | 'returned_ok'
  | 'captured';
```

**Payment Status:**
```typescript
type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';
```

**User Role:**
```typescript
type UserRole = 'customer' | 'admin' | 'super_admin';
```

**User Status:**
```typescript
type UserStatus = 'active' | 'inactive' | 'suspended';
```

**Equipment Status:**
```typescript
type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'retired';
```

**Contract Status:**
```typescript
type ContractStatus =
  | 'draft'
  | 'sent_for_signature'
  | 'signed'
  | 'declined'
  | 'voided'
  | 'expired'
  | 'delivered'
  | 'completed';
```

---

## Booking Types

### `Booking`
**Location**: `lib/api-client.ts`

```typescript
interface Booking {
  id: string;
  bookingNumber: string;
  equipmentId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

### `BookingPricingInput`
**Location**: `lib/booking/pricing.ts`

```typescript
interface BookingPricingInput {
  equipment: {
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    overageHourlyRate?: number;
    dailyHourAllowance?: number;
    weeklyHourAllowance?: number;
  };
  startDate: Date | string;
  endDate: Date | string;
  delivery?: {
    city?: string | null;
    distanceKm?: number | null;
  };
  includeInsurance?: boolean;
  includeOperator?: boolean;
  coupon?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}
```

---

### `BookingPricingResult`
**Location**: `lib/booking/pricing.ts`

```typescript
interface BookingPricingResult {
  days: number;
  rentalCost: number;
  discount: number;
  insuranceFee: number;
  operatorFee: number;
  deliveryFee: number;
  couponDiscount: number;
  subtotal: number;
  taxes: number;
  total: number;
  deposit: number;
  breakdown: BookingPricingBreakdownItem[];
}

interface BookingPricingBreakdownItem {
  item: string;
  amount: number;
}
```

---

### `BookingResult`
**Location**: `app/book/actions.ts`

```typescript
interface BookingResult {
  success: boolean;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number;
  };
  error?: string;
}
```

---

## Payment Types

### `Payment`
**Location**: Database types

```typescript
type Payment = Tables<'payments'>;

// Includes:
// - id: UUID
// - booking_id: UUID
// - amount: DECIMAL(10,2)
// - currency: VARCHAR(3)
// - status: PaymentStatus
// - payment_method: VARCHAR(50)
// - stripe_payment_intent_id: VARCHAR(100)
// - stripe_charge_id: VARCHAR(100)
// - description: TEXT
// - metadata: JSONB
// - created_at: TIMESTAMPTZ
// - updated_at: TIMESTAMPTZ
```

---

## User Types

### `User`
**Location**: `lib/api-client.ts`

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: 'customer' | 'admin' | 'operator';
}
```

---

### `User` (Database)
**Location**: `lib/supabase/auth.ts`

```typescript
import { Tables } from '@/../../supabase/types';

type User = Tables<'users'>;
```

---

## Equipment Types

### `Equipment`
**Location**: Database types

```typescript
type Equipment = Tables<'equipment'>;

// Includes:
// - id: UUID
// - unit_id: VARCHAR(50)
// - serial_number: VARCHAR(100)
// - type: VARCHAR(50)
// - model: VARCHAR(100)
// - year: INTEGER
// - make: VARCHAR(100)
// - description: TEXT
// - replacement_value: DECIMAL(10,2)
// - daily_rate: DECIMAL(10,2)
// - weekly_rate: DECIMAL(10,2)
// - monthly_rate: DECIMAL(10,2)
// - overage_hourly_rate: DECIMAL(10,2)
// - daily_hour_allowance: INTEGER
// - weekly_hour_allowance: INTEGER
// - specifications: JSONB
// - status: EquipmentStatus
// - notes: TEXT
// - attachments: JSONB
// - total_engine_hours: INTEGER
// - location: JSONB
// - images: JSONB
// - documents: JSONB
// - created_at: TIMESTAMPTZ
// - updated_at: TIMESTAMPTZ
```

---

## API Types

### `ApiResponse<T>`
**Location**: `lib/api-client.ts`

```typescript
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}
```

---

### `PaginatedResponse<T>`
**Location**: `lib/api-client.ts`

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Dashboard Types

### `DashboardSummary`
**Location**: `types/dashboard.ts`

```typescript
interface DashboardSummary {
  totalBookings: number;
  totalRevenue: number;
  activeEquipment: number;
  totalCustomers: number;
  bookingsGrowth: number | null;
  revenueGrowth: number | null;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  equipmentUtilization: number;
  snapshotDate: string | null;
  lastGeneratedAt: string | null;
}
```

---

### `RevenueChartPoint`
**Location**: `types/dashboard.ts`

```typescript
interface RevenueChartPoint {
  date: string;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  paymentsCount: number;
}
```

---

### `BookingChartPoint`
**Location**: `types/dashboard.ts`

```typescript
interface BookingChartPoint {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
  active: number;
}
```

---

### `DateRangeKey`
**Location**: `types/dashboard.ts`

```typescript
type DateRangeKey = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
```

---

### `DashboardOverviewResponse`
**Location**: `types/dashboard.ts`

```typescript
interface DashboardOverviewResponse {
  summary: DashboardSummary;
  charts?: unknown;
  chartsV2?: DashboardChartsPayload;
  metadata?: DashboardMetadata;
  alerts?: {
    active: unknown[];
    candidates: unknown[];
  };
}
```

---

## Validation Types

### `ValidationResult`
**Location**: `lib/validation.ts`

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
```

---

### `PasswordStrength`
**Location**: `lib/validators/password.ts`

```typescript
interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}
```

---

### `PasswordValidation`
**Location**: `lib/validators/password.ts`

```typescript
interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
}
```

---

## Error Types

### `AppError`
**Location**: `lib/error-handler.ts`

```typescript
interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  timestamp: string;
  requestId?: string;
}
```

---

### `SupabaseError`
**Location**: `lib/supabase/error-handler.ts`

```typescript
class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  );
}
```

---

### `ERROR_CODES`
**Location**: `lib/error-handler.ts`

```typescript
const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Business logic errors
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  EQUIPMENT_NOT_AVAILABLE: 'EQUIPMENT_NOT_AVAILABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Client errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
```

---

## Contract Types

### `ContractData`
**Location**: `lib/contract-pdf-template.ts`

```typescript
interface ContractData {
  // Contract Info
  contractNumber: string;
  bookingNumber: string;
  createdAt: string;
  signedAt: string;

  // Customer Info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  customerLicense?: string;

  // Equipment Info
  equipmentModel: string;
  equipmentSerial: string;
  equipmentHours: number;
  attachments: string[];
  equipmentWeight?: string;
  equipmentCapacity?: string;

  // Rental Details
  startDate: string;
  endDate: string;
  rentalDays: number;
  deliveryAddress: string;
  deliveryTime?: string;
  specialInstructions?: string;

  // Financial
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
  deliveryFee: number;

  // Insurance
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceCoverage?: string;

  // Timeline
  bookingCreatedAt?: string;
  bookingConfirmedAt?: string;

  // Signature
  signatureImage: string;
  signerTypedName: string;
  signerInitials: string;
  signedDate: string;
  signedTime: string;
}
```

---

## Logging Types

### `LogContext`
**Location**: `lib/logger.ts`

```typescript
interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}
```

---

### `LogEntry`
**Location**: `lib/logger.ts`

```typescript
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  performance?: {
    duration?: number;
    memoryUsage?: NodeJS.MemoryUsage;
  };
}
```

---

### `LogLevel`
**Location**: `lib/logger.ts`

```typescript
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}
```

---

## Rate Limiting Types

### `RateLimitConfig`
**Location**: `lib/rate-limiter.ts`

```typescript
type RateLimitConfig = {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  uniqueTokenPerInterval: number; // Max unique tokens tracked
  skipAdmins?: boolean; // Whether to skip rate limiting for admin users
};
```

---

### `RateLimitResult`
**Location**: `lib/rate-limiter.ts`

```typescript
type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
};
```

---

## Quick Reference

### Common Type Imports

```typescript
// Database types
import { Database, Tables } from '@/../../supabase/types';

// Booking types
import { BookingPricingInput, BookingPricingResult } from '@/lib/booking/pricing';

// API types
import { ApiResponse, PaginatedResponse } from '@/lib/api-client';

// Validation types
import { ValidationResult } from '@/lib/validation';

// Error types
import { AppError, ERROR_CODES } from '@/lib/error-handler';

// Dashboard types
import { DashboardSummary, DateRangeKey } from '@/types/dashboard';
```

### Type Guards

```typescript
// Check if response is successful
function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.success === true && response.data !== undefined;
}

// Check if user is admin
function isAdmin(user: User): user is User & { role: 'admin' | 'super_admin' } {
  return user.role === 'admin' || user.role === 'super_admin';
}
```

---

**Remember**:
- 📝 **Use Database types from Supabase**
- ✅ **Validate types at runtime**
- 🔒 **Type-safe API responses**
- 📊 **Type-safe database queries**
- 🛡️ **Type guards for runtime checks**



