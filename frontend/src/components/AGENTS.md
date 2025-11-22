# Component Development (Quick Reference)

## Before Creating Component

Check: @docs/reference/COMPONENT_INDEX.md

## Real Examples from This Codebase

- **Form Component**: @frontend/src/components/EnhancedBookingFlowV2.tsx
  - Props interface (lines 105-109)
  - State management (lines 110-128)
  - Memoized calculations (lines 132-140)
  - Validation function (lines 373-426)
- **Dashboard**: @frontend/src/components/BookingManagementDashboard.tsx:18-372
  - Props interface (lines 18-34)
  - State with sessionStorage (lines 48-69)
  - Section management pattern
- **Admin Component**: @frontend/src/components/admin/HoldManagementDashboard.tsx
  - Admin-specific patterns
  - Data table patterns
  - Modal patterns

## Component Structure

Follow pattern from @frontend/src/components/EnhancedBookingFlowV2.tsx:

- Props interface at top (line 105-109)
- 'use client' for interactive components
- State management with useState/useMemo
- Validation function extracted (line 373-426)

## Validation Pattern

Use validation from @frontend/src/components/EnhancedBookingFlowV2.tsx:373-426:

- Past date check (line 380-386)
- Date comparison (line 392-397)
- Max rental period check (line 402-404)

```typescript
const validateForm = (step: number): boolean => {
  const newErrors: ValidationErrors = {};

  if (step >= 1) {
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## State Management Patterns

- Memoized calculations: @frontend/src/components/EnhancedBookingFlowV2.tsx:136-179
- useState with complex objects: @frontend/src/components/EnhancedBookingFlowV2.tsx:110-128

## Error Handling

Use error handler from: @frontend/src/lib/error-handler.ts

- `errorHandler.handleError()` for user-facing errors
- `logger.error()` for structured logging (signature: `logger.error('message', context, error)` - error LAST)

## Common Mistakes

1. Don't access process.env directly - use secrets loaders
2. Always handle errors gracefully - use @frontend/src/lib/error-handler.ts
3. Validate on both client and server
4. Use proper TypeScript types - no `any`
5. Don't forget 'use client' for interactive components
