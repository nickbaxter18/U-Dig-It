import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import {
  InsuranceReminderInput,
  InsuranceRequestInfoInput,
  SupportAssignmentInput,
  SupportMessageCreateInput,
  SupportReminderInput,
  SupportSlaUpdateInput,
  SupportTemplateCreateInput,
  SupportTemplateUpdateInput,
} from '@/lib/validators/admin/support';

export async function fetchSupportMessages(ticketId: string) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}/messages`);
  if (!response.ok) throw new Error('Failed to load support messages');
  const data = await response.json();
  return data.messages as any[];
}

export async function postSupportMessage(ticketId: string, payload: SupportMessageCreateInput) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to send support message');
  }
  return response.json();
}

export async function fetchSupportSla(ticketId: string) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}/sla`);
  if (!response.ok) throw new Error('Failed to load support SLA');
  return response.json();
}

export async function updateSupportSla(
  ticketId: string,
  payload: SupportSlaUpdateInput
) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}/sla`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update SLA');
  }
  return response.json();
}

export async function assignSupportTicket(
  ticketId: string,
  payload: SupportAssignmentInput
) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to assign support ticket');
  }
  return response.json();
}

export async function remindSupportTicket(
  ticketId: string,
  payload: SupportReminderInput
) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}/remind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to trigger reminder');
  }
  return response.json();
}

export async function fetchSupportTemplates() {
  const response = await fetchWithAuth('/api/admin/support/templates');
  if (!response.ok) throw new Error('Failed to load support templates');
  const data = await response.json();
  return data.templates as any[];
}

export async function createSupportTemplate(payload: SupportTemplateCreateInput) {
  const response = await fetchWithAuth('/api/admin/support/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to create template');
  }
  return response.json();
}

export async function updateSupportTemplate(
  id: string,
  payload: SupportTemplateUpdateInput
) {
  const response = await fetchWithAuth(`/api/admin/support/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update template');
  }
  return response.json();
}

export async function deleteSupportTemplate(id: string) {
  const response = await fetchWithAuth(`/api/admin/support/templates/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to delete template');
  }
  return response.json();
}

export async function fetchInsuranceActivity(insuranceId: string) {
  const response = await fetchWithAuth(`/api/admin/insurance/${insuranceId}/activity`);
  if (!response.ok) throw new Error('Failed to load insurance activity');
  const data = await response.json();
  return data.activity as any[];
}

export async function requestInsuranceInfo(
  insuranceId: string,
  payload: InsuranceRequestInfoInput
) {
  const response = await fetchWithAuth(`/api/admin/insurance/${insuranceId}/request-info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to request info');
  }
  return response.json();
}

export async function remindInsurance(
  insuranceId: string,
  payload: InsuranceReminderInput
) {
  const response = await fetchWithAuth(`/api/admin/insurance/${insuranceId}/remind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to schedule reminder');
  }
  return response.json();
}

