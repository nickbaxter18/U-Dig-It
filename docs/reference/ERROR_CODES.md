# Error Codes Reference

**Purpose**: Standardized error codes and user-friendly error messages used throughout the application.

**Last Updated**: 2025-01-21

---

## 📚 Table of Contents

- [Application Error Codes](#application-error-codes)
- [Supabase Error Codes](#supabase-error-codes)
- [HTTP Status Code Mapping](#http-status-code-mapping)
- [Error Handling Patterns](#error-handling-patterns)
- [User-Friendly Messages](#user-friendly-messages)

---

## Application Error Codes

### Network Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `NETWORK_ERROR` | "Network connection failed. Please check your internet connection and try again." | Connection refused, DNS failure |
| `TIMEOUT_ERROR` | "Request timed out. Please try again." | Request timeout exceeded |
| `CONNECTION_ERROR` | "Unable to connect to server. Please try again later." | Connection errors |

---

### Authentication Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `UNAUTHORIZED` | "Please log in to continue." | User not authenticated (401) |
| `FORBIDDEN` | "You do not have permission to perform this action." | User lacks permissions (403) |
| `TOKEN_EXPIRED` | "Your session has expired. Please log in again." | Auth token expired |

---

### Validation Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `VALIDATION_ERROR` | "Please check your input and try again." | Input validation failed (400) |
| `INVALID_INPUT` | "Invalid input provided. Please review and try again." | Invalid data format |

---

### Business Logic Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `BOOKING_NOT_FOUND` | "Booking not found." | Booking doesn't exist (404) |
| `EQUIPMENT_NOT_AVAILABLE` | "Equipment is not available for the selected dates." | Equipment unavailable |
| `PAYMENT_FAILED` | "Payment failed. Please try again or contact support." | Payment processing failed |

---

### Server Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `INTERNAL_SERVER_ERROR` | "Something went wrong on our end. Please try again later." | Server error (500) |
| `SERVICE_UNAVAILABLE` | "Service is temporarily unavailable. Please try again later." | Service down (503) |
| `RATE_LIMIT_EXCEEDED` | "Too many requests. Please wait a moment and try again." | Rate limit exceeded (429) |

---

### Client Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `UNKNOWN_ERROR` | "An unexpected error occurred. Please try again." | Unknown/unhandled error |

---

## Supabase Error Codes

### Database Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `PGRST116` | "No data found." | Query returned no results |
| `PGRST301` | "Access denied." | RLS policy blocked access |
| `23505` | "This item already exists." | Unique constraint violation |
| `23503` | "Cannot complete action due to related data." | Foreign key violation |
| `23502` | "Required field is missing." | NOT NULL constraint violation |

---

### Authentication Errors

| Code | Message | When to Use |
|------|---------|-------------|
| `auth/invalid-credentials` | "Invalid email or password. Please check your credentials and try again." | Wrong email/password |
| `auth/user-not-found` | "No account found with this email address." | User doesn't exist |
| `auth/weak-password` | "Password must be at least 6 characters long." | Password too weak |
| `auth/email-already-registered` | "An account with this email already exists." | Email already in use |
| `auth/invalid-email` | "Please enter a valid email address." | Invalid email format |
| `auth/too-many-requests` | "Too many login attempts. Please try again later." | Rate limited |

---

## HTTP Status Code Mapping

### Client Errors (4xx)

| Status | Error Code | Message |
|--------|------------|---------|
| 400 | `VALIDATION_ERROR` | "Please check your input and try again." |
| 401 | `UNAUTHORIZED` | "Please log in to continue." |
| 403 | `FORBIDDEN` | "You do not have permission to perform this action." |
| 404 | `BOOKING_NOT_FOUND` | "Resource not found." |
| 429 | `RATE_LIMIT_EXCEEDED` | "Too many requests. Please wait a moment and try again." |

### Server Errors (5xx)

| Status | Error Code | Message |
|--------|------------|---------|
| 500 | `INTERNAL_SERVER_ERROR` | "Something went wrong on our end. Please try again later." |
| 503 | `SERVICE_UNAVAILABLE` | "Service is temporarily unavailable. Please try again later." |

---

## Error Handling Patterns

### API Route Error Handling

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { ERROR_CODES } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    // Process request...
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // Handle specific errors
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.BOOKING_NOT_FOUND,
          message: 'Booking not found.',
        },
        { status: 404 }
      );
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Please check your input and try again.',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle unknown errors
    logger.error('Unexpected error', { error }, error);
    return NextResponse.json(
      {
        success: false,
        error: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong on our end. Please try again later.',
      },
      { status: 500 }
    );
  }
}
```

---

### Supabase Error Handling

```typescript
import { handleSupabaseError, getErrorMessage } from '@/lib/supabase/error-handler';

try {
  const { data, error } = await supabase.from('bookings').insert(bookingData);

  if (error) {
    const supabaseError = handleSupabaseError(error);
    const userMessage = getErrorMessage(supabaseError);

    // Show user-friendly message
    toast.error(userMessage);
    return;
  }
} catch (error) {
  // Handle unexpected errors
  logger.error('Database error', { error }, error);
}
```

---

### Client-Side Error Handling

```typescript
import { ERROR_CODES } from '@/lib/error-handler';

async function createBooking(data: BookingFormData) {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      // Handle application errors
      switch (result.error) {
        case ERROR_CODES.VALIDATION_ERROR:
          setErrors(result.details);
          break;
        case ERROR_CODES.EQUIPMENT_NOT_AVAILABLE:
          toast.error('Equipment is not available for these dates.');
          break;
        default:
          toast.error(result.message || 'An error occurred.');
      }
      return;
    }

    // Success
    toast.success('Booking created successfully!');
  } catch (error) {
    // Handle network errors
    if (error.code === 'ECONNREFUSED') {
      toast.error('Unable to connect to server. Please try again later.');
    } else {
      toast.error('An unexpected error occurred. Please try again.');
    }
  }
}
```

---

## User-Friendly Messages

### Error Message Guidelines

1. **Be Specific**: Tell users what went wrong
2. **Be Actionable**: Tell users what they can do
3. **Be Friendly**: Use conversational tone
4. **Avoid Technical Jargon**: Don't expose internal details
5. **Provide Context**: Include relevant information

### Good Error Messages

✅ **Good:**
- "Equipment is not available for the selected dates. Please choose different dates."
- "Payment failed. Please check your card details and try again."
- "Your session has expired. Please log in again to continue."

❌ **Bad:**
- "Error 500"
- "Database constraint violation"
- "PGRST301: Access denied"

---

### Error Message Mapping

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]:
    'Network connection failed. Please check your internet connection and try again.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ERROR_CODES.UNAUTHORIZED]: 'Please log in to continue.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.BOOKING_NOT_FOUND]: 'Booking not found.',
  [ERROR_CODES.EQUIPMENT_NOT_AVAILABLE]:
    'Equipment is not available for the selected dates.',
  [ERROR_CODES.PAYMENT_FAILED]:
    'Payment failed. Please try again or contact support.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]:
    'Something went wrong on our end. Please try again later.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]:
    'Service is temporarily unavailable. Please try again later.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]:
    'Too many requests. Please wait a moment and try again.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};
```

