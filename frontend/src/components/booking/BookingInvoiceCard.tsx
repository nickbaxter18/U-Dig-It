'use client';

import { useRef } from 'react';

import Image from 'next/image';

import { formatCurrency } from '@/lib/utils';

type Nullable<T> = T | null | undefined;

interface BookingInvoiceCardProps {
  booking: {
    id: string;
    bookingNumber: string;
    createdAt: string;
    startDate: string;
    endDate: string;
    subtotal?: number | string | null;
    taxes?: number | string | null;
    totalAmount?: number | string | null;
    balanceAmount?: number | string | null;
    deliveryFee?: number | string | null;
    securityDeposit?: number | string | null;
    floatFee?: number | string | null;
    distanceKm?: number | string | null;
    couponCode?: string | null;
    couponType?: string | null;
    couponValue?: string | number | null;
    couponDiscount?: string | number | null;
    waiver_selected?: boolean | null;
    waiver_rate_cents?: number | null;
    deliveryAddress?: string | null;
    deliveryCity?: string | null;
    deliveryProvince?: string | null;
    deliveryPostalCode?: string | null;
    equipment?: {
      model?: string | null;
      make?: string | null;
      type?: string | null;
      category?: string | null;
      unitId?: string | null;
    } | null;
    customer?: {
      firstName?: string | null;
      lastName?: string | null;
      company?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
  paymentAmountOverride?: number;
  className?: string;
  showPrintButton?: boolean;
}

const INCLUDED_KM = 30;
const ADDITIONAL_KM_RATE = 3;
const BASE_TRANSPORT_FEE = 150;

const safeNumber = (value: Nullable<number | string>): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

export default function BookingInvoiceCard({
  booking,
  paymentAmountOverride,
  className = '',
  showPrintButton = true,
}: BookingInvoiceCardProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const subtotal = safeNumber(booking.subtotal);
  const taxes = safeNumber(booking.taxes);
  const totalAmount = paymentAmountOverride ?? (booking.balanceAmount !== undefined && booking.balanceAmount !== null ? safeNumber(booking.balanceAmount) : safeNumber(booking.totalAmount));
  const deliveryFee = safeNumber(booking.deliveryFee);
  const securityDeposit = safeNumber(booking.securityDeposit);
  const floatFee = safeNumber(booking.floatFee);
  const distanceKm = safeNumber(booking.distanceKm);

  const rentalDays = Math.max(
    1,
    Math.ceil(
      (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const hasAdditionalMileage = distanceKm > INCLUDED_KM;
  const extraKm = hasAdditionalMileage ? distanceKm - INCLUDED_KM : 0;
  const additionalMileageFeePerDirection = hasAdditionalMileage ? extraKm * ADDITIONAL_KM_RATE : 0;
  const calculatedDeliveryFee = floatFee / 2 || deliveryFee / 2;
  const displayBaseFee = hasAdditionalMileage ? BASE_TRANSPORT_FEE : calculatedDeliveryFee;
  const transportTotal = hasAdditionalMileage
    ? (displayBaseFee + additionalMileageFeePerDirection) * 2
    : floatFee || deliveryFee;

  const waiverCharge =
    booking.waiver_selected && booking.waiver_rate_cents
      ? (booking.waiver_rate_cents / 100) * rentalDays
      : 0;

  const subtotalBeforeDiscount = subtotal + transportTotal + waiverCharge;

  let discountAmount = 0;
  if (booking.couponType && booking.couponValue !== null && booking.couponValue !== undefined) {
    const couponValue =
      typeof booking.couponValue === 'string'
        ? parseFloat(booking.couponValue)
        : booking.couponValue;
    if (booking.couponType === 'percentage' && couponValue) {
      discountAmount = subtotalBeforeDiscount * (couponValue / 100);
    } else if (
      (booking.couponType === 'fixed' || booking.couponType === 'fixed_amount') &&
      couponValue
    ) {
      discountAmount = Math.min(couponValue, subtotalBeforeDiscount);
    }
  } else if (booking.couponDiscount) {
    discountAmount = safeNumber(booking.couponDiscount);
  }

  const totalDue = totalAmount || subtotalBeforeDiscount - discountAmount + taxes;
  const deliverySubtotal = formatCurrency(displayBaseFee + additionalMileageFeePerDirection);
  const pickupSubtotal = formatCurrency(displayBaseFee + additionalMileageFeePerDirection);
  const additionalMileageLabel = `- Additional mileage per direction (${extraKm.toFixed(1)} km × $${ADDITIONAL_KM_RATE})`;
  const standardMileageLabel = '- Standard mileage (per direction):';

  const renderAmountRow = (label: string, amount: number, options: { strong?: boolean } = {}) => (
    <div className="flex justify-between text-sm">
      <span className={options.strong ? 'font-semibold text-gray-900' : 'text-gray-600'}>
        {label}
      </span>
      <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
    </div>
  );

  const handlePrint = () => {
    if (typeof window === 'undefined' || !invoiceRef.current) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(
      `<!doctype html><html><head><title>Invoice ${booking.bookingNumber}</title></head><body><div class="print-root">${invoiceRef.current.outerHTML}</div></body></html>`
    );
    doc.close();

    const sourceHeadNodes = document.querySelectorAll('link[rel="stylesheet"], style');
    sourceHeadNodes.forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      doc.head.appendChild(clone);
    });

    const extraStyle = doc.createElement('style');
    extraStyle.textContent = `
      body { margin: 0; background: #f4f6fb; }
      .print-root { padding: 0; display: flex; justify-content: center; }
      .print-root > div { width: 100%; max-width: 690px; border-radius: 10px; border: 1px solid #d1d5db; background: #fff; overflow: hidden; }
      .print-root > div.invoice-print-root { padding: 14px 20px; }
      .print-root header, .print-root section { page-break-inside: avoid; }
      .print-root h1, .print-root h2, .print-root h3 { margin-bottom: 0.45rem; }
      .print-root .space-y-5 > * + * { margin-top: 0.68rem !important; }
      .print-root .space-y-6 > * + * { margin-top: 0.78rem !important; }
      .print-root table { margin: 0 !important; }
      .print-root * { line-height: 1.18; font-size: 0.86rem; }
      .print-root h3 { font-size: 1.42rem; }
      .print-root .text-sm { font-size: 0.8rem; }
      .print-root .text-xs { font-size: 0.66rem; }
      .print-root .pt-6 { padding-top: 0.85rem !important; }
      .print-root .pb-6 { padding-bottom: 0.85rem !important; }
      .print-root .gap-6 { gap: 1rem !important; }
      .print-root .gap-5 { gap: 0.85rem !important; }
      .print-root .tracking-[0.35em] { letter-spacing: 0.25em !important; }
      .print-root .p-6 { padding: 14px !important; }
      .print-root .px-6 { padding-left: 18px !important; padding-right: 18px !important; }
      .print-root .pb-5 { padding-bottom: 1rem !important; }
      .print-root .pt-8 { padding-top: 1.4rem !important; }
      .print-root .discount-row { font-size: 0.78rem !important; }
      .no-print { display: none !important; }
      @page { size: A4 portrait; margin: 9mm; }
    `;
    doc.head.appendChild(extraStyle);

    const cleanup = () => {
      const parent = iframe.parentNode;
      if (parent) parent.removeChild(iframe);
    };

    const triggerPrint = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      win.focus();
      win.print();
      win.onafterprint = cleanup;
      setTimeout(cleanup, 1000);
    };

    setTimeout(triggerPrint, 300);
  };

  return (
    <div className={`overflow-hidden rounded-lg border-2 border-gray-300 bg-white ${className}`}>
      <div ref={invoiceRef} className="invoice-print-root">
        <div className="relative border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white px-6 pb-5 pt-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight text-gray-900">Invoice</h3>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-xl bg-[#0f172a] p-2 shadow-lg"
                  style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                >
                  <div className="relative h-[4.5rem] w-[4.5rem] sm:h-[5.5rem] sm:w-[5.5rem]">
                    <Image
                      src="/images/udigit-logo.png"
                      alt="U-Dig It Rentals watermark"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 80px, 110px"
                      priority={false}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.25em] text-gray-500 sm:text-sm">
                  <span className="font-semibold text-gray-600">U-Dig It Rentals Inc.</span>
                  <span className="text-gray-400">
                    945 Golden Grove Road • Saint John, NB E2H 2X1 • Canada
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4 text-right text-sm text-gray-600">
              {showPrintButton && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="no-print inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-12 0h12m-12 0v3h12v-3"
                    />
                  </svg>
                  Print Invoice
                </button>
              )}
              <div>
                <p className="font-semibold uppercase tracking-wide text-gray-500">Invoice #</p>
                <p className="mt-1 whitespace-nowrap text-lg font-bold tracking-wide text-gray-900">
                  {booking.bookingNumber}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Issued {new Date(booking.createdAt).toLocaleDateString('en-CA')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / Rental Info */}
        <div className="grid gap-6 border-b border-gray-200 bg-gray-50 p-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Bill To
            </h4>
            <p className="font-semibold text-gray-900">
              {booking.customer?.firstName} {booking.customer?.lastName}
            </p>
            {booking.customer?.company && (
              <p className="text-sm text-gray-600">{booking.customer.company}</p>
            )}
            {booking.deliveryAddress && (
              <p className="mt-1 text-sm text-gray-600">
                {booking.deliveryAddress}
                {booking.deliveryCity && `, ${booking.deliveryCity}`}
                {booking.deliveryProvince && `, ${booking.deliveryProvince}`}
                {booking.deliveryPostalCode && ` ${booking.deliveryPostalCode}`}
              </p>
            )}
            {booking.customer?.email && (
              <p className="mt-1 text-sm text-gray-600">{booking.customer.email}</p>
            )}
            {booking.customer?.phone && (
              <p className="text-sm text-gray-600">{booking.customer.phone}</p>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Rental Period
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-gray-900">{formatDate(booking.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium text-gray-900">{formatDate(booking.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">
                  {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {/* Equipment */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                Equipment Rental ({rentalDays} {rentalDays === 1 ? 'day' : 'days'} @{' '}
                {formatCurrency(
                  safeNumber(
                    (booking as { dailyRate?: number } | null)?.dailyRate ?? subtotal / rentalDays
                  )
                )}
                /day)
              </p>
              <p className="text-sm text-gray-600">
                {booking.equipment?.make} {booking.equipment?.model}
                {booking.equipment?.unitId ? ` • Unit: ${booking.equipment.unitId}` : ''}
              </p>
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>

          {/* Transportation & Staging */}
          {transportTotal > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="font-semibold text-gray-900">Transportation &amp; Staging</p>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(transportTotal)}
                </span>
              </div>
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">• Delivery to site:</p>
                  <div className="ml-4 space-y-1">
                    <div className="flex justify-between">
                      <span>{standardMileageLabel}</span>
                      <span>{formatCurrency(displayBaseFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{additionalMileageLabel}</span>
                      <span>{formatCurrency(additionalMileageFeePerDirection)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 text-xs uppercase tracking-wide text-gray-500">
                      <span>Subtotal:</span>
                      <span>{deliverySubtotal}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-medium text-gray-900">• Pickup from site:</p>
                  <div className="ml-4 space-y-1">
                    <div className="flex justify-between">
                      <span>{standardMileageLabel}</span>
                      <span>{formatCurrency(displayBaseFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{additionalMileageLabel}</span>
                      <span>{formatCurrency(additionalMileageFeePerDirection)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 text-xs uppercase tracking-wide text-gray-500">
                      <span>Subtotal:</span>
                      <span>{pickupSubtotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Damage Waiver */}
          {waiverCharge > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Damage Waiver ({rentalDays} {rentalDays === 1 ? 'day' : 'days'} ×{' '}
                {formatCurrency(booking.waiver_rate_cents! / 100)})
              </span>
              <span className="font-medium text-gray-900">{formatCurrency(waiverCharge)}</span>
            </div>
          )}

          {/* Subtotals & Totals */}
          <div className="space-y-2 border-t-2 border-gray-300 pt-4 text-sm">
            {renderAmountRow(
              `Subtotal (Equipment + Transport${waiverCharge > 0 ? ' + Waiver' : ''})`,
              subtotalBeforeDiscount
            )}

            {discountAmount > 0 && (
              <div className="discount-row flex justify-between text-sm text-green-700">
                <span>Discount ({booking.couponCode})</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {discountAmount > 0 &&
              renderAmountRow('Subtotal After Discount', subtotalBeforeDiscount - discountAmount)}

            {renderAmountRow('HST (15%)', taxes)}

            <div className="flex justify-between border-t border-gray-300 pt-3 text-base font-semibold text-gray-900">
              <span>Total Amount</span>
              <span>{formatCurrency(totalDue)}</span>
            </div>

            {securityDeposit > 0 && (
              <div className="flex justify-between text-xs text-blue-600">
                <span>Security Deposit</span>
                <span>{formatCurrency(securityDeposit)}</span>
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            CAD • All taxes included. Note: A refundable security deposit may still be required at
            pickup or delivery.
          </p>
        </div>
      </div>
    </div>
  );
}
