# Next.js Server Actions Pattern

## Overview

Server Actions are the recommended approach for form submissions in Next.js 16. They provide:
- Progressive enhancement (works without JavaScript)
- Reduced HTTP overhead
- Better error handling
- Automatic revalidation

## When to Use Server Actions vs API Routes

### Use Server Actions For:
- ✅ Authenticated form submissions
- ✅ Mutations (create, update, delete)
- ✅ Form submissions that don't need to be public APIs
- ✅ Actions that benefit from progressive enhancement

### Keep API Routes For:
- ✅ Public endpoints (no authentication)
- ✅ Webhooks (external services calling your API)
- ✅ Third-party integrations
- ✅ Complex integrations requiring custom headers/authentication

## Current Implementation

### Already Using Server Actions:
- `frontend/src/app/book/actions-v2.ts` - Booking creation (✅ Good example)

### Candidates for Conversion:
1. **Contact Form** (`/api/contact`) - Currently public, could stay as API route
2. **Lead Capture** (`/api/leads`) - Currently public, could stay as API route
3. **Admin Form Submissions** - Should convert to Server Actions

## Pattern Example

**Server Action** (`actions.ts`):
```typescript
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function submitForm(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const validated = schema.parse(rawData);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('table')
    .insert(validated)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/path');
  return { success: true, data };
}
```

**Client Component** (`page.tsx`):
```typescript
'use client';

import { submitForm } from './actions';
import { useFormState } from 'react-dom';

export default function FormPage() {
  const [state, formAction] = useFormState(submitForm, null);

  return (
    <form action={formAction}>
      {/* Form fields */}
    </form>
  );
}
```

## Benefits

- **Progressive Enhancement**: Forms work without JavaScript
- **Better Performance**: No extra HTTP round trip
- **Automatic Revalidation**: Use `revalidatePath` and `revalidateTag`
- **Type Safety**: Full TypeScript support
- **Error Handling**: Better error boundaries

## Migration Strategy

1. Identify authenticated form submissions
2. Convert to Server Actions one at a time
3. Test thoroughly
4. Keep API routes for public endpoints and webhooks






