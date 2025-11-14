/**
 * Email Templates for Customer Communications
 * Professional, branded email templates for the rental platform
 */

interface BookingEmailData {
  bookingNumber: string;
  customerName: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  deliveryAddress: string;
  totalAmount: number;
  securityDeposit: number;
  deliveryFee: number;
}

/**
 * Generate HTML email for booking confirmation
 */
export function generateBookingConfirmationEmail(data: BookingEmailData): string {
  const {
    bookingNumber,
    customerName,
    equipmentName,
    startDate,
    endDate,
    deliveryAddress,
    totalAmount,
    securityDeposit,
    deliveryFee,
  } = data;

  const startDateFormatted = new Date(startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const endDateFormatted = new Date(endDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - ${bookingNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #E1BC56 0%, #d4b04a 100%);
      padding: 30px 20px;
      text-align: center;
      color: #1a1a1a;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
    }
    .success-icon {
      text-align: center;
      margin-bottom: 20px;
    }
    .success-icon svg {
      width: 64px;
      height: 64px;
      color: #10B981;
    }
    .booking-number {
      background-color: #f9fafb;
      border-left: 4px solid #E1BC56;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .booking-number strong {
      color: #E1BC56;
      font-size: 18px;
    }
    .details-table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .details-table td:first-child {
      font-weight: 600;
      color: #6b7280;
      width: 40%;
    }
    .pricing-table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
      background-color: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
    }
    .pricing-table tr {
      border-bottom: 1px solid #e5e7eb;
    }
    .pricing-table tr:last-child {
      border-bottom: none;
      background-color: #fff7e6;
    }
    .pricing-table td {
      padding: 12px 15px;
    }
    .pricing-table td:last-child {
      text-align: right;
      font-weight: 600;
    }
    .pricing-table tr:last-child td {
      font-size: 18px;
      font-weight: 700;
      color: #E1BC56;
    }
    .next-steps {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #1e40af;
    }
    .next-steps ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
      color: #1e3a8a;
    }
    .important-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .important-box strong {
      color: #92400e;
    }
    .footer {
      background-color: #1f2937;
      color: #9ca3af;
      padding: 25px 20px;
      text-align: center;
      font-size: 12px;
    }
    .footer a {
      color: #E1BC56;
      text-decoration: none;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #E1BC56;
      color: #1a1a1a;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Your equipment rental is all set</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Hi ${customerName},</p>

      <p>Great news! Your equipment rental has been successfully confirmed. We're excited to serve you!</p>

      <div class="booking-number">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Booking Reference Number</p>
        <strong>${bookingNumber}</strong>
      </div>

      <h2 style="color: #1f2937; margin-top: 30px;">Booking Details</h2>
      <table class="details-table">
        <tr>
          <td>Equipment</td>
          <td>${equipmentName}</td>
        </tr>
        <tr>
          <td>Start Date</td>
          <td>${startDateFormatted}</td>
        </tr>
        <tr>
          <td>End Date</td>
          <td>${endDateFormatted}</td>
        </tr>
        <tr>
          <td>Delivery Address</td>
          <td>${deliveryAddress}</td>
        </tr>
      </table>

      <h3 style="color: #1f2937; margin-top: 30px;">Pricing Summary</h3>
      <table class="pricing-table">
        <tr>
          <td>Equipment Rental</td>
          <td>$${(totalAmount - deliveryFee).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Delivery & Pickup</td>
          <td>$${deliveryFee.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Total Amount</td>
          <td>$${totalAmount.toFixed(2)}</td>
        </tr>
      </table>

      <div class="next-steps">
        <h3>📋 What Happens Next?</h3>
        <ol>
          <li><strong>Insurance Verification:</strong> Your Certificate of Insurance will be reviewed within 24 hours.</li>
          <li><strong>Security Deposit:</strong> A $${securityDeposit.toFixed(2)} refundable security deposit payment link will be sent to you.</li>
          <li><strong>Rental Agreement:</strong> You'll receive a digital rental agreement to sign electronically.</li>
          <li><strong>Delivery Confirmation:</strong> Our team will contact you 24 hours before delivery to confirm timing.</li>
          <li><strong>Equipment Delivery:</strong> We'll deliver the equipment on your scheduled start date!</li>
        </ol>
      </div>

      <div class="important-box">
        <strong>⚠️ Important:</strong> Equipment cannot be released until your insurance is verified and the security deposit is paid. Please complete these steps as soon as possible to ensure timely delivery.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard/bookings" class="cta-button">
          View Booking in Dashboard
        </a>
      </div>

      <p style="margin-top: 30px;">If you have any questions or need to make changes to your booking, please don't hesitate to contact us:</p>

      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 5px 0;"><strong>📞 Phone:</strong> <a href="tel:+15066431575" style="color: #E1BC56; text-decoration: none;">(506) 643-1575</a></p>
        <p style="margin: 5px 0;"><strong>✉️ Email:</strong> <a href="mailto:info@udigit.ca" style="color: #E1BC56; text-decoration: none;">info@udigit.ca</a></p>
        <p style="margin: 5px 0;"><strong>🕐 Hours:</strong> Monday-Friday 7:00 AM - 6:00 PM</p>
      </div>

      <p>Thank you for choosing U-Dig It Rentals!</p>

      <p style="margin-top: 20px; color: #6b7280; font-style: italic;">
        Best regards,<br>
        <strong>The U-Dig It Rentals Team</strong><br>
        Saint John, New Brunswick
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 5px 0;"><strong>U-Dig It Rentals Inc.</strong></p>
      <p style="margin: 5px 0;">Professional Equipment Rental | Saint John, NB</p>
      <p style="margin: 15px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/terms">Terms</a> •
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/privacy">Privacy</a> •
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/support">Support</a>
      </p>
      <p style="margin: 10px 0; font-size: 11px; color: #6b7280;">
        © ${new Date().getFullYear()} U-Dig It Rentals Inc. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for booking confirmation (fallback)
 */
export function generateBookingConfirmationText(data: BookingEmailData): string {
  const {
    bookingNumber,
    customerName,
    equipmentName,
    startDate,
    endDate,
    deliveryAddress,
    totalAmount,
    securityDeposit,
  } = data;

  return `
BOOKING CONFIRMED!
==================

Hi ${customerName},

Your equipment rental has been successfully confirmed!

Booking Reference: ${bookingNumber}

BOOKING DETAILS:
- Equipment: ${equipmentName}
- Start Date: ${new Date(startDate).toLocaleDateString()}
- End Date: ${new Date(endDate).toLocaleDateString()}
- Delivery Address: ${deliveryAddress}
- Total Amount: $${totalAmount.toFixed(2)}
- Security Deposit: $${securityDeposit.toFixed(2)} (refundable)

WHAT HAPPENS NEXT:
1. Insurance Verification: Your Certificate of Insurance will be reviewed within 24 hours.
2. Security Deposit: A payment link will be sent to you.
3. Rental Agreement: You'll receive a digital agreement to sign.
4. Delivery Confirmation: We'll contact you 24 hours before delivery.
5. Equipment Delivery: We'll deliver on your scheduled start date!

IMPORTANT: Equipment cannot be released until insurance is verified and security deposit is paid.

CONTACT US:
Phone: (506) 643-1575
Email: info@udigit.ca
Hours: Monday-Friday 7:00 AM - 6:00 PM

Thank you for choosing U-Dig It Rentals!

Best regards,
The U-Dig It Rentals Team
Saint John, New Brunswick

---
© ${new Date().getFullYear()} U-Dig It Rentals Inc. All rights reserved.
  `.trim();
}

/**
 * Generate booking reminder email (24-48 hours before start)
 */
export function generateBookingReminderEmail(
  data: BookingEmailData & { hoursUntilStart: number }
): string {
  const { customerName, equipmentName, startDate, deliveryAddress, hoursUntilStart } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

    <div style="background-color: #3b82f6; padding: 30px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 26px;">⏰ Rental Reminder</h1>
    </div>

    <div style="padding: 30px 20px;">
      <p>Hi ${customerName},</p>

      <p style="font-size: 18px; font-weight: 600; color: #1f2937;">
        Your equipment rental starts in ${hoursUntilStart} hours!
      </p>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Equipment:</strong> ${equipmentName}</p>
        <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(startDate).toLocaleString(
          'en-US',
          {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        )}</p>
        <p style="margin: 5px 0;"><strong>Delivery To:</strong> ${deliveryAddress}</p>
      </div>

      <h3 style="color: #1f2937;">Final Checklist:</h3>
      <ul style="color: #4b5563;">
        <li>✅ Insurance verified and approved</li>
        <li>✅ Security deposit paid</li>
        <li>✅ Rental agreement signed</li>
        <li>✅ Site prepared for delivery</li>
        <li>✅ Qualified operator ready</li>
      </ul>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #92400e;">
          <strong>⚠️ Reminder:</strong> Please ensure your site is ready for equipment delivery and that a qualified operator is available for the equipment handover.
        </p>
      </div>

      <p>Our team will contact you shortly before delivery to confirm the exact time. If you have any last-minute questions or need to make changes, please call us immediately.</p>

      <div style="text-align: center; margin: 25px 0;">
        <p style="margin: 5px 0;"><strong>Need Help?</strong></p>
        <p style="margin: 5px 0;">Call: <a href="tel:+15066431575" style="color: #E1BC56; text-decoration: none; font-weight: 600;">(506) 643-1575</a></p>
        <p style="margin: 5px 0;">Email: <a href="mailto:info@udigit.ca" style="color: #E1BC56; text-decoration: none;">info@udigit.ca</a></p>
      </div>

      <p style="margin-top: 25px;">
        We look forward to serving you!<br>
        <strong>The U-Dig It Rentals Team</strong>
      </p>
    </div>

    <div style="background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} U-Dig It Rentals Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Email notification types
 */
export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_REMINDER_48H: 'booking_reminder_48h',
  BOOKING_REMINDER_24H: 'booking_reminder_24h',
  INSURANCE_APPROVED: 'insurance_approved',
  INSURANCE_REJECTED: 'insurance_rejected',
  PAYMENT_RECEIVED: 'payment_received',
  CONTRACT_READY: 'contract_ready',
  DELIVERY_SCHEDULED: 'delivery_scheduled',
  BOOKING_CANCELLED: 'booking_cancelled',
} as const;
