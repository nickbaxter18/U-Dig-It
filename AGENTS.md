# Agent Instructions - Quick Reference

This is a simple markdown file for defining agent instructions. See [Cursor Rules Documentation](https://cursor.com/docs/context/rules) for details.

## Before Starting Any Task

1. **Check Reference Files**
   - @docs/reference/AI_CODING_REFERENCE.md - Main coding patterns
   - @docs/reference/COMPONENT_INDEX.md - Existing components
   - @docs/reference/API_ROUTES_INDEX.md - API endpoints
   - @docs/reference/QUICK_COMMANDS.md - Command reference

2. **Review Patterns**
   - Use @filename references to see actual codebase implementations
   - Follow patterns from YOUR codebase, not generic examples

## API Route Development

**Reference**: @frontend/src/app/api/bookings/route.ts:72-297

Follow the 8-step pattern:
1. Rate limit FIRST: @frontend/src/lib/rate-limiter.ts
2. Validate request: @frontend/src/lib/request-validator.ts
3. Authenticate: @frontend/src/lib/supabase/server.ts
4. Sanitize input: @frontend/src/lib/input-sanitizer.ts
5. Validate with Zod
6. Process business logic
7. Log with structured logger: @frontend/src/lib/logger.ts
8. Return JSON response

See @frontend/src/app/api/AGENTS.md for complete details.

## Component Development

**Reference**: @frontend/src/components/EnhancedBookingFlowV2.tsx

Follow component structure:
- Props interface at top (line 105-109)
- State management (line 110-128)
- Memoized calculations (line 136-179)
- Validation function (line 373-426)

See @frontend/src/components/AGENTS.md for complete details.

## Database Operations

**ALWAYS use Supabase MCP tools**, never modify `/backend` directory (legacy).

- Schema queries: `mcp_supabase_list_tables({ schemas: ['public'] })`
- Data queries: `mcp_supabase_execute_sql({ query: 'SELECT ...' })`
- Schema changes: `mcp_supabase_apply_migration({ name: '...', query: '...' })`

See @supabase/AGENTS.md for complete details.

## Common Patterns

### Error Handling
Use structured logger: @frontend/src/lib/logger.ts
**IMPORTANT**: Error signature is `logger.error('message', context, error)` - error LAST

See example: @frontend/src/app/api/bookings/route.ts:268-276

### Secrets Management
**NEVER access `process.env` directly** - always use secrets loader functions:
- Email: `getSendGridApiKey()` from @frontend/src/lib/secrets/email.ts
- Stripe: `getStripeSecretKey()` from @frontend/src/lib/stripe/config.ts

### Webhook Service Client
For webhooks, use service client (bypasses RLS):
```typescript
import { createServiceClient } from '@/lib/supabase/service';
const supabase = createServiceClient();
```
- ✅ Correct examples:
  - IDKit webhook: @frontend/src/app/api/webhooks/idkit/route.ts:79
  - SendGrid webhook: @frontend/src/app/api/webhooks/sendgrid/route.ts:19
- ⚠️ Should update: Stripe webhook: @frontend/src/app/api/webhooks/stripe/route.ts:168
- Pattern: @frontend/src/lib/supabase/service.ts

### Supabase Queries
Always use specific columns and pagination:
```typescript
.select('id, bookingNumber, status, totalAmount')
.range(0, 19)
.limit(20)
```

See example: @frontend/src/app/api/bookings/route.ts:147-153

## Directory-Specific Instructions

- **API Routes**: @frontend/src/app/api/AGENTS.md
  - Nested rules: @frontend/src/app/api/.cursor/rules/api-route-patterns.mdc
  - Workflow: @.cursor/rules/workflows/api-route-development.mdc
- **Components**: @frontend/src/components/AGENTS.md
  - Nested rules: @frontend/src/components/.cursor/rules/component-patterns.mdc
  - Workflow: @.cursor/rules/workflows/component-development.mdc
- **Utilities**: @frontend/src/lib/AGENTS.md
- **Database**: @supabase/AGENTS.md
  - Workflow: @.cursor/rules/workflows/database-migration.mdc

## Quick Commands

See @docs/reference/QUICK_COMMANDS.md for complete command reference.

---

**Remember**: Always reference actual codebase patterns using @filename syntax. These are real patterns from THIS codebase, not generic examples.

