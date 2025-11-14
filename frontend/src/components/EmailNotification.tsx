'use client';

// TODO: This component needs refactoring - the email-service module doesn't export these types
// import {
//   BookingEmailData,
//   emailService,
//   PaymentEmailData,
//   ReminderEmailData,
// } from '@/lib/email-service';
import { useState } from 'react';

// Temporary type placeholders until email-service is refactored
type BookingEmailData = any;
type PaymentEmailData = any;
type ReminderEmailData = any;

interface EmailNotificationProps {
  type: 'booking' | 'payment' | 'reminder' | 'admin';
  data: BookingEmailData | PaymentEmailData | ReminderEmailData | any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function EmailNotification({
  type,
  data,
  onSuccess,
  onError,
}: EmailNotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendEmail = async () => {
    setIsLoading(true);
    setStatus('sending');
    setErrorMessage(null);

    try {
      // TODO: Implement email service integration
      // The emailService module needs to be refactored to export the required types and methods
      throw new Error('Email service not yet implemented - needs refactoring');
    } catch (error: unknown) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
      setErrorMessage(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>;
      case 'success':
        return (
          <svg
            className="h-4 w-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="h-4 w-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="h-4 w-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'success':
        return 'Email sent successfully';
      case 'error':
        return 'Failed to send email';
      default:
        return 'Send email';
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case 'sending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {type === 'booking' && 'Booking Confirmation'}
              {type === 'payment' && 'Payment Receipt'}
              {type === 'reminder' && 'Booking Reminder'}
              {type === 'admin' && 'Admin Notification'}
            </h3>
            <p className="text-xs text-gray-500">
              {status === 'success' && 'Email queued for delivery'}
              {status === 'error' && errorMessage}
              {status === 'idle' && 'Click to send email notification'}
              {status === 'sending' && 'Processing email...'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSendEmail}
          disabled={isLoading || status === 'success'}
          className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${getButtonColor()} ${
            isLoading || status === 'success' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          {getStatusText()}
        </button>
      </div>

      {status === 'error' && errorMessage && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
          <button
            onClick={() => {
              setStatus('idle');
              setErrorMessage(null);
            }}
            className="mt-2 text-xs text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
