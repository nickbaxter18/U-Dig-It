import { z } from 'zod';

const uuid = () => z.string().uuid();
const isoDateTime = z
  .string()
  .min(1)
  .refine(value => !Number.isNaN(new Date(value).getTime()), { message: 'Invalid datetime value' });

export const customerTagCreateSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().optional(),
  description: z.string().optional(),
});

export const customerTagUpdateSchema = customerTagCreateSchema.partial();

export const customerTagAssignSchema = z.object({
  tagId: uuid(),
});

export const customerTagRemoveSchema = z.object({
  tagId: uuid(),
});

export const customerNoteCreateSchema = z.object({
  note: z.string().min(1),
  type: z.enum(['info', 'warning', 'action']).optional(),
  visibility: z.enum(['internal', 'shared']).optional(),
});

export const customerTimelineQuerySchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(20),
  cursor: isoDateTime.optional(),
  eventTypes: z
    .string()
    .transform(value => value.split(',').map(item => item.trim()).filter(Boolean))
    .optional(),
});

export const customerConsentPatchSchema = z.object({
  channel: z.enum(['email', 'sms', 'push']),
  enabled: z.boolean(),
  source: z.string().optional(),
});

export type CustomerTagCreateInput = z.infer<typeof customerTagCreateSchema>;
export type CustomerTagUpdateInput = z.infer<typeof customerTagUpdateSchema>;
export type CustomerTagAssignInput = z.infer<typeof customerTagAssignSchema>;
export type CustomerNoteCreateInput = z.infer<typeof customerNoteCreateSchema>;
export type CustomerTimelineQueryInput = z.infer<typeof customerTimelineQuerySchema>;
export type CustomerConsentPatchInput = z.infer<typeof customerConsentPatchSchema>;

