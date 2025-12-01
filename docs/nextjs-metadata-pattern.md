# Next.js Metadata Generation Pattern

## Overview

This document describes the pattern for adding `generateMetadata` to dynamic pages in the Next.js application.

## Pattern: Server Component Wrapper

For pages that are currently Client Components but need metadata generation, use a Server Component wrapper pattern:

### Structure

```
app/
  bookings/
    [id]/
      page.tsx          # Server Component (wrapper)
      BookingClient.tsx # Client Component (existing logic)
```

### Example Implementation

**Server Component Wrapper** (`page.tsx`):
```typescript
import type { Metadata } from 'next';
import { generateBookingMetadata } from '@/lib/bookings/metadata';
import BookingClient from './BookingClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return generateBookingMetadata(params.id, { isAdmin: false });
}

export default async function BookingPage({ params }: { params: { id: string } }) {
  // Optionally fetch initial data server-side
  // Pass to client component as props
  return <BookingClient bookingId={params.id} />;
}
```

**Client Component** (`BookingClient.tsx`):
```typescript
'use client';

export default function BookingClient({ bookingId }: { bookingId: string }) {
  // Existing client-side logic
  // Can still fetch data client-side for real-time updates
}
```

## Helper Function

The `generateBookingMetadata` helper is available at:
- `frontend/src/lib/bookings/metadata.ts`

It provides:
- Cached booking data fetching
- SEO-optimized metadata generation
- Support for both admin and user pages

## Pages to Update

1. `frontend/src/app/dashboard/bookings/[id]/page.tsx` - User booking detail
2. `frontend/src/app/admin/bookings/[id]/page.tsx` - Admin booking detail
3. `frontend/src/app/bookings/[id]/page.tsx` - Public booking detail (if applicable)

## Benefits

- Better SEO for dynamic pages
- Improved social media sharing (Open Graph tags)
- Faster initial page loads (server-side metadata)
- Progressive enhancement (client interactivity preserved)






