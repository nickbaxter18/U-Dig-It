import { logger } from '@/lib/logger';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';
import {
  EquipmentMediaCreateInput,
  EquipmentMediaDeleteInput,
  MaintenanceAlertCreateInput,
  MaintenanceAlertPatchInput,
  MaintenanceAlertQueryInput,
  MaintenanceLogCreateInput,
  MaintenanceLogUpdateInput,
  TelematicsSnapshotCreateInput,
} from '@/lib/validators/admin/equipment';

export async function fetchEquipmentMedia(equipmentId: string) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/media`);
  if (!response.ok) {
    throw new Error('Failed to load equipment media');
  }
  const data = await response.json();
  return data.media as unknown[];
}

export async function createEquipmentMedia(
  equipmentId: string,
  payload: EquipmentMediaCreateInput | FormData
) {
  // If FormData, send as-is (for file uploads)
  // Otherwise, send as JSON (for backward compatibility)
  const isFormData = payload instanceof FormData;

  logger.debug('Preparing equipment media request', {
    component: 'createEquipmentMedia',
    action: 'preparing_request',
    metadata: {
      equipmentId,
      isFormData,
      payloadType: payload instanceof FormData ? 'FormData' : typeof payload,
    },
  });

  // For FormData, don't set Content-Type - browser will set it with boundary
  const requestOptions: RequestInit = {
    method: 'POST',
    body: isFormData ? payload : JSON.stringify(payload),
  };

  // Only set Content-Type for JSON, not for FormData
  if (!isFormData) {
    requestOptions.headers = { 'Content-Type': 'application/json' };
  }

  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/media`, requestOptions);

  logger.debug('Equipment media response received', {
    component: 'createEquipmentMedia',
    action: 'response_received',
    metadata: {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
    },
  });

  if (!response.ok) {
    let error: any = null;
    let errorText: string | null = null;

    try {
      error = await response.json();
    } catch (jsonError) {
      // If JSON parsing fails, try to get text
      try {
        errorText = await response.text();
        logger.error('Non-JSON error response', {
          component: 'createEquipmentMedia',
          action: 'non_json_error',
          metadata: {
            status: response.status,
            errorText: errorText.substring(0, 500), // Limit length
          },
        });
      } catch (textError) {
        logger.error('Failed to read error response', {
          component: 'createEquipmentMedia',
          action: 'read_error_failed',
          metadata: {
            status: response.status,
            jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
          },
        });
      }
    }

    logger.error('Equipment media creation error response', {
      component: 'createEquipmentMedia',
      action: 'error_response',
      metadata: {
        status: response.status,
        error,
        errorText,
        contentType: response.headers.get('content-type'),
        errorDetails: error?.details,
      },
    });

    // Extract detailed error message
    let errorMessage = error?.error || errorText || `Server returned ${response.status}`;

    // If error has details object, include it in the message
    if (error?.details) {
      if (typeof error.details === 'object') {
        const detailsStr = JSON.stringify(error.details, null, 2);
        errorMessage = `${errorMessage}\n\nDetails: ${detailsStr}`;
      } else {
        errorMessage = `${errorMessage}\n\nDetails: ${error.details}`;
      }
    }

    throw new Error(errorMessage);
  }

  const result = await response.json();
  logger.info('Equipment media creation success', {
    component: 'createEquipmentMedia',
    action: 'success',
    metadata: {
      hasMedia: !!result.media,
      mediaId: result.media?.id,
    },
  });
  return result;
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
  if (!equipmentId) {
    return [];
  }

  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/maintenance`);

  if (!response.ok) {
    // If 404 or no logs, return empty array instead of throwing
    if (response.status === 404) {
      return [];
    }

    // Try to get error message from response
    let errorMessage = 'Failed to load maintenance logs';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use default message
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Handle both response formats
  if (data.maintenanceLogs) {
    return Array.isArray(data.maintenanceLogs) ? data.maintenanceLogs : [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  // If no logs property, return empty array
  return [];
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
  equipmentId: string,
  maintenanceLogId: string,
  payload: MaintenanceLogUpdateInput
) {
  const response = await fetchWithAuth(`/api/admin/equipment/${equipmentId}/maintenance`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logId: maintenanceLogId, ...payload }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update maintenance log');
  }

  return response.json();
}

export async function deleteMaintenanceLog(equipmentId: string, maintenanceLogId: string) {
  const response = await fetchWithAuth(
    `/api/admin/equipment/${equipmentId}/maintenance?logId=${maintenanceLogId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to delete maintenance log');
  }

  return response.json();
}

export async function updateScheduledMaintenance(
  equipmentId: string,
  maintenanceId: string,
  payload: {
    title?: string;
    maintenanceType?: 'scheduled' | 'preventive' | 'repair' | 'emergency' | 'inspection';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    scheduledDate?: string;
    description?: string;
    performedBy?: string;
    cost?: number;
    nextDueDate?: string | null;
    nextDueHours?: number;
    notes?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  }
) {
  const response = await fetchWithAuth(
    `/api/admin/equipment/${equipmentId}/maintenance?type=scheduled`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maintenanceId, ...payload }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update scheduled maintenance');
  }

  return response.json();
}

export async function cancelScheduledMaintenance(equipmentId: string, maintenanceId: string) {
  const response = await fetchWithAuth(
    `/api/admin/equipment/${equipmentId}/maintenance?maintenanceId=${maintenanceId}&type=scheduled`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to cancel scheduled maintenance');
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
  return data.alerts as unknown[];
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
