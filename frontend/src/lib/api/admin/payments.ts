import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import {
  ExportCreateInput,
  ExportQueryInput,
  InstallmentCreateInput,
  InstallmentStatusUpdateInput,
  LedgerQueryInput,
  ManualPaymentCreateInput,
  ManualPaymentUpdateInput,
  ReconciliationQueryInput,
  ReconciliationTriggerInput,
  ReconciliationUpdateInput,
} from '@/lib/validators/admin/payments';

export interface ManualPaymentRecord {
  id: string;
  booking_id: string;
  customer_id: string | null;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'completed' | 'voided';
  received_at: string | null;
  recorded_by: string | null;
  notes?: string | null;
  attachments?: Array<{ fileName: string; url: string; size?: number }>;
  created_at: string;
  updated_at: string;
  booking?: {
    id: string;
    bookingNumber: string;
    totalAmount?: number;
    depositAmount?: number;
    balanceAmount?: number;
  } | null;
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
}

export interface InstallmentRecord {
  id: string;
  booking_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_id?: string | null;
  manual_payment_id?: string | null;
  paid_at?: string | null;
}

export interface LedgerEntryRecord {
  id: string;
  booking_id: string | null;
  entry_type: string;
  amount: number;
  currency: string;
  source: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PayoutReconciliationRecord {
  id: string;
  stripe_payout_id: string;
  amount: number;
  currency: string;
  arrival_date: string | null;
  status: 'pending' | 'reconciled' | 'discrepancy';
  details: Record<string, unknown> | null;
  reconciled_by: string | null;
  reconciled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialExportRecord {
  id: string;
  admin_id: string;
  export_type: string;
  parameters: Record<string, unknown> | null;
  file_path: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export async function listManualPayments(query: {
  bookingId?: string;
  status?: ManualPaymentRecord['status'];
} = {}) {
  const params = new URLSearchParams();
  if (query.bookingId) params.append('bookingId', query.bookingId);
  if (query.status) params.append('status', query.status);

  const response = await fetchWithAuth(
    `/api/admin/payments/manual${params.toString() ? `?${params}` : ''}`
  );
  if (!response.ok) throw new Error('Failed to load manual payments');
  const data = await response.json();
  return data.manualPayments as ManualPaymentRecord[];
}

export async function createManualPayment(payload: ManualPaymentCreateInput) {
  const response = await fetchWithAuth('/api/admin/payments/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to record manual payment');
  }
  return response.json();
}

export async function updateManualPayment(id: string, payload: ManualPaymentUpdateInput) {
  const response = await fetchWithAuth(`/api/admin/payments/manual/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update manual payment');
  }
  return response.json();
}

export async function deleteManualPayment(id: string) {
  const response = await fetchWithAuth(`/api/admin/payments/manual/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to delete manual payment');
  }
  return response.json();
}

export async function fetchInstallmentSchedule(bookingId: string) {
  const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}/installments`);
  if (!response.ok) throw new Error('Failed to load installment schedule');
  const data = await response.json();
  return data.installments as InstallmentRecord[];
}

export async function createInstallmentSchedule(
  bookingId: string,
  payload: InstallmentCreateInput
) {
  const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}/installments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to create installment schedule');
  }
  return response.json();
}

export async function updateInstallmentStatus(
  installmentId: string,
  payload: InstallmentStatusUpdateInput
) {
  const response = await fetchWithAuth(`/api/admin/installments/${installmentId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update installment status');
  }
  return response.json();
}

export async function fetchLedgerEntries(query: LedgerQueryInput = { limit: 100 }) {
  const params = new URLSearchParams();
  if (query.bookingId) params.append('bookingId', query.bookingId);
  if (query.entryType) params.append('entryType', query.entryType);
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await fetchWithAuth(
    `/api/admin/payments/ledger${params.toString() ? `?${params}` : ''}`
  );
  if (!response.ok) throw new Error('Failed to load financial ledger');
  const data = await response.json();
  return data.entries as LedgerEntryRecord[];
}

export async function fetchPayoutReconciliations(
  query: ReconciliationQueryInput = { limit: 100 }
) {
  const params = new URLSearchParams();
  if (query.status) params.append('status', query.status);
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await fetchWithAuth(
    `/api/admin/payments/reconcile${params.toString() ? `?${params}` : ''}`
  );
  if (!response.ok) throw new Error('Failed to load payout reconciliations');
  const data = await response.json();
  return data.payouts as PayoutReconciliationRecord[];
}

export async function triggerPayoutReconciliation(
  payload: ReconciliationTriggerInput = {}
) {
  const response = await fetchWithAuth('/api/admin/payments/reconcile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to trigger reconciliation');
  }

  return response.json();
}

export async function updatePayoutReconciliation(
  payoutId: string,
  payload: ReconciliationUpdateInput
) {
  const response = await fetchWithAuth(`/api/admin/payments/reconcile/${payoutId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update payout reconciliation');
  }

  return response.json();
}

export async function requestFinancialExport(payload: ExportCreateInput) {
  const response = await fetchWithAuth('/api/admin/payments/exports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to generate export');
  }

  return response.json() as Promise<{
    export: FinancialExportRecord;
    downloadUrl: string | null;
  }>;
}

export async function listFinancialExports(query: ExportQueryInput = { limit: 100 }) {
  const params = new URLSearchParams();
  if (query.limit) params.append('limit', query.limit.toString());

  const response = await fetchWithAuth(
    `/api/admin/payments/exports${params.toString() ? `?${params}` : ''}`
  );
  if (!response.ok) throw new Error('Failed to load financial exports');
  const data = await response.json();
  return data.exports as FinancialExportRecord[];
}

