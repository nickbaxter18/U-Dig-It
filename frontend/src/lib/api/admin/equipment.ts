import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import {
  EquipmentMediaCreateInput,
  EquipmentMediaDeleteInput,
  MaintenanceAlertCreateInput,
  MaintenanceAlertPatchInput,
  MaintenanceLogCreateInput,
  MaintenanceLogUpdateInput,
  MaintenanceAlertQueryInput,
  TelematicsSnapshotCreateInput,
} from '@/lib/validators/admin/equipment';

export async function fetchEquipmentMedia(equipmentId: string) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/media`);
  if (!response.ok) {
    throw new Error('Failed to load equipment media');
  }
  const data = await response.json();
  return data.media as any[];
}

export async function createEquipmentMedia(
  equipmentId: string,
  payload: EquipmentMediaCreateInput
) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to create equipment media');
  }

  return response.json();
}

export async function deleteEquipmentMedia(
  equipmentId: string,
  payload: EquipmentMediaDeleteInput
) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/media`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to delete equipment media');
  }

  return response.json();
}

export async function fetchMaintenanceLogs(equipmentId: string) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/maintenance`);
  if (!response.ok) {
    throw new Error('Failed to load maintenance logs');
  }
  const data = await response.json();
  return data.maintenanceLogs as any[];
}

export async function createMaintenanceLog(
  equipmentId: string,
  payload: MaintenanceLogCreateInput
) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to create maintenance log');
  }

  return response.json();
}

export async function updateMaintenanceLog(
  maintenanceLogId: string,
  payload: MaintenanceLogUpdateInput
) {
  const response = await fetchWithAuth(`/api/admin/maintenance/logs/${maintenanceLogId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update maintenance log');
  }

  return response.json();
}

export async function deleteMaintenanceLog(maintenanceLogId: string) {
  const response = await fetchWithAuth(`/api/admin/maintenance/logs/${maintenanceLogId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to delete maintenance log');
  }

  return response.json();
}

export async function fetchMaintenanceAlerts(query: MaintenanceAlertQueryInput = {}) {
  const params = new URLSearchParams();
  if (query.equipmentId) params.append('equipmentId', query.equipmentId);
  if (query.status) params.append('status', query.status);

  const response = await fetchWithAuth(`/api/admin/maintenance/alerts?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load maintenance alerts');
  }
  const data = await response.json();
  return data.alerts as any[];
}

export async function createMaintenanceAlert(payload: MaintenanceAlertCreateInput) {
  const response = await fetchWithAuth('/api/admin/maintenance/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to create maintenance alert');
  }

  return response.json();
}

export async function updateMaintenanceAlert(payload: MaintenanceAlertPatchInput) {
  const response = await fetchWithAuth('/api/admin/maintenance/alerts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update maintenance alert');
  }

  return response.json();
}

export async function createTelematicsSnapshot(payload: TelematicsSnapshotCreateInput) {
  const response = await fetchWithAuth('/api/admin/telematics/snapshots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to ingest telematics snapshot');
  }

  return response.json();
}

export async function fetchLatestTelematicsSnapshot(equipmentId: string) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/telematics`);
  if (!response.ok) {
    throw new Error('Failed to load telematics snapshot');
  }
  const data = await response.json();
  return data.snapshot ?? null;
}

