/**
 * Invoice HTML Generator
 * Shared utility for generating invoice HTML for both display and email purposes
 */
import { getEmailLogoImgSrc } from '@/lib/email-template';
import { logger } from '@/lib/logger';
import { calculateInvoiceTotals } from './invoice-calculations';

export interface InvoiceBookingData {
  bookingNumber: string | null;
  createdAt: string | null;
  startDate: string;
  endDate: string;
  subtotal: number | string | null;
  taxes: number | string | null;
  totalAmount: number | string | null;
  balance_amount: number | string | null;
  dailyRate: number | string | null;
  floatFee: number | string | null;
  deliveryFee: number | string | null;
  distanceKm: number | string | null;
  waiver_selected: boolean | null;
  waiver_rate_cents: number | string | null;
  couponCode: string | null;
  couponType: string | null;
  couponValue: number | string | null;
  couponDiscount: number | string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    companyName: string | null;
    phone: string | null;
  } | null;
  equipment: {
    make: string | null;
    model: string | null;
    type: string | null;
    unitId: string | null;
    serialNumber: string | null;
  } | null;
  payments?: Array<{
    id: string;
    paymentNumber?: string | null;
    amount: number | string;
    status: string;
    type?: string | null;
    method?: string | null;
    processedAt?: string | null;
    createdAt?: string | null;
  }> | null;
}

/**
 * Generate invoice HTML (with payment information displayed as deductions)
 * Used for both display and email sending
 */
