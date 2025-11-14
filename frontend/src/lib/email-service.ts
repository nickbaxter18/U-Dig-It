/**
 * Email Service - SendGrid Integration
 * Handles all email notifications for the Kubota Rental Platform
 */
import sgMail from '@sendgrid/mail';

import { escapeHtml, getEmailLogoImgSrc, renderEmailLayout } from './email-template';
import { logger } from './logger';

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  logger.warn('SENDGRID_API_KEY not found in environment variables', {
    component: 'email-service',
    action: 'init_warning',
  });
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'NickBaxter@udigit.ca';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'U-Dig It Rentals';
const COMPANY_NAME = 'U-Dig It Rentals';
const HST_REGISTRATION_NUMBER = '744292160 RT0001';
const HST_REGISTRATION_DISPLAY = `HST/GST Registration: ${HST_REGISTRATION_NUMBER}`;
const MONCTON_TZ = 'America/Moncton';

function normalizeDate(input: string | number | Date | undefined | null): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatEmailDate(
  input: string | number | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = normalizeDate(input);
  if (!date) return 'TBD';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: MONCTON_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    ...options,
  });

  return formatter.format(date);
}

function formatEmailDateTime(
  input: string | number | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return formatEmailDate(input, {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  booking: {
    id: string;
    bookingNumber: string;
    equipment?: { make?: string; model?: string };
    startDate: string;
    endDate: string;
    deliveryAddress?: string;
    totalAmount: number | string;
  },
  customer: { email: string; firstName: string; lastName: string }
) {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://udigitrentals.com'
  ).replace(/\/$/, '');

  const greetingName =
    (customer.firstName && customer.firstName.trim()) ||
    (customer.lastName && customer.lastName.trim()) ||
    customer.email.split('@')[0];
  const safeGreetingName = escapeHtml(greetingName);

  const equipmentDisplayName =
    booking.equipment?.make && booking.equipment?.model
      ? `${booking.equipment.make} ${booking.equipment.model}`
      : booking.equipment?.model || booking.equipment?.make || 'Kubota SVL-75 Compact Track Loader';

  const bookingNumberHtml = escapeHtml(booking.bookingNumber);
  const equipmentNameHtml = escapeHtml(equipmentDisplayName);
  const startDateText = formatEmailDate(booking.startDate);
  const endDateText = formatEmailDate(booking.endDate);
  const startDateHtml = escapeHtml(startDateText);
  const endDateHtml = escapeHtml(endDateText);

  const totalAmountNumber = Number(booking.totalAmount);
  const totalAmountText = Number.isFinite(totalAmountNumber)
    ? `$${totalAmountNumber.toFixed(2)}`
    : `$${booking.totalAmount}`;
  const totalAmountHtml = escapeHtml(totalAmountText);

  const manageUrl = `${baseUrl}/booking/${booking.id}/manage`;
  const safeManageUrl = escapeHtml(manageUrl);
  const generatedAtText = formatEmailDateTime(new Date());
  const generatedAtHtml = escapeHtml(generatedAtText);

  const detailRows: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: 'Booking Number', value: bookingNumberHtml, strong: true },
    { label: 'Equipment', value: equipmentNameHtml },
    { label: 'Start Date', value: startDateHtml },
    { label: 'End Date', value: endDateHtml },
    { label: 'Total Amount', value: totalAmountHtml, strong: true },
  ];

  if (booking.deliveryAddress) {
    detailRows.push({
      label: 'Delivery Address',
      value: escapeHtml(booking.deliveryAddress).replace(/\n/g, '<br />'),
    });
  }

  const detailRowsHtml = detailRows
    .map((row, index) => {
      const border = index === detailRows.length - 1 ? 'none' : '1px solid #e5e7eb';
      const valueContent = row.strong ? `<strong>${row.value}</strong>` : row.value;
      return `
        <tr>
          <td style="padding:12px 16px; font-size:13px; line-height:1.45; color:#4b5563; font-weight:600; background-color:#f9fafb; border-bottom:${border};">${row.label}</td>
          <td style="padding:12px 16px; font-size:13px; line-height:1.45; color:#111827; text-align:right; background-color:#f9fafb; border-bottom:${border};">${valueContent}</td>
        </tr>
      `;
    })
    .join('');

  const bookingDetailsTable = `
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="margin:24px 0 28px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
      <tbody>
        ${detailRowsHtml}
      </tbody>
    </table>
  `;

  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#111827;">Hi ${safeGreetingName},</p>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#111827;">
      Great news! Your equipment rental has been confirmed. Below is a summary for booking <strong>${bookingNumberHtml}</strong>.
    </p>
    <p style="margin:0 0 16px; font-size:13px; color:#6b7280;">Generated: ${generatedAtHtml}</p>
    ${bookingDetailsTable}
    <h2 style="margin:24px 0 12px; font-size:18px; line-height:1.4; color:#1f2937;">What happens next</h2>
    <ol style="margin:0 0 24px 20px; padding:0; font-size:14px; line-height:1.6; color:#111827;">
      <li>Complete your invoice payment if you have not already done so.</li>
      <li>Upload your driver’s license and Certificate of Insurance to your portal.</li>
      <li>Watch for your rental agreement – we will send it shortly for e-signature.</li>
      <li>We will send a reminder 24 hours before pickup on ${startDateHtml}.</li>
    </ol>
    <div style="text-align:center; margin:32px 0 24px;">
      <a href="${safeManageUrl}" style="display:inline-block; padding:14px 36px; background-color:#2563eb; color:#ffffff; text-decoration:none; border-radius:9999px; font-weight:600; font-size:15px;">
        Manage your booking
      </a>
    </div>
    <p style="margin:0 0 12px; font-size:14px; line-height:1.6; color:#111827;">
      Questions? Email <a href="mailto:info@udigitrentals.com" style="color:#2563eb; text-decoration:none;">info@udigitrentals.com</a> or call (506) 555-0199.
    </p>
    <p style="margin:0; font-size:14px; line-height:1.6; color:#111827;">
      Thank you for choosing U-Dig It Rentals!<br /><strong>The U-Dig It Rentals Team</strong>
    </p>
  `;

  const html = renderEmailLayout({
    headline: 'Booking Confirmed',
    previewText: `Your booking ${booking.bookingNumber} is confirmed.`,
    accentColor: '#1d4ed8',
    bodyHtml,
  });

  const textLines = [
    `Booking Confirmation - ${booking.bookingNumber}`,
    '',
    `Hi ${greetingName},`,
    '',
    'Great news! Your equipment rental has been confirmed.',
    '',
    'Booking Details:',
    `- Booking Number: ${booking.bookingNumber}`,
    `- Equipment: ${equipmentDisplayName}`,
    `- Start Date: ${startDateText}`,
    `- End Date: ${endDateText}`,
    `- Total Amount: ${totalAmountText}`,
  ];

  if (booking.deliveryAddress) {
    textLines.push(`- Delivery Address: ${booking.deliveryAddress}`);
  }

  textLines.push(
    '',
    'Next Steps:',
    '1. Complete payment (if not already done).',
    '2. Upload your license and insurance documents.',
    '3. Sign the rental agreement when it arrives.',
    `4. We will remind you 24 hours before pickup on ${startDateText}.`,
    '',
    `Manage your booking: ${manageUrl}`,
    'Need help? Email info@udigitrentals.com or call (506) 555-0199.',
    '',
    'Thank you for choosing U-Dig It Rentals!',
    'The U-Dig It Rentals Team'
  );

  const msg = {
    to: customer.email,
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject: `Booking Confirmation - ${booking.bookingNumber}`,
    html,
    text: textLines.join('\n'),
  };

  try {
    await sgMail.send(msg);
    logger.info('Booking confirmation email sent', {
      component: 'email-service',
      action: 'booking_confirmation_sent',
      metadata: { to: customer.email, bookingNumber: booking.bookingNumber },
    });

    return { success: true, messageId: 'sent' };
  } catch (error) {
    logger.error(
      'Failed to send booking confirmation email',
      {
        component: 'email-service',
        action: 'booking_confirmation_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send booking confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceiptEmail(
  booking: {
    bookingNumber: string;
    equipment?: { make?: string; model?: string };
    totalAmount: number | string;
    startDate: string;
  },
  payment: {
    type: string;
    amount: number | string;
    status: string;
    method?: string;
    stripePaymentIntentId?: string;
  },
  customer: { email: string; firstName: string; lastName: string }
) {
  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://udigitrentals.com'
  ).replace(/\/$/, '');

  const greetingName =
    (customer.firstName && customer.firstName.trim()) ||
    (customer.lastName && customer.lastName.trim()) ||
    customer.email.split('@')[0];
  const safeGreetingName = escapeHtml(greetingName);

  const bookingNumberHtml = escapeHtml(booking.bookingNumber);
  const manageUrl = `${baseUrl}/dashboard`;
  const safeManageUrl = escapeHtml(manageUrl);

  const amountNumber = Number(payment.amount);
  const amountFormatted = Number.isFinite(amountNumber)
    ? `$${amountNumber.toFixed(2)} CAD`
    : `$${payment.amount}`;
  const amountFormattedHtml = escapeHtml(amountFormatted);

  const paymentTypeLabel = payment.type ? payment.type.replace(/_/g, ' ') : 'Payment';
  const paymentTypeHtml = escapeHtml(paymentTypeLabel);

  const paymentMethod = (payment.method && payment.method.trim()) || 'Credit Card';
  const paymentMethodHtml = escapeHtml(paymentMethod);

  const receiptTimestamp = formatEmailDateTime(new Date());
  const receiptTimestampHtml = escapeHtml(receiptTimestamp);

  const rentalStartText = formatEmailDate(booking.startDate);
  const rentalStartHtml = escapeHtml(rentalStartText);

  const equipmentDisplayName =
    booking.equipment?.make && booking.equipment?.model
      ? `${booking.equipment.make} ${booking.equipment.model}`
      : booking.equipment?.model || booking.equipment?.make || 'Kubota SVL-75 Compact Track Loader';
  const equipmentHtml = escapeHtml(equipmentDisplayName);

  const detailRows: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: 'Amount Paid', value: amountFormattedHtml, strong: true },
    { label: 'Payment Type', value: paymentTypeHtml },
    { label: 'Payment Method', value: paymentMethodHtml },
    { label: 'Payment Date', value: receiptTimestampHtml },
    { label: 'Booking Number', value: bookingNumberHtml },
    { label: 'Equipment', value: equipmentHtml },
    { label: 'Rental Start', value: rentalStartHtml },
  ];

  if (payment.stripePaymentIntentId) {
    detailRows.splice(4, 0, {
      label: 'Transaction ID',
      value: escapeHtml(payment.stripePaymentIntentId),
    });
  }

  const detailRowsHtml = detailRows
    .map((row, index) => {
      const border = index === detailRows.length - 1 ? 'none' : '1px solid #d1fae5';
      const valueContent = row.strong ? `<strong>${row.value}</strong>` : row.value;
      return `
        <tr>
          <td style="padding:12px 16px; font-size:13px; line-height:1.45; color:#047857; font-weight:600; background-color:#ecfdf5; border-bottom:${border};">${row.label}</td>
          <td style="padding:12px 16px; font-size:13px; line-height:1.45; color:#065f46; text-align:right; background-color:#ecfdf5; border-bottom:${border};">${valueContent}</td>
        </tr>
      `;
    })
    .join('');

  const receiptTable = `
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="margin:24px 0 28px; border:1px solid #a7f3d0; border-radius:12px; overflow:hidden;">
      <tbody>
        ${detailRowsHtml}
      </tbody>
    </table>
  `;

  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#064e3b;">Hi ${safeGreetingName},</p>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#064e3b;">
      Thank you! We’ve received your payment for booking <strong>${bookingNumberHtml}</strong>. Here is your receipt.
    </p>
    ${receiptTable}
    <p style="margin:0 0 16px; font-size:14px; line-height:1.6; color:#064e3b;">
      Your equipment is scheduled for pickup on <strong>${rentalStartHtml}</strong>. We will send a reminder 24 hours before your rental begins.
    </p>
    <h2 style="margin:24px 0 12px; font-size:18px; line-height:1.4; color:#047857;">Next steps</h2>
    <ul style="margin:0 0 24px 18px; padding:0; font-size:14px; line-height:1.6; color:#064e3b;">
      <li>Sign your rental agreement if you have not already completed it.</li>
      <li>Upload your insurance documents to your booking portal.</li>
      <li>Review pickup instructions and ensure your crew is ready.</li>
    </ul>
    <div style="text-align:center; margin:32px 0 24px;">
      <a href="${safeManageUrl}" style="display:inline-block; padding:12px 32px; background-color:#059669; color:#ffffff; text-decoration:none; border-radius:9999px; font-weight:600; font-size:15px;">
        View booking &amp; receipt
      </a>
    </div>
    <p style="margin:0 0 12px; font-size:14px; line-height:1.6; color:#064e3b;">
      Need anything else? Reply to this email or call (506) 555-0199.
    </p>
    <p style="margin:0; font-size:14px; line-height:1.6; color:#064e3b;">
      Thank you for choosing U-Dig It Rentals!<br /><strong>The U-Dig It Rentals Team</strong>
    </p>
  `;

  const html = renderEmailLayout({
    headline: 'Payment Received',
    previewText: `Receipt for booking ${booking.bookingNumber}`,
    accentColor: '#059669',
    bodyHtml,
    tagLine: 'Secure Kubota Equipment Rentals • Payment Receipt',
  });

  const textLines = [
    `Payment Receipt - ${booking.bookingNumber}`,
    '',
    `Hi ${greetingName},`,
    '',
    `Thank you! We have received your payment for booking ${booking.bookingNumber}.`,
    '',
    'Payment Details:',
    `- Amount Paid: ${amountFormatted}`,
    `- Payment Type: ${paymentTypeLabel}`,
    `- Payment Method: ${paymentMethod}`,
    `- Payment Date: ${receiptTimestamp}`,
    `- Booking Number: ${booking.bookingNumber}`,
  ];

  if (payment.stripePaymentIntentId) {
    textLines.push(`- Transaction ID: ${payment.stripePaymentIntentId}`);
  }

  textLines.push(
    `- Equipment: ${equipmentDisplayName}`,
    `- Rental Start: ${rentalStartText}`,
    '',
    'Next Steps:',
    '• Sign your rental agreement (if not already signed).',
    '• Upload your insurance documents.',
    '• Watch for your 24-hour pickup reminder.',
    '',
    `View your booking and receipt: ${manageUrl}`,
    'Need help? Reply to this email or call (506) 555-0199.',
    '',
    'Thank you for choosing U-Dig It Rentals!',
    'The U-Dig It Rentals Team'
  );

  const msg = {
    to: customer.email,
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject: `Payment Receipt - ${booking.bookingNumber}`,
    html,
    text: textLines.join('\n'),
  };

  try {
    await sgMail.send(msg);
    logger.info('Payment receipt email sent', {
      component: 'email-service',
      action: 'payment_receipt_sent',
      metadata: { to: customer.email, bookingNumber: booking.bookingNumber },
    });
    return { success: true };
  } catch (error) {
    logger.error(
      'Failed to send payment receipt',
      {
        component: 'email-service',
        action: 'payment_receipt_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send payment receipt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send Spin-to-Win winner notification
 */
export async function sendSpinWinnerEmail(
  email: string,
  prizeAmount: number,
  promoCode: string,
  expiresAt: Date
) {
  const formattedAmount = `$${prizeAmount.toFixed(0)}`;
  const safeAmount = escapeHtml(formattedAmount);
  const safePromoCode = escapeHtml(promoCode);
  const expiresText = formatEmailDateTime(expiresAt);
  const safeExpiresText = escapeHtml(expiresText);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const detailPath = `${appUrl}/dashboard/promotions/${promoCode.toLowerCase()}`;
  const bookingPath = `${appUrl}/book?code=${promoCode}`;
  const safeDetailPath = escapeHtml(detailPath);
  const safeBookingPath = escapeHtml(bookingPath);

  const bodyHtml = `
    <div style="margin:0 0 24px; padding:22px 24px; border-radius:16px; background:#ecfdf5; border-left:4px solid #10b981;">
      <p style="margin:0 0 8px; font-size:15px; font-weight:600; color:#047857;">🎉 Congratulations!</p>
      <p style="margin:0; font-size:18px; font-weight:700; color:#065f46;">You just unlocked ${safeAmount} off your next rental.</p>
    </div>
    <div style="margin:0 0 24px; padding:22px 24px; border-radius:16px; background:#eff6ff; border-left:4px solid #3b82f6;">
      <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.24em; text-transform:uppercase; color:#1d4ed8;">Promo Code</p>
      <p style="margin:0; font-size:32px; font-weight:800; letter-spacing:0.35em; color:#1e3a8a;">${safePromoCode}</p>
      <p style="margin:12px 0 0; font-size:13px; color:#1e3a8a;">Expires on <strong>${safeExpiresText}</strong></p>
      <p style="margin:12px 0 0; font-size:13px; color:#1e3a8a;">View your promotion to copy the code instantly and apply it at checkout.</p>
      <div style="margin:18px 0 0;">
        <a href="${safeDetailPath}" style="display:inline-block; padding:12px 28px; border-radius:999px; background:#3b82f6; color:#ffffff; font-weight:600; text-decoration:none;">🔐 View My Promo Code</a>
      </div>
    </div>
    <div style="margin:0 0 24px; padding:20px 22px; border-radius:14px; border:1px solid #e2e8f0; background:#ffffff;">
      <p style="margin:0 0 10px; font-size:14px; font-weight:600; color:#047857;">Redeem in three easy steps</p>
      <ol style="margin:0; padding-left:20px; color:#1f2937; line-height:1.8; font-size:13px;">
        <li>Visit our booking portal and choose the equipment you need.</li>
        <li>Enter code <strong>${safePromoCode}</strong> during checkout.</li>
        <li>Complete your reservation — the ${safeAmount} savings apply automatically.</li>
      </ol>
    </div>
    <div style="margin:0 0 24px; text-align:center;">
      <a href="${safeBookingPath}" style="display:inline-block; padding:12px 28px; border-radius:999px; border:1px solid #047857; color:#047857; font-weight:600; text-decoration:none;">Start a booking now →</a>
    </div>
    <div style="margin:0 0 24px; padding:18px 22px; border-radius:14px; background:#fef3c7; border-left:4px solid #f59e0b; color:#92400e;">
      <strong>Need a hand?</strong> Reply to this email or call <a href="tel:+15066431575" style="color:#92400e; text-decoration:underline;">(506) 643-1575</a> and we’ll take care of it.
    </div>
  `;

  const html = renderEmailLayout({
    headline: 'You Won a Discount!',
    previewText: `Enjoy ${formattedAmount} off your next rental`,
    accentColor: '#16a34a',
    bodyHtml,
    tagLine: 'Professional Equipment Rentals • Promotional Offer',
  });

  const textLines = [
    `🎉 You Won ${formattedAmount} OFF Your Next Rental!`,
    '',
    `Promo Code: ${promoCode}`,
    `Expires: ${expiresText}`,
    '',
    'Redeem in three easy steps:',
    '1. Visit the booking portal and choose your equipment.',
    `2. Enter code ${promoCode} during checkout.`,
    `3. Complete your reservation to save ${formattedAmount}.`,
    '',
    `View promo details: ${detailPath}`,
    `Start a booking now: ${bookingPath}`,
    '',
    'Need help? Call (506) 643-1575 or reply to this email.',
  ];

  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: `🎉 You Won ${formattedAmount} OFF Your Next Rental!`,
    html,
    text: textLines.join('\n'),
  };

  try {
    await sgMail.send(msg);
    logger.info('Spin-to-Win winner email sent', {
      component: 'email-service',
      action: 'spin_winner_sent',
      metadata: { to: email, prizeAmount, promoCode },
    });
    return { success: true };
  } catch (error) {
    logger.error(
      'Failed to send winner notification',
      {
        component: 'email-service',
        action: 'spin_winner_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send winner notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send Spin-to-Win 24-hour expiry reminder
 */
export async function sendSpinExpiryReminder(
  email: string,
  prizeAmount: number,
  promoCode: string,
  expiresAt: Date
) {
  const formattedAmount = `$${prizeAmount.toFixed(0)}`;
  const safeAmount = escapeHtml(formattedAmount);
  const safePromoCode = escapeHtml(promoCode);
  const expiresText = formatEmailDateTime(expiresAt);
  const safeExpiresText = escapeHtml(expiresText);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const detailPath = `${appUrl}/dashboard/promotions/${promoCode.toLowerCase()}`;
  const bookingPath = `${appUrl}/book?code=${promoCode}`;
  const safeDetailPath = escapeHtml(detailPath);
  const safeBookingPath = escapeHtml(bookingPath);

  const bodyHtml = `
    <div style="margin:0 0 24px; padding:22px 24px; border-radius:16px; background:#fef3c7; border-left:4px solid #f59e0b;">
      <p style="margin:0 0 8px; font-size:15px; font-weight:600; color:#b45309;">⏰ 24-hour reminder</p>
      <p style="margin:0; font-size:18px; font-weight:700; color:#92400e;">Your ${safeAmount} savings will expire soon.</p>
    </div>
    <div style="margin:0 0 24px; padding:22px 24px; border-radius:16px; background:#eff6ff; border-left:4px solid #3b82f6;">
      <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.24em; text-transform:uppercase; color:#1d4ed8;">Promo Code</p>
      <p style="margin:0; font-size:30px; font-weight:800; letter-spacing:0.35em; color:#1e3a8a;">${safePromoCode}</p>
      <p style="margin:10px 0 0; font-size:13px; color:#1e3a8a;">Expires <strong>${safeExpiresText}</strong></p>
      <div style="margin:16px 0 0;">
        <a href="${safeDetailPath}" style="display:inline-block; padding:11px 26px; border-radius:999px; background:#3b82f6; color:#ffffff; font-weight:600; text-decoration:none;">🔐 View My Promo Code</a>
      </div>
    </div>
    <div style="margin:0 0 24px; padding:20px 22px; border-radius:14px; border:1px solid #e2e8f0; background:#ffffff;">
      <p style="margin:0 0 10px; font-size:14px; font-weight:600; color:#047857;">Finish in three quick steps</p>
      <ol style="margin:0; padding-left:20px; color:#1f2937; line-height:1.8; font-size:13px;">
        <li>Open the booking portal and choose your equipment.</li>
        <li>Enter code <strong>${safePromoCode}</strong> during checkout.</li>
        <li>Complete the reservation and the ${safeAmount} savings are yours.</li>
      </ol>
    </div>
    <div style="margin:0 0 24px; text-align:center;">
      <a href="${safeBookingPath}" style="display:inline-block; padding:11px 26px; border-radius:999px; border:1px solid #1d4ed8; color:#1d4ed8; font-weight:600; text-decoration:none;">Apply the discount now →</a>
    </div>
    <div style="margin:0 0 24px; padding:18px 22px; border-radius:14px; background:#ecfdf5; border-left:4px solid #10b981; color:#047857;">
      <strong>Need assistance?</strong> Reply to this email or call <a href="tel:+15066431575" style="color:#047857; text-decoration:underline;">(506) 643-1575</a>. We're ready to help.
    </div>
  `;

  const html = renderEmailLayout({
    headline: 'Your Discount Is Expiring',
    previewText: `${formattedAmount} savings expire in 24 hours`,
    accentColor: '#dc2626',
    bodyHtml,
    tagLine: 'Professional Equipment Rentals • Promotional Reminder',
  });

  const textLines = [
    `⏰ Your ${formattedAmount} Discount Expires in 24 Hours!`,
    '',
    `Promo Code: ${promoCode}`,
    `Expires: ${expiresText}`,
    '',
    'Finish in three quick steps:',
    '1. Open the booking portal and choose your equipment.',
    `2. Enter code ${promoCode} during checkout.`,
    `3. Complete the reservation to keep ${formattedAmount} off.`,
    '',
    `View promo details: ${detailPath}`,
    `Apply the discount now: ${bookingPath}`,
    '',
    'Need help? Call (506) 643-1575 or reply to this email.',
  ];

  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: `⏰ Your ${formattedAmount} Discount Expires in 24 Hours!`,
    html,
    text: textLines.join('\n'),
  };

  try {
    await sgMail.send(msg);
    logger.info('Spin-to-Win expiry reminder sent', {
      component: 'email-service',
      action: 'spin_expiry_reminder_sent',
      metadata: { to: email, prizeAmount, promoCode },
    });
    return { success: true };
  } catch (error) {
    logger.error(
      'Failed to send spin expiry reminder',
      {
        component: 'email-service',
        action: 'spin_expiry_reminder_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send spin expiry reminder: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send lead magnet email with equipment rental checklist
 */
export async function sendLeadMagnetEmail(email: string, name?: string) {
  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject: '📋 Your FREE Equipment Rental Checklist',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .checklist-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .checklist-item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .cta-button { background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Your Equipment Rental Checklist</h1>
          </div>
          <div class="content">
            <p>Hi${name ? ` ${name}` : ' there'},</p>
            <p>Thank you for your interest in U-Dig It Rentals! Here's your complete equipment rental checklist to ensure a smooth rental experience.</p>

            <div class="checklist-box">
              <h3 style="margin-top: 0;">Before You Book:</h3>
              <div class="checklist-item">✅ <strong>Verify Insurance:</strong> Ensure you have proper liability insurance coverage</div>
              <div class="checklist-item">✅ <strong>Check Licenses:</strong> Valid driver's license and operator certification (if required)</div>
              <div class="checklist-item">✅ <strong>Site Assessment:</strong> Measure access points and ensure equipment can reach the job site</div>
              <div class="checklist-item">✅ <strong>Budget Planning:</strong> Consider rental duration, delivery fees, and fuel costs</div>
            </div>

            <div class="checklist-box">
              <h3 style="margin-top: 0;">During Rental:</h3>
              <div class="checklist-item">✅ <strong>Pre-Rental Inspection:</strong> Document equipment condition with photos</div>
              <div class="checklist-item">✅ <strong>Operator Training:</strong> Review safety procedures and equipment operation</div>
              <div class="checklist-item">✅ <strong>Daily Maintenance:</strong> Check fluid levels and perform visual inspections</div>
              <div class="checklist-item">✅ <strong>Emergency Contacts:</strong> Keep our support number handy: (506) 555-0199</div>
            </div>

            <div class="checklist-box">
              <h3 style="margin-top: 0;">After Rental:</h3>
              <div class="checklist-item">✅ <strong>Clean Equipment:</strong> Remove debris and dirt before return</div>
              <div class="checklist-item">✅ <strong>Fuel Tank:</strong> Return with same fuel level as pickup</div>
              <div class="checklist-item">✅ <strong>Return Inspection:</strong> Review equipment condition with our team</div>
              <div class="checklist-item">✅ <strong>Final Payment:</strong> Settle any additional charges or deposits</div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://udigitrentals.com'}/book" class="cta-button">
                📅 Book Your Equipment Now
              </a>
            </div>

            <p><strong>Ready to rent?</strong> Our Kubota SVL-75 Compact Track Loader is perfect for excavation, grading, and material handling projects.</p>

            <p>Have questions? We're here to help!</p>
            <ul>
              <li>📧 Email: <a href="mailto:info@udigitrentals.com">info@udigitrentals.com</a></li>
              <li>📞 Phone: (506) 555-0199</li>
              <li>🌐 Website: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://udigitrentals.com'}">${process.env.NEXT_PUBLIC_BASE_URL || 'udigitrentals.com'}</a></li>
            </ul>

            <p>Best regards,<br>
            <strong>The U-Dig It Rentals Team</strong></p>
          </div>
          <div class="footer">
            <p>U-Dig It Rentals Inc. | Saint John, New Brunswick<br>
            © ${new Date().getFullYear()} All rights reserved.</p>
            <p style="font-size: 12px;">You received this email because you requested our equipment rental checklist.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Equipment Rental Checklist - U-Dig It Rentals

Hi${name ? ` ${name}` : ' there'},

Thank you for your interest in U-Dig It Rentals! Here's your complete equipment rental checklist.

BEFORE YOU BOOK:
✅ Verify Insurance (proper liability coverage)
✅ Check Licenses (driver's license and operator certification)
✅ Site Assessment (measure access points)
✅ Budget Planning (rental duration, delivery fees, fuel)

DURING RENTAL:
✅ Pre-Rental Inspection (document condition with photos)
✅ Operator Training (review safety and operation)
✅ Daily Maintenance (check fluids and inspect)
✅ Emergency Contacts (call us at (506) 555-0199)

AFTER RENTAL:
✅ Clean Equipment (remove debris)
✅ Fuel Tank (return with same level)
✅ Return Inspection (review with our team)
✅ Final Payment (settle charges)

Ready to book? Visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://udigitrentals.com'}/book

Contact Us:
📧 info@udigitrentals.com
📞 (506) 555-0199

Best regards,
The U-Dig It Rentals Team
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    logger.info('Lead magnet email sent', {
      component: 'email-service',
      action: 'lead_magnet_sent',
      metadata: { to: email },
    });
    return { success: true };
  } catch (error) {
    logger.error(
      'Failed to send lead magnet email',
      {
        component: 'email-service',
        action: 'lead_magnet_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send lead magnet email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send admin notification when new booking is created
 */
export async function sendAdminBookingNotification(
  booking: {
    id: string;
    bookingNumber: string;
    equipment?: { make?: string; model?: string };
    startDate: string;
    endDate: string;
    deliveryAddress?: string;
    totalAmount: number | string;
  },
  customer: { email: string; firstName: string; lastName: string; phone?: string }
) {
  const msg = {
    to: 'nickbaxter@udigit.ca',
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject: `🎉 New Booking: ${booking.bookingNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .booking-box { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
          .customer-box { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }
          .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .cta-button { background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Booking Created!</h1>
          </div>
          <div class="content">
            <p><strong>A new booking has been created in the system.</strong></p>

            <div class="booking-box">
              <h3 style="margin-top: 0; color: #10b981;">Booking Details</h3>
              <div class="detail-row">
                <strong>Booking Number:</strong> ${booking.bookingNumber}
              </div>
              <div class="detail-row">
                <strong>Equipment:</strong> Kubota SVL-75 Compact Track Loader
              </div>
              <div class="detail-row">
                <strong>Start Date:</strong> ${formatEmailDate(booking.startDate)}
                <br />
                <strong>End Date:</strong> ${formatEmailDate(booking.endDate)}
                <br />
                <strong>Delivery Window:</strong> ${formatEmailDateTime(booking.startDate)}
              </div>
              <div class="detail-row">
                <strong>Total Amount:</strong> <strong style="color: #10b981; font-size: 18px;">$${parseFloat(String(booking.totalAmount)).toFixed(2)} CAD</strong>
              </div>
            </div>

            ${
              booking.deliveryAddress
                ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #f59e0b;">📍 DELIVERY ADDRESS</h3>
              <p style="font-size: 18px; font-weight: bold; color: #92400e; margin: 0;">${booking.deliveryAddress}</p>
            </div>
            `
                : '<p style="color: #dc2626;"><strong>⚠️ No delivery address provided - Customer pickup</strong></p>'
            }

            <div class="customer-box">
              <h3 style="margin-top: 0; color: #2563eb;">Customer Information</h3>
              <div class="detail-row">
                <strong>Name:</strong> ${customer.firstName} ${customer.lastName}
              </div>
              <div class="detail-row">
                <strong>Email:</strong> <a href="mailto:${customer.email}">${customer.email}</a>
              </div>
              ${
                customer.phone
                  ? `
              <div class="detail-row">
                <strong>Phone:</strong> <a href="tel:${customer.phone}">${customer.phone}</a>
              </div>
              `
                  : ''
              }
            </div>

            <h3 style="color: #dc2626;">⚠️ Action Required:</h3>
            <ol>
              <li>Customer must pay their invoice</li>
              <li>Customer must upload driver's license</li>
              <li>Customer must upload Certificate of Insurance</li>
              <li>Customer must sign rental agreement</li>
              <li>System will place $500 security hold 48 hours before pickup</li>
            </ol>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/bookings" class="cta-button">
                View in Admin Dashboard
              </a>
            </div>

            <p style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; border-radius: 4px; color: #991b1b;">
              <strong>Important:</strong> Monitor this booking to ensure all requirements are completed before the rental date.
            </p>

            <p>This is an automated notification from the U-Dig It Rentals booking system.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    logger.info('Admin booking notification sent', {
      component: 'email-service',
      action: 'admin_notification_sent',
      metadata: { bookingNumber: booking.bookingNumber, adminEmail: 'nickbaxter@udigit.ca' },
    });
    return { success: true };
  } catch (error) {
    logger.error(
      'Failed to send admin notification',
      {
        component: 'email-service',
        action: 'admin_notification_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send admin notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send completion congratulations email to customer when all steps are done
 */
export async function sendBookingCompletionEmail(
  booking: {
    bookingNumber: string;
    startDate: string;
    endDate: string;
    deliveryAddress?: string;
  },
  customer: { email: string; firstName: string; lastName: string }
) {
  const generatedAt = formatEmailDateTime(new Date());
  const deliveryDate = formatEmailDate(booking.startDate);
  const returnDate = formatEmailDate(booking.endDate);
  const deliveryAddressLine = booking.deliveryAddress
    ? `<p style="margin:4px 0 0; color:#1f2937;">${escapeHtml(booking.deliveryAddress)}</p>`
    : '';

  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#111827;">Hi ${escapeHtml(customer.firstName)},</p>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#111827;"><strong>Excellent news!</strong> You've completed all the required steps for your equipment rental.</p>
    <p style="margin:0 0 20px; font-size:13px; color:#6b7280;">Generated: ${generatedAt}</p>
    <div style="margin:24px 0; padding:24px; border-radius:12px; background:#f0fdf4; border-left:4px solid #10b981; text-align:center;">
      <h2 style="margin:0 0 10px; color:#047857; font-size:24px;">✅ All Requirements Met!</h2>
      <p style="margin:0; font-size:16px; color:#1f2937;">Booking <strong>${escapeHtml(booking.bookingNumber)}</strong> is ready to go!</p>
    </div>
    <div style="margin:24px 0; padding:20px; border-radius:12px; background:#eff6ff; border-left:4px solid #2563eb;">
      <h3 style="margin:0 0 12px; color:#1d4ed8;">📅 Delivery Information</h3>
      <p style="margin:4px 0; color:#1f2937;"><strong>Delivery Date:</strong> ${deliveryDate}</p>
      <p style="margin:4px 0; color:#1f2937;"><strong>Return Date:</strong> ${returnDate}</p>
      ${deliveryAddressLine}
    </div>
    <h3 style="margin:24px 0 12px; color:#047857;">What You've Completed:</h3>
    <ul style="margin:0 0 24px 20px; padding:0; color:#374151; line-height:1.8;">
      <li>Invoice paid in full</li>
      <li>Driver's license uploaded</li>
      <li>Certificate of Insurance uploaded</li>
      <li>Rental agreement signed</li>
      <li>Payment method verified</li>
    </ul>
    <h3 style="margin:0 0 12px; color:#111827;">What Happens Next:</h3>
    <ol style="margin:0 0 24px 18px; padding:0; color:#374151; line-height:1.8;">
      <li><strong>48 Hours Before:</strong> We'll place a $500 refundable security hold on your card.</li>
      <li><strong>Delivery Day:</strong> Our team will deliver the Kubota SVL-75 to your site.</li>
      <li><strong>Equipment Handover:</strong> We'll do a quick walk-through and inspection.</li>
      <li><strong>You're Ready:</strong> Start your project with confidence!</li>
    </ol>
    <div style="margin:24px 0; padding:18px 20px; border-radius:10px; background:#fef3c7; border-left:4px solid #f59e0b; color:#92400e;">
      <strong>📞 Questions?</strong> We're here to help! Call <a href="tel:+15066431575" style="color:#2563eb; text-decoration:none;">(506) 643-1575</a> or reply to this email.
    </div>
    <p style="margin:0 0 16px; font-size:14px; color:#111827;">We'll send you a reminder 24 hours before your delivery date.</p>
    <p style="margin:0; font-size:14px; color:#111827;">Thank you for choosing U-Dig It Rentals!<br /><strong>The U-Dig It Rentals Team</strong></p>
  `;

  const html = renderEmailLayout({
    headline: 'All Requirements Met!',
    previewText: `Booking ${booking.bookingNumber} is ready to go.`,
    accentColor: '#10b981',
    bodyHtml,
    tagLine: 'Professional Equipment Rentals • Completion Notice',
  });

  const textLines = [
    `All Set! Your Equipment is Ready - ${booking.bookingNumber}`,
    '',
    `Hi ${customer.firstName},`,
    '',
    "Excellent news! You've completed all the required steps for your equipment rental.",
    `Delivery Date: ${deliveryDate}`,
    `Return Date: ${returnDate}`,
  ];

  if (booking.deliveryAddress) {
    textLines.push(`Delivery Address: ${booking.deliveryAddress}`);
  }

  textLines.push(
    '',
    'What Happens Next:',
    "1. 48 Hours Before: We'll place a $500 refundable security hold on your card.",
    '2. Delivery Day: Our team will deliver the Kubota SVL-75 to your site.',
    "3. Equipment Handover: We'll do a quick walk-through and inspection.",
    "4. You're Ready: Start your project with confidence!",
    '',
    'Questions? Call (506) 643-1575 or reply to this email.'
  );

  const textBody = textLines.join('\n');

  const msg = {
    to: customer.email,
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject: `🎉 All Set! Your Equipment is Ready - ${booking.bookingNumber}`,
    html,
    text: textBody,
  };

  try {
    await sgMail.send(msg);
    logger.info('Booking completion email sent to customer', {
      component: 'email-service',
      action: 'completion_email_sent',
      metadata: { bookingNumber: booking.bookingNumber, customerEmail: customer.email },
    });
    return { success: true };
  } catch (error) {
    logger.error(
      'Failed to send completion email',
      {
        component: 'email-service',
        action: 'completion_email_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send completion email: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send admin notification when booking reaches 100% completion
 */
export async function sendAdminBookingCompletedNotification(
  booking: {
    id: string;
    bookingNumber: string;
    startDate: string;
    endDate: string;
    deliveryAddress?: string;
    totalAmount: number | string;
  },
  customer: { email: string; firstName: string; lastName: string; phone?: string }
) {
  const msg = {
    to: 'nickbaxter@udigit.ca',
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject: `✅ Booking Complete - Schedule Delivery: ${booking.bookingNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
          .success-box { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0; }
          .customer-box { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }
          .delivery-box { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .cta-button { background: #10b981; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #ffffff;">✅ Booking 100% Complete!</h1>
          </div>
          <div class="content">
            <p><strong>Great news!</strong> Booking ${booking.bookingNumber} is fully complete and ready for delivery.</p>

            <div class="success-box">
              <h3 style="margin-top: 0; color: #10b981;">✅ All Requirements Completed</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li>✓ Invoice paid</li>
                <li>✓ Driver's license uploaded</li>
                <li>✓ Certificate of Insurance uploaded</li>
                <li>✓ Rental agreement signed</li>
                <li>✓ Payment method verified</li>
              </ul>
            </div>

            <div class="customer-box">
              <h3 style="margin-top: 0; color: #2563eb;">Customer Information</h3>
              <p><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</p>
              <p><strong>Email:</strong> <a href="mailto:${customer.email}" style="color: #2563eb;">${customer.email}</a></p>
              ${customer.phone ? `<p><strong>Phone:</strong> <a href="tel:${customer.phone}" style="color: #2563eb;">${customer.phone}</a></p>` : ''}
            </div>

            <div class="delivery-box">
              <h3 style="margin-top: 0; color: #f59e0b;">📦 Delivery Details</h3>
              <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
              <p><strong>Equipment:</strong> Kubota SVL-75 Compact Track Loader</p>
              <p><strong>Delivery Date:</strong> ${formatEmailDate(booking.startDate)}</p>
              <p><strong>Return Date:</strong> ${formatEmailDate(booking.endDate)}</p>
              <p><strong>Total Amount:</strong> <span style="color: #10b981; font-size: 18px; font-weight: bold;">$${parseFloat(String(booking.totalAmount)).toFixed(2)} CAD</span></p>
            </div>

            ${
              booking.deliveryAddress
                ? `
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 3px solid #f59e0b; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #f59e0b;">📍 DELIVERY ADDRESS</h3>
              <p style="font-size: 20px; font-weight: bold; color: #92400e; margin: 0; line-height: 1.4;">${booking.deliveryAddress}</p>
            </div>
            `
                : '<p style="color: #dc2626; background: #fee2e2; padding: 15px; border-radius: 8px;"><strong>⚠️ No delivery address provided - Customer pickup</strong></p>'
            }

            <h3 style="color: #dc2626;">🚨 Action Required:</h3>
            <ol style="font-weight: bold; color: #dc2626; line-height: 1.8;">
              <li>Schedule delivery for ${formatEmailDate(booking.startDate)}</li>
              <li>Assign driver and delivery truck</li>
              <li>Confirm delivery time with customer</li>
              <li>Prepare equipment for pickup</li>
              <li>Complete pre-delivery inspection</li>
            </ol>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/operations" class="cta-button">
                Schedule Delivery Now
              </a>
            </div>

            <p style="background: #dcfce7; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; color: #166534;">
              <strong>Status:</strong> This booking is ready for delivery scheduling. No further action required from customer.
            </p>

            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from the U-Dig It Rentals booking system.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await sgMail.send(msg);
    logger.info('Admin booking completed notification sent', {
      component: 'email-service',
      action: 'admin_completion_notification_sent',
      metadata: { bookingNumber: booking.bookingNumber, adminEmail: 'nickbaxter@udigit.ca' },
    });
    return { success: true };
  } catch (error) {
    logger.error(
      'Failed to send admin completion notification',
      {
        component: 'email-service',
        action: 'admin_completion_notification_error',
      },
      error as Error
    );

    throw new Error(
      `Failed to send admin completion notification: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build invoice payment receipt email content (HTML + text + subject).
 * Shared between the email sender and the admin receipt download endpoint.
 */
export function buildInvoicePaymentReceiptEmail(
  booking: {
    bookingNumber: string;
    createdAt?: string | null;
    startDate: string;
    endDate: string;
    subtotal: number | string | null;
    taxes: number | string | null;
    totalAmount: number | string | null;
    dailyRate?: number | string | null;
    floatFee?: number | string | null;
    deliveryFee?: number | string | null;
    distanceKm?: number | string | null;
    securityDeposit?: number | string | null;
    waiverSelected?: boolean | null;
    waiverRateCents?: number | null;
    couponCode?: string | null;
    couponType?: string | null;
    couponValue?: number | string | null;
    couponDiscount?: number | string | null;
    deliveryAddress?: string | null;
    deliveryCity?: string | null;
    deliveryProvince?: string | null;
    deliveryPostalCode?: string | null;
    equipment?: {
      make?: string | null;
      model?: string | null;
      type?: string | null;
      unitId?: string | null;
    } | null;
  },
  payment: {
    amount: number | string;
    method?: string | null;
    paidAt: string;
    transactionId?: string | null;
  },
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    company?: string | null;
    phone?: string | null;
  }
): {
  subject: string;
  html: string;
  text: string;
} {
  const safeNumber = (value: number | string | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const currencyFormatter = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatCurrency = (value: number): string => currencyFormatter.format(value);

  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  const rentalDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const equipmentSubtotal = safeNumber(booking.subtotal);
  const floatFee = safeNumber(booking.floatFee);
  const deliveryFee = safeNumber(booking.deliveryFee);
  const totalTransportFee = floatFee || deliveryFee;
  const distanceKm = safeNumber(booking.distanceKm);
  const includedKm = 30;
  const hasAdditionalMileage = distanceKm > includedKm;
  const extraKm = hasAdditionalMileage ? distanceKm - includedKm : 0;
  const additionalMileageFeePerDirection = hasAdditionalMileage ? extraKm * 3 : 0;
  const calculatedDeliveryFee = floatFee / 2 || deliveryFee / 2 || 0;
  const displayBaseFee = hasAdditionalMileage ? 150 : calculatedDeliveryFee;
  const deliverySubtotalValue = displayBaseFee + additionalMileageFeePerDirection;
  const pickupSubtotalValue = deliverySubtotalValue;
  const transportTotal = hasAdditionalMileage
    ? deliverySubtotalValue + pickupSubtotalValue
    : totalTransportFee;

  const waiverCharge =
    booking.waiverSelected && booking.waiverRateCents
      ? (booking.waiverRateCents / 100) * rentalDays
      : 0;

  const subtotalBeforeDiscount = equipmentSubtotal + transportTotal + waiverCharge;

  let discountAmount = 0;
  if (booking.couponType && booking.couponValue !== null && booking.couponValue !== undefined) {
    const couponValueNumber = safeNumber(booking.couponValue);
    if (booking.couponType === 'percentage') {
      discountAmount = subtotalBeforeDiscount * (couponValueNumber / 100);
    } else if (booking.couponType === 'fixed' || booking.couponType === 'fixed_amount') {
      discountAmount = Math.min(couponValueNumber, subtotalBeforeDiscount);
    }
  } else if (booking.couponDiscount) {
    discountAmount = safeNumber(booking.couponDiscount);
  }

  const subtotalAfterDiscount = Math.max(0, subtotalBeforeDiscount - discountAmount);
  const taxesAmount = safeNumber(booking.taxes);
  const totalPaid = safeNumber(booking.totalAmount) || subtotalAfterDiscount + taxesAmount;
  const securityDeposit = safeNumber(booking.securityDeposit);

  const paymentAmount = safeNumber(payment.amount);
  const paymentDisplay = formatCurrency(paymentAmount);
  const paymentMethodDisplay = escapeHtml(payment.method || 'Credit Card');
  const paymentDateDisplay = formatEmailDateTime(payment.paidAt);
  const paymentTransactionDisplay = payment.transactionId ? escapeHtml(payment.transactionId) : '';

  const safeBookingNumber = escapeHtml(booking.bookingNumber);
  const issuedDate = formatEmailDate(booking.createdAt ?? payment.paidAt);

  const safeCustomerFirstName =
    customer.firstName && customer.firstName.trim()
      ? escapeHtml(customer.firstName.trim())
      : escapeHtml(customer.email.split('@')[0]);
  const safeCustomerFullName = escapeHtml(
    `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email.split('@')[0]
  );

  const equipmentRecord = booking.equipment ?? null;
  const safeEquipmentMake = equipmentRecord?.make ? escapeHtml(equipmentRecord.make) : '';
  const safeEquipmentModel = equipmentRecord?.model ? escapeHtml(equipmentRecord.model) : '';
  const safeEquipmentType = equipmentRecord?.type ? escapeHtml(equipmentRecord.type) : '';
  const safeEquipmentUnit = equipmentRecord?.unitId
    ? ` • Unit: ${escapeHtml(String(equipmentRecord.unitId))}`
    : '';

  const equipmentLabelParts = [
    safeEquipmentMake,
    safeEquipmentModel,
    safeEquipmentMake || safeEquipmentModel ? safeEquipmentType : '',
  ].filter(Boolean);

  const equipmentDescription =
    equipmentLabelParts.join(' ') || safeEquipmentType || 'Kubota Compact Track Loader';

  const dailyRateValue =
    safeNumber(booking.dailyRate) || (rentalDays > 0 ? equipmentSubtotal / rentalDays : 0);
  const dailyRateDisplay = rentalDays > 0 ? formatCurrency(dailyRateValue) : formatCurrency(0);

  const billToLines = [
    safeCustomerFullName,
    customer.company ? escapeHtml(customer.company) : '',
    booking.deliveryAddress ? escapeHtml(booking.deliveryAddress) : '',
    [booking.deliveryCity, booking.deliveryProvince, booking.deliveryPostalCode]
      .filter(Boolean)
      .map((part) => escapeHtml(String(part)))
      .join(', ')
      .trim(),
    escapeHtml(customer.email),
    customer.phone ? escapeHtml(customer.phone) : '',
  ]
    .filter((line) => line && line.length > 0)
    .map((line) => `<p style="margin:0 0 4px 0;">${line}</p>`)
    .join('');

  const rentalPeriodHtml = `
    <p style="margin:0 0 6px 0; display:flex; justify-content:space-between;">
      <span style="color:#4b5563;">Start Date:</span>
      <strong style="color:#111827;">${formatEmailDate(booking.startDate)}</strong>
    </p>
    <p style="margin:0 0 6px 0; display:flex; justify-content:space-between;">
      <span style="color:#4b5563;">End Date:</span>
      <strong style="color:#111827;">${formatEmailDate(booking.endDate)}</strong>
    </p>
    <p style="margin:0; display:flex; justify-content:space-between;">
      <span style="color:#4b5563;">Duration:</span>
      <strong style="color:#111827;">${rentalDays} ${rentalDays === 1 ? 'day' : 'days'}</strong>
    </p>
  `;

  const standardMileageLabel = '- Standard mileage (per direction):';
  const additionalMileageLabel = `- Additional mileage per direction (${extraKm.toFixed(1)} km × $3)`;

  const transportBreakdownHtml =
    transportTotal > 0
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
                  <span>${standardMileageLabel}</span>
                  <span>${formatCurrency(displayBaseFee)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:#4b5563; font-size:13px;">
                  <span>${additionalMileageLabel}</span>
                  <span>${formatCurrency(additionalMileageFeePerDirection)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid #e5e7eb; margin-top:10px; padding-top:8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280;">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(deliverySubtotalValue)}</span>
                </div>
              </div>
            </div>
            <div>
              <p style="margin:0 0 8px 0; font-weight:600; color:#111827;">• Pickup from site:</p>
              <div style="margin-left:12px;">
                <div style="display:flex; justify-content:space-between; color:#4b5563; font-size:13px; margin-bottom:6px;">
                  <span>${standardMileageLabel}</span>
                  <span>${formatCurrency(displayBaseFee)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:#4b5563; font-size:13px;">
                  <span>${additionalMileageLabel}</span>
                  <span>${formatCurrency(additionalMileageFeePerDirection)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid #e5e7eb; margin-top:10px; padding-top:8px; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280;">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(pickupSubtotalValue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
      : '';

  const waiverHtml =
    waiverCharge > 0
      ? `
        <div style="margin-top:18px; display:flex; justify-content:space-between; font-size:13px; color:#4b5563;">
          <span>Damage Waiver (${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} × ${formatCurrency(
            booking.waiverRateCents ? safeNumber(booking.waiverRateCents) / 100 : 0
          )})</span>
          <span style="font-weight:600; color:#0f172a;">${formatCurrency(waiverCharge)}</span>
        </div>
      `
      : '';

  const discountHtml =
    discountAmount > 0
      ? `
        <div style="margin:6px 0; display:flex; justify-content:space-between; font-size:13px; color:#047857;">
          <span>Discount${booking.couponCode ? ` (${escapeHtml(booking.couponCode)})` : ''}</span>
          <span>- ${formatCurrency(discountAmount)}</span>
        </div>
      `
      : '';

  const summaryHtml = `
    <div style="margin-top:24px; padding-top:18px; border-top:2px solid #d1d5db; font-size:14px; color:#374151;">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <span>Subtotal (Equipment + Transport${waiverCharge > 0 ? ' + Waiver' : ''})</span>
        <strong style="color:#0f172a;">${formatCurrency(subtotalBeforeDiscount)}</strong>
      </div>
      ${discountHtml}
      <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
        <span>Subtotal before tax</span>
        <strong style="color:#0f172a;">${formatCurrency(subtotalAfterDiscount)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
        <span>HST (15%)</span>
        <strong style="color:#0f172a;">${formatCurrency(taxesAmount)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding-top:14px; border-top:1px solid #d1d5db; font-size:18px; font-weight:700; color:#111827;">
        <span>Total Amount</span>
        <span>${formatCurrency(totalPaid)}</span>
      </div>
      ${
        securityDeposit > 0
          ? `<div style="display:flex; justify-content:space-between; margin-top:10px; font-size:12px; color:#1d4ed8;">
              <span>Security Deposit</span>
              <span>${formatCurrency(securityDeposit)}</span>
            </div>`
          : ''
      }
    </div>
  `;

  const invoiceLogoSrc = getEmailLogoImgSrc();

  const invoiceCardHtml = `
    <div style="margin:28px 0;">
      <div style="border:2px solid #d1d5db; border-radius:16px; overflow:hidden; background:#ffffff;">
        <div style="background:linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border-bottom:2px solid #d1d5db; padding:28px 26px;">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top" style="padding-right:18px;">
                <h2 style="margin:0; font-size:32px; font-weight:600; color:#0f172a;">Invoice</h2>
                <table role="presentation" cellPadding="0" cellSpacing="0" style="border-collapse:collapse; margin-top:16px;">
                  <tr>
                    <td style="background:#0f172a; border-radius:20px; padding:12px;">
                      <img src="${invoiceLogoSrc}" alt="U-Dig It Rentals" style="display:block; max-width:72px; width:72px; height:auto;" />
                    </td>
                    <td style="padding-left:16px;">
                      <p style="margin:0; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; font-weight:600; color:#374151;">U-DIG IT RENTALS INC.</p>
                      <p style="margin:4px 0 0; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#9ca3af;">945 Golden Grove Road • Saint John, NB E2H 2X1 • Canada</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="top" width="200" align="right" style="text-align:right; color:#4b5563;">
                <p style="margin:0; font-size:12px; font-weight:600; letter-spacing:0.16em; text-transform:uppercase;">Invoice #</p>
                <p style="margin:8px 0 0; font-size:20px; font-weight:700; color:#0f172a;">${safeBookingNumber}</p>
                <p style="margin:6px 0 0; font-size:12px; color:#6b7280;">Issued ${issuedDate}</p>
              </td>
            </tr>
          </table>
        </div>
        <div style="border-bottom:1px solid #e5e7eb; background:#f9fafb; padding:24px 26px;">
          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top" style="padding-right:18px;">
                <p style="margin:0 0 10px 0; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Bill To</p>
                ${
                  billToLines ||
                  '<p style="margin:0; font-size:13px; color:#4b5563;">Customer details on file.</p>'
                }
              </td>
              <td valign="top" style="min-width:200px;">
                <p style="margin:0 0 10px 0; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#6b7280;">Rental Period</p>
                ${rentalPeriodHtml}
              </td>
            </tr>
          </table>
        </div>
        <div style="padding:24px 26px;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px;">
            <div>
              <p style="margin:0; font-weight:600; color:#0f172a;">
                Equipment Rental (${rentalDays} ${rentalDays === 1 ? 'day' : 'days'} @ ${dailyRateDisplay}/day)
              </p>
              <p style="margin:6px 0 0; font-size:13px; color:#4b5563;">
                ${equipmentDescription}${safeEquipmentUnit}
              </p>
            </div>
            <span style="font-weight:600; color:#0f172a;">${formatCurrency(equipmentSubtotal)}</span>
          </div>
          ${transportBreakdownHtml}
          ${waiverHtml}
          ${summaryHtml}
          <p style="margin:20px 0 0; font-size:12px; color:#6b7280;">
            CAD • All taxes included. Note: A refundable security deposit may still be required at pickup or delivery.
          </p>
        </div>
      </div>
    </div>
  `;

  const paymentDetailsHtml = `
    <div style="margin:0 0 24px 0; background:#ecfdf5; border-left:4px solid #10b981; padding:18px 20px; border-radius:12px; color:#065f46;">
      <p style="margin:0; font-size:16px; font-weight:700;">Payment Details</p>
      <p style="margin:10px 0 0 0; font-size:14px;">Amount Paid: <strong>${paymentDisplay}</strong></p>
      <p style="margin:6px 0 0 0; font-size:14px;">Payment Method: ${paymentMethodDisplay}</p>
      <p style="margin:6px 0 0 0; font-size:14px;">Date: ${paymentDateDisplay}</p>
      <p style="margin:6px 0 0 0; font-size:13px;">${escapeHtml(HST_REGISTRATION_DISPLAY)}</p>
      ${paymentTransactionDisplay ? `<p style="margin:6px 0 0 0; font-size:13px;">Transaction ID: ${paymentTransactionDisplay}</p>` : ''}
    </div>
  `;

  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#111827;">Hi ${safeCustomerFirstName},</p>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#111827;">
      Thank you for your payment! Attached below is an exact copy of your official invoice for booking <strong>${safeBookingNumber}</strong>.
    </p>
    ${paymentDetailsHtml}
    ${invoiceCardHtml}
    <p style="margin:24px 0 0; font-size:13px; color:#6b7280; text-align:center;">
      Need help? Reply to this email or call (506) 555-0199. We will send a reminder 24 hours before your rental begins.
    </p>
  `;

  const html = renderEmailLayout({
    headline: 'Invoice Paid',
    previewText: `Receipt for booking ${booking.bookingNumber}`,
    accentColor: '#0f172a',
    bodyHtml,
  });

  const textLines = [
    `Invoice Paid - Receipt for ${booking.bookingNumber}`,
    '',
    `Hi ${customer.firstName || customer.email.split('@')[0]},`,
    '',
    'Payment Details',
    `• Amount Paid: ${paymentDisplay}`,
    `• Method: ${payment.method || 'Credit Card'}`,
    `• Date: ${paymentDateDisplay}`,
    `• ${HST_REGISTRATION_DISPLAY}`,
    payment.transactionId ? `• Transaction ID: ${payment.transactionId}` : '',
    '',
    'Rental Details',
    `• Rental Period: ${formatEmailDate(booking.startDate)} → ${formatEmailDate(booking.endDate)} (${rentalDays} ${rentalDays === 1 ? 'day' : 'days'})`,
    `• Equipment: ${equipmentDescription}${safeEquipmentUnit ? safeEquipmentUnit : ''}`,
    '',
    'Invoice Summary',
    `• Equipment Rental: ${formatCurrency(equipmentSubtotal)}`,
    transportTotal > 0 ? `• Transportation & Staging: ${formatCurrency(transportTotal)}` : '',
    waiverCharge > 0 ? `• Damage Waiver: ${formatCurrency(waiverCharge)}` : '',
    discountAmount > 0
      ? `• Discount${booking.couponCode ? ` (${booking.couponCode})` : ''}: -${formatCurrency(
          discountAmount
        )}`
      : '',
    `• Subtotal before tax: ${formatCurrency(subtotalAfterDiscount)}`,
    `• HST (15%): ${formatCurrency(taxesAmount)}`,
    `• Total Paid: ${formatCurrency(totalPaid)}`,
    securityDeposit > 0 ? `• Security Deposit: ${formatCurrency(securityDeposit)}` : '',
    '',
    'Need assistance? Call (506) 555-0199 or reply to this email.',
  ].filter(Boolean);

  const textBody = textLines.join('\n');

  return {
    subject: `✅ Invoice Paid - Receipt for ${booking.bookingNumber}`,
    html,
    text: textBody,
  };
}

/**
 * Send invoice payment confirmation with invoice copy
 * Matches the exact invoice shown in PaymentSection.tsx
 */
export async function sendInvoicePaymentConfirmation(
  booking: Parameters<typeof buildInvoicePaymentReceiptEmail>[0],
  payment: Parameters<typeof buildInvoicePaymentReceiptEmail>[1],
  customer: Parameters<typeof buildInvoicePaymentReceiptEmail>[2]
) {
  const { subject, html, text } = buildInvoicePaymentReceiptEmail(booking, payment, customer);

  const msg = {
    to: customer.email,
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject,
    html,
    text,
  };

  try {
    await sgMail.send(msg);

    logger.info('Invoice payment confirmation sent', {
      component: 'email-service',
      action: 'invoice_payment_sent',
      metadata: {
        bookingNumber: booking.bookingNumber,
        customerEmail: customer.email,
        amount: payment.amount,
      },
    });
    logger.debug('SendGrid email sent successfully', {
      component: 'email-service',
      action: 'sendgrid_success',
      metadata: { emailType: 'invoice_payment_confirmation' },
    });

    return { success: true };
  } catch (error) {
    logger.error(
      'SendGrid email send failed',
      {
        component: 'email-service',
        action: 'sendgrid_failed',
        metadata: { emailType: 'invoice_payment_confirmation' },
      },
      error as Error
    );

    logger.error(
      'Failed to send invoice payment confirmation',
      {
        component: 'email-service',
        action: 'invoice_payment_error',
        metadata: {
          error: (error as Error).message,
          bookingNumber: booking.bookingNumber,
        },
      },
      error as Error
    );

    throw new Error(
      `Failed to send invoice payment confirmation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Send test email (for verification)
 */
export async function sendTestEmail(toEmail: string) {
  const msg = {
    to: toEmail,
    from: {
      email: FROM_EMAIL,
      name: COMPANY_NAME,
    },
    subject: 'Test Email - U-Dig It Rentals',
    html: `
      <h2>Email System Test</h2>
      <p>This is a test email from U-Dig It Rentals.</p>
      <p>If you're reading this, the email system is working correctly! ✅</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    logger.info('Test email sent successfully', {
      component: 'email-service',
      action: 'test_email_sent',
      metadata: { to: toEmail },
    });
    return { success: true, response };
  } catch (error) {
    logger.error(
      'Test email failed',
      {
        component: 'email-service',
        action: 'test_email_error',
      },
      error as Error
    );

    throw error;
  }
}
