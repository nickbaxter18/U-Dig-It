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

      // Get current user for assignment filtering
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch support tickets with related data
      let query = supabase.from('support_tickets').select(`
          id,
          ticket_number,
          customer_id,
          booking_id,
          equipment_id,
          subject,
          description,
          priority,
          status,
          category,
          assigned_to,
          created_at,
          resolved_at,
          first_response_at,
          customer:customer_id (
            firstName,
            lastName,
            email
          ),
          booking:booking_id (
            bookingNumber
          ),
          equipment:equipment_id (
            make,
            model
          ),
          assignedUser:assigned_to (
            firstName,
            lastName
          )
        `);

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      if (assignToMe && user) {
        query = query.eq('assigned_to', user.id);
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) throw queryError;

      // Transform data
      const ticketsData: SupportTicket[] = (data || []).map((ticket: unknown) => {
        const customer = ticket.customer || {};
        const booking = ticket.booking || {};
        const equipment = ticket.equipment || {};
        const assignedUser = ticket.assignedUser || {};

        const customerName =
          `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
        const equipmentName =
          equipment.make && equipment.model ? `${equipment.make} ${equipment.model}` : undefined;
        const assignedToName =
          assignedUser.firstName && assignedUser.lastName
            ? `${assignedUser.firstName} ${assignedUser.lastName}`
            : undefined;

        // Calculate response time
        let responseTime: number | undefined;
        if (ticket.first_response_at) {
          const created = new Date(ticket.created_at);
          const responded = new Date(ticket.first_response_at);
          responseTime = (responded.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        }

        return {
          id: ticket.id,
          ticketNumber: ticket.ticket_number,
          customerId: ticket.customer_id,
          customerName,
          customerEmail: customer.email || 'N/A',
          bookingId: ticket.booking_id,
          bookingNumber: booking.bookingNumber,
          equipmentId: ticket.equipment_id,
          equipmentName,
          subject: ticket.subject,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          category: ticket.category,
          assignedTo: ticket.assigned_to,
          assignedToName,
          createdAt: new Date(ticket.created_at),
          resolvedAt: ticket.resolved_at ? new Date(ticket.resolved_at) : undefined,
          firstResponseAt: ticket.first_response_at
            ? new Date(ticket.first_response_at)
            : undefined,
          responseTime,
        };
      });

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
  }, [statusFilter, priorityFilter, assignToMe]);

  useEffect(() => {
    fetchTickets();
    fetchAdminUsers();
  }, [fetchTickets, fetchAdminUsers]);

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
      const updateData: any = {
        status: newStatus,
      };

      // Add resolved_at timestamp if resolving
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      // Add first_response_at if responding for first time
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket && !ticket.firstResponseAt && newStatus === 'in_progress') {
        updateData.first_response_at = new Date().toISOString();
      }

      const supabaseClient2: any = supabase;
      const { error: updateError } = await supabaseClient2
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (updateError) throw updateError;

      await fetchTickets();
      setShowDetails(false);
      setSelectedTicket(null);
      alert(`✅ Ticket status updated to ${newStatus}!`);
    } catch (err) {
      logger.error(
        'Failed to update ticket status',
        {},
        err instanceof Error ? err : new Error(String(err))
      );
      alert('Failed to update ticket status');
    }
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
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
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
            className="focus:ring-kubota-orange rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
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
          className="focus:ring-kubota-orange rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
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
            className="text-kubota-orange focus:ring-kubota-orange rounded"
          />
          <span>Assigned to Me</span>
        </label>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedTicketIds.size > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-kubota-orange bg-orange-50 px-4 py-3">
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
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
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
                className="rounded-md bg-kubota-orange px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Assign
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={bulkActionStatus}
                onChange={(e) => setBulkActionStatus(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-kubota-orange focus:outline-none focus:ring-2 focus:ring-kubota-orange"
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
                className="rounded-md bg-kubota-orange px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
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
                    className={`hover:bg-gray-50 ${isSelected ? 'bg-orange-50/30' : ''}`}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
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
                        className="text-kubota-orange hover:text-orange-600"
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
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
                      <div>
                        <strong>Priority:</strong>
                        <span
                          className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityColor(selectedTicket.priority)}`}
                        >
                          {selectedTicket.priority}
                        </span>
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <span
                          className={`ml-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}
                        >
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      {selectedTicket.category && (
                        <div>
                          <strong>Category:</strong> {selectedTicket.category}
                        </div>
                      )}
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
                        className="bg-kubota-orange rounded-md px-4 py-2 text-sm text-white hover:bg-orange-600"
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