export function generateInvoiceHtml(booking: InvoiceBookingData): string {
  const safeNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-CA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Halifax', // Atlantic Time - Saint John, NB
      });
    } catch {
      return dateString;
    }
  };

  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const bookingNumber = booking.bookingNumber || 'N/A';
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

  // Use shared calculation function
  const calculations = calculateInvoiceTotals(booking);

  // Extract values for backward compatibility with existing code
  const rentalDays = calculations.rentalDays;
  const equipmentSubtotal = calculations.equipmentSubtotal;
  const deliverySubtotal = calculations.deliverySubtotal;
  const pickupSubtotal = calculations.pickupSubtotal;
  const transportTotal = calculations.transportTotal;
  const waiverCharge = calculations.waiverCharge;
  const subtotalBeforeDiscount = calculations.subtotalBeforeDiscount;
  const couponDiscount = calculations.couponDiscount;
  const subtotalAfterDiscount = calculations.subtotalAfterDiscount;
  const taxesAmount = calculations.taxesAmount;
  const totalAmount = calculations.totalAmount;
  const balanceAmount = calculations.balanceAmount;
  const hasAdditionalMileage = calculations.hasAdditionalMileage;
  const extraKm = calculations.extraKm;
  const additionalMileageFeePerDirection = calculations.additionalMileageFeePerDirection;
  const displayBaseFee = calculations.displayBaseFee;

  const customer = booking.customer && typeof booking.customer === 'object' && !Array.isArray(booking.customer)
    ? booking.customer
    : null;
  const customerName = customer
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer'
    : 'Customer';
  const customerCompany = customer?.companyName || null;
  const customerEmail = customer?.email || '';
  const customerPhone = customer?.phone || '';

  const equipment = booking.equipment && typeof booking.equipment === 'object' && !Array.isArray(booking.equipment)
    ? booking.equipment
    : null;
  const equipmentDescription = equipment
    ? `${equipment.make || ''} ${equipment.model || ''}`.trim() || 'Equipment'
    : 'Equipment';
  const equipmentUnit = equipment?.unitId ? ` • Unit: ${equipment.unitId}` : '';

  const deliveryAddress = booking.deliveryAddress
    ? `${booking.deliveryAddress}${booking.deliveryCity ? `, ${booking.deliveryCity}` : ''}${booking.deliveryProvince ? `, ${booking.deliveryProvince}` : ''}${booking.deliveryPostalCode ? ` ${booking.deliveryPostalCode}` : ''}`
    : null;

  const issuedDate = booking.createdAt ? formatDate(booking.createdAt) : formatDate(new Date().toISOString());

  const billToLines = customer
    ? `
      <p style="margin:0; font-size:14px; font-weight:600; color:#0f172a;">${escapeHtml(customerName)}</p>
      ${customerCompany ? `<p style="margin:4px 0 0; font-size:13px; color:#4b5563;">${escapeHtml(customerCompany)}</p>` : ''}
      ${deliveryAddress ? `<p style="margin:4px 0 0; font-size:13px; color:#4b5563;">${escapeHtml(deliveryAddress)}</p>` : ''}
      ${customerEmail ? `<p style="margin:4px 0 0; font-size:13px; color:#4b5563;">${escapeHtml(customerEmail)}</p>` : ''}
      ${customerPhone ? `<p style="margin:4px 0 0; font-size:13px; color:#4b5563;">${escapeHtml(customerPhone)}</p>` : ''}
    `
    : null;

  const rentalPeriodHtml = `
    <p style="margin:0 0 6px 0; display:flex; justify-content:space-between;">
      <span style="color:#4b5563;">Start Date:</span>
      <strong style="color:#111827;">${formatDate(startDate)}</strong>
    </p>
    <p style="margin:0 0 6px 0; display:flex; justify-content:space-between;">
      <span style="color:#4b5563;">End Date:</span>
      <strong style="color:#111827;">${formatDate(endDate)}</strong>
    </p>
    <p style="margin:0; display:flex; justify-content:space-between;">
      <span style="color:#4b5563;">Duration:</span>
      <strong style="color:#111827;">${rentalDays} ${rentalDays === 1 ? 'day' : 'days'}</strong>
    </p>
  `;

  const discountHtml = couponDiscount > 0
    ? `
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; color:#10b981;">
        <span>Discount${booking.couponCode ? ` (${escapeHtml(booking.couponCode)})` : ''}</span>
        <strong>-${formatCurrency(couponDiscount)}</strong>
      </div>
    `
    : '';

  const transportBreakdownHtml = transportTotal > 0
    ? `
      <div style="margin-top:18px;">
        <div style="display:flex; justify-content:space-between; font-weight:600; color:#0f172a;">
          <span>Transportation &amp; Staging</span>
          <span>${formatCurrency(transportTotal)}</span>
        </div>
        <div style="margin-top:12px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb; padding:16px;">
          <div style="margin-bottom:16px;">
            <p style="margin:0 0 8px 0; font-weight:600; color:#111827;">• Delivery to site:</p>
            <div style="margin-left:12px;">
              <div style="display:flex; justify-content:space-between; color:#4b5563; font-size:13px; margin-bottom:6px;">
                <span>- Standard mileage (per direction):</span>
                <span>${formatCurrency(displayBaseFee)}</span>
              </div>
              ${hasAdditionalMileage ? `
              <div style="display:flex; justify-content:space-between; color:#4b5563; font-size:13px;">
                <span>- Additional mileage per direction (${extraKm.toFixed(1)} km × $3):</span>
                <span>${formatCurrency(additionalMileageFeePerDirection)}</span>
              </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between; border-top:1px solid #e5e7eb; margin-top:10px; padding-top:8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280;">
                <span>Subtotal:</span>
                <span>${formatCurrency(deliverySubtotal)}</span>
              </div>
            </div>
          </div>
          <div>
            <p style="margin:0 0 8px 0; font-weight:600; color:#111827;">• Pickup from site:</p>
            <div style="margin-left:12px;">
              <div style="display:flex; justify-content:space-between; color:#4b5563; font-size:13px; margin-bottom:6px;">
                <span>- Standard mileage (per direction):</span>
                <span>${formatCurrency(displayBaseFee)}</span>
              </div>
              ${hasAdditionalMileage ? `
              <div style="display:flex; justify-content:space-between; color:#4b5563; font-size:13px;">
                <span>- Additional mileage per direction (${extraKm.toFixed(1)} km × $3):</span>
                <span>${formatCurrency(additionalMileageFeePerDirection)}</span>
              </div>
              ` : ''}
              <div style="display:flex; justify-content:space-between; border-top:1px solid #e5e7eb; margin-top:10px; padding-top:8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280;">
                <span>Subtotal:</span>
                <span>${formatCurrency(pickupSubtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    : '';

  const waiverHtml = waiverCharge > 0
    ? `
      <div style="margin-top:18px; display:flex; justify-content:space-between; font-size:13px; color:#4b5563;">
        <span>Damage Waiver (${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} × ${formatCurrency(
          booking.waiver_rate_cents ? safeNumber(booking.waiver_rate_cents) / 100 : 0
        )})</span>
        <span style="font-weight:600; color:#0f172a;">${formatCurrency(waiverCharge)}</span>
      </div>
    `
    : '';

  // Get logo using the same function as email templates (with fallback)
  let logoUrl: string;
  try {
    logoUrl = getEmailLogoImgSrc();
  } catch (error) {
    // Fallback if logo loading fails
    logoUrl = 'https://udigitrentals.com/images/udigit-logo.png';
    logger.warn('Failed to load logo for invoice', {
      component: 'invoice-html-generator',
      action: 'logo_load_failed',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${escapeHtml(bookingNumber)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #111827;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f9fafb;
    }
    .invoice-container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .logo-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .logo {
      width: 72px;
      height: 72px;
      background: #0f172a;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 600;
      color: #374151;
      margin-bottom: 4px;
    }
    .company-address {
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #9ca3af;
    }
    .invoice-number {
      text-align: right;
    }
    .invoice-label {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #4b5563;
      margin-bottom: 8px;
    }
    .invoice-value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .invoice-date {
      font-size: 12px;
      color: #6b7280;
    }
    .bill-to-section {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      padding: 24px;
      margin: 0 -40px 0 -40px;
    }
    .section-label {
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .line-items {
      margin-top: 24px;
    }
    .line-item {
      margin-bottom: 18px;
    }
    .line-item-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .line-item-details {
      font-size: 13px;
      color: #4b5563;
      margin-left: 12px;
    }
    .summary {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 2px solid #d1d5db;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
      color: #374151;
    }
    .summary-total {
      display: flex;
      justify-content: space-between;
      padding-top: 14px;
      border-top: 1px solid #d1d5db;
      font-size: 18px;
      font-weight: 700;
      color: #111827;
    }
    .balance-section {
      margin-top: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      border: 1px solid #f59e0b;
    }
    .balance-label {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #92400e;
      margin-bottom: 8px;
    }
    .balance-amount {
      font-size: 24px;
      font-weight: 700;
      color: #78350f;
    }
    .balance-zero {
      color: #047857;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div class="logo-section">
          <div class="logo" style="background: #0f172a; border-radius: 20px; padding: 12px; display: flex; align-items: center; justify-content: center;">
            <img src="${logoUrl}" alt="U-Dig It Rentals" style="max-width: 48px; max-height: 48px; width: auto; height: auto; object-fit: contain;">
          </div>
          <div class="company-info">
            <div class="company-name">U-DIG IT RENTALS INC.</div>
            <div class="company-address">945 Golden Grove Road • Saint John, NB E2H 2X1 • Canada</div>
          </div>
        </div>
        <div class="invoice-number">
          <div class="invoice-label">Invoice #</div>
          <div class="invoice-value">${escapeHtml(bookingNumber)}</div>
          <div class="invoice-date">Issued ${issuedDate}</div>
        </div>
      </div>
    </div>

    <div class="bill-to-section">
      <div style="display: flex; justify-content: space-between; gap: 18px;">
        <div style="flex: 1;">
          <div class="section-label">Bill To</div>
          ${billToLines || '<p style="margin:0; font-size:13px; color:#4b5563;">Customer details on file.</p>'}
        </div>
        <div style="min-width: 200px;">
          <div class="section-label">Rental Period</div>
          ${rentalPeriodHtml}
        </div>
      </div>
    </div>

    <div class="line-items">
      <div class="line-item">
        <div class="line-item-title">
          Equipment Rental (${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} @ ${formatCurrency(equipmentSubtotal / rentalDays)}/day)
        </div>
        <div class="line-item-details">
          ${escapeHtml(equipmentDescription)}${equipmentUnit}
        </div>
        <div style="text-align: right; font-weight: 600; color: #0f172a; margin-top: 8px;">
          ${formatCurrency(equipmentSubtotal)}
        </div>
      </div>
      ${transportBreakdownHtml}
      ${waiverHtml}
    </div>

    <div class="summary">
      ${discountHtml}
      <div class="summary-row">
        <span>Subtotal</span>
        <strong>${formatCurrency(subtotalAfterDiscount)}</strong>
      </div>
      <div class="summary-row">
        <span>HST (15%)</span>
        <strong>${formatCurrency(taxesAmount)}</strong>
      </div>
      <div class="summary-total">
        <span>Total Amount</span>
        <span>${formatCurrency(totalAmount)}</span>
      </div>
    </div>

    ${(() => {
      // Calculate and display payments
      const payments = booking.payments || [];
      const completedPayments = payments.filter((p: any) => {
        const status = typeof p.status === 'string' ? p.status.toLowerCase() : '';
        // Accept 'completed', 'succeeded', or 'paid' status
        return status === 'completed' || status === 'succeeded' || status === 'paid';
      });

      if (completedPayments.length === 0) {
        return '';
      }

      const totalPayments = completedPayments.reduce((sum: number, p: any) => {
        return sum + safeNumber(p.amount);
      }, 0);

      const formatPaymentMethod = (method: string | null | undefined): string => {
        if (!method) return 'Payment';
        const methodMap: Record<string, string> = {
          'credit_card': 'Credit Card',
          'debit_card': 'Debit Card',
          'bank_transfer': 'Bank Transfer',
          'cash': 'Cash',
          'check': 'Check',
          'ach': 'ACH',
        };
        return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1).replace(/_/g, ' ');
      };

      const formatPaymentDate = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        try {
          return new Date(dateString).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'America/Halifax', // Atlantic Time - Saint John, NB
          });
        } catch {
          return '';
        }
      };

      return `
        <div style="margin-top: 24px; padding-top: 18px; border-top: 2px solid #d1d5db;">
          <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 12px;">
            Payments Received
          </div>
          ${completedPayments.map((p: any) => {
            const paymentAmount = safeNumber(p.amount);
            const paymentMethod = formatPaymentMethod(p.method);
            const paymentDate = formatPaymentDate(p.processedAt || p.createdAt);
            const paymentNumber = p.paymentNumber ? ` (${escapeHtml(p.paymentNumber)})` : '';
            return `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #4b5563;">
                <span>${paymentMethod}${paymentNumber}${paymentDate ? ` - ${paymentDate}` : ''}</span>
                <strong style="color: #10b981;">-${formatCurrency(paymentAmount)}</strong>
              </div>
            `;
          }).join('')}
          <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 14px; font-weight: 600; color: #0f172a;">
            <span>Total Payments</span>
            <strong style="color: #10b981;">-${formatCurrency(totalPayments)}</strong>
          </div>
        </div>
      `;
    })()}

    ${balanceAmount !== null && balanceAmount !== undefined ? `
    <div class="balance-section">
      <div class="balance-label">${balanceAmount <= 0 ? 'Invoice Paid in Full' : 'Outstanding Balance'}</div>
      <div class="balance-amount ${balanceAmount <= 0 ? 'balance-zero' : ''}">
        ${balanceAmount <= 0 ? '$0.00 ✓' : formatCurrency(balanceAmount)}
      </div>
    </div>
    ` : ''}

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
      <p style="margin: 0 0 8px 0;">HST/GST Registration: 744292160 RT0001</p>
      <p style="margin: 0;">Need help? Reply to this email or call (506) 555-0199.</p>
    </div>
  </div>
</body>
</html>`;
}




