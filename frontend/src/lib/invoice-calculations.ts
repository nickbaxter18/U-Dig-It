/**
 * Invoice Calculations
 * Shared calculation logic for invoice generation (both web and email)
 */
import type { InvoiceBookingData } from './invoice-html-generator';

export interface InvoiceCalculations {
  rentalDays: number;
  equipmentSubtotal: number;
  deliverySubtotal: number;
  pickupSubtotal: number;
  transportTotal: number;
  waiverCharge: number;
  subtotalBeforeDiscount: number;
  couponDiscount: number;
  subtotalAfterDiscount: number;
  taxesAmount: number;
  totalAmount: number;
  balanceAmount: number;
  hasAdditionalMileage: boolean;
  extraKm: number;
  additionalMileageFeePerDirection: number;
  displayBaseFee: number;
}

/**
 * Calculate all invoice financial values from booking data
 */
export function calculateInvoiceTotals(booking: InvoiceBookingData): InvoiceCalculations {
  const safeNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const startDate = booking.startDate;
  const endDate = booking.endDate;

  if (!startDate || !endDate) {
    throw new Error('Booking missing required dates (startDate or endDate)');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format in booking dates');
  }

  const rentalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const dailyRate = safeNumber(booking.dailyRate);
  const equipmentSubtotal = dailyRate * rentalDays;
  const distanceKm = safeNumber(booking.distanceKm);
  const INCLUDED_KM = 25;
  const hasAdditionalMileage = distanceKm > INCLUDED_KM;
  const extraKm = hasAdditionalMileage ? distanceKm - INCLUDED_KM : 0;
  const BASE_TRANSPORT_FEE = 150;
  const ADDITIONAL_KM_RATE = 3;
  const additionalMileageFeePerDirection = hasAdditionalMileage ? extraKm * ADDITIONAL_KM_RATE : 0;
  const floatFee = safeNumber(booking.floatFee);
  const deliveryFee = safeNumber(booking.deliveryFee);
  const calculatedDeliveryFee = floatFee / 2 || deliveryFee / 2;
  const displayBaseFee = hasAdditionalMileage ? BASE_TRANSPORT_FEE : calculatedDeliveryFee;
  const deliverySubtotal = displayBaseFee + additionalMileageFeePerDirection;
  const pickupSubtotal = displayBaseFee + additionalMileageFeePerDirection;
  const transportTotal = deliverySubtotal + pickupSubtotal;

  const waiverCharge = booking.waiver_selected && booking.waiver_rate_cents
    ? safeNumber(booking.waiver_rate_cents) / 100 * rentalDays
    : 0;

  const subtotalBeforeDiscount = equipmentSubtotal + transportTotal + waiverCharge;
  const couponDiscount = safeNumber(booking.couponDiscount);
  const subtotalAfterDiscount = Math.max(0, subtotalBeforeDiscount - couponDiscount);
  const taxesAmount = safeNumber(booking.taxes) || subtotalAfterDiscount * 0.15;
  const totalAmount = safeNumber(booking.totalAmount) || subtotalAfterDiscount + taxesAmount;
  const balanceAmount = safeNumber(booking.balance_amount);

  return {
    rentalDays,
    equipmentSubtotal,
    deliverySubtotal,
    pickupSubtotal,
    transportTotal,
    waiverCharge,
    subtotalBeforeDiscount,
    couponDiscount,
    subtotalAfterDiscount,
    taxesAmount,
    totalAmount,
    balanceAmount,
    hasAdditionalMileage,
    extraKm,
    additionalMileageFeePerDirection,
    displayBaseFee,
  };
}