---

## Error Logging

### Structured Error Logging

```typescript
import { logger } from '@/lib/logger';

try {
  // Operation...
} catch (error) {
  logger.error('Operation failed', {
    component: 'module-name',
    action: 'action-name',
    metadata: {
      userId: user.id,
      bookingId: booking.id,
      errorCode: error.code,
    },
  }, error);
}
```

### Error Context

Always include:
- **Component**: Where the error occurred
- **Action**: What action was being performed
- **Metadata**: Relevant context (user ID, booking ID, etc.)
- **Error Object**: Original error for stack trace

---

## Quick Reference

### Common Error Scenarios

**Booking Not Found:**
```typescript
return NextResponse.json(
  {
    success: false,
    error: ERROR_CODES.BOOKING_NOT_FOUND,
    message: 'Booking not found.',
  },
  { status: 404 }
);
```

**Validation Error:**
```typescript
return NextResponse.json(
  {
    success: false,
    error: ERROR_CODES.VALIDATION_ERROR,
    message: 'Please check your input and try again.',
    details: validationErrors,
  },
  { status: 400 }
);
```

**Rate Limit Exceeded:**
```typescript
return NextResponse.json(
  {
    success: false,
    error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: 'Too many requests. Please wait a moment and try again.',
    retryAfter: 60,
  },
  { status: 429 }
);
```

---

**Remember**:
- 🛡️ **Always use error codes, not raw messages**
- 📝 **Log errors with context**
- 👤 **Show user-friendly messages**
- 🔒 **Don't expose internal details**
- ✅ **Handle errors gracefully**



