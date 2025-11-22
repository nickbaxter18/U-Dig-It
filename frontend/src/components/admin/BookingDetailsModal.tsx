'use client';

import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react';

import { useCallback, useEffect, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { BookingFinancePanel } from '@/components/admin/finance/BookingFinancePanel';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { EmailCustomerModal } from './EmailCustomerModal';

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

interface BookingDetailsModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (bookingId: string, updates: Record<string, unknown>) => void;
  onStatusUpdate: (bookingId: string, status: string) => void;
  onCancel: (bookingId: string, reason?: string) => void;
}

interface BookingPayment {
  id: string;
  paymentNumber?: string | null;
  amount: number;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  type?: string | null;
  method?: 'card' | 'bank_transfer' | 'cash' | 'check';
  createdAt?: string | null;
  processedAt?: string | null;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  refundAmount?: number;
  refundReason?: string | null;
  failureReason?: string | null;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onUpdate,
  onStatusUpdate,
  onCancel,
}: BookingDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<
    'details' | 'payments' | 'communications' | 'documents'
  >('details');
  const [internalNotes, setInternalNotes] = useState(booking.internalNotes || '');
  const [showNotesEdit, setShowNotesEdit] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [stripeLinkLoadingId, setStripeLinkLoadingId] = useState<string | null>(null);

  const mapPaymentStatus = useCallback((status?: string | null): BookingPayment['status'] => {
    const normalized = (status ?? '').toLowerCase();
    switch (normalized) {
      case 'completed':
      case 'succeeded':
        return 'succeeded';
      case 'refunded':
        return 'refunded';
      case 'partially_refunded':
        return 'partially_refunded';
      case 'failed':
      case 'cancelled':
        return 'failed';
      case 'processing':
      case 'pending':
        return 'pending';
      default:
        return 'pending';
    }
  }, []);

  const mapPaymentMethod = useCallback((method?: string | null): BookingPayment['method'] => {
    const normalized = (method ?? '').toLowerCase();
    switch (normalized) {
      case 'credit_card':
      case 'debit_card':
      case 'card':
        return 'card';
      case 'bank_transfer':
        return 'bank_transfer';
      case 'cash':
        return 'cash';
      case 'check':
      case 'cheque':
        return 'check';
      default:
        return 'card';
    }
  }, []);

  useEffect(() => {
    if (!isOpen || activeTab !== 'payments') {
      return;
    }

    let isMounted = true;

    const loadPayments = async () => {
      setPaymentsLoading(true);
      setPaymentsError(null);
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(
            `
            id,
            paymentNumber,
            amount,
            status,
            type,
            method,
            "stripePaymentIntentId",
            "stripeCheckoutSessionId",
            "processedAt",
            "createdAt",
            "amountRefunded",
            "refundReason",
            "failureReason"
          `
          )
          .eq('bookingId', booking.id)
          .order('createdAt', { ascending: false });

        if (error) throw error;

        const mapped: BookingPayment[] = (data ?? []).map((payment: unknown) => {
          const amount =
            typeof payment.amount === 'string' ? parseFloat(payment.amount) : (payment.amount ?? 0);
          const refundAmountRaw = payment.amountRefunded ?? null;
          const refundAmount =
            refundAmountRaw === null
              ? undefined
              : typeof refundAmountRaw === 'string'
                ? parseFloat(refundAmountRaw)
                : Number(refundAmountRaw);

          return {
            id: payment.id,
            paymentNumber: payment.paymentNumber ?? null,
            amount,
            status: mapPaymentStatus(payment.status),
            type: payment.type ?? null,
            method: mapPaymentMethod(payment.method),
            createdAt: payment.createdAt ?? null,
            processedAt: payment.processedAt ?? null,
            stripePaymentIntentId: payment.stripePaymentIntentId ?? null,
            stripeCheckoutSessionId: payment.stripeCheckoutSessionId ?? null,
            refundAmount,
            refundReason: payment.refundReason ?? null,
            failureReason: payment.failureReason ?? null,
          };
        });

        if (isMounted) {
          setPayments(mapped);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load payments';
        if (process.env.NODE_ENV === 'development') {
          logger.error(
            'Failed to load booking payments',
            {
              component: 'BookingDetailsModal',
              action: 'payments_fetch_error',
              metadata: { bookingId: booking.id, error: message },
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
        if (isMounted) {
          setPayments([]);
          setPaymentsError(message);
        }
      } finally {
        if (isMounted) {
          setPaymentsLoading(false);
        }
      }
    };

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, booking.id, mapPaymentMethod, mapPaymentStatus]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('cancel')) return 'bg-red-100 text-red-800';
    if (statusLower.includes('complet')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('paid')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('confirmed')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('deliver')) return 'bg-cyan-100 text-cyan-800';
    if (statusLower.includes('progress')) return 'bg-orange-100 text-orange-800';
    if (statusLower.includes('ready')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const calculateDuration = () => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentStatusClasses = (status: BookingPayment['status']) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'partially_refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status: BookingPayment['status']) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-red-600" />;
      case 'refunded':
      case 'partially_refunded':
        return <DollarSign className="h-3.5 w-3.5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method?: BookingPayment['method']) => {
    switch (method) {
      case 'card':
        return 'Card';
      case 'bank_transfer':
        return 'Bank transfer';
      case 'cash':
        return 'Cash';
      case 'check':
        return 'Cheque';
      default:
        return 'Payment method';
    }
  };

  const getPaymentTypeLabel = (type?: string | null) => {
    if (!type) return 'Payment';
    const normalized = type.toLowerCase();
    if (normalized === 'deposit') return 'Security deposit';
    if (normalized === 'payment') return 'Invoice payment';
    return type
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  };

  const formatStatusLabel = (status: BookingPayment['status']) => {
    return status
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  };

  // ✅ SMART QUICK ACTIONS - Based on current status
  const getRelevantActions = () => {
    const status = booking.status.toLowerCase();
    const actions = [];

    // Status progression actions
    if (status.includes('pending') || status === 'confirmed') {
      actions.push({
        label: 'Mark as Paid',
        icon: <CreditCard className="h-4 w-4" />,
        onClick: () => onStatusUpdate(booking.id, 'paid'),
        color: 'bg-green-600 hover:bg-green-700',
      });
    }

    if (status.includes('paid') || status.includes('hold')) {
      actions.push({
        label: 'Ready for Pickup',
        icon: <CheckCircle className="h-4 w-4" />,
        onClick: () => onStatusUpdate(booking.id, 'ready_for_pickup'),
        color: 'bg-indigo-600 hover:bg-indigo-700',
      });
    }

    if (status.includes('ready')) {
      actions.push({
        label: 'Mark as Delivered',
        icon: <Truck className="h-4 w-4" />,
        onClick: () => onStatusUpdate(booking.id, 'delivered'),
        color: 'bg-cyan-600 hover:bg-cyan-700',
      });
    }

    if (status.includes('deliver') || status.includes('progress')) {
      actions.push({
        label: 'Complete Rental',
        icon: <Check className="h-4 w-4" />,
        onClick: () => onStatusUpdate(booking.id, 'completed'),
        color: 'bg-green-600 hover:bg-green-700',
      });
    }

    // Communication actions (always available)
    actions.push({
      label: 'Email Customer',
      icon: <Mail className="h-4 w-4" />,
      onClick: () => handleEmailCustomer(),
      color: 'bg-blue-600 hover:bg-blue-700',
    });

    // Document actions (always available)
    actions.push({
      label: 'View Contract',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => handleViewContract(),
      color: 'bg-purple-600 hover:bg-purple-700',
    });

    // Cancel action (if not already cancelled)
    if (!status.includes('cancel') && !status.includes('complet')) {
      actions.push({
        label: 'Cancel Booking',
        icon: <XCircle className="h-4 w-4" />,
        onClick: handleBookingCancel,
        color: 'bg-red-600 hover:bg-red-700',
      });
    }

    return actions;
  };

  const handleEmailCustomer = () => {
    // Open email modal with templates
    logger.info('Email customer action', {
      component: 'BookingDetailsModal',
      action: 'email_customer',
      metadata: { bookingId: booking.id, customerEmail: booking.customer.email },
    });
    setShowEmailModal(true);
  };

  const handleViewContract = () => {
    // Open contract or generate if doesn't exist
    logger.info('View contract action', {
      component: 'BookingDetailsModal',
      action: 'view_contract',
      metadata: { bookingId: booking.id },
    });
    window.open(`/admin/contracts?booking=${booking.id}`, '_blank');
  };

  const handleBookingCancel = () => {
    const reason = prompt('Please provide a detailed reason for cancellation:');
    if (reason && reason.trim().length > 10) {
      onCancel(booking.id, reason);
      onClose();
    } else if (reason) {
      alert('Please provide a more detailed cancellation reason (at least 10 characters).');
    }
  };

  const handleViewReceipt = (payment: BookingPayment) => {
    if (!payment?.id) {
      alert('Unable to open receipt: missing payment ID.');
      return;
    }
    window.open(
      `/api/admin/payments/receipt/${payment.id}?mode=inline`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleDownloadReceipt = async (payment: BookingPayment) => {
    try {
      if (!payment?.id) {
        alert('Unable to download receipt: missing payment ID.');
        return;
      }

      const response = await fetchWithAuth(`/api/admin/payments/receipt/${payment.id}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.paymentNumber ?? booking.bookingNumber ?? payment.id}.html`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download receipt';
      alert(message);
    }
  };

  const handleViewInStripe = async (payment: BookingPayment) => {
    if (!payment.stripePaymentIntentId && !payment.stripeCheckoutSessionId) {
      alert('No Stripe Payment Intent or Checkout Session ID available for this payment.');
      return;
    }

    try {
      setStripeLinkLoadingId(payment.id);
      const response = await fetchWithAuth(
        `/api/admin/payments/stripe/link?paymentId=${payment.id}`
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to generate Stripe dashboard link');
      }
      const { url } = await response.json();
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Stripe dashboard link was not provided');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open Stripe dashboard';
      alert(message);
    } finally {
      setStripeLinkLoadingId(null);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await onUpdate(booking.id, { internalNotes });
      setShowNotesEdit(false);
      logger.info('Internal notes saved', {
        component: 'BookingDetailsModal',
        action: 'save_notes',
        metadata: { bookingId: booking.id },
      });
    } catch (error) {
      logger.error(
        'Failed to save notes',
        {
          component: 'BookingDetailsModal',
          action: 'save_notes_error',
          metadata: { bookingId: booking.id },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Failed to save notes. Please try again.');
    }
  };

  return (
    <>
      <AdminModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="6xl"
        showCloseButton={false}
        className="flex flex-col"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Booking Details - {booking.bookingNumber}
              </h3>
              <p className="text-sm text-gray-500">Created on {formatDate(booking.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(booking.status)}`}
              >
                {booking.status.replace(/_/g, ' ').toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'border-premium-gold text-premium-gold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'payments'
                    ? 'border-premium-gold text-premium-gold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Payments
              </button>
              <button
                onClick={() => setActiveTab('communications')}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'communications'
                    ? 'border-premium-gold text-premium-gold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Communications
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'documents'
                    ? 'border-premium-gold text-premium-gold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Documents
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-8 min-h-0">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column - Booking Info */}
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                      <Calendar className="mr-2 h-4 w-4 text-premium-gold" />
                      Booking Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(booking.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date:</span>
                        <span className="font-medium text-gray-900">
                          {formatDate(booking.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">
                          {calculateDuration()} days
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Total:</span>
                        <span className="text-lg font-bold text-premium-gold">
                          {formatCurrency(booking.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                      <User className="mr-2 h-4 w-4 text-premium-gold" />
                      Customer Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="block text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-600">Email:</span>
                        <div className="flex items-center">
                          <Mail className="mr-2 h-3 w-3 text-gray-400" />
                          <a
                            href={`mailto:${booking.customer.email}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {booking.customer.email}
                          </a>
                        </div>
                      </div>
                      {booking.customer.phone && (
                        <div>
                          <span className="block text-gray-600">Phone:</span>
                          <div className="flex items-center">
                            <Phone className="mr-2 h-3 w-3 text-gray-400" />
                            <a
                              href={`tel:${booking.customer.phone}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {booking.customer.phone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                      <Package className="mr-2 h-4 w-4 text-premium-gold" />
                      Equipment
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="block text-gray-600">Equipment:</span>
                        <span className="font-medium text-gray-900">{booking.equipment.name}</span>
                      </div>
                      <div>
                        <span className="block text-gray-600">Model:</span>
                        <span className="font-medium text-gray-900">{booking.equipment.model}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Delivery & Special Instructions */}
                <div className="space-y-4">
                  {booking.deliveryAddress && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                        <MapPin className="mr-2 h-4 w-4 text-premium-gold" />
                        Delivery Address
                      </h4>
                      <p className="text-sm text-gray-900">{booking.deliveryAddress}</p>
                    </div>
                  )}

                  {booking.specialInstructions && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                      <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                        <MessageSquare className="mr-2 h-4 w-4 text-premium-gold" />
                        Special Instructions
                      </h4>
                      <p className="text-sm text-gray-700">{booking.specialInstructions}</p>
                    </div>
                  )}

                  {/* Internal Notes (Admin Only) */}
                  <div className="rounded-lg border border-gray-200 bg-yellow-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="flex items-center text-sm font-semibold text-gray-900">
                        <FileText className="mr-2 h-4 w-4 text-premium-gold" />
                        Internal Notes (Admin Only)
                      </h4>
                      {!showNotesEdit && (
                        <button
                          onClick={() => setShowNotesEdit(true)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    {showNotesEdit ? (
                      <>
                        <textarea
                          value={internalNotes}
                          onChange={(e: unknown) => setInternalNotes(e.target.value)}
                          placeholder="Add internal notes visible only to admins..."
                          className="mb-2 w-full rounded border border-gray-300 p-2 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-opacity-50"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveNotes}
                            className="flex-1 rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                          >
                            Save Notes
                          </button>
                          <button
                            onClick={() => {
                              setInternalNotes(booking.internalNotes || '');
                              setShowNotesEdit(false);
                            }}
                            className="rounded bg-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-700">
                        {internalNotes || 'No internal notes yet. Click Edit to add notes.'}
                      </p>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                      <Clock className="mr-2 h-4 w-4 text-premium-gold" />
                      Timeline
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="mr-3 mt-1 h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Booking created</p>
                          <p className="text-xs text-gray-500">{formatDate(booking.createdAt)}</p>
                        </div>
                      </div>
                      {booking.status !== 'pending' && (
                        <div className="flex items-start">
                          <div className="mr-3 mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Status: {booking.status.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-500">Recently</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="space-y-4">
                  <div className="rounded-lg border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-4">
                    <h4 className="mb-4 text-sm font-semibold text-gray-900">Quick Actions</h4>
                    <div className="space-y-2">
                      {getRelevantActions().map((action: any, index: number) => {
                        // Determine permission based on action label
                        let permission: string | null = null;
                        if (action.label.includes('Cancel')) {
                          permission = 'bookings:cancel:all';
                        } else if (action.label.includes('Approve')) {
                          permission = 'bookings:approve:all';
                        } else if (
                          action.label.includes('Update') ||
                          action.label.includes('Edit')
                        ) {
                          permission = 'bookings:update:all';
                        }

                        const button = (
                          <button
                            key={index}
                            onClick={action.onClick}
                            className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${action.color}`}
                          >
                            {action.icon}
                            {action.label}
                          </button>
                        );

                        // Wrap with PermissionGate if permission is required
                        if (permission) {
                          return (
                            <PermissionGate key={index} permission={permission}>
                              {button}
                            </PermissionGate>
                          );
                        }

                        // No permission required (e.g., View Contract, Email Customer)
                        return button;
                      })}
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h4 className="mb-3 flex items-center text-sm font-semibold text-gray-900">
                      <DollarSign className="mr-2 h-4 w-4 text-premium-gold" />
                      Payment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(booking.total)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span
                          className={`font-medium ${booking.status.toLowerCase().includes('paid') ? 'text-green-600' : 'text-yellow-600'}`}
                        >
                          {booking.status.toLowerCase().includes('paid') ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          window.open(`/admin/payments?booking=${booking.id}`, '_blank')
                        }
                        className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        View Payment Details
                      </button>
                    </div>
                  </div>

                  {/* Help Card */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-blue-900">Need Help?</h4>
                    <p className="mb-3 text-xs text-blue-700">
                      Quick actions are based on the current booking status. Contact customer or
                      view full booking history for more options.
                    </p>
                    <a
                      href={`mailto:${booking.customer.email}?subject=Regarding Booking ${booking.bookingNumber}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700"
                    >
                      <Mail className="h-3 w-3" />
                      Email Customer Now
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <BookingFinancePanel
                  bookingId={booking.id}
                  bookingNumber={booking.bookingNumber}
                  customerId={booking.customer.id}
                  customerName={`${booking.customer.firstName} ${booking.customer.lastName}`.trim()}
                  totalAmount={booking.total}
                  depositAmount={booking.depositAmount ?? null}
                  balanceAmount={booking.balanceAmount ?? null}
                  billingStatus={booking.billingStatus ?? null}
                  balanceDueAt={booking.balanceDueAt ?? null}
                />

                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Stripe & Manual Payments
                        </h3>
                        <p className="text-sm text-gray-600">
                          View payment attempts processed through Stripe or recorded manually.
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          window.open(
                            `/admin/payments?booking=${booking.id}`,
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Manage in Payments
                      </button>
                    </div>
                  </div>

                  {paymentsLoading ? (
                    <div
                      className="flex h-32 items-center justify-center"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="border-premium-gold h-10 w-10 animate-spin rounded-full border-4 border-premium-gold border-t-transparent"></div>
                    </div>
                  ) : paymentsError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                        <div>
                          <h4 className="text-sm font-semibold text-red-800">
                            Unable to load payments
                          </h4>
                          <p className="text-sm text-red-700">{paymentsError}</p>
                        </div>
                      </div>
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-6">
                      <h3 className="text-lg font-semibold text-gray-900">No Payments Found</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        This booking does not have any Stripe or manual payment records yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {payment.paymentNumber ||
                                    `Payment ${payment.id.slice(0, 8).toUpperCase()}`}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${getPaymentStatusClasses(payment.status)}`}
                                >
                                  {getPaymentStatusIcon(payment.status)}
                                  <span>{formatStatusLabel(payment.status)}</span>
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {getPaymentTypeLabel(payment.type)} ·{' '}
                                {getPaymentMethodLabel(payment.method)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created {formatDateTime(payment.createdAt)}
                                {payment.processedAt
                                  ? ` · Processed ${formatDateTime(payment.processedAt)}`
                                  : ''}
                              </p>
                              {payment.failureReason && (
                                <div className="flex items-start gap-2 text-xs text-red-600">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                                  <span>{payment.failureReason}</span>
                                </div>
                              )}
                              {typeof payment.refundAmount === 'number' &&
                                payment.refundAmount > 0 && (
                                  <div className="text-xs text-blue-600">
                                    Refunded {formatCurrency(payment.refundAmount)}
                                    {payment.refundReason ? ` · ${payment.refundReason}` : ''}
                                  </div>
                                )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleViewReceipt(payment)}
                              className="inline-flex items-center justify-center rounded-md border border-[#A90F0F] px-3 py-2 text-sm font-medium text-[#A90F0F] transition hover:bg-[#A90F0F] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#A90F0F] focus:ring-offset-2"
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              View Receipt
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(payment)}
                              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                            >
                              <Download className="mr-1.5 h-4 w-4" />
                              Download Receipt
                            </button>
                            <button
                              onClick={() => handleViewInStripe(payment)}
                              disabled={
                                (!payment.stripePaymentIntentId &&
                                  !payment.stripeCheckoutSessionId) ||
                                stripeLinkLoadingId === payment.id
                              }
                              className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                payment.stripePaymentIntentId || payment.stripeCheckoutSessionId
                                  ? 'bg-[#A90F0F] text-white hover:bg-[#8B0B0B] focus:ring-[#A90F0F]'
                                  : 'cursor-not-allowed bg-gray-200 text-gray-500 focus:ring-gray-300'
                              }`}
                            >
                              {stripeLinkLoadingId === payment.id ? 'Opening…' : 'View in Stripe'}
                            </button>
                          </div>
                          {!payment.stripePaymentIntentId && !payment.stripeCheckoutSessionId && (
                            <p className="mt-2 text-xs text-gray-500">
                              This payment is not linked to Stripe. Stripe-specific actions are
                              unavailable.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'communications' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Communication History</h3>
                <p className="text-sm text-gray-600">
                  Email and SMS history for this booking will appear here.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() =>
                      alert(`Sending booking confirmation to ${booking.customer.email}`)
                    }
                    className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Send Confirmation Email
                    </span>
                  </button>
                  <button
                    onClick={() => alert(`Sending reminder to ${booking.customer.email}`)}
                    className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Send Reminder
                    </span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Documents & Contracts</h3>
                <p className="text-sm text-gray-600">
                  Rental contracts, invoices, and insurance documents for this booking.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => window.open(`/admin/contracts?booking=${booking.id}`, '_blank')}
                    className="rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      View Contract
                    </span>
                  </button>
                  <button
                    onClick={() => alert('Generating invoice...')}
                    className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <span className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Generate Invoice
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminModal>

      {/* Email Customer Modal */}
      <EmailCustomerModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        customerEmail={booking.customer.email}
        customerName={`${booking.customer.firstName} ${booking.customer.lastName}`}
        bookingNumber={booking.bookingNumber}
        bookingId={booking.id}
      />
    </>
  );
}
