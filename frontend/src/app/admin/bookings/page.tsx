'use client';

import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  List,
  RefreshCw,
  Truck,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { AdvancedFilters, type DateRange } from '@/components/admin/AdvancedFilters';
import { BookingCalendarView } from '@/components/admin/BookingCalendarView';
import { BookingDetailsModal } from '@/components/admin/BookingDetailsModal';
import { BookingFilters } from '@/components/admin/BookingFilters';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { BulkEmailModal } from '@/components/admin/BulkEmailModal';
import { ConfirmationModal } from '@/components/admin/ConfirmationModal';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

interface Booking {
  id: string;
  bookingNumber: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  equipment: {
    id: string;
    name: string;
    model: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  total: number;
  createdAt: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  internalNotes?: string;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  balanceDueAt?: string | null;
  billingStatus?: string | null;
}

interface BookingFilters {
  status?: string;
  customerId?: string;
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface LogisticsItem {
  id: string;
  bookingNumber: string;
  status: string;
  scheduledAt: string;
  address?: string | null;
  customerName?: string;
  customerPhone?: string | null;
  equipmentName?: string | null;
}

const TABLE_PAGE_SIZE = 20;
const CALENDAR_FETCH_LIMIT = 500;

const normalizeStatusValue = (status?: string) => (status ? status.toLowerCase() : undefined);

const formatStatusLabel = (status?: string | null) => {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams?.get('customerId') ?? undefined;
  const initialBookingId = searchParams?.get('bookingId') ?? undefined;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | undefined>(initialBookingId);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [filters, setFilters] = useState<BookingFilters>(() => ({
    page: 1,
    limit: TABLE_PAGE_SIZE,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    customerId: initialCustomerId,
  }));
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [flaggedBookings, setFlaggedBookings] = useState<unknown[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<LogisticsItem[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<LogisticsItem[]>([]);
  const [nextReturnDate, setNextReturnDate] = useState<LogisticsItem | null>(null);
  const [showAllDeliveries, setShowAllDeliveries] = useState(false);
  const [showAllReturns, setShowAllReturns] = useState(false);
  const [isConnected, setIsConnected] = useState(true); // Supabase connection status
  const [advancedFilters, setAdvancedFilters] = useState<{
    dateRange?: DateRange;
    operators?: unknown[];
    multiSelects?: Record<string, string[]>;
  }>({});
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkActionMessage, setBulkActionMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBookings = useCallback(
    async (newFilters?: BookingFilters, retryAttempt = 0) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        setLoading(true);
        setError(null);

        const currentFilters = { ...filters, ...newFilters };

        // Build API URL with query parameters
        const params = new URLSearchParams();
        const page = currentFilters.page || 1;
        const limit = currentFilters.limit || 20;
        params.append('page', String(page));
        params.append('limit', String(limit));

        if (currentFilters.status) {
          const statusFilter = normalizeStatusValue(currentFilters.status);
          if (statusFilter) {
            params.append('status', statusFilter);
          }
        }
        if (currentFilters.customerId) {
          params.append('customerId', currentFilters.customerId);
        }
        if (currentFilters.equipmentId) {
          params.append('equipmentId', currentFilters.equipmentId);
        }
        if (currentFilters.startDate) {
          params.append('startDate', currentFilters.startDate);
        }
        if (currentFilters.endDate) {
          params.append('endDate', currentFilters.endDate);
        }
        if (currentFilters.search) {
          params.append('search', currentFilters.search);
        }
        if (currentFilters.sortBy) {
          params.append('sortBy', currentFilters.sortBy);
        }
        if (currentFilters.sortOrder) {
          params.append('sortOrder', currentFilters.sortOrder);
        }

        const response = await fetchWithAuth(`/api/admin/bookings?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const body = await response.json();
            errorMessage = body?.error || errorMessage;
            logger.error(
              'Bookings API returned error',
              {
                component: 'app-page',
                action: 'api_error',
                metadata: {
                  status: response.status,
                  statusText: response.statusText,
                  error: body?.error,
                  body,
                },
              },
              new Error(errorMessage)
            );
          } catch (parseError) {
            const text = await response.text().catch(() => 'Unable to read response');
            logger.error(
              'Failed to parse error response',
              {
                component: 'app-page',
                action: 'parse_error_response',
                metadata: {
                  status: response.status,
                  statusText: response.statusText,
                  responseText: text.substring(0, 500),
                },
              },
              parseError instanceof Error ? parseError : new Error(String(parseError))
            );
          }
          throw new Error(errorMessage);
        }

        const result = await response.json().catch((parseError) => {
          logger.error(
            'Failed to parse bookings response',
            {
              component: 'app-page',
              action: 'parse_error',
              metadata: { status: response.status, statusText: response.statusText },
            },
            parseError instanceof Error ? parseError : new Error(String(parseError))
          );
          throw new Error('Invalid response from server');
        });

        const data = result.bookings || [];
        const total = result.total || 0;

        if (!Array.isArray(data)) {
          logger.error(
            'Invalid bookings data format',
            {
              component: 'app-page',
              action: 'data_format_error',
              metadata: { resultType: typeof result, resultKeys: Object.keys(result || {}) },
            },
            new Error('Bookings data is not an array')
          );
          throw new Error('Invalid data format received from server');
        }

        // Transform data
        const bookingsData: Booking[] = (data as unknown[]).map((booking: unknown) => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          customer: {
            id: booking.customer?.id || '',
            firstName: booking.customer?.firstName || '',
            lastName: booking.customer?.lastName || '',
            email: booking.customer?.email || '',
            phone: booking.customer?.phone || '',
          },
          equipment: {
            id: booking.equipment?.id || '',
            name: `${booking.equipment?.make || 'Kubota'} ${booking.equipment?.model || 'SVL-75'}`,
            model: booking.equipment?.model || 'SVL-75',
          },
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status,
          total: parseFloat(booking.totalAmount || 0),
          createdAt: booking.createdAt,
          deliveryAddress: booking.deliveryAddress ?? null,
          specialInstructions: booking.specialInstructions ?? null,
          internalNotes: booking.internalNotes ?? null,
          depositAmount:
            booking.depositAmount !== undefined && booking.depositAmount !== null
              ? Number(booking.depositAmount)
              : null,
          balanceAmount:
            booking.balance_amount !== undefined && booking.balance_amount !== null
              ? Number(booking.balance_amount)
              : null,
          balanceDueAt: booking.balance_due_at ?? null,
          billingStatus: booking.billing_status ?? null,
        }));

        setBookings(bookingsData);
        setSelectedBookingIds((prev) =>
          prev.filter((id) => bookingsData.some((booking) => booking.id === id))
        );
        setPagination({
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        });
      } catch (err) {
        // Don't retry if request was aborted
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        // Retry on network errors
        if (
          retryAttempt < 3 &&
          (err instanceof TypeError || (err as Error).message.includes('fetch'))
        ) {
          const delay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
          setTimeout(() => {
            fetchBookings(newFilters, retryAttempt + 1);
          }, delay);
          return;
        }

        logger.error(
          'Failed to fetch bookings',
          {
            component: 'app-page',
            action: 'fetch_bookings_error',
            metadata: { retryAttempt },
          },
          err instanceof Error ? err : new Error(String(err))
        );
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
        abortControllerRef.current = null;
      }
    },
    [filters]
  );

  const fetchFlaggedBookings = useCallback(async (retryAttempt = 0) => {
    try {
      // Query bookings that might need attention (pending insurance, missing documents, etc.)
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          status,
          createdAt,
          customer:customerId (
            firstName,
            lastName,
            phone,
            email
          )
        `
        )
        .in('status', ['pending'])
        .order('createdAt', { ascending: true })
        .limit(10);

      if (error) throw error;
      setFlaggedBookings(data || []);
    } catch (err) {
      // Retry on network errors
      if (
        retryAttempt < 2 &&
        (err instanceof TypeError || (err as Error).message.includes('fetch'))
      ) {
        const delay = Math.min(1000 * Math.pow(2, retryAttempt), 5000);
        setTimeout(() => {
          fetchFlaggedBookings(retryAttempt + 1);
        }, delay);
        return;
      }

      logger.error(
        'Failed to fetch flagged bookings',
        {
          component: 'app-page',
          action: 'fetch_flagged_error',
          metadata: { retryAttempt },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setFlaggedBookings([]);
    }
  }, []);

  const fetchUpcomingDeliveries = useCallback(async () => {
    try {
      // Query bookings with upcoming start dates (next 7 days)
      // Use start of today (midnight) to include bookings starting today
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      weekFromNow.setHours(23, 59, 59, 999); // End of day 7 days from now

      // Include all statuses that represent scheduled bookings (not yet started)
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          startDate,
          deliveryAddress,
          status,
          customer:customerId (
            firstName,
            lastName,
            phone
          ),
          equipment:equipmentId (
            make,
            model
          )
        `
        )
        .gte('startDate', now.toISOString())
        .lte('startDate', weekFromNow.toISOString())
        .in('status', [
          'confirmed',
          'paid',
          'insurance_verified',
          'verify_hold_ok',
          'hold_placed',
          'deposit_scheduled',
        ])
        .order('startDate', { ascending: true })
        .limit(10);

      if (error) throw error;
      const mapped: LogisticsItem[] =
        (data || []).map((booking: unknown) => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          scheduledAt: booking.startDate,
          address: booking.deliveryAddress,
          customerName:
            [booking.customer?.firstName, booking.customer?.lastName].filter(Boolean).join(' ') ||
            undefined,
          customerPhone: booking.customer?.phone ?? null,
          equipmentName:
            [booking.equipment?.make, booking.equipment?.model].filter(Boolean).join(' ') ||
            undefined,
        })) ?? [];
      setUpcomingDeliveries(mapped);
    } catch (err) {
      logger.error(
        'Failed to fetch upcoming deliveries',
        {
          component: 'app-page',
          action: 'fetch_deliveries_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setUpcomingDeliveries([]);
    }
  }, []);

  const fetchUpcomingReturns = useCallback(async () => {
    try {
      // Use start of today (midnight) to include bookings ending today
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      weekFromNow.setHours(23, 59, 59, 999); // End of day 7 days from now

      // First, query for returns in the next 7 days
      // Include active rentals AND confirmed/paid bookings (scheduled to return)
      // Include all statuses that represent active or scheduled rentals
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          endDate,
          status,
          deliveryAddress,
          customer:customerId (
            firstName,
            lastName,
            phone
          ),
          equipment:equipmentId (
            make,
            model
          )
        `
        )
        .gte('endDate', now.toISOString())
        .lte('endDate', weekFromNow.toISOString())
        .in('status', [
          'in_progress',
          'ready_for_pickup',
          'delivered',
          'confirmed',
          'paid',
          'insurance_verified',
          'verify_hold_ok',
          'hold_placed',
          'deposit_scheduled',
        ])
        .order('endDate', { ascending: true })
        .limit(10);

      if (error) throw error;
      const mapped: LogisticsItem[] =
        (data || []).map((booking: unknown) => ({
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          scheduledAt: booking.endDate,
          address: booking.deliveryAddress,
          customerName:
            [booking.customer?.firstName, booking.customer?.lastName].filter(Boolean).join(' ') ||
            undefined,
          customerPhone: booking.customer?.phone ?? null,
          equipmentName:
            [booking.equipment?.make, booking.equipment?.model].filter(Boolean).join(' ') ||
            undefined,
        })) ?? [];
      setUpcomingReturns(mapped);

      // If no returns in the next week, find the next upcoming return (any future date)
      if (mapped.length === 0) {
        const { data: nextData, error: nextError } = await supabase
          .from('bookings')
          .select(
            `
            id,
            bookingNumber,
            endDate,
            status,
            deliveryAddress,
            customer:customerId (
              firstName,
              lastName,
              phone
            ),
            equipment:equipmentId (
              make,
              model
            )
          `
          )
          .gte('endDate', now.toISOString())
          .in('status', [
            'in_progress',
            'ready_for_pickup',
            'delivered',
            'confirmed',
            'paid',
            'insurance_verified',
            'verify_hold_ok',
            'hold_placed',
            'deposit_scheduled',
          ])
          .order('endDate', { ascending: true })
          .limit(1);

        if (!nextError && nextData && nextData.length > 0) {
          const nextReturn: LogisticsItem = {
            id: nextData[0].id,
            bookingNumber: nextData[0].bookingNumber,
            status: nextData[0].status,
            scheduledAt: nextData[0].endDate,
            address: nextData[0].deliveryAddress,
            customerName:
              [nextData[0].customer?.firstName, nextData[0].customer?.lastName]
                .filter(Boolean)
                .join(' ') || undefined,
            customerPhone: nextData[0].customer?.phone ?? null,
            equipmentName:
              [nextData[0].equipment?.make, nextData[0].equipment?.model]
                .filter(Boolean)
                .join(' ') || undefined,
          };
          setNextReturnDate(nextReturn);
        } else {
          setNextReturnDate(null);
        }
      } else {
        setNextReturnDate(null);
      }
    } catch (err) {
      logger.error(
        'Failed to fetch upcoming returns',
        {
          component: 'app-page',
          action: 'fetch_returns_error',
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setUpcomingReturns([]);
      setNextReturnDate(null);
    }
  }, []);

  useEffect(() => {
    const customerIdParam = searchParams?.get('customerId');

    if (customerIdParam && filters.customerId !== customerIdParam) {
      setFilters((prev) => ({ ...prev, customerId: customerIdParam, page: 1 }));
      fetchBookings({ customerId: customerIdParam, page: 1 });
    } else if (!customerIdParam && filters.customerId) {
      setFilters((prev) => ({ ...prev, customerId: undefined, page: 1 }));
      fetchBookings({ customerId: undefined, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filters.customerId]); // Removed fetchBookings to prevent infinite loop

  // Initial data fetch - only run once on mount
  useEffect(() => {
    fetchBookings();
    fetchFlaggedBookings();
    fetchUpcomingDeliveries();
    fetchUpcomingReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Use refs to store latest functions for realtime subscription
  const fetchBookingsRef = useRef(fetchBookings);
  const fetchFlaggedBookingsRef = useRef(fetchFlaggedBookings);
  const fetchUpcomingDeliveriesRef = useRef(fetchUpcomingDeliveries);
  const fetchUpcomingReturnsRef = useRef(fetchUpcomingReturns);

  // Update refs when functions change
  useEffect(() => {
    fetchBookingsRef.current = fetchBookings;
    fetchFlaggedBookingsRef.current = fetchFlaggedBookings;
    fetchUpcomingDeliveriesRef.current = fetchUpcomingDeliveries;
    fetchUpcomingReturnsRef.current = fetchUpcomingReturns;
  }, [fetchBookings, fetchFlaggedBookings, fetchUpcomingDeliveries, fetchUpcomingReturns]);

  // Subscribe to real-time booking updates - only set up once
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    // Subscribe to real-time booking updates using Supabase Realtime
    const channel = supabase
      .channel('admin-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Booking change detected:', {
              component: 'app-page',
              action: 'debug',
              metadata: { payload },
            });
          }
          // Debounce real-time updates to prevent excessive refreshes
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          debounceTimer = setTimeout(() => {
            // Use refs to access latest functions
            fetchBookingsRef.current();
            fetchFlaggedBookingsRef.current();
            fetchUpcomingDeliveriesRef.current();
            fetchUpcomingReturnsRef.current();
          }, 1000); // Increased debounce to 1 second
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup subscription on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      supabase.removeChannel(channel);
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty deps - only set up subscription once

  const handleFilterChange = (newFilters: Partial<BookingFilters>) => {
    const normalizedFilters: Partial<BookingFilters> = { ...newFilters };
    if (normalizedFilters.status) {
      normalizedFilters.status = normalizeStatusValue(normalizedFilters.status);
    }

    const updatedFilters = { ...filters, ...normalizedFilters, page: 1 };
    setFilters(updatedFilters);
    fetchBookings(updatedFilters);
  };

  const handlePageChange = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    fetchBookings(updatedFilters);
  };

  const handleViewModeChange = (mode: 'table' | 'calendar') => {
    setViewMode(mode);
    if (mode === 'calendar') {
      const updatedFilters: BookingFilters = {
        ...filters,
        page: 1,
        limit: CALENDAR_FETCH_LIMIT,
        sortBy: 'startDate',
        sortOrder: 'ASC',
      };
      setFilters(updatedFilters);
      fetchBookings(updatedFilters);
    } else {
      const updatedFilters: BookingFilters = {
        ...filters,
        page: 1,
        limit: TABLE_PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      setFilters(updatedFilters);
      fetchBookings(updatedFilters);
    }
  };

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookingIds((prev) =>
      prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = bookings.map((booking) => booking.id);
    const hasAllVisible =
      visibleIds.length > 0 && visibleIds.every((id) => selectedBookingIds.includes(id));

    if (hasAllVisible) {
      setSelectedBookingIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      const merged = new Set(selectedBookingIds);
      visibleIds.forEach((id) => merged.add(id));
      setSelectedBookingIds(Array.from(merged));
    }
  };

  const performBulkAction = async (payload: {
    operation: 'update_status' | 'delete';
    status?: string;
  }) => {
    if (selectedBookingIds.length === 0 || bulkActionLoading) return;

    try {
      setBulkActionLoading(true);
      setBulkActionError(null);
      setBulkActionMessage(null);

      const response = await fetchWithAuth('/api/admin/bookings/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingIds: selectedBookingIds,
          operation: payload.operation,
          status: payload.status,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Bulk action failed');
      }

      const { affected } = await response.json();
      setBulkActionMessage(
        `${affected} booking${affected === 1 ? '' : 's'} ${
          payload.operation === 'delete' ? 'deleted' : 'updated'
        } successfully.`
      );

      await fetchBookings();
      setSelectedBookingIds([]);
    } catch (bulkError) {
      setBulkActionError(
        bulkError instanceof Error ? bulkError.message : 'Failed to perform bulk action'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkStatusChange = (status: string) => {
    performBulkAction({ operation: 'update_status', status });
  };

  const handleBulkDelete = () => {
    if (selectedBookingIds.length > 0) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmBulkDelete = () => {
    setShowDeleteConfirm(false);
    performBulkAction({ operation: 'delete' });
  };

  const handleBulkExport = async () => {
    if (selectedBookingIds.length === 0 || bulkActionLoading) return;

    try {
      setBulkActionLoading(true);
      setBulkActionError(null);
      setBulkActionMessage(null);

      const response = await fetchWithAuth('/api/admin/bookings/bulk-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingIds: selectedBookingIds,
          format: 'csv',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setBulkActionMessage(
        `Exported ${selectedBookingIds.length} booking${selectedBookingIds.length === 1 ? '' : 's'} successfully.`
      );
      setSelectedBookingIds([]);
    } catch (exportError) {
      setBulkActionError(
        exportError instanceof Error ? exportError.message : 'Failed to export bookings'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkEmail = () => {
    if (selectedBookingIds.length === 0 || bulkActionLoading) return;
    setShowEmailModal(true);
  };

  const submitBulkEmail = async (subject: string, message: string) => {
    setShowEmailModal(false);
    if (!subject.trim() || !message.trim()) return;

    try {
      setBulkActionLoading(true);
      setBulkActionError(null);
      setBulkActionMessage(null);

      const response = await fetchWithAuth('/api/admin/bookings/bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingIds: selectedBookingIds,
          subject: subject.trim(),
          message: message.trim(),
          emailType: 'custom',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Email send failed');
      }

      const { successful, failed } = await response.json();
      setBulkActionMessage(
        `Sent ${successful} email${successful === 1 ? '' : 's'} successfully.${failed > 0 ? ` ${failed} failed.` : ''}`
      );
      setSelectedBookingIds([]);
    } catch (emailError) {
      logger.error(
        'Failed to send bulk emails',
        {
          component: 'app-page',
          action: 'bulk_email_error',
          metadata: { bookingCount: selectedBookingIds.length },
        },
        emailError instanceof Error ? emailError : new Error(String(emailError))
      );
      setBulkActionError(
        emailError instanceof Error ? emailError.message : 'Failed to send emails'
      );
    } finally {
      setBulkActionLoading(false);
    }
  };


  const formatDateTime = (value?: string | null) => {
    if (!value) return 'TBD';
    return new Date(value).toLocaleString('en-CA', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const fetchBookingById = useCallback(async (bookingId: string): Promise<Booking | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(
          `
          id,
          bookingNumber,
          startDate,
          endDate,
          status,
          totalAmount,
          createdAt,
          deliveryAddress,
          specialInstructions,
          internalNotes,
          depositAmount,
          balanceAmount:balance_amount,
          balanceDueAt:balance_due_at,
          billingStatus:billing_status,
          equipment:equipmentId (
            id,
            make,
            model
          ),
          customer:customerId (
            id,
            firstName,
            lastName,
            email,
            phone
          )
        `
        )
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Booking not found');

      // Type assertion needed due to complex query with joins
      const bookingData = data as unknown as Record<string, unknown>;

      const booking: Booking = {
        id: bookingData.id,
        bookingNumber: bookingData.bookingNumber,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        status: bookingData.status,
        total: parseFloat(bookingData.totalAmount),
        createdAt: bookingData.createdAt,
        deliveryAddress: bookingData.deliveryAddress ?? undefined,
        specialInstructions: bookingData.specialInstructions ?? undefined,
        internalNotes: bookingData.internalNotes ?? undefined,
        depositAmount:
          bookingData.depositAmount !== undefined && bookingData.depositAmount !== null
            ? Number(bookingData.depositAmount)
            : null,
        balanceAmount:
          bookingData.balanceAmount !== undefined && bookingData.balanceAmount !== null
            ? Number(bookingData.balanceAmount)
            : bookingData.balance_amount !== undefined && bookingData.balance_amount !== null
              ? Number(bookingData.balance_amount)
              : null,
        balanceDueAt: bookingData.balanceDueAt ?? bookingData.balance_due_at ?? null,
        billingStatus: bookingData.billingStatus ?? bookingData.billing_status ?? null,
        equipment: {
          id: bookingData.equipment?.id || '',
          name: `${bookingData.equipment?.make || 'Kubota'} ${bookingData.equipment?.model || 'SVL-75'}`,
          model: bookingData.equipment?.model || 'SVL-75',
        },
        customer: {
          id: bookingData.customer?.id || '',
          firstName: bookingData.customer?.firstName || '',
          lastName: bookingData.customer?.lastName || '',
          email: bookingData.customer?.email || '',
          phone: bookingData.customer?.phone || '',
        },
      };

      return booking;
    } catch (err) {
      logger.error(
        'Failed to fetch booking by ID',
        {
          component: 'app-page',
          action: 'fetch_booking_by_id_error',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      return null;
    }
  }, []);

  const handleBookingSelect = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
    setPendingBookingId(undefined);
    router.replace(`/admin/bookings?bookingId=${booking.id}`, { scroll: false });
  };

  useEffect(() => {
    if (!pendingBookingId) return;

    const match = bookings.find((booking) => booking.id === pendingBookingId);
    if (match) {
      setSelectedBooking(match);
      setShowDetailsModal(true);
      setPendingBookingId(undefined);
      return;
    }

    let isMounted = true;
    (async () => {
      const fetched = await fetchBookingById(pendingBookingId);
      if (!isMounted) return;
      if (fetched) {
        setSelectedBooking(fetched);
        setShowDetailsModal(true);
      }
      setPendingBookingId(undefined);
    })();

    return () => {
      isMounted = false;
    };
  }, [pendingBookingId, bookings, fetchBookingById]);

  const handleBookingUpdate = async (bookingId: string, updates: Record<string, unknown>) => {
    try {
      const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update booking');
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[Admin Bookings] Booking updated successfully:', {
          component: 'app-page',
          action: 'debug',
          metadata: { bookingId },
        });
      }

      // Refresh data
      fetchBookings();
      fetchFlaggedBookings();
      fetchUpcomingDeliveries();
      fetchUpcomingReturns();
    } catch (err) {
      logger.error(
        'Failed to update booking',
        {
          component: 'app-page',
          action: 'update_booking_error',
          metadata: { bookingId },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to update booking status');
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[Admin Bookings] Booking status updated:', {
          component: 'app-page',
          action: 'debug',
          metadata: { bookingId, status },
        });
      }

      // Refresh data
      fetchBookings();
      fetchFlaggedBookings();
      fetchUpcomingDeliveries();
      fetchUpcomingReturns();
    } catch (err) {
      logger.error(
        'Failed to update booking status',
        {
          component: 'app-page',
          action: 'update_status_error',
          metadata: { bookingId, status },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to update booking status');
    }
  };

  const handleCancelBooking = async (bookingId: string, reason?: string) => {
    try {
      const response = await fetchWithAuth(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancellationReason: reason || 'Cancelled by admin',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to cancel booking');
      }

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[Admin Bookings] Booking cancelled:', {
          component: 'app-page',
          action: 'debug',
          metadata: { bookingId, reason },
        });
      }

      // Refresh data
      fetchBookings();
      fetchFlaggedBookings();
      fetchUpcomingDeliveries();
      fetchUpcomingReturns();
    } catch (err) {
      logger.error(
        'Failed to cancel booking',
        {
          component: 'app-page',
          action: 'cancel_booking_error',
          metadata: { bookingId, reason },
        },
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }
        params.append(key, String(value));
      });

      const url = `/api/bookings/export${params.size > 0 ? `?${params.toString()}` : ''}`;
      const response = await fetchWithAuth(url);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      // Error logged in development mode only
      setError(err instanceof Error ? err.message : 'Failed to export bookings');
    }
  };

  const handleRefresh = () => {
    fetchBookings();
    fetchFlaggedBookings();
    fetchUpcomingDeliveries();
    fetchUpcomingReturns();
  };

  return (
    <div className="space-y-6">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" id="page-title">
            Booking Management
          </h1>
          <p className="text-gray-600" id="page-description">
            Manage all bookings, view schedules, and track deliveries.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* WebSocket connection indicator */}
          <div className="flex items-center space-x-2" role="status" aria-live="polite">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              aria-hidden="true"
            ></div>
            <span
              className="text-sm text-gray-500"
              aria-label={`Connection status: ${isConnected ? 'Live' : 'Offline'}`}
            >
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1" role="group" aria-label="View mode">
            <button
              onClick={() => handleViewModeChange('table')}
              aria-pressed={viewMode === 'table'}
              aria-label="View bookings as table"
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="mr-1 inline h-4 w-4" aria-hidden="true" />
              Table
            </button>
            <button
              onClick={() => handleViewModeChange('calendar')}
              aria-pressed={viewMode === 'calendar'}
              aria-label="View bookings as calendar"
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="mr-1 inline h-4 w-4" aria-hidden="true" />
              Calendar
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleExport}
            aria-label="Export bookings to CSV"
            className="flex items-center space-x-2 rounded-md bg-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh bookings data"
            aria-busy={loading}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {flaggedBookings.length > 0 && (
        <div
          className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" aria-hidden="true" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-yellow-900" id="flagged-bookings-title">
                {flaggedBookings.length} booking
                {flaggedBookings.length === 1 ? '' : 's'} need attention
              </h3>
              <p className="mt-1 text-xs text-yellow-800">
                Review these bookings for missing insurance, pending deposits, or other blockers.
              </p>

              <div className="mt-3 space-y-2">
                {flaggedBookings.slice(0, 3).map((booking: unknown) => {
                  const customerName =
                    [booking.customer?.firstName, booking.customer?.lastName]
                      .filter(Boolean)
                      .join(' ') || 'Customer';
                  const created = booking.createdAt
                    ? new Date(booking.createdAt).toLocaleDateString('en-CA', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A';
                  return (
                    <div
                      key={booking.id}
                      className="rounded-md border border-yellow-200 bg-white/60 p-3 text-xs text-yellow-900 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{booking.bookingNumber}</span>
                        <span className="text-[10px] uppercase tracking-wide text-yellow-600">
                          {formatStatusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-yellow-800">
                        {customerName} • Created {created}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => {
                            const match = bookings.find((b) => b.id === booking.id);
                            if (match) {
                              handleBookingSelect(match);
                            }
                          }}
                          className="text-[11px] font-medium text-yellow-700 hover:text-yellow-900"
                        >
                          View booking
                        </button>
                        {booking.customer?.phone && (
                          <a
                            href={`tel:${booking.customer.phone}`}
                            className="text-[11px] font-medium text-yellow-700 hover:text-yellow-900"
                          >
                            Call customer
                          </a>
                        )}
                        {booking.customer?.email && (
                          <a
                            href={`mailto:${booking.customer.email}`}
                            className="text-[11px] font-medium text-yellow-700 hover:text-yellow-900"
                          >
                            Email customer
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
                {flaggedBookings.length > 3 && (
                  <p className="text-[11px] text-yellow-800">
                    +{flaggedBookings.length - 3} additional booking
                    {flaggedBookings.length - 3 === 1 ? '' : 's'} flagged — apply filters to view
                    all.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(upcomingDeliveries.length > 0 || upcomingReturns.length > 0) && (
        <div
          className="rounded-lg bg-white p-4 shadow"
          role="region"
          aria-labelledby="logistics-schedule-title"
        >
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
              <h2 id="logistics-schedule-title" className="text-lg font-semibold text-gray-900">
                Delivery & Return Schedule
              </h2>
              <p className="text-sm text-gray-500">
                Logistics tasks scheduled over the next seven days.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Truck className="h-4 w-4 text-blue-500" />
              <span>
                {upcomingDeliveries.length} deliveries · {upcomingReturns.length} returns
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div role="region" aria-labelledby="deliveries-title">
              <h3
                id="deliveries-title"
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700"
              >
                <Truck className="h-4 w-4" aria-hidden="true" />
                Upcoming Deliveries
              </h3>
              <div className="space-y-3">
                {upcomingDeliveries.length === 0 ? (
                  <p className="rounded-md border border-dashed border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    No deliveries scheduled in the next week.
                  </p>
                ) : (
                  <>
                    {(showAllDeliveries ? upcomingDeliveries : upcomingDeliveries.slice(0, 1)).map(
                      (booking) => (
                        <div
                          key={booking.id}
                          className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{booking.bookingNumber}</span>
                            <span className="text-xs uppercase tracking-wide text-blue-500">
                              {formatStatusLabel(booking.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-blue-700">
                            {formatDateTime(booking.scheduledAt)}
                          </p>
                          {booking.equipmentName && (
                            <p className="mt-2 text-xs text-blue-800">
                              Equipment:{' '}
                              <span className="font-medium">{booking.equipmentName}</span>
                            </p>
                          )}
                          {booking.address && (
                            <p className="mt-1 text-xs text-blue-800">
                              Address: <span className="font-medium">{booking.address}</span>
                            </p>
                          )}
                          {booking.customerName && (
                            <p className="mt-1 text-xs text-blue-800">
                              Customer: <span className="font-medium">{booking.customerName}</span>
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            <button
                              onClick={() => {
                                const match = bookings.find((b) => b.id === booking.id);
                                if (match) {
                                  handleBookingSelect(match);
                                }
                              }}
                              aria-label={`View booking ${booking.bookingNumber}`}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              View booking
                            </button>
                            {booking.customerPhone && (
                              <a
                                href={`tel:${booking.customerPhone}`}
                                aria-label={`Call customer for booking ${booking.bookingNumber}`}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                Call customer
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    )}
                    {upcomingDeliveries.length > 1 && (
                      <button
                        onClick={() => setShowAllDeliveries(!showAllDeliveries)}
                        aria-expanded={showAllDeliveries}
                        aria-controls="deliveries-list"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {showAllDeliveries ? (
                          <>
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            <span>Show less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            <span>See all ({upcomingDeliveries.length - 1} more)</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div role="region" aria-labelledby="returns-title">
              <h3
                id="returns-title"
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Upcoming Returns
              </h3>
              <div className="space-y-3">
                {upcomingReturns.length === 0 ? (
                  nextReturnDate ? (
                    <div className="rounded-md border border-dashed border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                      <p className="mb-2 font-medium">No returns scheduled in the next week.</p>
                      <p className="text-xs">
                        Next return:{' '}
                        <span className="font-semibold">{nextReturnDate.bookingNumber}</span> on{' '}
                        <span className="font-semibold">
                          {formatDateTime(nextReturnDate.scheduledAt)}
                        </span>
                        {nextReturnDate.equipmentName && (
                          <span className="block mt-1">
                            Equipment:{' '}
                            <span className="font-medium">{nextReturnDate.equipmentName}</span>
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-md border border-dashed border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                      No returns scheduled in the next week.
                    </p>
                  )
                ) : (
                  <>
                    {(showAllReturns ? upcomingReturns : upcomingReturns.slice(0, 1)).map(
                      (booking) => (
                        <div
                          key={booking.id}
                          className="rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{booking.bookingNumber}</span>
                            <span className="text-xs uppercase tracking-wide text-emerald-500">
                              {formatStatusLabel(booking.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-emerald-700">
                            {formatDateTime(booking.scheduledAt)}
                          </p>
                          {booking.equipmentName && (
                            <p className="mt-2 text-xs text-emerald-800">
                              Equipment:{' '}
                              <span className="font-medium">{booking.equipmentName}</span>
                            </p>
                          )}
                          {booking.address && (
                            <p className="mt-1 text-xs text-emerald-800">
                              Return to: <span className="font-medium">{booking.address}</span>
                            </p>
                          )}
                          {booking.customerName && (
                            <p className="mt-1 text-xs text-emerald-800">
                              Customer: <span className="font-medium">{booking.customerName}</span>
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            <button
                              onClick={() => {
                                const match = bookings.find((b) => b.id === booking.id);
                                if (match) {
                                  handleBookingSelect(match);
                                }
                              }}
                              aria-label={`View booking ${booking.bookingNumber}`}
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                              View booking
                            </button>
                            {booking.customerPhone && (
                              <a
                                href={`tel:${booking.customerPhone}`}
                                aria-label={`Call customer for booking ${booking.bookingNumber}`}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                              >
                                Call customer
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    )}
                    {upcomingReturns.length > 1 && (
                      <button
                        onClick={() => setShowAllReturns(!showAllReturns)}
                        aria-expanded={showAllReturns}
                        aria-controls="returns-list"
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                      >
                        {showAllReturns ? (
                          <>
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            <span>Show less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            <span>See all ({upcomingReturns.length - 1} more)</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800" id="error-title">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700" id="error-message">
                <p>{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  fetchBookings();
                }}
                className="mt-3 text-sm font-medium text-red-800 underline hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                aria-label="Retry fetching bookings"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkActionError && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
          aria-live="assertive"
        >
          {bulkActionError}
        </div>
      )}

      {bulkActionMessage && (
        <div
          className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          role="status"
          aria-live="polite"
        >
          {bulkActionMessage}
        </div>
      )}

      {selectedBookingIds.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-800">
                {selectedBookingIds.length} booking{selectedBookingIds.length === 1 ? '' : 's'}{' '}
                selected
              </p>
              <p className="text-xs text-gray-500">Choose a bulk action below.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkStatusChange('confirmed')}
                disabled={bulkActionLoading}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark Confirmed
              </button>
              <button
                onClick={() => handleBulkStatusChange('cancelled')}
                disabled={bulkActionLoading}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark Cancelled
              </button>
              <button
                onClick={handleBulkExport}
                disabled={bulkActionLoading}
                className="rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                onClick={handleBulkEmail}
                disabled={bulkActionLoading}
                className="rounded-md border border-green-200 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send Email
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div
        className="space-y-4 rounded-lg bg-white p-4 shadow"
        role="region"
        aria-labelledby="filters-title"
      >
        <h2 id="filters-title" className="sr-only">
          Booking Filters
        </h2>
        <BookingFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Advanced Filters */}
        <div className="border-t border-gray-200 pt-4">
          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            availableFields={[
              { label: 'Booking Number', value: 'bookingNumber', type: 'text' },
              { label: 'Customer Name', value: 'customerName', type: 'text' },
              { label: 'Customer Email', value: 'customerEmail', type: 'text' },
              { label: 'Equipment Name', value: 'equipmentName', type: 'text' },
              { label: 'Total Amount', value: 'totalAmount', type: 'number' },
              { label: 'Start Date', value: 'startDate', type: 'date' },
              { label: 'End Date', value: 'endDate', type: 'date' },
              { label: 'Created Date', value: 'createdAt', type: 'date' },
              {
                label: 'Status',
                value: 'status',
                type: 'select',
                options: [
                  { label: 'Pending', value: 'pending' },
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Paid', value: 'paid' },
                  { label: 'Insurance Verified', value: 'insurance_verified' },
                  { label: 'Ready for Pickup', value: 'ready_for_pickup' },
                  { label: 'Delivered', value: 'delivered' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' },
                ],
              },
            ]}
            multiSelectFields={[
              {
                label: 'Status',
                value: 'status',
                options: [
                  { label: 'Pending', value: 'pending' },
                  { label: 'Confirmed', value: 'confirmed' },
                  { label: 'Paid', value: 'paid' },
                  { label: 'Insurance Verified', value: 'insurance_verified' },
                  { label: 'Ready for Pickup', value: 'ready_for_pickup' },
                  { label: 'Delivered', value: 'delivered' },
                  { label: 'In Progress', value: 'in_progress' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Cancelled', value: 'cancelled' },
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <div
        id="main-content"
        className="rounded-lg bg-white shadow"
        role="main"
        aria-labelledby="page-title"
      >
        {viewMode === 'table' ? (
          <BookingsTable
            bookings={bookings}
            loading={loading}
            pagination={pagination}
            onBookingSelect={handleBookingSelect}
            onBookingUpdate={handleBookingUpdate}
            onStatusUpdate={handleStatusUpdate}
            onCancelBooking={handleCancelBooking}
            onPageChange={handlePageChange}
            selectedBookingIds={selectedBookingIds}
            onToggleBookingSelection={toggleBookingSelection}
            onToggleSelectAll={toggleSelectAll}
          />
        ) : (
          <BookingCalendarView
            bookings={bookings}
            loading={loading}
            onBookingSelect={handleBookingSelect}
          />
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={showDetailsModal}
          onClose={() => {
            try {
              setShowDetailsModal(false);
              setSelectedBooking(null);
              // Use push instead of replace to avoid router errors
              // Remove bookingId from URL if present
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.delete('bookingId');
              router.push(currentUrl.pathname + currentUrl.search);
            } catch (error) {
              logger.error('Error closing booking modal', {
                component: 'admin-bookings-page',
                action: 'modal_close_error',
                metadata: { error: error instanceof Error ? error.message : String(error) },
              }, error instanceof Error ? error : undefined);
              // Fallback: just close modal without navigation
              setShowDetailsModal(false);
              setSelectedBooking(null);
            }
          }}
          onUpdate={handleBookingUpdate}
          onStatusUpdate={handleStatusUpdate}
          onCancel={handleCancelBooking}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Bookings"
        message={`Are you sure you want to delete ${selectedBookingIds.length} booking${selectedBookingIds.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={bulkActionLoading}
      />

      {/* Bulk Email Modal */}
      <BulkEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={submitBulkEmail}
        isLoading={bulkActionLoading}
      />
    </div>
  );
}
