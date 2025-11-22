'use client';

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  MessageSquare,
  Search,
  User,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';

import { useCallback, useEffect, useRef, useState } from 'react';

import MessageComposer from '@/components/admin/support/MessageComposer';
import MessageThread from '@/components/admin/support/MessageThread';
import SLADisplay from '@/components/admin/support/SLADisplay';

import {
  fetchSupportTickets,
  updateSupportTicket,
  updateSupportTicketCategory,
  updateSupportTicketInternalNotes,
  updateSupportTicketPriority,
  updateSupportTicketResolutionNotes,
  updateSupportTicketSatisfaction,
} from '@/lib/api/admin/support';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  bookingId?: string;
  bookingNumber?: string;
  equipmentId?: string;
  equipmentName?: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  category?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  resolvedAt?: Date;
  firstResponseAt?: Date;
  responseTime?: number; // in hours
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [assignToMe, setAssignToMe] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [satisfactionScore, setSatisfactionScore] = useState<number | null>(null);
  const [updatingNotes, setUpdatingNotes] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<string>('');
  const [bulkAssignTo, setBulkAssignTo] = useState<string>('');
  const [adminUsers, setAdminUsers] = useState<
    Array<{ id: string; firstName: string; lastName: string; email: string }>
  >([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const fetchAdminUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, firstName, lastName, email')
        .in('role', ['admin', 'super_admin'])
        .eq('status', 'active')
        .order('firstName', { ascending: true });

      if (error) throw error;
      setAdminUsers((data || []) as any);
    } catch (err) {
      logger.error(
        'Failed to fetch admin users',
        { component: 'SupportPage' },
        err instanceof Error ? err : new Error(String(err))
      );
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch support tickets via API
      const response = await fetchSupportTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        assignedTo: assignToMe ? 'me' : undefined,
        search: searchTerm || undefined,
      });

      // Response format: { tickets: SupportTicket[], total: number, page: number, pageSize: number }
      // Transform dates from strings to Date objects
      const ticketsData: SupportTicket[] = (response.tickets || []).map((ticket: any) => ({
        ...ticket,
        createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
        resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined,
        firstResponseAt: ticket.firstResponseAt ? new Date(ticket.firstResponseAt) : undefined,
      }));

      setTickets(ticketsData);
    } catch (err) {
      logger.error(
        'Failed to fetch support tickets',
        { component: 'SupportPage' },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to fetch support tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, assignToMe, searchTerm]);

  useEffect(() => {
    fetchTickets();
    fetchAdminUsers();
  }, [fetchTickets, fetchAdminUsers]);

  // Load ticket details (notes, satisfaction) when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      const loadTicketDetails = async () => {
        try {
          const response = await fetchWithAuth(`/api/admin/support/tickets/${selectedTicket.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.ticket) {
              setInternalNotes(data.ticket.internal_notes || '');
              setResolutionNotes(data.ticket.resolution_notes || '');
              setSatisfactionScore(data.ticket.satisfaction_score || null);
            }
          }
        } catch (err) {
          logger.warn(
            'Failed to load ticket details',
            { component: 'SupportPage', action: 'load_ticket_details_failed' },
            err instanceof Error ? err : undefined
          );
        }
      };
      loadTicketDetails();
    }
  }, [selectedTicket?.id]);

  const handleAssignTicket = async (ticketId: string, adminId?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const supabaseClient: any = supabase;
      const { error: updateError } = await supabaseClient
        .from('support_tickets')
        .update({
          assigned_to: adminId || user.id,
          assigned_at: new Date().toISOString(),
          status: 'in_progress',
        })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      await fetchTickets();
      alert('✅ Ticket assigned successfully!');
    } catch (err) {
      logger.error(
        'Failed to assign ticket',
        {},
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to assign ticket');
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await updateSupportTicket(ticketId, { status: newStatus as any });
      await fetchTickets();
      // Update selected ticket if it's the one being updated
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus as any });
      }
      alert(`✅ Ticket status updated to ${newStatus}!`);
    } catch (err) {
      logger.error(
        'Failed to update ticket status',
        { component: 'SupportPage', action: 'update_status_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to update ticket status');
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: string) => {
    try {
      await updateSupportTicketPriority(ticketId, priority);
      await fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, priority: priority as any });
      }
    } catch (err) {
      logger.error(
        'Failed to update priority',
        { component: 'SupportPage', action: 'update_priority_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to update priority');
    }
  };

  const handleUpdateCategory = async (ticketId: string, category: string) => {
    try {
      await updateSupportTicketCategory(ticketId, category);
      await fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, category });
      }
    } catch (err) {
      logger.error(
        'Failed to update category',
        { component: 'SupportPage', action: 'update_category_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to update category');
    }
  };

  const handleSaveInternalNotes = async (ticketId: string) => {
    try {
      setUpdatingNotes(true);
      await updateSupportTicketInternalNotes(ticketId, internalNotes);
      await fetchTickets();
    } catch (err) {
      logger.error(
        'Failed to save internal notes',
        { component: 'SupportPage', action: 'save_internal_notes_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to save internal notes');
    } finally {
      setUpdatingNotes(false);
    }
  };

  const handleSaveResolutionNotes = async (ticketId: string) => {
    try {
      setUpdatingNotes(true);
      await updateSupportTicketResolutionNotes(ticketId, resolutionNotes);
      await fetchTickets();
    } catch (err) {
      logger.error(
        'Failed to save resolution notes',
        { component: 'SupportPage', action: 'save_resolution_notes_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to save resolution notes');
    } finally {
      setUpdatingNotes(false);
    }
  };

  const handleSaveSatisfaction = async (ticketId: string, score: number) => {
    try {
      await updateSupportTicketSatisfaction(ticketId, score);
      await fetchTickets();
      setSatisfactionScore(score);
    } catch (err) {
      logger.error(
        'Failed to save satisfaction score',
        { component: 'SupportPage', action: 'save_satisfaction_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to save satisfaction score');
    }
  };

  const handleMessageSent = () => {
    // Refresh tickets to update response time
    fetchTickets();
  };

  const handleExportTickets = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        params.set('priority', priorityFilter);
      }
      if (assignToMe) {
        params.set('assignedTo', 'me');
      }
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }

      const queryString = params.toString();
      const response = await fetchWithAuth(
        `/api/admin/support/export${queryString ? `?${queryString}` : ''}`
      );
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || 'Failed to export support tickets');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `support-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } catch (err) {
      logger.error(
        'Support export failed',
        { component: 'SupportPage', action: 'export_failed' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to export support tickets');
    } finally {
      setExporting(false);
    }
  };

  const handleToggleTicketSelection = (ticketId: string) => {
    const newSelected = new Set(selectedTicketIds);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTicketIds(newSelected);
  };

  const handleToggleSelectAll = () => {
    if (selectedTicketIds.size === filteredTickets.length) {
      setSelectedTicketIds(new Set());
    } else {
      setSelectedTicketIds(new Set(filteredTickets.map((t) => t.id)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedTicketIds.size === 0 || !bulkAssignTo) return;

    const confirmed = window.confirm(
      `Assign ${selectedTicketIds.size} ticket(s) to selected admin?`
    );
    if (!confirmed) return;

    try {
      const response = await fetchWithAuth('/api/admin/support/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTicketIds),
          action: 'assign',
          assignedTo: bulkAssignTo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign tickets');
      }

      const result = await response.json();
      alert(result.message || 'Tickets assigned successfully!');
      setSelectedTicketIds(new Set());
      setBulkAssignTo('');
      fetchTickets();
    } catch (err) {
      logger.error(
        'Failed to bulk assign tickets',
        { component: 'SupportPage' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to assign tickets');
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedTicketIds.size === 0 || !bulkActionStatus) return;

    const confirmed = window.confirm(
      `Update ${selectedTicketIds.size} ticket(s) to ${bulkActionStatus}?`
    );
    if (!confirmed) return;

    try {
      const response = await fetchWithAuth('/api/admin/support/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds: Array.from(selectedTicketIds),
          action: 'update_status',
          status: bulkActionStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update ticket status');
      }

      const result = await response.json();
      alert(result.message || 'Ticket status updated successfully!');
      setSelectedTicketIds(new Set());
      setBulkActionStatus('');
      fetchTickets();
    } catch (err) {
      logger.error(
        'Failed to bulk update ticket status',
        { component: 'SupportPage' },
        err instanceof Error ? err : new Error(String(err))
      );
      alert(err instanceof Error ? err.message : 'Failed to update ticket status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting_customer':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const openTickets = tickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(
    (t) => t.status === 'resolved' || t.status === 'closed'
  ).length;
  const avgResponseTime =
    tickets.filter((t) => t.responseTime).length > 0
      ? tickets
          .filter((t) => t.responseTime)
          .reduce((sum: unknown, t: unknown) => sum + (t.responseTime || 0), 0) /
        tickets.filter((t) => t.responseTime).length
      : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-premium-gold h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">
            Manage customer support requests, technical issues, and inquiries.
          </p>
        </div>
        <button
          onClick={handleExportTickets}
          disabled={exporting}
          className="flex items-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{openTickets}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{inProgressTickets}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">{resolvedTickets}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">{avgResponseTime.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="focus:ring-premium-gold rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus:ring-premium-gold rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_customer">Waiting Customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="focus:ring-premium-gold rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={assignToMe}
            onChange={(e) => setAssignToMe(e.target.checked)}
            className="text-premium-gold focus:ring-premium-gold rounded"
          />
          <span>Assigned to Me</span>
        </label>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedTicketIds.size > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-premium-gold bg-premium-gold-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              {selectedTicketIds.size} ticket(s) selected
            </span>
            <button
              onClick={() => {
                setSelectedTicketIds(new Set());
                setBulkActionStatus('');
                setBulkAssignTo('');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-gray-500" />
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold"
              >
                <option value="">Select admin...</option>
                {adminUsers.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.firstName} {admin.lastName} ({admin.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssign}
                disabled={!bulkAssignTo}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Assign
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={bulkActionStatus}
                onChange={(e) => setBulkActionStatus(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold"
              >
                <option value="">Select status...</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkActionStatus}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-premium-gold focus:ring-premium-gold"
                    aria-label="Select all tickets"
                    checked={
                      selectedTicketIds.size === filteredTickets.length &&
                      filteredTickets.length > 0
                    }
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTickets.map((ticket) => {
                const isSelected = selectedTicketIds.has(ticket.id);
                return (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-premium-gold-50/30' : ''}`}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-premium-gold focus:ring-premium-gold"
                        checked={isSelected}
                        onChange={() => handleToggleTicketSelection(ticket.id)}
                        aria-label={`Select ticket ${ticket.ticketNumber}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.ticketNumber}</div>
                      {ticket.bookingNumber && (
                        <div className="text-sm text-gray-500">Booking: {ticket.bookingNumber}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.customerName}
                          </div>
                          <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-sm font-medium text-gray-900">
                        {ticket.subject}
                      </div>
                      {ticket.equipmentName && (
                        <div className="text-sm text-gray-500">Re: {ticket.equipmentName}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(ticket.status)}
                        <span
                          className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {ticket.assignedToName || (
                        <button
                          onClick={() => handleAssignTicket(ticket.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Assign to me
                        </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {ticket.createdAt.toLocaleDateString()}
                      <div className="text-xs">{ticket.createdAt.toLocaleTimeString()}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDetails(true);
                        }}
                        className="text-premium-gold hover:text-premium-gold-dark"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {showDetails && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Ticket #{selectedTicket.ticketNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created {selectedTicket.createdAt.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedTicket(null);
                    setShowInternalNotes(false);
                    setInternalNotes('');
                    setResolutionNotes('');
                    setSatisfactionScore(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer & Ticket Info */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Name:</strong> {selectedTicket.customerName}
                      </div>
                      <div>
                        <strong>Email:</strong> {selectedTicket.customerEmail}
                      </div>
                      {selectedTicket.bookingNumber && (
                        <div>
                          <strong>Booking:</strong> {selectedTicket.bookingNumber}
                        </div>
                      )}
                      {selectedTicket.equipmentName && (
                        <div>
                          <strong>Equipment:</strong> {selectedTicket.equipmentName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Ticket Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <strong>Priority:</strong>
                        <select
                          value={selectedTicket.priority}
                          onChange={(e) => handleUpdatePriority(selectedTicket.id, e.target.value)}
                          className={`rounded-md border px-2 py-1 text-xs font-semibold ${getPriorityColor(selectedTicket.priority)} focus:outline-none focus:ring-2`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <span
                          className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}
                        >
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong>Category:</strong>
                        <input
                          type="text"
                          value={selectedTicket.category || ''}
                          onChange={(e) => {
                            const newCategory = e.target.value;
                            setSelectedTicket({ ...selectedTicket, category: newCategory });
                          }}
                          onBlur={(e) => {
                            if (e.target.value !== selectedTicket.category) {
                              handleUpdateCategory(selectedTicket.id, e.target.value);
                            }
                          }}
                          placeholder="Enter category"
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2"
                        />
                      </div>
                      {selectedTicket.assignedToName && (
                        <div>
                          <strong>Assigned To:</strong> {selectedTicket.assignedToName}
                        </div>
                      )}
                      {selectedTicket.responseTime && (
                        <div>
                          <strong>Response Time:</strong> {selectedTicket.responseTime.toFixed(1)}{' '}
                          hours
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SLA Display */}
                <SLADisplay
                  ticketId={selectedTicket.id}
                  priority={selectedTicket.priority}
                  createdAt={selectedTicket.createdAt.toISOString()}
                />

                {/* Subject & Description */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900">Subject</h4>
                  <p className="text-sm text-gray-700">{selectedTicket.subject}</p>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900">Description</h4>
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                {/* Message Thread */}
                <MessageThread ticketId={selectedTicket.id} onMessageSent={handleMessageSent} />

                {/* Message Composer */}
                <MessageComposer
                  ticketId={selectedTicket.id}
                  onMessageSent={handleMessageSent}
                  customerName={selectedTicket.customerName}
                  ticketNumber={selectedTicket.ticketNumber}
                />

                {/* Internal Notes */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setShowInternalNotes(!showInternalNotes)}
                    className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900"
                  >
                    <span>Internal Notes</span>
                    <span className="text-xs text-gray-500">(Admin only)</span>
                    {showInternalNotes ? <X className="h-4 w-4" /> : <span>+</span>}
                  </button>
                  {showInternalNotes && (
                    <div className="space-y-2">
                      <textarea
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        onBlur={() => {
                          if (internalNotes.trim()) {
                            handleSaveInternalNotes(selectedTicket.id);
                          }
                        }}
                        placeholder="Add internal notes (only visible to admins)..."
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        disabled={updatingNotes}
                      />
                      {updatingNotes && <p className="text-xs text-gray-500">Saving...</p>}
                    </div>
                  )}
                </div>

                {/* Resolution Notes & Satisfaction (when resolved/closed) */}
                {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-900">Resolution Notes</h4>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        onBlur={() => {
                          if (resolutionNotes.trim()) {
                            handleSaveResolutionNotes(selectedTicket.id);
                          }
                        }}
                        placeholder="Add resolution notes..."
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        disabled={updatingNotes}
                      />
                      {updatingNotes && <p className="text-xs text-gray-500">Saving...</p>}
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-900">
                        Customer Satisfaction
                      </h4>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleSaveSatisfaction(selectedTicket.id, score)}
                            className={`h-8 w-8 rounded-full text-lg ${
                              satisfactionScore && satisfactionScore >= score
                                ? 'text-yellow-400'
                                : 'text-gray-300 hover:text-gray-400'
                            }`}
                            aria-label={`Rate ${score} stars`}
                          >
                            ⭐
                          </button>
                        ))}
                        {satisfactionScore && (
                          <span className="text-sm text-gray-600">
                            {satisfactionScore} / 5 stars
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {!selectedTicket.assignedTo && (
                      <button
                        onClick={() => handleAssignTicket(selectedTicket.id)}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        Assign to Me
                      </button>
                    )}

                    {selectedTicket.status === 'open' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                        className="rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        Start Working
                      </button>
                    )}

                    {selectedTicket.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'waiting_customer')}
                          className="rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                          Wait for Customer
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                          className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          Mark Resolved
                        </button>
                      </>
                    )}

                    {(selectedTicket.status === 'waiting_customer' ||
                      selectedTicket.status === 'resolved') && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                        className="rounded-md bg-gray-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Close Ticket
                      </button>
                    )}

                    {selectedTicket.bookingId && (
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/bookings/${selectedTicket.bookingId}`)
                        }
                        className="bg-blue-600 rounded-md px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        View Booking
                      </button>
                    )}

                    <button
                      onClick={() => {
                        window.location.href = `/admin/customers?search=${selectedTicket.customerEmail}`;
                      }}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
