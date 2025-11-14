import { z } from 'zod';

const isoDateTime = z
  .string()
  .min(1)
  .refine(value => !Number.isNaN(new Date(value).getTime()), {
    message: 'Invalid datetime value',
  });

const moneySchema = z
  .number()
  .finite()
  .refine(value => Math.abs(value) < 1_000_000_000, {
    message: 'Amount is out of range',
  });

export const equipmentMediaCreateSchema = z.object({
  mediaType: z.enum(['image', 'video', 'document']),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
  caption: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isPrimary: z.boolean().optional(),
});

export const equipmentMediaDeleteSchema = z.object({
  mediaId: z.string().uuid(),
});

export const maintenanceDocumentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.string().optional(),
});

export const maintenancePartSchema = z.object({
  partName: z.string().min(1),
  quantity: z.number().positive().optional().default(1),
  costPerUnit: moneySchema.optional(),
  supplier: z.string().optional(),
});

export const maintenanceLogCreateSchema = z.object({
  maintenanceType: z.enum(['routine', 'repair', 'inspection']),
  performedAt: isoDateTime,
  technician: z.string().optional(),
  notes: z.string().optional(),
  cost: moneySchema.optional(),
  durationHours: z.number().nonnegative().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
  nextDueAt: isoDateTime.optional(),
  documents: z.array(maintenanceDocumentSchema).optional(),
  parts: z.array(maintenancePartSchema).optional(),
});

export const maintenanceLogUpdateSchema = z.object({
  maintenanceType: z.enum(['routine', 'repair', 'inspection']).optional(),
  performedAt: isoDateTime.optional(),
  technician: z.string().optional(),
  notes: z.string().optional(),
  cost: moneySchema.optional(),
  durationHours: z.number().nonnegative().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  nextDueAt: isoDateTime.optional().nullable(),
  documents: z.array(maintenanceDocumentSchema).optional(),
});

export const maintenanceAlertCreateSchema = z.object({
  equipmentId: z.string().uuid(),
  alertType: z.enum(['hours_based', 'calendar_based', 'fault_code']),
  thresholdValue: z.number().optional(),
  triggeredAt: isoDateTime.optional(),
});

export const maintenanceAlertUpdateSchema = z.object({
  status: z.enum(['active', 'resolved', 'disabled']).optional(),
  resolvedAt: isoDateTime.optional().nullable(),
  resolvedBy: z.string().uuid().optional().nullable(),
});

export const maintenanceAlertPatchSchema = maintenanceAlertUpdateSchema.extend({
  alertId: z.string().uuid(),
});

export const maintenanceAlertQuerySchema = z.object({
  equipmentId: z.string().uuid().optional(),
  status: z.enum(['active', 'resolved', 'disabled']).optional(),
});

export const telematicsSnapshotCreateSchema = z.object({
  equipmentId: z.string().uuid(),
  capturedAt: isoDateTime,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  engineHours: z.number().nonnegative().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  source: z.string().optional(),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
});

export type EquipmentMediaCreateInput = z.infer<typeof equipmentMediaCreateSchema>;
export type EquipmentMediaDeleteInput = z.infer<typeof equipmentMediaDeleteSchema>;
export type MaintenanceLogCreateInput = z.infer<typeof maintenanceLogCreateSchema>;
export type MaintenanceLogUpdateInput = z.infer<typeof maintenanceLogUpdateSchema>;
export type MaintenanceAlertCreateInput = z.infer<typeof maintenanceAlertCreateSchema>;
export type MaintenanceAlertUpdateInput = z.infer<typeof maintenanceAlertUpdateSchema>;
export type MaintenanceAlertPatchInput = z.infer<typeof maintenanceAlertPatchSchema>;
export type MaintenanceAlertQueryInput = z.infer<typeof maintenanceAlertQuerySchema>;
export type TelematicsSnapshotCreateInput = z.infer<typeof telematicsSnapshotCreateSchema>;

