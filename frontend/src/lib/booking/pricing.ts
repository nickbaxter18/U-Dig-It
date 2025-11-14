import { calculateRentalDays as calculateRentalDaysFromUtils } from '@/lib/utils';

export interface BookingPricingInput {
  equipment: {
    dailyRate: number;
    weeklyRate: number;
    monthlyRate: number;
    overageHourlyRate?: number;
    dailyHourAllowance?: number;
    weeklyHourAllowance?: number;
  };
  startDate: Date | string;
  endDate: Date | string;
  delivery?: {
    city?: string | null;
    distanceKm?: number | null;
  };
  includeInsurance?: boolean;
  includeOperator?: boolean;
  coupon?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface BookingPricingBreakdownItem {
  item: string;
  amount: number;
}

export interface BookingPricingResult {
  days: number;
  rentalCost: number;
  discount: number;
  insuranceFee: number;
  operatorFee: number;
  deliveryFee: number;
  couponDiscount: number;
  subtotal: number;
  taxes: number;
  total: number;
  deposit: number;
  breakdown: BookingPricingBreakdownItem[];
}

const TAX_RATE = 0.15;
const INSURANCE_RATE = 0.08;
const OPERATOR_DAILY_RATE = 150;
const DEPOSIT_RATE = 0.30;

const roundCurrency = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

export function calculateRentalDays(start: Date | string, end: Date | string): number {
  const startIso = start instanceof Date ? start.toISOString() : start;
  const endIso = end instanceof Date ? end.toISOString() : end;
  return calculateRentalDaysFromUtils(startIso, endIso);
}

export function calculateDeliveryFee(distanceKm?: number | null): number {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
    return 0;
  }

  const distance = Math.max(0, distanceKm);

  if (distance <= 10) return 50;
  if (distance <= 25) return 75;
  if (distance <= 50) return 125;

  return roundCurrency(125 + (distance - 50) * 2);
}

export function calculateBookingPricing(input: BookingPricingInput): BookingPricingResult {
  const days = Math.max(1, calculateRentalDays(input.startDate, input.endDate));
  const breakdown: BookingPricingBreakdownItem[] = [];

  const baseDailyRate = Math.max(0, input.equipment.dailyRate);
  let rentalCost = baseDailyRate * days;
  breakdown.push({ item: 'Equipment rental', amount: roundCurrency(rentalCost) });

  // Apply long-term discounts
  let discount = 0;
  if (days >= 30) {
    discount = rentalCost * 0.2;
    breakdown.push({ item: 'Monthly discount (20%)', amount: roundCurrency(-discount) });
  } else if (days >= 7) {
    discount = rentalCost * 0.1;
    breakdown.push({ item: 'Weekly discount (10%)', amount: roundCurrency(-discount) });
  }
  rentalCost -= discount;

  // Optional add-ons
  const insuranceFee = input.includeInsurance ? rentalCost * INSURANCE_RATE : 0;
  if (insuranceFee > 0) {
    breakdown.push({ item: 'Insurance coverage', amount: roundCurrency(insuranceFee) });
  }

  const operatorFee = input.includeOperator ? OPERATOR_DAILY_RATE * days : 0;
  if (operatorFee > 0) {
    breakdown.push({ item: 'Certified operator', amount: roundCurrency(operatorFee) });
  }

  const deliveryFee = calculateDeliveryFee(input.delivery?.distanceKm ?? null);
  if (deliveryFee > 0) {
    breakdown.push({ item: 'Delivery & pickup', amount: roundCurrency(deliveryFee) });
  }

  let subtotal = rentalCost + insuranceFee + operatorFee + deliveryFee;

  // Coupon discounts
  let couponDiscount = 0;
  if (input.coupon) {
    if (input.coupon.type === 'percentage') {
      couponDiscount = subtotal * (input.coupon.value / 100);
    } else {
      couponDiscount = input.coupon.value;
    }
    couponDiscount = Math.min(couponDiscount, subtotal);
    if (couponDiscount > 0) {
      breakdown.push({ item: 'Coupon discount', amount: roundCurrency(-couponDiscount) });
    }
    subtotal -= couponDiscount;
  }

  const taxes = subtotal * TAX_RATE;
  const total = subtotal + taxes;
  const deposit = total * DEPOSIT_RATE;

  return {
    days,
    rentalCost: roundCurrency(rentalCost),
    discount: roundCurrency(discount),
    insuranceFee: roundCurrency(insuranceFee),
    operatorFee: roundCurrency(operatorFee),
    deliveryFee: roundCurrency(deliveryFee),
    couponDiscount: roundCurrency(couponDiscount),
    subtotal: roundCurrency(subtotal),
    taxes: roundCurrency(taxes),
    total: roundCurrency(total),
    deposit: roundCurrency(deposit),
    breakdown: breakdown.map((item) => ({
      item: item.item,
      amount: roundCurrency(item.amount),
    })),
  };
}

