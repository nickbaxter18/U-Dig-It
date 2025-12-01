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
  Shield,
  FileCheck,
  Lock,
  Upload,
  Image as ImageIcon,
  File as FileIcon,
  Trash2,
} from 'lucide-react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AdminModal } from '@/components/admin/AdminModal';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { BookingFinancePanel } from '@/components/admin/finance/BookingFinancePanel';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase/client';
import { fetchWithAuth } from '@/lib/supabase/fetchWithAuth';

import { EmailCustomerModal } from './EmailCustomerModal';
import { ContractStepDetails } from './steps/ContractStepDetails';
import { InsuranceStepDetails } from './steps/InsuranceStepDetails';
import { LicenseStepDetails } from './steps/LicenseStepDetails';
import { PaymentStepDetails } from './steps/PaymentStepDetails';
import { DepositStepDetails } from './steps/DepositStepDetails';

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
    'details' | 'payments' | 'communications' | 'documents' | 'steps'
  >('details');
  const [internalNotes, setInternalNotes] = useState(booking.internalNotes || '');
  const [showNotesEdit, setShowNotesEdit] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [stripeLinkLoadingId, setStripeLinkLoadingId] = useState<string | null>(null);

  // Steps tab state
  const [completionSteps, setCompletionSteps] = useState({
    contract_signed: false,
    insurance_uploaded: false,
    license_uploaded: false,
    payment_completed: false,
    deposit_paid: false,
  });
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set());
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadedFileUrls, setUploadedFileUrls] = useState<Record<string, string>>({});
  const [uploadedFileNames, setUploadedFileNames] = useState<Record<string, string>>({});
  const [viewingStepFile, setViewingStepFile] = useState<string | null>(null);

  // Step detail expansion state
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [activeStepTabs, setActiveStepTabs] = useState<Record<string, 'details' | 'history' | 'files' | 'actions'>>({});

  // Mount tracking to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Upload timeout refs to track and clear timeouts
  const uploadTimeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  // Upload abort controllers for cancellation
  const uploadAbortControllers = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup: clear all upload timeouts and abort all uploads
      Object.values(uploadTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      Object.values(uploadAbortControllers.current).forEach(controller => {
        if (controller) controller.abort();
      });
      uploadTimeoutRefs.current = {};
      uploadAbortControllers.current = {};
      // Clear all uploading states
      setUploadingFiles(new Set());
      setUploadProgress({});
    };
  }, []);

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

  // Fetch completion steps when Steps tab is opened
  useEffect(() => {
    if (!isOpen || activeTab !== 'steps') {
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    const loadCompletionSteps = async () => {
      if (!isMounted) return;

      setStepsLoading(true);
      setStepErrors({});

      try {
        // Fetch booking with all related data
        const { data: bookingData, error } = await supabase
          .from('bookings')
          .select(
            `
            id,
            status,
            stripe_payment_method_id,
            contracts(id, status, signedAt, completedAt, signedDocumentUrl, signedDocumentPath),
            payments(type, status, amount),
            insurance_documents(id, status, reviewedAt, fileUrl, fileName),
            customer:customerId(drivers_license_verified_at)
            `
          )
          .eq('id', booking.id)
          .single();

        if (error) throw error;
        if (!isMounted) return;

        // Calculate completion status (same logic as checkBookingCompletion)
        // Prioritize signed/completed contracts with files over draft contracts
        const contracts = bookingData.contracts || [];
        const contract = contracts.find(
          (c: { status: string; signedDocumentPath?: string | null; signedDocumentUrl?: string | null }) =>
            (c.status === 'signed' || c.status === 'completed') &&
            (c.signedDocumentPath || c.signedDocumentUrl)
        ) || contracts.find(
          (c: { signedDocumentPath?: string | null; signedDocumentUrl?: string | null }) =>
            c.signedDocumentPath || c.signedDocumentUrl
        ) || contracts[0];
        const payment = bookingData.payments?.find(
          (p: { type: string; status: string }) => p.type === 'payment'
        );
        // Check for approved insurance documents
        const hasInsurance = Array.isArray(bookingData.insurance_documents)
          ? bookingData.insurance_documents.some(
              (doc: { status?: string }) => doc?.status === 'approved'
            )
          : false;

        const { data: approvedVerification } = await supabase
          .from('id_verification_requests')
          .select('id')
          .eq('booking_id', booking.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const hasApprovedVerification = Boolean(approvedVerification);
        const hasVerifiedDriverLicense = Boolean(bookingData.customer?.drivers_license_verified_at);
        const hasLicense = hasApprovedVerification || hasVerifiedDriverLicense;

        const contractSigned = contract?.status === 'signed' || contract?.status === 'completed';
        const paymentCompleted = payment?.status === 'completed' || bookingData.status === 'paid';
        const depositPaid = !!bookingData.stripe_payment_method_id;

        // Fetch existing file URLs
        const fileUrls: Record<string, string> = {};
        const fileNames: Record<string, string> = {};

        // Contract file - prefer signedDocumentPath for generating fresh signed URLs
        if (contract?.signedDocumentPath) {
          fileUrls.contract_signed = contract.signedDocumentPath;
          fileNames.contract_signed = 'Signed Contract';
        } else if (contract?.signedDocumentUrl) {
          // Fallback to full URL if path not available
          fileUrls.contract_signed = contract.signedDocumentUrl;
          fileNames.contract_signed = 'Signed Contract';
        }

        // Insurance file
        if (Array.isArray(bookingData.insurance_documents) && bookingData.insurance_documents.length > 0) {
          const insuranceDoc = bookingData.insurance_documents[0];
          if (insuranceDoc.fileUrl) {
            fileUrls.insurance_uploaded = insuranceDoc.fileUrl;
            fileNames.insurance_uploaded = insuranceDoc.fileName || 'Insurance Document';
          }
        }

        // License file - check id_verification_requests metadata
        if (approvedVerification) {
          const { data: verificationData } = await supabase
            .from('id_verification_requests')
            .select('metadata')
            .eq('id', approvedVerification.id)
            .single();

          if (verificationData?.metadata?.fileUrl) {
            fileUrls.license_uploaded = verificationData.metadata.fileUrl;
            fileNames.license_uploaded = 'Driver License';
          }
        }

        if (isMounted) {
          setCompletionSteps({
            contract_signed: contractSigned,
            insurance_uploaded: hasInsurance,
            license_uploaded: hasLicense,
            payment_completed: paymentCompleted,
            deposit_paid: depositPaid,
          });
          setUploadedFileUrls(fileUrls);
          setUploadedFileNames(fileNames);
        }
      } catch (error) {
        if (!isMounted) return;

        const message = error instanceof Error ? error.message : 'Failed to load completion steps';
        setStepErrors({ load: message });

        if (process.env.NODE_ENV === 'development') {
          logger.error(
            'Failed to load completion steps',
            {
              component: 'BookingDetailsModal',
              action: 'steps_fetch_error',
              metadata: { bookingId: booking.id, error: message },
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      } finally {
        if (isMounted) {
          setStepsLoading(false);
        }
      }
    };

    loadCompletionSteps();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isOpen, activeTab, booking.id, supabase]);

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

  const handleGenerateInvoice = async () => {
    // Open the invoice modal instead of directly opening the invoice
    setShowInvoiceModal(true);
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

  const stepDefinitions = useMemo(() => [
    {
      id: 'contract_signed',
      label: 'Sign Contract',
      description: 'Rental agreement signed',
      icon: <FileCheck className="h-5 w-5" />,
      requiresConfirmation: false,
    },
    {
      id: 'insurance_uploaded',
      label: 'Upload Insurance',
      description: 'Certificate of Insurance approved',
      icon: <Shield className="h-5 w-5" />,
      requiresConfirmation: false,
    },
    {
      id: 'license_uploaded',
      label: 'Upload License',
      description: 'Driver\'s license verified',
      icon: <FileText className="h-5 w-5" />,
      requiresConfirmation: false,
    },
    {
      id: 'payment_completed',
      label: 'Pay Invoice',
      description: 'Rental invoice payment completed',
      icon: <CreditCard className="h-5 w-5" />,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to mark the invoice payment as completed? This will update the payment records.',
    },
    {
      id: 'deposit_paid',
      label: 'Card Verification',
      description: 'Security deposit card verified',
      icon: <Lock className="h-5 w-5" />,
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to mark the security deposit as paid? This will update the booking records.',
    },
  ], []);

  const confirmStepToggle = useCallback(async (step: string, completed: boolean) => {
    if (!isMountedRef.current) return;

    setLoadingSteps(prev => new Set(prev).add(step));
    setStepErrors(prev => ({ ...prev, [step]: '' }));

    try {
      const response = await fetch(`/api/admin/bookings/${booking.id}/completion-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          completed,
          notes: stepNotes[step] || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update step' }));
        throw new Error(error.error || 'Failed to update step');
      }

      // Only update state if still mounted
      if (!isMountedRef.current) return;

      // Optimistic update
      setCompletionSteps(prev => ({ ...prev, [step]: completed }));
      setStepNotes(prev => {
        const next = { ...prev };
        delete next[step];
        return next;
      });

      // Trigger refetch via useEffect (don't refetch here)
      // The useEffect will run when booking.id changes or tab opens
      // We'll trigger it by toggling the tab or relying on natural refresh

      // Show success notification
      if (isMountedRef.current) {
        const stepLabel = stepDefinitions.find(s => s.id === step)?.label || 'Step';
        const message = completed
          ? `✅ ${stepLabel} marked as completed successfully!`
          : `✅ ${stepLabel} marked as incomplete successfully!`;
        alert(message);
        logger.info('Step updated successfully', {
          component: 'BookingDetailsModal',
          action: 'step_updated',
          metadata: { bookingId: booking.id, step, completed },
        });
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      const message = error instanceof Error ? error.message : 'Failed to update step';
      setStepErrors(prev => ({ ...prev, [step]: message }));
      alert(`❌ Failed to update step: ${message}`);
      logger.error(
        'Failed to update step',
        {
          component: 'BookingDetailsModal',
          action: 'step_update_error',
          metadata: { bookingId: booking.id, step },
        },
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      if (!isMountedRef.current) return;

      setLoadingSteps(prev => {
        const next = new Set(prev);
        next.delete(step);
        return next;
      });
      setShowConfirmation(prev => {
        const next = { ...prev };
        delete next[step];
        return next;
      });
    }
  }, [booking.id, stepNotes, stepDefinitions]);

  // File upload handlers
  const handleFileSelect = useCallback((step: string, file: File | null) => {
    // Clear previous errors
    setStepErrors(prev => ({ ...prev, [step]: '' }));

    if (!file) {
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[step];
        return next;
      });
      return;
    }

    // Comprehensive file validation
    logger.info('File selected', {
      component: 'BookingDetailsModal',
      action: 'file_selected',
      metadata: {
        step,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: file.lastModified,
      },
    });

    // Validate file exists and has size
    if (file.size === 0) {
      const errorMsg = 'Selected file is empty (0 bytes). Please choose a different file.';
      setStepErrors(prev => ({ ...prev, [step]: errorMsg }));
      logger.warn('Empty file selected', {
        component: 'BookingDetailsModal',
        action: 'file_validation_failed',
        metadata: { step, fileName: file.name },
      });
      return;
    }

    // Validate file type
    const stepFileConfig: Record<string, { accept: string[]; maxSize: number }> = {
      contract_signed: {
        accept: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        maxSize: 50 * 1024 * 1024, // 50MB
      },
      insurance_uploaded: {
        accept: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        maxSize: 50 * 1024 * 1024, // 50MB
      },
      license_uploaded: {
        accept: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        maxSize: 10 * 1024 * 1024, // 10MB
      },
    };

    const config = stepFileConfig[step];
    if (!config) {
      const errorMsg = 'File upload not supported for this step';
      setStepErrors(prev => ({ ...prev, [step]: errorMsg }));
      return;
    }

    // Check file type (also check by extension as fallback)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string[]> = {
      pdf: ['application/pdf'],
      jpg: ['image/jpeg', 'image/jpg'],
      jpeg: ['image/jpeg', 'image/jpg'],
      png: ['image/png'],
      webp: ['image/webp'],
    };

    const isValidType = config.accept.includes(file.type) ||
      (fileExtension && typeMap[fileExtension]?.some(t => config.accept.includes(t)));

    if (!isValidType) {
      const errorMsg = `Invalid file type "${file.type}". Please upload: ${config.accept.join(', ')}`;
      setStepErrors(prev => ({ ...prev, [step]: errorMsg }));
      logger.warn('Invalid file type', {
        component: 'BookingDetailsModal',
        action: 'file_validation_failed',
        metadata: { step, fileName: file.name, fileType: file.type, allowedTypes: config.accept },
      });
      return;
    }

    if (file.size > config.maxSize) {
      const errorMsg = `File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size: ${(config.maxSize / 1024 / 1024).toFixed(0)}MB`;
      setStepErrors(prev => ({ ...prev, [step]: errorMsg }));
      logger.warn('File too large', {
        component: 'BookingDetailsModal',
        action: 'file_validation_failed',
        metadata: { step, fileName: file.name, fileSize: file.size, maxSize: config.maxSize },
      });
      return;
    }

    // File is valid - store it
    setSelectedFiles(prev => ({ ...prev, [step]: file }));
    logger.info('File validated and stored', {
      component: 'BookingDetailsModal',
      action: 'file_validated',
      metadata: { step, fileName: file.name, fileSize: file.size },
    });
  }, []);

  const handleFileUpload = useCallback(async (step: string, file: File) => {
    if (!isMountedRef.current) return;

    // Comprehensive validation before upload
    if (!file) {
      setStepErrors(prev => ({ ...prev, [step]: 'No file selected. Please select a file first.' }));
      return;
    }

    if (file.size === 0) {
      setStepErrors(prev => ({ ...prev, [step]: 'File is empty (0 bytes). Please select a valid file.' }));
      return;
    }

    // Verify file is still valid - check if it's a File-like object
    if (!file || typeof file !== 'object' || !('name' in file) || !('size' in file) || !('type' in file)) {
      setStepErrors(prev => ({ ...prev, [step]: 'Invalid file object. Please select the file again.' }));
      logger.warn('Invalid file object detected', {
        component: 'BookingDetailsModal',
        action: 'file_validation_error',
        metadata: { step, fileType: typeof file, hasName: 'name' in (file || {}), hasSize: 'size' in (file || {}) },
      });
      return;
    }

    logger.info('Starting file upload', {
      component: 'BookingDetailsModal',
      action: 'file_upload_start',
      metadata: {
        bookingId: booking.id,
        step,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    setUploadingFiles(prev => new Set(prev).add(step));
    setUploadProgress(prev => ({ ...prev, [step]: 0 }));
    setStepErrors(prev => ({ ...prev, [step]: '' }));

    // Create abort controller for this upload
    const abortController = new AbortController();
    uploadAbortControllers.current[step] = abortController;

    // Set upload timeout (30 seconds)
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && uploadingFiles.has(step)) {
        abortController.abort();
        setUploadingFiles(prev => {
          const next = new Set(prev);
          next.delete(step);
          return next;
        });
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[step];
          return next;
        });
        setStepErrors(prev => ({ ...prev, [step]: 'Upload timeout after 30 seconds. Please try again with a smaller file or check your connection.' }));
        logger.error('Upload timeout', {
          component: 'BookingDetailsModal',
          action: 'upload_timeout',
          metadata: { bookingId: booking.id, step, fileName: file.name },
        });
        delete uploadTimeoutRefs.current[step];
        delete uploadAbortControllers.current[step];
      }
    }, 30000);
    uploadTimeoutRefs.current[step] = timeoutId;

    try {
      // Use XMLHttpRequest for better progress tracking
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('step', step);
      formData.append('completed', 'true');
      if (stepNotes[step]) {
        formData.append('notes', stepNotes[step]);
      }

      // Verify FormData has the file
      const fileInFormData = formData.get('file');
      if (!fileInFormData || !(fileInFormData instanceof File)) {
        throw new Error('File not properly added to FormData');
      }

      logger.info('FormData prepared', {
        component: 'BookingDetailsModal',
        action: 'formdata_prepared',
        metadata: {
          bookingId: booking.id,
          step,
          hasFile: !!fileInFormData,
          fileSize: fileInFormData instanceof File ? fileInFormData.size : 0,
        },
      });

      // Use XMLHttpRequest for progress tracking
      const responseData = await new Promise<{ data: unknown; status: number; statusText: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && isMountedRef.current) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(prev => ({ ...prev, [step]: percentComplete }));
            logger.debug('Upload progress', {
              component: 'BookingDetailsModal',
              action: 'upload_progress',
              metadata: { step, progress: percentComplete, loaded: e.loaded, total: e.total },
            });
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = xhr.responseText ? JSON.parse(xhr.responseText) : {};
              resolve({ data, status: xhr.status, statusText: xhr.statusText });
            } catch (parseError) {
              logger.error('Failed to parse XHR response', {
                component: 'BookingDetailsModal',
                action: 'xhr_parse_error',
                metadata: { step, responseText: xhr.responseText.substring(0, 200) },
              });
              reject(new Error('Failed to parse response'));
            }
          } else {
            let errorMessage = `Upload failed: ${xhr.status} ${xhr.statusText}`;
            try {
              const errorData = xhr.responseText ? JSON.parse(xhr.responseText) : {};
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              // Ignore parse errors for error response
            }
            reject(new Error(errorMessage));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload. Please check your connection.'));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'));
        });

        // Start upload
        xhr.open('POST', `/api/admin/bookings/${booking.id}/completion-steps`);
        xhr.send(formData);

        // Store xhr reference for potential abort
        (abortController as any).xhr = xhr;
      });

      // Check response status
      if (responseData.status < 200 || responseData.status >= 300) {
        throw new Error(`Upload failed: ${responseData.status} ${responseData.statusText}`);
      }

      const data = responseData.data as { fileUrl?: string; success?: boolean; error?: string; [key: string]: unknown };

      // Clear timeout on success
      if (uploadTimeoutRefs.current[step]) {
        clearTimeout(uploadTimeoutRefs.current[step]);
        delete uploadTimeoutRefs.current[step];
      }
      delete uploadAbortControllers.current[step];

      if (!isMountedRef.current) return;

      logger.info('Upload successful', {
        component: 'BookingDetailsModal',
        action: 'upload_success',
        metadata: {
          bookingId: booking.id,
          step,
          hasFileUrl: !!data.fileUrl,
          fileUrl: data.fileUrl ? 'present' : 'missing',
        },
      });

      // Update state
      setUploadProgress(prev => ({ ...prev, [step]: 100 }));
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[step];
        return next;
      });

      // Update uploaded file info if returned
      if (data.fileUrl) {
        setUploadedFileUrls(prev => ({ ...prev, [step]: data.fileUrl }));
        setUploadedFileNames(prev => ({ ...prev, [step]: file.name }));
        logger.info('File URL stored', {
          component: 'BookingDetailsModal',
          action: 'fileurl_stored',
          metadata: { step, fileUrl: data.fileUrl.substring(0, 50) + '...' },
        });
      } else {
        logger.warn('Upload successful but no fileUrl in response', {
          component: 'BookingDetailsModal',
          action: 'fileurl_missing',
          metadata: { step, responseData: data },
        });
      }

      // Mark step as completed
      setCompletionSteps(prev => ({ ...prev, [step]: true }));
      setStepNotes(prev => {
        const next = { ...prev };
        delete next[step];
        return next;
      });

      // Refresh booking data
      onUpdate(booking.id, {});

      // Wait a moment for database to update, then refetch
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refetch completion steps to get updated file URLs
      const { data: bookingData, error: refetchError } = await supabase
        .from('bookings')
        .select(`
          contracts(signedDocumentUrl),
          insurance_documents(id, fileUrl, fileName, status, createdAt),
          id_verification_requests(metadata)
        `)
        .eq('id', booking.id)
        .single();

      if (refetchError) {
        logger.warn('Failed to refetch booking data after upload', {
          component: 'BookingDetailsModal',
          action: 'refetch_error',
          metadata: { bookingId: booking.id, step, error: refetchError.message },
        });
      }

      if (bookingData && isMountedRef.current) {
        // Update file URLs from fresh data
        const newFileUrls: Record<string, string> = { ...uploadedFileUrls };
        const newFileNames: Record<string, string> = { ...uploadedFileNames };

        // Prefer signedDocumentPath for generating fresh signed URLs
        if (bookingData.contracts?.[0]?.signedDocumentPath) {
          newFileUrls.contract_signed = bookingData.contracts[0].signedDocumentPath;
          newFileNames.contract_signed = 'Signed Contract';
        } else if (bookingData.contracts?.[0]?.signedDocumentUrl) {
          newFileUrls.contract_signed = bookingData.contracts[0].signedDocumentUrl;
          newFileNames.contract_signed = 'Signed Contract';
        }

        // For insurance, get the most recent approved document with fileUrl
        if (bookingData.insurance_documents && Array.isArray(bookingData.insurance_documents)) {
          // Sort by createdAt to get most recent
          const sortedDocs = [...bookingData.insurance_documents].sort(
            (a: { createdAt?: string }, b: { createdAt?: string }) => {
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bTime - aTime;
            }
          );

          const approvedDoc = sortedDocs.find(
            (doc: { fileUrl?: string; status?: string }) =>
              doc.fileUrl && doc.fileUrl.trim() !== '' && doc.status === 'approved'
          );

          if (approvedDoc?.fileUrl) {
            newFileUrls.insurance_uploaded = approvedDoc.fileUrl;
            newFileNames.insurance_uploaded = approvedDoc.fileName || 'Insurance Document';
            logger.info('Insurance document fileUrl found in refetch', {
              component: 'BookingDetailsModal',
              action: 'insurance_fileurl_found',
              metadata: {
                step,
                documentId: approvedDoc.id,
                fileUrl: approvedDoc.fileUrl.substring(0, 50) + '...',
              },
            });
          } else {
            logger.warn('No approved insurance document with fileUrl found', {
              component: 'BookingDetailsModal',
              action: 'insurance_fileurl_not_found',
              metadata: {
                step,
                documentsCount: sortedDocs.length,
                documents: sortedDocs.map((d: { id: string; status: string; fileUrl?: string }) => ({
                  id: d.id,
                  status: d.status,
                  hasFileUrl: !!d.fileUrl,
                })),
              },
            });
          }
        }

        setUploadedFileUrls(newFileUrls);
        setUploadedFileNames(newFileNames);
      }

      // Reset file input
      const fileInput = document.querySelector(`input[type="file"][data-step="${step}"]`) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Show success message via state (no alert)
      const stepLabel = stepDefinitions.find(s => s.id === step)?.label || 'Step';
      setSuccessMessage(`${stepLabel} completed with file uploaded successfully!`);
      // Clear success message after 5 seconds
      setTimeout(() => {
        if (isMountedRef.current) {
          setSuccessMessage(null);
        }
      }, 5000);

      logger.info('File upload process completed', {
        component: 'BookingDetailsModal',
        action: 'upload_complete',
        metadata: { bookingId: booking.id, step },
      });
    } catch (error) {
      // Clear timeout on error
      if (uploadTimeoutRefs.current[step]) {
        clearTimeout(uploadTimeoutRefs.current[step]);
        delete uploadTimeoutRefs.current[step];
      }
      delete uploadAbortControllers.current[step];

      if (!isMountedRef.current) return;

      const message = error instanceof Error ? error.message : 'Failed to upload file';

      // Check if it was an abort (timeout or cancellation)
      if (message.includes('cancelled') || message.includes('abort')) {
        setStepErrors(prev => ({ ...prev, [step]: 'Upload was cancelled or timed out' }));
      } else {
        setStepErrors(prev => ({ ...prev, [step]: message }));
      }

      logger.error(
        'File upload failed',
        {
          component: 'BookingDetailsModal',
          action: 'file_upload_error',
          metadata: {
            bookingId: booking.id,
            step,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            error: message,
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );

      // Clear uploading state immediately on error
      setUploadingFiles(prev => {
        const next = new Set(prev);
        next.delete(step);
        return next;
      });
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[step];
        return next;
      });
    } finally {
      // Always ensure state is cleared, even if component unmounts
      if (isMountedRef.current) {
        // Clear timeout if still exists
        if (uploadTimeoutRefs.current[step]) {
          clearTimeout(uploadTimeoutRefs.current[step]);
          delete uploadTimeoutRefs.current[step];
        }
        delete uploadAbortControllers.current[step];

        // Final cleanup of upload state
        setUploadingFiles(prev => {
          const next = new Set(prev);
          next.delete(step);
          return next;
        });
        // Don't clear progress in finally - let it stay at 100% on success or be cleared on error
      }
    }
  }, [booking.id, stepNotes, stepDefinitions, uploadedFileUrls, uploadedFileNames, supabase, onUpdate]);

  const handleRemoveFile = useCallback((step: string) => {
    setSelectedFiles(prev => {
      const next = { ...prev };
      delete next[step];
      return next;
    });
  }, []);

  // Handle viewing uploaded file with signed URL
  const handleViewUploadedFile = useCallback(async (step: string, fileUrl: string) => {
    if (!fileUrl || fileUrl.trim() === '') {
      logger.warn('No file URL to view', {
        component: 'BookingDetailsModal',
        action: 'view_no_url',
        metadata: { step },
      });
      return;
    }

    setViewingStepFile(step);

    try {
      // If it's already a full external URL (not Supabase storage), open directly
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        if (!fileUrl.includes('/storage/v1/object/') && !fileUrl.includes('supabase.co')) {
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      }

      // Determine which API to call based on the step type
      let apiEndpoint: string;
      if (step === 'insurance_uploaded') {
        // For insurance, we need to get the document ID from the database
        const { data: docs } = await supabase
          .from('insurance_documents')
          .select('id')
          .eq('bookingId', booking.id)
          .eq('fileUrl', fileUrl)
          .limit(1);

        if (docs && docs.length > 0) {
          apiEndpoint = `/api/admin/insurance/${docs[0].id}/view`;
        } else {
          // Fallback: try to generate signed URL directly
          apiEndpoint = `/api/admin/storage/signed-url?bucket=insurance-documents&path=${encodeURIComponent(fileUrl)}`;
        }
      } else if (step === 'contract_signed') {
        // Check if it's already a full signed URL (starts with http)
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          // The stored URL is already a signed URL - open directly
          window.open(fileUrl, '_blank', 'noopener,noreferrer');
          return;
        }
        // It's a path - generate fresh signed URL from signed-contracts bucket
        apiEndpoint = `/api/admin/storage/signed-url?bucket=signed-contracts&path=${encodeURIComponent(fileUrl)}`;
      } else if (step === 'license_uploaded') {
        // ID verification images are stored in idkit-intake bucket
        apiEndpoint = `/api/admin/storage/signed-url?bucket=idkit-intake&path=${encodeURIComponent(fileUrl)}`;
      } else {
        // Generic storage endpoint
        apiEndpoint = `/api/admin/storage/signed-url?bucket=documents&path=${encodeURIComponent(fileUrl)}`;
      }

      logger.info('Fetching signed URL for step file', {
        component: 'BookingDetailsModal',
        action: 'fetch_signed_url',
        metadata: { step, fileUrl: fileUrl.substring(0, 100), apiEndpoint },
      });

      const response = await fetchWithAuth(apiEndpoint);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get signed URL (${response.status})`);
      }

      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('No URL returned from API');
      }
    } catch (err) {
      logger.error(
        'Failed to view uploaded file',
        {
          component: 'BookingDetailsModal',
          action: 'view_file_error',
          metadata: {
            step,
            fileUrl: fileUrl.substring(0, 100),
            error: err instanceof Error ? err.message : String(err),
          },
        },
        err instanceof Error ? err : undefined
      );
      // Fallback: show error message
      alert(`Failed to view file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setViewingStepFile(null);
    }
  }, [booking.id, supabase]);

  const handleStepToggle = async (step: string, completed: boolean) => {
    // Check if step is already in desired state
    const currentState = completionSteps[step as keyof typeof completionSteps];
    if (currentState === completed) {
      // Already in desired state, no need to update
      return;
    }

    // For financial steps, show confirmation when marking as completed
    if (completed && (step === 'payment_completed' || step === 'deposit_paid')) {
      setShowConfirmation({ ...showConfirmation, [step]: true });
      return;
    }

    // For marking as incomplete, show confirmation for financial steps
    if (!completed && (step === 'payment_completed' || step === 'deposit_paid')) {
      if (!confirm('Are you sure you want to mark this financial step as incomplete? This may affect payment records.')) {
        return;
      }
    }

    await confirmStepToggle(step, completed);
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
              <button
                onClick={() => setActiveTab('steps')}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'steps'
                    ? 'border-premium-gold text-premium-gold'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Steps
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
                  customerEmail={booking.customer.email}
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
                </div>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="space-y-4">
                {successMessage && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">{successMessage}</p>
                      </div>
                      <button
                        onClick={() => setSuccessMessage(null)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Booking Completion Steps</h3>
                  <p className="mb-6 text-sm text-gray-600">
                    Manually mark completion steps as done. Changes will be reflected in the customer's booking portal.
                  </p>

                  {stepsLoading ? (
                    <div className="flex h-32 items-center justify-center" role="status" aria-live="polite">
                      <div className="border-premium-gold h-10 w-10 animate-spin rounded-full border-4 border-premium-gold border-t-transparent"></div>
                    </div>
                  ) : stepErrors.load ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-red-800">Unable to load steps</h4>
                          <p className="mt-1 text-sm text-red-700">{stepErrors.load}</p>
                          <button
                            onClick={() => {
                              // Trigger refetch by toggling tab
                              setActiveTab('details');
                              setTimeout(() => setActiveTab('steps'), 100);
                            }}
                            className="mt-3 text-sm font-medium text-red-600 underline hover:text-red-800"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stepDefinitions.map((stepDef) => {
                        const isCompleted = completionSteps[stepDef.id as keyof typeof completionSteps];
                        const isLoading = loadingSteps.has(stepDef.id);
                        const error = stepErrors[stepDef.id];
                        const notes = stepNotes[stepDef.id] || '';

                        return (
                          <div
                            key={stepDef.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  className={`mt-1 rounded-full p-2 ${
                                    isCompleted
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  {stepDef.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900">{stepDef.label}</h4>
                                    {isCompleted && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600">{stepDef.description}</p>
                                  {error && (
                                    <p className="mt-2 text-sm text-red-600">{error}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setExpandedSteps(prev => {
                                      const next = new Set(prev);
                                      if (next.has(stepDef.id)) {
                                        next.delete(stepDef.id);
                                      } else {
                                        next.add(stepDef.id);
                                        // Set default tab when expanding
                                        if (!activeStepTabs[stepDef.id]) {
                                          setActiveStepTabs(prev => ({ ...prev, [stepDef.id]: 'details' }));
                                        }
                                      }
                                      return next;
                                    });
                                  }}
                                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                  title={expandedSteps.has(stepDef.id) ? 'Hide details' : 'View details'}
                                >
                                  {expandedSteps.has(stepDef.id) ? 'Hide Details' : 'View Details'}
                                </button>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={(e) => handleStepToggle(stepDef.id, e.target.checked)}
                                    disabled={isLoading}
                                    className="peer sr-only"
                                    title={isCompleted ? 'Click to mark as incomplete' : 'Click to mark as complete'}
                                  />
                                  <div className="peer h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"></div>
                                  <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-full"></div>
                                </label>
                              </div>
                            </div>

                            {!isCompleted && (
                              <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                                {/* File Upload Section */}
                                {(stepDef.id === 'contract_signed' ||
                                  stepDef.id === 'insurance_uploaded' ||
                                  stepDef.id === 'license_uploaded') && (
                                  <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                      Upload File
                                    </label>

                                    {/* File Input */}
                                    <div className="flex items-center gap-2">
                                      <label
                                        htmlFor={`file-input-${stepDef.id}`}
                                        className="flex-1 cursor-pointer"
                                        onClick={(e) => {
                                          // Prevent event bubbling that might interfere with button clicks
                                          e.stopPropagation();
                                        }}
                                      >
                                        <input
                                          id={`file-input-${stepDef.id}`}
                                          type="file"
                                          data-step={stepDef.id}
                                          accept={
                                            stepDef.id === 'license_uploaded'
                                              ? 'image/jpeg,image/jpg,image/png,image/webp'
                                              : 'application/pdf,image/jpeg,image/jpg,image/png,image/webp'
                                          }
                                          onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            handleFileSelect(stepDef.id, file);
                                          }}
                                          disabled={isLoading || uploadingFiles.has(stepDef.id)}
                                          className="hidden"
                                        />
                                        <div
                                          className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                          onClick={(e) => {
                                            // Allow clicking the label area to trigger file input
                                            if (!isLoading && !uploadingFiles.has(stepDef.id)) {
                                              const input = document.getElementById(`file-input-${stepDef.id}`) as HTMLInputElement;
                                              if (input) {
                                                input.click();
                                              }
                                            }
                                            e.stopPropagation();
                                          }}
                                        >
                                          <Upload className="h-4 w-4" />
                                          <span className="flex-1 truncate">
                                            {selectedFiles[stepDef.id]
                                              ? selectedFiles[stepDef.id]?.name
                                              : 'Choose file...'}
                                          </span>
                                        </div>
                                      </label>

                                      {selectedFiles[stepDef.id] && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveFile(stepDef.id)}
                                          disabled={uploadingFiles.has(stepDef.id)}
                                          className="rounded-md p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      )}

                                      {selectedFiles[stepDef.id] && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const file = selectedFiles[stepDef.id];
                                            if (file) {
                                              logger.info('Upload button clicked', {
                                                component: 'BookingDetailsModal',
                                                action: 'upload_button_clicked',
                                                metadata: {
                                                  step: stepDef.id,
                                                  fileName: file.name,
                                                  fileSize: file.size,
                                                  isLoading,
                                                  isUploading: uploadingFiles.has(stepDef.id),
                                                },
                                              });
                                              handleFileUpload(stepDef.id, file);
                                            } else {
                                              logger.warn('Upload button clicked but no file', {
                                                component: 'BookingDetailsModal',
                                                action: 'upload_button_no_file',
                                                metadata: { step: stepDef.id },
                                              });
                                            }
                                          }}
                                          disabled={isLoading || uploadingFiles.has(stepDef.id) || !selectedFiles[stepDef.id]}
                                          className="relative z-10 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-md cursor-pointer transition-all duration-200 border-2 border-blue-700"
                                          style={{ pointerEvents: (isLoading || uploadingFiles.has(stepDef.id) || !selectedFiles[stepDef.id]) ? 'none' : 'auto' }}
                                          title={
                                            isLoading
                                              ? 'Loading...'
                                              : uploadingFiles.has(stepDef.id)
                                                ? 'Uploading...'
                                                : !selectedFiles[stepDef.id]
                                                  ? 'Please select a file first'
                                                  : 'Click to upload file and complete step'
                                          }
                                        >
                                          {uploadingFiles.has(stepDef.id) ? (
                                            <span className="flex items-center gap-2">
                                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                              Uploading...
                                            </span>
                                          ) : (
                                            'Upload & Complete'
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    {/* Upload Progress */}
                                    {uploadingFiles.has(stepDef.id) && uploadProgress[stepDef.id] !== undefined && (
                                      <div className="w-full rounded-full bg-gray-200 h-2">
                                        <div
                                          className="bg-premium-gold h-2 rounded-full transition-all duration-300"
                                          style={{ width: `${uploadProgress[stepDef.id]}%` }}
                                        />
                                      </div>
                                    )}

                                    {/* File Size Info */}
                                    {selectedFiles[stepDef.id] && (
                                      <p className="text-xs text-gray-500">
                                        {selectedFiles[stepDef.id]!.size > 0
                                          ? `${(selectedFiles[stepDef.id]!.size / 1024 / 1024).toFixed(2)} MB`
                                          : 'File size unavailable'}
                                        {stepDef.id === 'license_uploaded' ? ' (Max 10MB)' : ' (Max 50MB)'}
                                      </p>
                                    )}

                                    {/* Error Display */}
                                    {stepErrors[stepDef.id] && (
                                      <div className="rounded-lg border border-red-200 bg-red-50 p-2">
                                        <p className="text-xs text-red-800">{stepErrors[stepDef.id]}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Notes Section */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (optional)
                                  </label>
                                  <textarea
                                    value={notes}
                                    onChange={(e) =>
                                      setStepNotes({ ...stepNotes, [stepDef.id]: e.target.value })
                                    }
                                    placeholder="Add notes (e.g., 'Approved in person', 'Cash payment received')"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold focus:ring-opacity-50"
                                    rows={2}
                                  />
                                </div>

                                {/* Toggle without file (for non-file steps or manual completion) */}
                                {(stepDef.id === 'payment_completed' || stepDef.id === 'deposit_paid') && (
                                  <button
                                    type="button"
                                    onClick={() => handleStepToggle(stepDef.id, true)}
                                    disabled={isLoading}
                                    className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {isLoading ? 'Processing...' : 'Mark as Completed'}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Show uploaded file if exists */}
                            {isCompleted && uploadedFileUrls[stepDef.id] && (
                              <div className="mt-4 border-t border-gray-100 pt-4">
                                <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                                  {uploadedFileUrls[stepDef.id].match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                    <ImageIcon className="h-5 w-5 text-gray-600" />
                                  ) : (
                                    <FileIcon className="h-5 w-5 text-gray-600" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {uploadedFileNames[stepDef.id] || 'Uploaded File'}
                                    </p>
                                    <p className="text-xs text-gray-500">File uploaded</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleViewUploadedFile(stepDef.id, uploadedFileUrls[stepDef.id]);
                                    }}
                                    disabled={viewingStepFile === stepDef.id}
                                    className="rounded-md p-1.5 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={viewingStepFile === stepDef.id ? 'Loading...' : 'View file'}
                                  >
                                    {viewingStepFile === stepDef.id ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {showConfirmation[stepDef.id] && (
                              <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                <p className="mb-3 text-sm text-yellow-800">
                                  {stepDef.confirmationMessage}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => confirmStepToggle(stepDef.id, true)}
                                    disabled={isLoading}
                                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {isLoading ? 'Processing...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setShowConfirmation({ ...showConfirmation, [stepDef.id]: false })
                                    }
                                    disabled={isLoading}
                                    className="rounded-md bg-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-400 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Expandable Detail Panel */}
                            {expandedSteps.has(stepDef.id) && (
                              <div className="mt-4 border-t border-gray-200 pt-4">
                                {stepDef.id === 'contract_signed' && (
                                  <ContractStepDetails
                                    bookingId={booking.id}
                                    isExpanded={true}
                                    onDownload={(url) => {
                                      window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                  />
                                )}
                                {stepDef.id === 'insurance_uploaded' && (
                                  <InsuranceStepDetails
                                    bookingId={booking.id}
                                    isExpanded={true}
                                    activeTab={activeStepTabs[stepDef.id] || 'details'}
                                    onTabChange={(tab) => {
                                      setActiveStepTabs(prev => ({ ...prev, [stepDef.id]: tab }));
                                    }}
                                  />
                                )}
                                {stepDef.id === 'license_uploaded' && (
                                  <LicenseStepDetails
                                    bookingId={booking.id}
                                    isExpanded={true}
                                    activeTab={activeStepTabs[stepDef.id] || 'details'}
                                    onTabChange={(tab) => {
                                      setActiveStepTabs(prev => ({ ...prev, [stepDef.id]: tab }));
                                    }}
                                  />
                                )}
                                {stepDef.id === 'payment_completed' && (
                                  <PaymentStepDetails
                                    bookingId={booking.id}
                                    isExpanded={true}
                                    activeTab={activeStepTabs[stepDef.id] || 'details'}
                                    onTabChange={(tab) => {
                                      setActiveStepTabs(prev => ({ ...prev, [stepDef.id]: tab }));
                                    }}
                                  />
                                )}
                                {stepDef.id === 'deposit_paid' && (
                                  <DepositStepDetails
                                    bookingId={booking.id}
                                    isExpanded={true}
                                    activeTab={activeStepTabs[stepDef.id] || 'details'}
                                    onTabChange={(tab) => {
                                      setActiveStepTabs(prev => ({ ...prev, [stepDef.id]: tab }));
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
