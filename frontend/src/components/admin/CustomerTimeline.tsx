'use client';

import {
  Calendar,
  CreditCard,
  FileText,
  Mail,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Tag,
  Ticket,
  X,
} from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { useAdminToast } from './AdminToastProvider';

interface TimelineEvent {
  id: string;
  customer_id: string;
  event_type:
    | 'booking_created'
    | 'booking_completed'
    | 'booking_cancelled'
    | 'payment_received'
    | 'payment_refunded'
    | 'ticket_created'
    | 'ticket_resolved'
    | 'note_added'
    | 'tag_added'
    | 'status_changed';
  occurred_at: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface CustomerTimelineProps {
  customerId: string;
  onEventChange?: () => void;
}

export function CustomerTimeline({ customerId, onEventChange }: CustomerTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const toast = useAdminToast();

  const fetchEvents = useCallback(
    async (cursor?: string | null) => {
      try {
        if (cursor) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();
        params.append('limit', '20');
        if (cursor) params.append('cursor', cursor);
        if (eventTypeFilter.length > 0) {
          eventTypeFilter.forEach((type) => params.append('eventTypes', type));
        }

        const response = await fetchWithAuth(
          `/api/admin/customers/${customerId}/timeline?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to load timeline');
        }

        const data = await response.json();

        if (cursor) {
          setEvents((prev) => [...prev, ...(data.events || [])]);
        } else {
          setEvents(data.events || []);
        }

        setNextCursor(data.nextCursor || null);
      } catch (error) {
        toast.error(
          'Failed to load timeline',
          error instanceof Error ? error.message : 'Unable to fetch customer timeline'
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [customerId, eventTypeFilter, toast]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const loadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchEvents(nextCursor);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'booking_created':
      case 'booking_completed':
      case 'booking_cancelled':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'payment_received':
      case 'payment_refunded':
        return <CreditCard className="h-5 w-5 text-green-600" />;
      case 'ticket_created':
      case 'ticket_resolved':
        return <Ticket className="h-5 w-5 text-orange-600" />;
      case 'note_added':
        return <FileText className="h-5 w-5 text-gray-600" />;
      case 'tag_added':
        return <Tag className="h-5 w-5 text-purple-600" />;
      case 'status_changed':
        return <RefreshCw className="h-5 w-5 text-yellow-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'booking_created':
      case 'booking_completed':
        return 'bg-blue-100 border-blue-300';
      case 'booking_cancelled':
        return 'bg-red-100 border-red-300';
      case 'payment_received':
        return 'bg-green-100 border-green-300';
      case 'payment_refunded':
        return 'bg-yellow-100 border-yellow-300';
      case 'ticket_created':
        return 'bg-orange-100 border-orange-300';
      case 'ticket_resolved':
        return 'bg-green-100 border-green-300';
      case 'note_added':
        return 'bg-gray-100 border-gray-300';
      case 'tag_added':
        return 'bg-purple-100 border-purple-300';
      case 'status_changed':
        return 'bg-yellow-100 border-yellow-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const formatEventDescription = (event: TimelineEvent) => {
    const metadata = event.metadata || {};

    switch (event.event_type) {
      case 'booking_created':
        return `Booking ${metadata.bookingNumber || 'created'} for ${metadata.equipmentName || 'equipment'}`;
      case 'booking_completed':
        return `Booking ${metadata.bookingNumber || ''} completed`;
      case 'booking_cancelled':
        return `Booking ${metadata.bookingNumber || ''} cancelled${metadata.reason ? `: ${metadata.reason}` : ''}`;
      case 'payment_received':
        return `Payment received: $${metadata.amount?.toFixed(2) || '0.00'}${metadata.paymentMethod ? ` via ${metadata.paymentMethod}` : ''}`;
      case 'payment_refunded':
        return `Refund processed: $${metadata.amount?.toFixed(2) || '0.00'}${metadata.reason ? ` - ${metadata.reason}` : ''}`;
      case 'ticket_created':
        return `Support ticket created: ${metadata.subject || 'No subject'}`;
      case 'ticket_resolved':
        return `Support ticket resolved: ${metadata.subject || 'No subject'}`;
      case 'note_added':
        return `Note added: ${metadata.note?.substring(0, 100) || 'No content'}${metadata.note?.length > 100 ? '...' : ''}`;
      case 'tag_added':
        return `Tag added: ${metadata.tag || 'Unknown'}`;
      case 'status_changed':
        return `Status changed from ${metadata.oldStatus || 'unknown'} to ${metadata.newStatus || 'unknown'}`;
      default:
        return `Event: ${event.event_type}`;
    }
  };

  const eventTypeOptions = [
    { value: 'booking_created', label: 'Bookings Created' },
    { value: 'booking_completed', label: 'Bookings Completed' },
    { value: 'booking_cancelled', label: 'Bookings Cancelled' },
    { value: 'payment_received', label: 'Payments Received' },
    { value: 'payment_refunded', label: 'Refunds' },
    { value: 'ticket_created', label: 'Tickets Created' },
    { value: 'ticket_resolved', label: 'Tickets Resolved' },
    { value: 'note_added', label: 'Notes' },
    { value: 'tag_added', label: 'Tags' },
    { value: 'status_changed', label: 'Status Changes' },
  ];

  const toggleEventTypeFilter = (eventType: string) => {
    setEventTypeFilter((prev) =>
      prev.includes(eventType) ? prev.filter((t) => t !== eventType) : [...prev, eventType]
    );
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-kubota-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
        <button
          onClick={() => fetchEvents()}
          className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Event Type Filters */}
      <div className="flex flex-wrap gap-2">
        {eventTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleEventTypeFilter(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              eventTypeFilter.includes(option.value)
                ? 'bg-kubota-orange text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
        {eventTypeFilter.length > 0 && (
          <button
            onClick={() => setEventTypeFilter([])}
            className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            <X className="h-3 w-3" />
            Clear Filters
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">No timeline events found</p>
          {eventTypeFilter.length > 0 && (
            <button
              onClick={() => setEventTypeFilter([])}
              className="mt-4 text-sm text-kubota-orange hover:text-orange-600"
            >
              Clear filters to see all events
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div
              key={event.id}
              className={`relative rounded-lg border-l-4 p-4 ${getEventColor(event.event_type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{getEventIcon(event.event_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formatEventDescription(event)}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {new Date(event.occurred_at).toLocaleString()}
                      </p>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                            View details
                          </summary>
                          <div className="mt-2 rounded-md bg-white/50 p-2 text-xs">
                            <pre className="whitespace-pre-wrap break-words">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {nextCursor && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
