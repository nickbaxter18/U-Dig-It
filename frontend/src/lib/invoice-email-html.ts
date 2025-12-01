/**
 * Invoice Email HTML Generator
 * Generates email-compatible HTML for invoice financial breakdown
 * Uses tables instead of flexbox for maximum email client compatibility
 */
import type { InvoiceBookingData } from './invoice-html-generator';
import { calculateInvoiceTotals } from './invoice-calculations';

export interface InvoiceEmailOptions {
  paymentUrl?: string | null;
}

export function generateInvoiceEmailHtml(booking: InvoiceBookingData, options?: InvoiceEmailOptions): string {
  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  // Helper to create a two-column row (label on left, value on right)
  const twoColumnRow = (label: string, value: string, labelStyle = '', valueStyle = ''): string => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
      <tr>
        <td style="text-align:left;${labelStyle}">${label}</td>
        <td style="text-align:right;${valueStyle}">${value}</td>
      </tr>
    </table>
  `;

  const calculations = calculateInvoiceTotals(booking);

  const bookingNumber = booking.bookingNumber || 'N/A';
  const startDate = booking.startDate;
  const endDate = booking.endDate;

  const equipment = booking.equipment && typeof booking.equipment === 'object' && !Array.isArray(booking.equipment)
    ? booking.equipment
    : null;
  const equipmentDescription = equipment
    ? `${equipment.make || ''} ${equipment.model || ''}`.trim() || 'Equipment'
    : 'Equipment';
  const equipmentUnit = equipment?.unitId ? ` &bull; Unit: ${equipment.unitId}` : '';

  // Equipment Rental Section
  const equipmentHtml = `
    <div style="margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #e5e7eb;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-weight:600; color:#0f172a; font-size:15px; margin-bottom:4px;">
              Equipment Rental (${calculations.rentalDays} ${calculations.rentalDays === 1 ? 'day' : 'days'} @ ${formatCurrency(calculations.equipmentSubtotal / calculations.rentalDays)}/day)
            </div>
            <div style="font-size:13px; color:#4b5563;">
              ${escapeHtml(equipmentDescription)}${equipmentUnit}
            </div>
          </td>
          <td style="vertical-align:top; text-align:right; font-weight:600; color:#0f172a; font-size:15px;">
            ${formatCurrency(calculations.equipmentSubtotal)}
          </td>
        </tr>
      </table>
    </div>
  `;

  // Transportation Breakdown
  const transportHtml = calculations.transportTotal > 0 ? `
    <div style="margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #e5e7eb;">
      <div style="font-weight:600; color:#0f172a; font-size:15px; margin-bottom:16px;">
        Transportation &amp; Staging
      </div>
      <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:12px;">
        <div style="margin-bottom:16px;">
          <div style="font-weight:600; color:#111827; font-size:14px; margin-bottom:8px;">&bull; Delivery to site:</div>
          <div style="margin-left:12px;">
            ${twoColumnRow(
              '- Standard mileage (per direction):',
              formatCurrency(calculations.displayBaseFee),
              'color:#4b5563; font-size:13px;',
              'color:#4b5563; font-size:13px;'
            )}
            ${calculations.hasAdditionalMileage ? twoColumnRow(
              `- Additional mileage per direction (${calculations.extraKm.toFixed(1)} km × $3):`,
              formatCurrency(calculations.additionalMileageFeePerDirection),
              'color:#4b5563; font-size:13px;',
              'color:#4b5563; font-size:13px;'
            ) : ''}
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb; margin-top:10px; padding-top:8px;">
              <tr>
                <td style="text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280; padding-top:8px;">SUBTOTAL:</td>
                <td style="text-align:right; font-size:12px; color:#6b7280; padding-top:8px;">${formatCurrency(calculations.deliverySubtotal)}</td>
              </tr>
            </table>
          </div>
        </div>
        <div>
          <div style="font-weight:600; color:#111827; font-size:14px; margin-bottom:8px;">&bull; Pickup from site:</div>
          <div style="margin-left:12px;">
            ${twoColumnRow(
              '- Standard mileage (per direction):',
              formatCurrency(calculations.displayBaseFee),
              'color:#4b5563; font-size:13px;',
              'color:#4b5563; font-size:13px;'
            )}
            ${calculations.hasAdditionalMileage ? twoColumnRow(
              `- Additional mileage per direction (${calculations.extraKm.toFixed(1)} km × $3):`,
              formatCurrency(calculations.additionalMileageFeePerDirection),
              'color:#4b5563; font-size:13px;',
              'color:#4b5563; font-size:13px;'
            ) : ''}
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb; margin-top:10px; padding-top:8px;">
              <tr>
                <td style="text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280; padding-top:8px;">SUBTOTAL:</td>
                <td style="text-align:right; font-size:12px; color:#6b7280; padding-top:8px;">${formatCurrency(calculations.pickupSubtotal)}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      <div style="text-align:right; font-weight:600; color:#0f172a; font-size:15px;">
        ${formatCurrency(calculations.transportTotal)}
      </div>
    </div>
  ` : '';

  // Damage Waiver Section
  const waiverHtml = calculations.waiverCharge > 0 ? `
    <div style="margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #e5e7eb;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-weight:600; color:#0f172a; font-size:15px; margin-bottom:4px;">
              Damage Waiver
            </div>
            <div style="font-size:13px; color:#4b5563;">
              ${calculations.rentalDays} ${calculations.rentalDays === 1 ? 'day' : 'days'} &times; ${formatCurrency(
                booking.waiver_rate_cents ? (typeof booking.waiver_rate_cents === 'number' ? booking.waiver_rate_cents : parseFloat(booking.waiver_rate_cents)) / 100 : 0
              )}
            </div>
          </td>
          <td style="vertical-align:top; text-align:right; font-weight:600; color:#0f172a; font-size:15px;">
            ${formatCurrency(calculations.waiverCharge)}
          </td>
        </tr>
      </table>
    </div>
  ` : '';

  // Discount Section
  const discountHtml = calculations.couponDiscount > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
      <tr>
        <td style="text-align:left; font-size:14px; color:#10b981;">
          Discount${booking.couponCode ? ` (${escapeHtml(booking.couponCode)})` : ''}
        </td>
        <td style="text-align:right; font-size:14px; font-weight:600; color:#10b981;">
          -${formatCurrency(calculations.couponDiscount)}
        </td>
      </tr>
    </table>
  ` : '';

  const safeNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Payments Section - Show completed payments as deductions
  const paymentsHtml = (() => {
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
      <div style="margin-top:24px; padding-top:20px; border-top:2px solid #d1d5db;">
        <div style="font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#6b7280; margin-bottom:12px;">
          Payments Received
        </div>
        ${completedPayments.map((p: any) => {
          const paymentAmount = safeNumber(p.amount);
          const paymentMethod = formatPaymentMethod(p.method);
          const paymentDate = formatPaymentDate(p.processedAt || p.createdAt);
          const paymentNumber = p.paymentNumber ? ` (${escapeHtml(p.paymentNumber)})` : '';
          return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
              <tr>
                <td style="text-align:left; font-size:13px; color:#4b5563;">
                  ${paymentMethod}${paymentNumber}${paymentDate ? ` - ${paymentDate}` : ''}
                </td>
                <td style="text-align:right; font-size:13px; font-weight:600; color:#10b981;">
                  -${formatCurrency(paymentAmount)}
                </td>
              </tr>
            </table>
          `;
        }).join('')}
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px; padding-top:12px; border-top:1px solid #e5e7eb;">
          <tr>
            <td style="text-align:left; font-size:14px; font-weight:600; color:#0f172a;">
              Total Payments
            </td>
            <td style="text-align:right; font-size:14px; font-weight:600; color:#10b981;">
              -${formatCurrency(totalPayments)}
            </td>
          </tr>
        </table>
      </div>
    `;
  })();

  // Summary Section
  const summaryHtml = `
    <div style="margin-top:24px; padding-top:20px; border-top:2px solid #d1d5db;">
      ${discountHtml}
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td style="text-align:left; font-size:14px; color:#374151;">Subtotal</td>
          <td style="text-align:right; font-size:14px; font-weight:600; color:#374151;">${formatCurrency(calculations.subtotalAfterDiscount)}</td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td style="text-align:left; font-size:14px; color:#374151;">HST (15%)</td>
          <td style="text-align:right; font-size:14px; font-weight:600; color:#374151;">${formatCurrency(calculations.taxesAmount)}</td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-top:14px; border-top:1px solid #d1d5db;">
        <tr>
          <td style="text-align:left; font-size:18px; font-weight:700; color:#111827;">Total Amount</td>
          <td style="text-align:right; font-size:18px; font-weight:700; color:#111827;">${formatCurrency(calculations.totalAmount)}</td>
        </tr>
      </table>
    </div>
  `;

  // Payment Section - Show payment button if balance > 0 and payment URL provided, otherwise show balance status
  const paymentHtml = (() => {
    if (calculations.balanceAmount === null || calculations.balanceAmount === undefined) {
      return '';
    }

    if (calculations.balanceAmount <= 0) {
      // Invoice paid in full
      return `
        <div style="margin-top:20px; padding:16px; background:linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius:12px; border:1px solid #10b981;">
          <div style="font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#047857; margin-bottom:8px;">
            Invoice Paid in Full
          </div>
          <div style="font-size:24px; font-weight:700; color:#047857;">
            $0.00 &#10003;
          </div>
        </div>
      `;
    }

    // Show payment button if payment URL provided
    if (options?.paymentUrl) {
      return `
        <div style="margin-top:24px; text-align:center;">
          <a href="${escapeHtml(options.paymentUrl)}" style="display:inline-block; padding:16px 48px; background-color:#635BFF; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px; box-shadow:0 2px 4px rgba(99, 91, 255, 0.2);">
            Pay ${formatCurrency(calculations.balanceAmount)}
          </a>
          <p style="margin-top:12px; font-size:12px; color:#6b7280;">
            Secure payment powered by <strong>Stripe</strong>
          </p>
        </div>
      `;
    }

    // Fallback: show outstanding balance if no payment URL
    return `
      <div style="margin-top:20px; padding:16px; background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius:12px; border:1px solid #f59e0b;">
        <div style="font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#92400e; margin-bottom:8px;">
          Outstanding Balance
        </div>
        <div style="font-size:24px; font-weight:700; color:#78350f;">
          ${formatCurrency(calculations.balanceAmount)}
        </div>
      </div>
    `;
  })();

  // Rental Period Info
  const rentalPeriodHtml = `
    <div style="margin-bottom:20px; padding:16px; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb;">
      <div style="font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280; margin-bottom:10px; font-weight:600;">
        Rental Period
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align:left; font-size:14px; color:#4b5563; padding-bottom:6px;">Start Date:</td>
          <td style="text-align:right; font-size:14px; font-weight:600; color:#111827; padding-bottom:6px;">${formatDate(startDate)}</td>
        </tr>
        <tr>
          <td style="text-align:left; font-size:14px; color:#4b5563; padding-bottom:6px;">End Date:</td>
          <td style="text-align:right; font-size:14px; font-weight:600; color:#111827; padding-bottom:6px;">${formatDate(endDate)}</td>
        </tr>
        <tr>
          <td style="text-align:left; font-size:14px; color:#4b5563;">Duration:</td>
          <td style="text-align:right; font-size:14px; font-weight:600; color:#111827;">${calculations.rentalDays} ${calculations.rentalDays === 1 ? 'day' : 'days'}</td>
        </tr>
      </table>
    </div>
  `;

  return `
    ${rentalPeriodHtml}
    <div style="margin:24px 0; padding:24px; border:1px solid #e5e7eb; border-radius:12px; background:#ffffff;">
      <div style="font-size:16px; font-weight:600; color:#0f172a; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid #e5e7eb;">
        Invoice Details
      </div>
      ${equipmentHtml}
      ${transportHtml}
      ${waiverHtml}
      ${summaryHtml}
      ${paymentsHtml}
      ${paymentHtml}
    </div>
  `;
}
