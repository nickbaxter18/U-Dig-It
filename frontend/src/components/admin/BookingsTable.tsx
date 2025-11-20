'use client';

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Edit,
  Eye,
  Mail,
  MoreVertical,
  Package,
  Phone,
  User,
  X,
} from 'lucide-react';

import { Fragment, useEffect, useRef, useState } from 'react';

import { PermissionGate } from '@/components/admin/PermissionGate';

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
}

interface BookingsTableProps {
  bookings: Booking[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onBookingSelect: (booking: Booking) => void;
  onBookingUpdate: (bookingId: string, updates: Record<string, unknown>) => void;
  onStatusUpdate: (bookingId: string, status: string) => void;
  onCancelBooking: (bookingId: string, reason?: string) => void;
  onPageChange: (page: number) => void;
  selectedBookingIds: string[];
  onToggleBookingSelection: (bookingId: string) => void;
  onToggleSelectAll: () => void;
}

export function BookingsTable({
  bookings,
  loading,
  pagination,
  onBookingSelect,
  onBookingUpdate: _onBookingUpdate,
  onStatusUpdate,
  onCancelBooking,
  onPageChange,
  selectedBookingIds,
  onToggleBookingSelection,
  onToggleSelectAll,
}: BookingsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionMenus, setActionMenus] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allVisibleSelected =
    bookings.length > 0 && bookings.every((booking) => selectedBookingIds.includes(booking.id));
  const someSelected = selectedBookingIds.length > 0 && !allVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected, allVisibleSelected]);

  const _toggleRowExpansion = (bookingId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId);
    } else {
      newExpanded.add(bookingId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleActionMenu = (bookingId: string) => {
    const newMenus = new Set(actionMenus);
    if (newMenus.has(bookingId)) {
      newMenus.delete(bookingId);
    } else {
      newMenus.add(bookingId);
    }
    setActionMenus(newMenus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'INSURANCE_VERIFIED':
        return 'bg-purple-100 text-purple-800';
      case 'READY_FOR_PICKUP':
        return 'bg-indigo-100 text-indigo-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'DELIVERED':
        return 'bg-cyan-100 text-cyan-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        className="flex h-64 items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
        <p className="text-sm text-gray-500">No bookings found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-4">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
                  aria-label="Select all bookings"
                  checked={allVisibleSelected}
                  onChange={(event) => {
                    event.stopPropagation();
                    onToggleSelectAll();
                  }}
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                Booking
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                Customer
              </th>
              <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell lg:px-6">
                Equipment
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                Dates
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                Status
              </th>
              <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell lg:px-6">
                Total
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:px-6">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {bookings.map((booking) => {
              const isSelected = selectedBookingIds.includes(booking.id);
              return (
                <Fragment key={booking.id}>
                  <tr
                    className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-orange-50/30' : ''}`}
                    onClick={() => onBookingSelect(booking)}
                  >
                    <td
                      className="px-3 py-4 lg:px-4"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-kubota-orange focus:ring-kubota-orange"
                        checked={isSelected}
                        onChange={(event) => {
                          event.stopPropagation();
                          onToggleBookingSelection(booking.id);
                        }}
                        aria-label={`Select booking ${booking.bookingNumber}`}
                      />
                    </td>
                    <td className="px-3 py-4 lg:px-6">
                      <div className="flex items-center">
                        <div className="hidden h-10 w-10 flex-shrink-0 sm:block">
                          <div className="bg-kubota-orange flex h-10 w-10 items-center justify-center rounded-full">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="sm:ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.bookingNumber}
                          </div>
                          <div className="text-xs text-gray-500 sm:text-sm">
                            {formatDate(booking.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 lg:px-6">
                      <div className="flex items-center">
                        <div className="hidden h-8 w-8 flex-shrink-0 sm:block">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="min-w-0 sm:ml-3">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {booking.customer.firstName} {booking.customer.lastName}
                          </div>
                          <div className="truncate text-xs text-gray-500 sm:text-sm">
                            {booking.customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-4 md:table-cell lg:px-6">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                            <Package className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-3 min-w-0">
                          <div className="truncate text-sm font-medium text-gray-900">
                            {booking.equipment.name}
                          </div>
                          <div className="truncate text-sm text-gray-500">
                            {booking.equipment.model}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 lg:px-6">
                      <div className="text-xs text-gray-900 sm:text-sm">
                        {formatDate(booking.startDate)}
                      </div>
                      <div className="text-xs text-gray-500 sm:text-sm">
                        to {formatDate(booking.endDate)}
                      </div>
                    </td>
                    <td className="px-3 py-4 lg:px-6">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}
                      >
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="hidden px-3 py-4 sm:table-cell lg:px-6">
                      <div className="flex items-center">
                        <DollarSign className="mr-1 h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.total)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right text-sm font-medium lg:px-6">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onBookingSelect(booking);
                          }}
                          aria-label="View booking details"
                          className="text-kubota-orange hover:text-orange-600"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">View details</span>
                        </button>
                        {booking.customer.phone && (
                          <a
                            href={`tel:${booking.customer.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="Call customer"
                          >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                        {booking.customer.email && (
                          <a
                            href={`mailto:${booking.customer.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-700"
                            aria-label="Email customer"
                          >
                            <Mail className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(booking.id);
                            }}
                            aria-label="More actions"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {actionMenus.has(booking.id) && (
                            <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onBookingSelect(booking);
                                    setActionMenus(new Set());
                                  }}
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </button>
                                <PermissionGate permission="bookings:update:all">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Handle edit
                                      setActionMenus(new Set());
                                    }}
                                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Booking
                                  </button>
                                </PermissionGate>
                                {booking.status !== 'CANCELLED' && (
                                  <PermissionGate permission="bookings:cancel:all">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const confirmed = window.confirm(
                                          'Are you sure you want to cancel this booking?'
                                        );
                                        if (confirmed) {
                                          onCancelBooking(booking.id);
                                        }
                                        setActionMenus(new Set());
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Cancel Booking
                                    </button>
                                  </PermissionGate>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(booking.id) && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 px-3 py-4 lg:px-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-gray-900">
                              Booking Details
                            </h4>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div>ID: {booking.id}</div>
                              <div>Created: {formatDate(booking.createdAt)}</div>
                              <div>
                                Duration:{' '}
                                {Math.ceil(
                                  (new Date(booking.endDate).getTime() -
                                    new Date(booking.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{' '}
                                days
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-gray-900">
                              Quick Actions
                            </h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => onBookingSelect(booking)}
                                className="bg-kubota-orange rounded px-3 py-1 text-xs text-white hover:bg-orange-600"
                              >
                                View Full Details
                              </button>
                              <PermissionGate permission="bookings:update:all">
                                <button
                                  onClick={() => {
                                    const newStatus = prompt('New status:', booking.status);
                                    if (newStatus && newStatus !== booking.status) {
                                      onStatusUpdate(booking.id, newStatus);
                                    }
                                  }}
                                  className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                                >
                                  Update Status
                                </button>
                              </PermissionGate>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm font-medium text-gray-700" aria-live="polite">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'bg-kubota-orange border-kubota-orange z-10 text-white'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
