/**
 * Real-Time Availability Calendar Component
 * Visual calendar showing equipment availability with real-time updates
 */

'use client';

import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface AvailabilityBlock {
  id: string;
  start_at_utc: string;
  end_at_utc: string;
  reason: 'booked' | 'maintenance' | 'blackout' | 'buffer' | 'reserved';
}

interface DateInfo {
  date: Date;
  isAvailable: boolean;
  isSelected: boolean;
  isInRange: boolean;
  reason?: string;
  isPast: boolean;
  isToday: boolean;
}

interface AvailabilityCalendarProps {
  equipmentId: string;
  selectedStartDate?: Date | null;
  selectedEndDate?: Date | null;
  onDateSelect?: (start: Date, end: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

export default function AvailabilityCalendar({
  equipmentId,
  selectedStartDate,
  selectedEndDate,
  onDateSelect,
  minDate = new Date(),
  maxDate,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingRange, setSelectingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(selectedStartDate || null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(selectedEndDate || null);

  // Fetch availability blocks for the current month
  useEffect(() => {
    fetchAvailability();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`availability-${equipmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability_blocks',
          filter: `equipment_id=eq.${equipmentId}`,
        },
        payload => {
          logger.debug('[AvailabilityCalendar] Availability changed:', {
            component: 'AvailabilityCalendar',
            action: 'debug',
            metadata: { payload },
          });
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [equipmentId, currentMonth]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('equipment_id', equipmentId)
        .gte('end_at_utc', monthStart.toISOString())
        .lte('start_at_utc', monthEnd.toISOString());

      if (error) throw error;

      setAvailabilityBlocks(data || []);
    } catch (error) {
      logger.error('[AvailabilityCalendar] Failed to fetch availability:', {
        component: 'AvailabilityCalendar',
        action: 'error',
      }, error instanceof Error ? error : new Error(String(error)));
      setAvailabilityBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (): DateInfo[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: DateInfo[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDate = new Date(year, month, -i);
      days.unshift({
        date: prevMonthDate,
        isAvailable: false,
        isSelected: false,
        isInRange: false,
        isPast: true,
        isToday: false,
      });
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const availabilityCheck = checkDateAvailability(date);
      const isPast = date < minDate;
      const isToday = isSameDay(date, new Date());
      const isSelected =
        (rangeStart && isSameDay(date, rangeStart)) || (rangeEnd && isSameDay(date, rangeEnd));
      const isInRange = rangeStart && rangeEnd && date > rangeStart && date < rangeEnd;

      days.push({
        date,
        isAvailable: !isPast && availabilityCheck.isAvailable,
        isSelected: !!isSelected,
        isInRange: !!isInRange,
        reason: availabilityCheck.reason,
        isPast,
        isToday,
      });
    }

    return days;
  };

  const checkDateAvailability = (date: Date): { isAvailable: boolean; reason?: string } => {
    // Normalize the date to UTC midnight for accurate comparison
    const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    // Check if date falls within any unavailability block
    for (const block of availabilityBlocks) {
      const blockStart = new Date(block.start_at_utc);
      const blockEnd = new Date(block.end_at_utc);

      // Normalize block dates to UTC midnight
      const normalizedBlockStart = new Date(
        Date.UTC(blockStart.getUTCFullYear(), blockStart.getUTCMonth(), blockStart.getUTCDate())
      );
      const normalizedBlockEnd = new Date(
        Date.UTC(blockEnd.getUTCFullYear(), blockEnd.getUTCMonth(), blockEnd.getUTCDate())
      );

      // Compare normalized dates (inclusive of both start and end dates)
      if (normalizedDate >= normalizedBlockStart && normalizedDate <= normalizedBlockEnd) {
        return { isAvailable: false, reason: block.reason };
      }
    }
    return { isAvailable: true };
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const handleDateClick = (dateInfo: DateInfo) => {
    if (!dateInfo.isAvailable || dateInfo.isPast) return;

    if (!selectingRange || !rangeStart) {
      // Start new range selection
      setRangeStart(dateInfo.date);
      setRangeEnd(null);
      setSelectingRange(true);
      if (onDateSelect) onDateSelect(dateInfo.date, null);
    } else {
      // Complete range selection
      // IMPORTANT: Prevent same-day rental - end date must be different from start date
      if (isSameDay(dateInfo.date, rangeStart)) {
        // Cannot select same day as start - minimum 1-day rental required
        return;
      }

      if (dateInfo.date < rangeStart) {
        // Clicked earlier date, swap
        setRangeEnd(rangeStart);
        setRangeStart(dateInfo.date);
        if (onDateSelect) onDateSelect(dateInfo.date, rangeStart);
      } else {
        setRangeEnd(dateInfo.date);
        if (onDateSelect) onDateSelect(rangeStart, dateInfo.date);
      }
      setSelectingRange(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDayClassName = (dayInfo: DateInfo): string => {
    const baseClasses = 'relative p-2 text-center text-sm cursor-pointer rounded-lg transition-all';

    if (dayInfo.isPast) {
      return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    if (!dayInfo.isAvailable) {
      return `${baseClasses} bg-red-100 text-red-800 line-through cursor-not-allowed`;
    }

    if (dayInfo.isSelected) {
      return `${baseClasses} bg-blue-600 text-white font-bold ring-2 ring-blue-400`;
    }

    if (dayInfo.isInRange) {
      return `${baseClasses} bg-blue-100 text-blue-900 font-medium`;
    }

    if (dayInfo.isToday) {
      return `${baseClasses} bg-green-50 text-green-900 ring-1 ring-green-400 hover:bg-green-100`;
    }

    return `${baseClasses} hover:bg-gray-100 text-gray-900`;
  };

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">📅 Availability Calendar</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Previous month"
          >
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="min-w-[200px] text-center text-lg font-medium text-gray-900">
            {monthName}
          </span>
          <button
            onClick={goToNextMonth}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Next month"
          >
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Enhanced Legend with Tooltips */}
      <div className="mb-4 rounded-lg bg-gray-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-700">Legend</p>
        <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-5">
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 rounded bg-blue-600"></div>
            <span className="font-medium text-gray-700">Selected</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 rounded bg-blue-100"></div>
            <span className="font-medium text-gray-700">In Range</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 rounded bg-green-50 ring-1 ring-green-400"></div>
            <span className="font-medium text-gray-700">Today</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 rounded bg-red-100"></div>
            <span className="font-medium text-gray-700">Unavailable</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-4 w-4 rounded bg-gray-100"></div>
            <span className="font-medium text-gray-700">Past</span>
          </div>
        </div>
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="text-xs italic text-gray-600">
            💡 Hover over unavailable dates to see why (booked, maintenance, etc.)
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading availability...</p>
        </div>
      ) : (
        <>
          {/* Week day headers */}
          <div className="mb-2 grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((dayInfo, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(dayInfo)}
                disabled={!dayInfo.isAvailable || dayInfo.isPast}
                className={getDayClassName(dayInfo)}
                title={
                  dayInfo.isPast
                    ? 'Past date - cannot select'
                    : !dayInfo.isAvailable && dayInfo.reason
                      ? `Unavailable - ${
                          dayInfo.reason === 'booked'
                            ? 'Already booked by another customer'
                            : dayInfo.reason === 'maintenance'
                              ? 'Equipment scheduled for maintenance'
                              : dayInfo.reason === 'blackout'
                                ? 'Blackout period (not available for booking)'
                                : dayInfo.reason === 'buffer'
                                  ? 'Buffer period between bookings'
                                  : dayInfo.reason === 'reserved'
                                    ? 'Reserved for another customer'
                                    : 'Not available'
                        }`
                      : !dayInfo.isAvailable
                        ? 'Unavailable for booking'
                        : dayInfo.isSelected
                          ? 'Selected date - click to deselect'
                          : dayInfo.isToday
                            ? 'Today - available for booking'
                            : 'Available - click to select'
                }
              >
                <span className="block">{dayInfo.date.getDate()}</span>
                {dayInfo.isToday && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 transform rounded-full bg-green-600"></span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Selected Range Display */}
      {rangeStart && (
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">📆 Selected Dates</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>
              <strong>Start:</strong>{' '}
              {rangeStart.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            {rangeEnd ? (
              <p>
                <strong>End:</strong>{' '}
                {rangeEnd.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            ) : (
              <p className="italic text-blue-600">Click another date to set end date</p>
            )}
            {rangeStart && rangeEnd && (
              <p className="border-t border-blue-200 pt-2">
                <strong>Duration:</strong>{' '}
                {Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))}{' '}
                days
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setRangeStart(null);
              setRangeEnd(null);
              setSelectingRange(false);
              if (onDateSelect) onDateSelect(null as any, null);
            }}
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Availability Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">
            {days.filter(d => d.isAvailable && !d.isPast).length}
          </div>
          <div className="text-xs text-gray-600">Available Days</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-red-600">
            {days.filter(d => !d.isAvailable && !d.isPast).length}
          </div>
          <div className="text-xs text-gray-600">Booked Days</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">
            {rangeStart && rangeEnd
              ? Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
              : 0}
          </div>
          <div className="text-xs text-gray-600">Selected Days</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCurrentMonth(new Date())}
          className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200"
        >
          Today
        </button>
        <button
          onClick={() => {
            const nextWeekend = new Date();
            const daysUntilSaturday = 6 - nextWeekend.getDay();
            nextWeekend.setDate(nextWeekend.getDate() + daysUntilSaturday);
            const sunday = new Date(nextWeekend);
            sunday.setDate(nextWeekend.getDate() + 1);
            setRangeStart(nextWeekend);
            setRangeEnd(sunday);
            if (onDateSelect) onDateSelect(nextWeekend, sunday);
          }}
          className="rounded-md bg-blue-100 px-3 py-1 text-xs text-blue-700 transition-colors hover:bg-blue-200"
        >
          Next Weekend
        </button>
        <button
          onClick={() => {
            const today = new Date();
            today.setDate(today.getDate() + 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 2);
            setRangeStart(today);
            setRangeEnd(tomorrow);
            if (onDateSelect) onDateSelect(today, tomorrow);
          }}
          className="rounded-md bg-green-100 px-3 py-1 text-xs text-green-700 transition-colors hover:bg-green-200"
        >
          Next 3 Days
        </button>
      </div>

      {/* Real-time indicator */}
      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
        <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
        Live availability updates
      </div>
    </div>
  );
}
