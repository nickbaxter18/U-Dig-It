import { z } from 'zod';

const isoDateString = () =>
  z
    .string()
    .min(1)
    .transform((value, ctx) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid date value',
        });
        return z.NEVER;
      }
      return date.toISOString();
    });

const addressSchema = z.object({
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().optional(),
});

export const bookingWizardStatusEnum = z.enum([
  'draft',
  'in_progress',
  'ready_to_commit',
  'completed',
  'expired',
  'abandoned',
]);

export const bookingWizardStartSchema = z.object({
  customerId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  startDate: isoDateString(),
  endDate: isoDateString(),
  deliveryAddress: addressSchema.optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const bookingWizardUpdateSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
  status: bookingWizardStatusEnum.optional(),
  expiresAt: isoDateString().optional(),
});

export const pricingBreakdownSchema = z.object({
  subtotal: z.number().nonnegative().optional(),
  taxes: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  items: z
    .array(
      z.object({
        label: z.string(),
        amount: z.number(),
        type: z.string().optional(),
      })
    )
    .optional(),
});

export const logisticsTaskInputSchema = z.object({
  taskType: z.enum(['delivery', 'pickup', 'transfer']),
  scheduledAt: isoDateString(),
  address: addressSchema
    .extend({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  driverId: z.string().uuid().optional(),
  routeUrl: z.string().url().optional(),
  etaMinutes: z.number().int().positive().optional(),
  specialInstructions: z.string().optional(),
  notes: z.string().optional(),
});

export const bookingWizardBookingSchema = z.object({
  customerId: z.string().uuid(),
  equipmentId: z.string().uuid(),
  startDate: isoDateString(),
  endDate: isoDateString(),
  status: z
    .enum([
      'pending',
      'confirmed',
      'paid',
      'insurance_verified',
      'ready_for_pickup',
      'delivered',
      'in_progress',
      'completed',
      'cancelled',
      'rejected',
      'no_show',
      'verify_hold_ok',
      'deposit_scheduled',
      'hold_placed',
      'returned_ok',
      'captured',
    ])
    .default('pending'),
  subtotal: z.number().nonnegative().optional(),
  taxes: z.number().nonnegative().optional(),
  totalAmount: z.number().nonnegative(),
  deliveryAddress: addressSchema.optional(),
  deliveryInstructions: z.string().optional(),
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
  couponCode: z.string().optional(),
});

export const bookingWizardCommitSchema = z.object({
  booking: bookingWizardBookingSchema,
  overrideTotals: z
    .object({
      subtotal: z.number().optional(),
      taxes: z.number().optional(),
      totalAmount: z.number().optional(),
    })
    .optional(),
  pricing: pricingBreakdownSchema.optional(),
  notes: z.array(
    z.object({
      note: z.string().min(1),
      visibility: z.enum(['internal', 'customer', 'partner']).default('internal'),
    })
  ).optional(),
  logisticsTasks: z.array(logisticsTaskInputSchema).optional(),
  payment: z
    .object({
      depositAmount: z.number().nonnegative().optional(),
      balanceDue: z.number().nonnegative().optional(),
      captureMode: z.enum(['none', 'stripe_intent', 'manual']).default('none'),
      paymentIntentId: z.string().optional(),
    })
    .optional(),
});

export const bookingConflictRequestSchema = z.object({
  equipmentId: z.string().uuid(),
  startDate: isoDateString(),
  endDate: isoDateString(),
  excludeBookingId: z.string().uuid().optional(),
});

export const bookingBulkActionSchema = z.object({
  action: z.string().min(1),
  filters: z.record(z.string(), z.unknown()).default({}),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const bookingNoteCreateSchema = z.object({
  note: z.string().min(1),
  visibility: z.enum(['internal', 'customer', 'partner']).default('internal'),
});

export const logisticsTaskCreateSchema = logisticsTaskInputSchema.extend({
  bookingId: z.string().uuid(),
});

export const logisticsTaskFilterSchema = z.object({
  taskType: z.enum(['delivery', 'pickup', 'transfer']).optional(),
  status: z.enum(['pending', 'scheduled', 'en_route', 'completed', 'cancelled']).optional(),
  driverId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  from: isoDateString().optional(),
  to: isoDateString().optional(),
});

export const logisticsTaskStatusSchema = z.object({
  status: z.enum(['pending', 'scheduled', 'en_route', 'completed', 'cancelled']),
  routeUrl: z.string().url().optional(),
  etaMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  completedAt: isoDateString().optional(),
});

export const assignDriverSchema = z.object({
  taskId: z.string().uuid(),
  driverId: z.string().uuid(),
  scheduledAt: isoDateString().optional(),
  routeUrl: z.string().url().optional(),
  etaMinutes: z.number().int().positive().optional(),
});

export const pickupChecklistSchema = z.object({
  bookingId: z.string().uuid(),
  checklist: z.array(
    z.object({
      item: z.string(),
      status: z.enum(['pass', 'fail', 'na']),
      notes: z.string().optional(),
    })
  ),
  inspectorId: z.string().uuid().optional(),
  signedAt: isoDateString().optional(),
  photos: z.array(
    z.object({
      url: z.string().url(),
      description: z.string().optional(),
    })
  ).optional(),
});

export type BookingWizardStartInput = z.infer<typeof bookingWizardStartSchema>;
export type BookingWizardUpdateInput = z.infer<typeof bookingWizardUpdateSchema>;
export type BookingWizardCommitInput = z.infer<typeof bookingWizardCommitSchema>;
export type BookingWizardBookingInput = z.infer<typeof bookingWizardBookingSchema>;
export type BookingConflictRequestInput = z.infer<typeof bookingConflictRequestSchema>;
export type BookingBulkActionInput = z.infer<typeof bookingBulkActionSchema>;
export type BookingNoteCreateInput = z.infer<typeof bookingNoteCreateSchema>;
export type LogisticsTaskCreateInput = z.infer<typeof logisticsTaskCreateSchema>;
export type LogisticsTaskStatusInput = z.infer<typeof logisticsTaskStatusSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type PickupChecklistInput = z.infer<typeof pickupChecklistSchema>;
export type BookingWizardStatus = z.infer<typeof bookingWizardStatusEnum>;


