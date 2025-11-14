import { z } from 'zod';

const uuid = () => z.string().uuid();

export const supportMessageCreateSchema = z.object({
  message: z.string().min(1),
  internal: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        url: z.string().url(),
        size: z.number().optional(),
        contentType: z.string().optional(),
      })
    )
    .optional(),
});

export const supportSlaUpdateSchema = z.object({
  priority: z.string().optional(),
  targetResponseMinutes: z.number().int().positive().optional(),
  targetResolutionMinutes: z.number().int().positive().optional(),
});

export const supportTemplateCreateSchema = z.object({
  name: z.string().min(1),
  channel: z.enum(['email', 'sms', 'note']),
  subject: z.string().optional(),
  body: z.string().min(1),
});

export const supportTemplateUpdateSchema = supportTemplateCreateSchema.partial();

export const supportAssignmentSchema = z.object({
  assigneeId: uuid(),
  note: z.string().optional(),
});

export const supportReminderSchema = z.object({
  type: z.enum(['response', 'resolution']).optional(),
});

export const insuranceRequestInfoSchema = z.object({
  message: z.string().min(1),
  requestedFields: z.array(z.string()).optional(),
});

export const insuranceReminderSchema = z.object({
  reminderType: z.enum(['expiry', 'missing_info']),
});

export type SupportMessageCreateInput = z.infer<typeof supportMessageCreateSchema>;
export type SupportSlaUpdateInput = z.infer<typeof supportSlaUpdateSchema>;
export type SupportTemplateCreateInput = z.infer<typeof supportTemplateCreateSchema>;
export type SupportTemplateUpdateInput = z.infer<typeof supportTemplateUpdateSchema>;
export type SupportAssignmentInput = z.infer<typeof supportAssignmentSchema>;
export type SupportReminderInput = z.infer<typeof supportReminderSchema>;
export type InsuranceRequestInfoInput = z.infer<typeof insuranceRequestInfoSchema>;
export type InsuranceReminderInput = z.infer<typeof insuranceReminderSchema>;
