'use client';

import { formatDateTime } from '@/lib/utils';
import { useLiveBookingStatus } from '@/hooks/useSupabase';
import { useEffect, useState } from 'react';

interface LiveBookingStatusProps {
  bookingId?: string;
  showLiveIndicator?: boolean;
}

interface BookingUpdate {
  id: string;
  type: 'status_change' | 'payment_update' | 'equipment_status' | 'delivery_update';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export default function LiveBookingStatus({
  bookingId,
  showLiveIndicator = true,
}: LiveBookingStatusProps) {
  const liveBooking = useLiveBookingStatus(bookingId || 'default-booking');
  const [updates, setUpdates] = useState<BookingUpdate[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (liveBooking) {
      // Add a new update when booking status changes
      const newUpdate: BookingUpdate = {
        id: `update-${Date.now()}`,
        type: 'status_change',
        message: `Booking status changed to ${liveBooking.status}`,
        timestamp: new Date().toISOString(),
        status: 'success',
      };

      setUpdates(prev => [newUpdate, ...prev.slice(0, 4)]);
      setIsLive(true);

      // Reset live indicator after 3 seconds
      setTimeout(() => setIsLive(false), 3000);
    }
  }, [liveBooking]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📋';
    }
  };

  const getCurrentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Booking Pending';
      case 'confirmed':
        return 'Booking Confirmed';
      case 'paid':
        return 'Payment Received';
      case 'in_progress':
        return 'Equipment In Use';
      case 'completed':
        return 'Booking Complete';
      case 'cancelled':
        return 'Booking Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Live Booking Status</h3>
        {showLiveIndicator && (
          <div className="flex items-center space-x-2">
            <div
              className={`h-2 w-2 rounded-full ${isLive ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`}
            ></div>
            <span className="text-sm text-gray-600">{isLive ? 'Live' : 'Connected'}</span>
          </div>
        )}
      </div>

      {liveBooking ? (
        <>
          <div className={`rounded-lg border p-4 ${getStatusColor(liveBooking.status)} mb-4`}>
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-current"></div>
              <div>
                <p className="font-medium">{getCurrentStatusText(liveBooking.status)}</p>
                <p className="text-sm opacity-75">Booking #{liveBooking.bookingNumber}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm">No active booking</p>
          <p className="mt-1 text-xs text-gray-400">Real-time updates will appear here</p>
        </div>
      )}

      {updates.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-medium text-gray-900">Recent Updates</h4>
          <div className="space-y-2">
            {updates.map(update => (
              <div
                key={update.id}
                className={`rounded-lg border p-2 text-xs ${getStatusColor(update.status)}`}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-sm">{getStatusIcon(update.status)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{update.message}</p>
                    <p className="mt-1 text-gray-500">{formatDateTime(update.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {updates.length > 0 && (
            <div className="mt-3 border-t border-gray-200 pt-3">
              <button
                onClick={() => setUpdates([])}
                className="text-xs text-gray-500 transition-colors hover:text-gray-700"
              >
                Clear updates
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
