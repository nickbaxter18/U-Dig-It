'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Booking {
  id: string;
  bookingNumber: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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

interface BookingCalendarViewProps {
  bookings: Booking[];
  loading: boolean;
  onBookingSelect: (booking: Booking) => void;
}

export function BookingCalendarView({
  bookings,
  loading,
  onBookingSelect,
}: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyBookings = bookings.filter(booking => {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    return bookingEnd >= monthStart && bookingStart <= monthEnd;
  });

  const monthlySummary = monthlyBookings.reduce(
    (acc, booking) => {
      if (booking.status === 'IN_PROGRESS') {
        acc.active += 1;
      }
      if (booking.status === 'COMPLETED') {
        acc.completed += 1;
      }
      acc.revenue += booking.total || 0;
      return acc;
    },
    { active: 0, completed: 0, revenue: 0 }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'CONFIRMED':
        return 'bg-blue-500';
      case 'PAID':
        return 'bg-green-500';
      case 'INSURANCE_VERIFIED':
        return 'bg-purple-500';
      case 'READY_FOR_PICKUP':
        return 'bg-indigo-500';
      case 'IN_PROGRESS':
        return 'bg-orange-500';
      case 'DELIVERED':
        return 'bg-cyan-500';
      case 'COMPLETED':
        return 'bg-green-600';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => {
      const startDate = new Date(booking.startDate).toISOString().split('T')[0];
      const endDate = new Date(booking.endDate).toISOString().split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayBookings = getBookingsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-1 ${
            isToday ? 'bg-blue-50' : 'bg-white'
          } hover:bg-gray-50`}
        >
          <div
            className={`mb-1 text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}
          >
            {day}
          </div>
          <div className="space-y-1">
            {dayBookings.slice(0, 3).map(booking => (
              <div
                key={booking.id}
                onClick={() => onBookingSelect(booking)}
                className={`cursor-pointer truncate rounded p-1 text-xs text-white ${getStatusColor(booking.status)}`}
                title={`${booking.bookingNumber} - ${booking.customer.firstName} ${booking.customer.lastName}`}
              >
                {booking.bookingNumber}
              </div>
            ))}
            {dayBookings.length > 3 && (
              <div className="text-xs text-gray-500">+{dayBookings.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="border-kubota-orange h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="rounded-md p-2 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="rounded-md p-2 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="bg-kubota-orange rounded-md px-3 py-2 text-sm text-white hover:bg-orange-600"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0 overflow-hidden rounded-lg border border-gray-200">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="border-b border-gray-200 bg-gray-100 p-3 text-center text-sm font-medium text-gray-700"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {renderCalendar()}
      </div>

      {/* Legend */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-gray-900">Status Legend</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {[
            { status: 'PENDING', label: 'Pending' },
            { status: 'CONFIRMED', label: 'Confirmed' },
            { status: 'PAID', label: 'Paid' },
            { status: 'IN_PROGRESS', label: 'In Progress' },
            { status: 'COMPLETED', label: 'Completed' },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded ${getStatusColor(status)}`}></div>
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-900">Month Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <span className="text-gray-600">Total Bookings:</span>
            <span className="ml-2 font-medium">{monthlyBookings.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Active:</span>
            <span className="ml-2 font-medium">
              {monthlySummary.active}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Completed:</span>
            <span className="ml-2 font-medium">
              {monthlySummary.completed}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Revenue:</span>
            <span className="ml-2 font-medium">
              ${monthlySummary.revenue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
