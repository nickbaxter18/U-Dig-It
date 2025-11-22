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
  SupportTicketUpdateInput,
} from '@/lib/validators/admin/support';

export async function fetchSupportTickets(params?: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.assignedTo) searchParams.set('assignedTo', params.assignedTo);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const url = `/api/admin/support/tickets${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const response = await fetchWithAuth(url);
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to fetch support tickets');
  }
  return response.json();
}

export async function fetchSupportMessages(ticketId: string) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}/messages`);
  if (!response.ok) throw new Error('Failed to load support messages');
  const data = await response.json();
  return data.messages as unknown[];
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

export async function updateSupportSla(ticketId: string, payload: SupportSlaUpdateInput) {
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

export async function assignSupportTicket(ticketId: string, payload: SupportAssignmentInput) {
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

export async function remindSupportTicket(ticketId: string, payload: SupportReminderInput) {
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

export async function updateSupportTicket(ticketId: string, payload: SupportTicketUpdateInput) {
  const response = await fetchWithAuth(`/api/admin/support/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? 'Failed to update support ticket');
  }
  return response.json();
}

export async function updateSupportTicketPriority(ticketId: string, priority: string) {
  return updateSupportTicket(ticketId, {
    priority: priority as 'critical' | 'high' | 'medium' | 'low',
  });
}

export async function updateSupportTicketCategory(ticketId: string, category: string) {
  return updateSupportTicket(ticketId, { category });
}

export async function updateSupportTicketResolutionNotes(ticketId: string, notes: string) {
  return updateSupportTicket(ticketId, { resolution_notes: notes });
}

export async function updateSupportTicketInternalNotes(ticketId: string, notes: string) {
  return updateSupportTicket(ticketId, { internal_notes: notes });
}

export async function updateSupportTicketSatisfaction(ticketId: string, score: number) {
  return updateSupportTicket(ticketId, { satisfaction_score: score });
}

export async function fetchSupportTemplates() {
  const response = await fetchWithAuth('/api/admin/support/templates');
  if (!response.ok) throw new Error('Failed to load support templates');
  const data = await response.json();
  return data.templates as unknown[];
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

export async function updateSupportTemplate(id: string, payload: SupportTemplateUpdateInput) {
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
  return data.activity as unknown[];
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

export async function remindInsurance(insuranceId: string, payload: InsuranceReminderInput) {
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
