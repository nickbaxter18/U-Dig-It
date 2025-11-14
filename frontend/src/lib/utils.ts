import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat('en-CA', { ...defaultOptions, ...options }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateRentalDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateRentalCost(
  startDate: string,
  endDate: string,
  dailyRate: number = 450,
  taxRate: number = 0.15
): {
  days: number;
  subtotal: number;
  taxes: number;
  total: number;
} {
  const days = calculateRentalDays(startDate, endDate);
  const subtotal = days * dailyRate;
  const taxes = subtotal * taxRate;
  const total = subtotal + taxes;

  return {
    days,
    subtotal,
    taxes,
    total,
  };
}

export function generateBookingNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `UDR-${year}${month}${day}-${random}`;
}

export function contractNumberFromBooking(bookingNumber: string | null | undefined): string {
  const fallback = `CT-${Date.now().toString(36).toUpperCase()}`;
  if (!bookingNumber) {
    return fallback;
  }

  const trimmed = bookingNumber.trim();
  if (!trimmed) {
    return fallback;
  }

  const sanitized = trimmed.replace(/\s+/g, '');
  const prefixMatch = sanitized.match(/^(bk|ct)([-_]?)/i);
  let remainder = prefixMatch ? sanitized.slice(prefixMatch[0].length) : sanitized;
  remainder = remainder.replace(/^[-_]+/, '');

  if (!remainder) {
    return fallback;
  }

  return `CT-${remainder}`;
}

export function generateContractNumber(bookingNumber?: string | null): string {
  if (bookingNumber) {
    return contractNumberFromBooking(bookingNumber);
  }

  const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CT-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
}

export function generatePaymentNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `PAY-${year}${month}${day}-${random}`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

export function validatePostalCode(postalCode: string, country: string = 'CA'): boolean {
  if (country === 'CA') {
    const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return canadianPostalRegex.test(postalCode);
  }
  // Add other country validations as needed
  return true;
}

export function debounce<T extends (...args: unknown[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'U';

  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';

  return first + last;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_progress':
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'draft':
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'Confirmed';
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'failed':
      return 'Failed';
    case 'draft':
      return 'Draft';
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    default:
      return status;
  }
}
