# Phase 3 Blueprint – API Contracts & Validation

_Date: 2025-11-11_

## Principles
- All admin API routes return `{ data, error, meta }` JSON envelope.
- Use Zod schemas for request validation and response typing.
- Standard error structure: `{ error: { code, message, details? } }` with HTTP status codes.

## 1. Dashboard & Analytics
### GET `/api/admin/dashboard`
```ts
const DashboardQuerySchema = z.object({
  range: z.enum(['today','week','month','quarter','year']).default('month'),
  filters: z.object({ segmentId: z.string().uuid().optional(), equipmentId: z.string().uuid().optional() }).partial().optional()
});

const DashboardResponseSchema = z.object({
  data: z.object({
    kpis: z.object({ totalBookings: z.number(), totalRevenue: z.number(), equipmentUtilization: z.number(), activeCustomers: z.number(), alerts: z.array(z.object({
      id: z.string().uuid(),
      type: z.string(),
      severity: z.enum(['info','warning','critical']),
      summary: z.string(),
      detectedAt: z.string().datetime()
    })) }),
    trends: z.object({ revenue: z.array(z.object({ date: z.string(), value: z.number() })), bookings: z.array(z.object({ date: z.string(), completed: z.number(), cancelled: z.number() })) }),
    lastRefreshedAt: z.object({ kpis: z.string().datetime(), revenue: z.string().datetime() })
  }),
  meta: z.object({ range: z.string(), filters: z.unknown() }).optional(),
  error: z.null()
});
```

### POST `/api/admin/dashboard/alerts/:id/ack`
```ts
const AlertAckSchema = z.object({ note: z.string().max(500).optional() });
const AlertAckResponseSchema = z.object({ data: z.object({ acknowledgedAt: z.string().datetime(), acknowledgedBy: z.string().uuid() }), error: z.null() });
```

## 2. Bookings & Logistics
### POST `/api/admin/bookings/wizard/start`
```ts
const WizardStartSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerDraft: z.object({ firstName: z.string(), lastName: z.string(), email: z.string().email(), phone: z.string().optional() }).optional(),
  equipmentId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
}).refine(data => data.customerId || data.customerDraft, { message: 'Provide customerId or customerDraft' });

const WizardStartResponseSchema = z.object({ data: z.object({ sessionId: z.string().uuid(), expiresAt: z.string().datetime() }), error: z.null() });
```

### POST `/api/admin/bookings/bulk-actions`
```ts
const BulkActionSchema = z.object({
  action: z.enum(['status_update','send_email','export','assign_driver']),
  filters: z.object({ status: z.array(z.string()).optional(), dateRange: z.object({ from: z.string().datetime(), to: z.string().datetime() }).optional(), customerSegmentId: z.string().uuid().optional() }),
  payload: z.object({
    status: z.string().optional(),
    emailTemplateId: z.string().uuid().optional(),
    driverId: z.string().uuid().optional()
  }).passthrough()
});

const BulkActionResponseSchema = z.object({ data: z.object({ operationId: z.string().uuid(), status: z.enum(['queued']) }), error: z.null() });
```

## 3. Equipment & Maintenance
### POST `/api/admin/equipment/:id/media`
```ts
const MediaCreateSchema = z.object({
  mediaType: z.enum(['image','video','document']),
  fileName: z.string().max(255),
  contentType: z.string(),
  caption: z.string().max(200).optional(),
  metadata: z.record(z.any()).optional()
});

const MediaCreateResponseSchema = z.object({
  data: z.object({ uploadUrl: z.string().url(), mediaId: z.string().uuid(), headers: z.record(z.string()) }),
  error: z.null()
});
```

## 4. Customers & Communications
### POST `/api/admin/customers/segments`
```ts
const SegmentCreateSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(200).optional(),
  filter: z.object({
    conditions: z.array(z.object({
      field: z.enum(['location','bookingCount','lastBooking','totalSpend','equipmentCategory','tag','riskScore']),
      operator: z.enum(['eq','ne','gt','lt','between','in']),
      value: z.any()
    })),
    logic: z.enum(['and','or']).default('and')
  })
});

const SegmentResponseSchema = z.object({ data: z.object({ segmentId: z.string().uuid(), name: z.string(), createdAt: z.string().datetime() }), error: z.null() });
```

