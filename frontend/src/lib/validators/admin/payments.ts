import { z } from 'zod';

const uuid = () => z.string().uuid();

const money = z
  .number()
  .finite()
  .refine(value => Math.abs(value) < 1_000_000_000, {
    message: 'Amount out of range',
  });

export const manualPaymentCreateSchema = z.object({
  bookingId: uuid(),
  customerId: uuid().optional(),
  amount: money,
  currency: z.string().min(1).default('cad'),
  method: z.enum(['cash', 'ach', 'check', 'pos', 'other']),
  receivedAt: z.string().optional(),
  notes: z.string().optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
      })
    )
    .optional(),
});

export const manualPaymentUpdateSchema = z.object({
  amount: money.optional(),
  status: z.enum(['pending', 'completed', 'voided']).optional(),
  notes: z.string().optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
      })
    )
    .optional(),
});

export const installmentCreateSchema = z.object({
  installments: z
    .array(
      z.object({
        dueDate: z.string(),
        amount: money,
      })
    )
    .min(1),
});

export const installmentStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  paymentId: uuid().optional(),
  manualPaymentId: uuid().optional(),
  paidAt: z.string().optional(),
  deferUntil: z.string().optional(),
});

export const ledgerQuerySchema = z.object({
  bookingId: uuid().optional(),
  entryType: z.enum(['deposit', 'balance', 'refund', 'manual', 'adjustment', 'fee']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z
    .number()
    .int()
    .positive()
    .max(200)
    .optional()
    .default(50),
});

export const reconciliationQuerySchema = z.object({
  status: z.enum(['pending', 'reconciled', 'discrepancy']).optional(),
  limit: z
    .number()
    .int()
    .positive()
    .max(200)
    .optional()
    .default(25),
});

export const reconciliationTriggerSchema = z.object({
  since: z.string().optional(),
});

export const reconciliationUpdateSchema = z.object({
  status: z.enum(['pending', 'reconciled', 'discrepancy']),
  notes: z.string().optional(),
  discrepancyAmount: z.number().optional(),
});

export const exportCreateSchema = z.object({
  exportType: z.enum([
    'payments_summary',
    'manual_payments',
    'accounts_receivable',
    'payout_summary',
  ]),
  filters: z.record(z.string(), z.any()).optional(),
});

export const exportQuerySchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(20),
});

export type ManualPaymentCreateInput = z.infer<typeof manualPaymentCreateSchema>;
export type ManualPaymentUpdateInput = z.infer<typeof manualPaymentUpdateSchema>;
export type InstallmentCreateInput = z.infer<typeof installmentCreateSchema>;
export type InstallmentStatusUpdateInput = z.infer<typeof installmentStatusUpdateSchema>;
export type LedgerQueryInput = z.infer<typeof ledgerQuerySchema>;
export type ReconciliationQueryInput = z.infer<typeof reconciliationQuerySchema>;
export type ReconciliationTriggerInput = z.infer<typeof reconciliationTriggerSchema>;
export type ReconciliationUpdateInput = z.infer<typeof reconciliationUpdateSchema>;
export type ExportCreateInput = z.infer<typeof exportCreateSchema>;
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;

