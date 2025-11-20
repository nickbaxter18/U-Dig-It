import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

function formatCsvValue(value: unknown) {
  const asString = value === null || value === undefined ? '' : String(value);
  return `"${asString.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for logging

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') ?? 'all';
    const priorityFilter = searchParams.get('priority') ?? 'all';
    const searchTerm = (searchParams.get('search') ?? '').trim().toLowerCase();
    const assignedToMe = searchParams.get('assignedTo') === 'me';

    let query = supabase
      .from('support_tickets')
      .select(
        `
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
      `
      )
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }

    if (assignedToMe && user) {
      query = query.eq('assigned_to', user?.id || 'unknown');
    }

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    const tickets = (data ?? []).map((ticket: unknown) => {
      const customer = ticket.customer ?? {};
      const booking = ticket.booking ?? {};
      const equipment = ticket.equipment ?? {};
      const assignedUser = ticket.assignedUser ?? {};

      const equipmentName =
        equipment.make && equipment.model
          ? `${equipment.make} ${equipment.model}`
          : equipment.make || equipment.model;
      const assignedToName =
        assignedUser.firstName && assignedUser.lastName
          ? `${assignedUser.firstName} ${assignedUser.lastName}`
          : '';

      return {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        customerName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Unknown',
        customerEmail: customer.email ?? '',
        bookingNumber: booking.bookingNumber ?? '',
        equipmentName: equipmentName ?? '',
        subject: ticket.subject ?? '',
        priority: ticket.priority ?? '',
        status: ticket.status ?? '',
        assignedToName,
        createdAt: ticket.created_at ? new Date(ticket.created_at) : null,
        resolvedAt: ticket.resolved_at ? new Date(ticket.resolved_at) : null,
        firstResponseAt: ticket.first_response_at ? new Date(ticket.first_response_at) : null,
        description: ticket.description ?? '',
      };
    });

    const filteredTickets = tickets.filter((ticket) => {
      if (searchTerm) {
        const matchesSearch =
          ticket.ticketNumber?.toLowerCase().includes(searchTerm) ||
          ticket.customerName.toLowerCase().includes(searchTerm) ||
          ticket.customerEmail.toLowerCase().includes(searchTerm) ||
          ticket.subject.toLowerCase().includes(searchTerm);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });

    const header = [
      'Ticket Number',
      'Customer Name',
      'Customer Email',
      'Booking Number',
      'Equipment',
      'Subject',
      'Priority',
      'Status',
      'Assigned To',
      'Created At',
      'Resolved At',
      'First Response At',
    ];

    const rows = filteredTickets.map((ticket) => [
      ticket.ticketNumber ?? 'N/A',
      ticket.customerName,
      ticket.customerEmail,
      ticket.bookingNumber,
      ticket.equipmentName,
      ticket.subject,
      ticket.priority,
      ticket.status,
      ticket.assignedToName,
      ticket.createdAt ? ticket.createdAt.toLocaleString() : '',
      ticket.resolvedAt ? ticket.resolvedAt.toLocaleString() : '',
      ticket.firstResponseAt ? ticket.firstResponseAt.toLocaleString() : '',
    ]);

    const csvContent = [header, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n');
    const filename = `support-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error(
      'Support export failed',
      {
        component: 'admin-support-api',
        action: 'export_failed',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to export support tickets' }, { status: 500 });
  }
}