### POST `/api/admin/communications/bulk-message`
```ts
const BulkMessageSchema = z.object({
  channel: z.enum(['email','sms','push']),
  templateId: z.string().uuid(),
  segmentId: z.string().uuid().optional(),
  customerIds: z.array(z.string().uuid()).optional(),
  scheduleAt: z.string().datetime().optional(),
  overrides: z.record(z.any()).optional()
}).refine(data => data.segmentId || (data.customerIds && data.customerIds.length > 0), { message: 'Provide segmentId or customerIds' });
```

## 5. Payments & Finance
### POST `/api/admin/payments/manual`
```ts
const ManualPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('CAD'),
  method: z.enum(['cash','ach','check','pos','other']),
  receivedAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
  attachments: z.array(z.object({ fileName: z.string(), storagePath: z.string() })).optional()
});
```

### PATCH `/api/admin/installments/:id/status`
```ts
const InstallmentStatusSchema = z.object({
  status: z.enum(['paid','overdue','cancelled']),
  paymentId: z.string().uuid().optional(),
  paidAt: z.string().datetime().optional()
});
```

## 6. Support & Insurance
### POST `/api/admin/support/tickets/:id/messages`
```ts
const SupportMessageSchema = z.object({
  message: z.string().min(1),
  internal: z.boolean().default(false),
  attachments: z.array(z.object({ fileName: z.string(), storagePath: z.string(), contentType: z.string() })).optional(),
  templateId: z.string().uuid().optional()
});
```

### POST `/api/admin/insurance/:id/request-info`
```ts
const InsuranceRequestSchema = z.object({
  requestedFields: z.array(z.string()),
  message: z.string().max(500).optional(),
  deadline: z.string().datetime().optional()
});
```

## 7. Promotions & Contracts
### POST `/api/admin/promotions/rules`
```ts
const PromotionRuleSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(200).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  priority: z.number().int().positive().default(100),
  stackable: z.boolean().default(false),
  discount: z.object({ type: z.enum(['percentage','fixed']), value: z.number().positive() }),
  conditions: z.array(z.object({
    field: z.enum(['equipmentCategory','customerSegment','bookingValue','duration','season','custom']),
    operator: z.enum(['eq','ne','gt','lt','between','in']),
    value: z.any()
  })),
  actions: z.array(z.object({ actionType: z.enum(['discount','free_delivery','bonus_points']), parameters: z.record(z.any()) })).nonempty()
});
```

### POST `/api/admin/contracts/templates`
```ts
const ContractTemplateSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().max(255).optional(),
  content: z.string(),
  placeholders: z.array(z.object({ key: z.string(), label: z.string(), type: z.enum(['text','date','number','select']), required: z.boolean().default(true) })).optional()
});
```

## 8. Audit & Security
### POST `/api/admin/security/secrets`
```ts
const SecretCreateSchema = z.object({
  key: z.string().regex(/^[a-z0-9_\.\-]+$/),
  value: z.string().min(1),
  description: z.string().max(200).optional(),
  validate: z.boolean().default(false)
});

const SecretResponseSchema = z.object({ data: z.object({ key: z.string(), createdAt: z.string().datetime(), maskedValue: z.string() }), error: z.null() });
```

### POST `/api/admin/settings/change-request`
```ts
const SettingsChangeSchema = z.object({
  category: z.enum(['stripe','sendgrid','docusign','maps','system','security']),
  payload: z.record(z.any()),
  comment: z.string().max(500).optional()
});
```

## 9. Common Response Schema
Create utility schema in codebase:
```ts
const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  data: dataSchema,
  error: z.null()
}).or(z.object({
  data: z.null(),
  error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() })
}));
```

## 10. Documentation & Tooling
- Generate TypeScript types using Zod inference to ensure frontend alignment.
- Use middleware to validate requests and attach parsed payload to `req` object.
- Document endpoints in API reference (OpenAPI docs optional).
- Add automated tests for schema validation using sample payload fixtures.

---
Prepared by: GPT-5 Codex.
