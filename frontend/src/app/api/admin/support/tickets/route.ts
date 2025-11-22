import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { RateLimitPresets, withRateLimit } from '@/lib/rate-limiter';
import { requireAdmin } from '@/lib/supabase/requireAdmin';

interface SupportTicketResponse {
  tickets: unknown[];
  total: number;
  page: number;
  pageSize: number;
}

export const GET = withRateLimit(RateLimitPresets.MODERATE, async (request: NextRequest) => {
  try {
    // Step 1: Rate limiting is handled by withRateLimit wrapper

    // Step 2: Authenticate - verify admin access
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });
    }

    // Get user for filtering and logging
    const { user } = adminResult;

    // Step 3: Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') ?? 'all';
    const priorityFilter = searchParams.get('priority') ?? 'all';
    const assignedTo = searchParams.get('assignedTo');
    const searchTerm = (searchParams.get('search') ?? '').trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);

    const rangeStart = (page - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    // Step 4: Build query with service client (bypasses RLS)
    // Note: customer_id and assigned_to reference auth.users, so we fetch users separately
    let query = supabase.from('support_tickets').select(
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
          booking:booking_id (
            bookingNumber
          ),
          equipment:equipment_id (
            make,
            model
          )
        `,
      { count: 'exact' }
    );

    // Step 5: Apply filters
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (priorityFilter !== 'all') {
      query = query.eq('priority', priorityFilter);
    }

    if (assignedTo === 'me' && user) {
      query = query.eq('assigned_to', user.id);
    }

    if (searchTerm) {
      query = query.ilike('subject', `%${searchTerm}%`);
    }

    // Step 6: Order results
    query = query.order('created_at', { ascending: false });

    // Execute query with pagination
    const { data, error: queryError, count } = await query.range(rangeStart, rangeEnd);

    if (queryError) {
      logger.error(
        'Failed to fetch support tickets',
        {
          component: 'admin-support-tickets-api',
          action: 'fetch_failed',
          metadata: {
            statusFilter,
            priorityFilter,
            assignedTo,
            searchTerm,
            page,
            pageSize,
            error: queryError.message,
          },
        },
        queryError
      );
      return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
    }

    // Fetch user data separately (customer_id and assigned_to reference auth.users)
    const userIds = new Set<string>();
    (data || []).forEach((ticket: any) => {
      if (ticket.customer_id) userIds.add(ticket.customer_id);
      if (ticket.assigned_to) userIds.add(ticket.assigned_to);
    });

    const usersMap = new Map<string, { firstName: string; lastName: string; email: string }>();
    if (userIds.size > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, firstName, lastName, email')
        .in('id', Array.from(userIds));

      if (usersError) {
        logger.warn(
          'Failed to fetch user data for support tickets',
          {
            component: 'admin-support-tickets-api',
            action: 'fetch_users_failed',
            metadata: { userIdCount: userIds.size, error: usersError.message },
          },
          usersError
        );
      } else {
        (usersData || []).forEach((user: any) => {
          usersMap.set(user.id, {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
          });
        });
      }
    }

    // Step 7: Transform data to match SupportTicket interface
    const ticketsData = (data || []).map((ticket: any) => {
      const booking = ticket.booking || {};
      const equipment = ticket.equipment || {};

      // Get customer and assignedUser from usersMap
      const customer = usersMap.get(ticket.customer_id) || {
        firstName: '',
        lastName: '',
        email: '',
      };
      const assignedUser = ticket.assigned_to ? usersMap.get(ticket.assigned_to) : null;

      const customerName =
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
      const equipmentName =
        equipment.make && equipment.model ? `${equipment.make} ${equipment.model}` : undefined;
      const assignedToName =
        assignedUser && assignedUser.firstName && assignedUser.lastName
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
        firstResponseAt: ticket.first_response_at ? new Date(ticket.first_response_at) : undefined,
        responseTime,
      };
    });

    // Step 8: Log and return JSON response
    logger.info('Support tickets fetched successfully', {
      component: 'admin-support-tickets-api',
      action: 'fetch_success',
      metadata: {
        ticketCount: ticketsData.length,
        total: count || 0,
        page,
        pageSize,
      },
    });

    const response: SupportTicketResponse = {
      tickets: ticketsData,
      total: count || 0,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      'Unexpected error fetching support tickets',
      {
        component: 'admin-support-tickets-api',
        action: 'fetch_unexpected',
      },
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
});
