/**
 * Email Template: Booking Confirmation (with Hold System v4 explanation)
 *
 * Sent immediately after booking is created and $50 verification hold is voided.
 */

interface BookingConfirmationEmailProps {
  customerName: string;
  bookingNumber: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  deliveryAddress: string;
  totalAmount: number;
  t48Date: string; // When $500 hold will be placed
  cardLast4: string;
}

export function generateBookingConfirmationEmail(data: BookingConfirmationEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Booking Confirmed - ${data.bookingNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #E1BC56 0%, #D4A843 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">✅ Booking Confirmed!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">Thank you for choosing U-Dig It Rentals</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">Hi ${data.customerName},</p>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Great news! Your booking is confirmed and we're excited to serve you. Here's what just happened:
              </p>

              <!-- Booking Details Card -->
              <table role="presentation" style="width: 100%; background: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">📋 Booking Details</h3>
                    <table style="width: 100%; font-size: 14px; color: #4B5563;">
                      <tr>
                        <td style="padding: 6px 0;"><strong>Booking Number:</strong></td>
                        <td style="padding: 6px 0; text-align: right; color: #111827; font-weight: 600;">${data.bookingNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;"><strong>Equipment:</strong></td>
                        <td style="padding: 6px 0; text-align: right;">${data.equipmentName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;"><strong>Rental Period:</strong></td>
                        <td style="padding: 6px 0; text-align: right;">${data.startDate} - ${data.endDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;"><strong>Delivery To:</strong></td>
                        <td style="padding: 6px 0; text-align: right;">${data.deliveryAddress}</td>
                      </tr>
                      <tr style="border-top: 2px solid #E5E7EB;">
                        <td style="padding: 12px 0 6px 0;"><strong>Total Amount:</strong></td>
                        <td style="padding: 12px 0 6px 0; text-align: right; color: #A90F0F; font-size: 18px; font-weight: 700;">$${data.totalAmount.toFixed(2)} CAD</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Hold System Explanation -->
              <table role="presentation" style="width: 100%; background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1E3A8A;">💳 About Your Security Holds</h3>

                    <div style="margin-bottom: 16px;">
                      <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 24px; margin-right: 8px;">✓</span>
                        <span style="font-size: 14px; font-weight: 600; color: #1E40AF;">$50 Verification Hold (Completed)</span>
                      </div>
                      <p style="margin: 0 0 0 32px; font-size: 13px; color: #1E40AF; line-height: 1.5;">
                        We placed a $50 hold on your card ending in <strong>${data.cardLast4}</strong> and voided it immediately.
                        Your bank may show it as pending for a few hours - this is normal and no money will be charged.
                      </p>
                    </div>

                    <div>
                      <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 24px; margin-right: 8px;">⏰</span>
                        <span style="font-size: 14px; font-weight: 600; color: #1E40AF;">$500 Security Hold (Scheduled)</span>
                      </div>
                      <p style="margin: 0 0 0 32px; font-size: 13px; color: #1E40AF; line-height: 1.5;">
                        A <strong>$500 refundable hold</strong> will be placed on <strong>${data.t48Date}</strong> (48 hours before pickup).
                        This is NOT a charge - it's a hold that releases within 24 hours of clean return.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">📝 Complete These Steps Next</h3>
                <table style="width: 100%; font-size: 14px;">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                      <span style="color: #10B981; font-size: 18px; margin-right: 10px;">1</span>
                      <strong>Upload Certificate of Insurance</strong><br>
                      <span style="color: #6B7280; font-size: 13px; margin-left: 28px;">
                        Must include U-Dig It Rentals as Additional Insured
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB;">
                      <span style="color: #10B981; font-size: 18px; margin-right: 10px;">2</span>
                      <strong>Upload Driver's License</strong><br>
                      <span style="color: #6B7280; font-size: 13px; margin-left: 28px;">
                        Clear photo of front (and back if applicable)
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #10B981; font-size: 18px; margin-right: 10px;">3</span>
                      <strong>Sign Rental Agreement</strong><br>
                      <span style="color: #6B7280; font-size: 13px; margin-left: 28px;">
                        Electronic signature - takes 2 minutes
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://yourdomain.com/booking/${data.bookingNumber}/manage"
                       style="display: inline-block; padding: 14px 32px; background: #A90F0F; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Complete Your Booking →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">Questions? We're here to help!</p>
                <p style="margin: 0; font-size: 16px;">
                  <a href="tel:+15066431575" style="color: #A90F0F; text-decoration: none; font-weight: 600;">📞 (506) 643-1575</a>
                  <span style="color: #D1D5DB; margin: 0 10px;">|</span>
                  <a href="mailto:info@udigit.ca" style="color: #A90F0F; text-decoration: none; font-weight: 600;">✉️ info@udigit.ca</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 24px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">
                U-Dig It Rentals Inc. | 945 Golden Grove Road, Saint John, NB E2H 2X1
              </p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                Professional equipment rental you can trust
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Booking Confirmed - ${data.bookingNumber}

Hi ${data.customerName},

Your booking is confirmed! Here's what just happened:

BOOKING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Booking Number: ${data.bookingNumber}
Equipment: ${data.equipmentName}
Rental Period: ${data.startDate} - ${data.endDate}
Delivery To: ${data.deliveryAddress}
Total Amount: $${data.totalAmount.toFixed(2)} CAD

ABOUT YOUR SECURITY HOLDS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ $50 Verification Hold (Completed)
  We placed a $50 hold on your card ending in ${data.cardLast4} and voided it immediately.
  Your bank may show it as pending for a few hours - this is normal and no money will be charged.

⏰ $500 Security Hold (Scheduled for ${data.t48Date})
  A $500 refundable hold will be placed 48 hours before pickup.
  This is NOT a charge - it releases within 24 hours of clean return.

NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Upload Certificate of Insurance
   → Must include U-Dig It Rentals as Additional Insured

2. Upload Driver's License
   → Clear photo of front (and back if applicable)

3. Sign Rental Agreement
   → Electronic signature - takes 2 minutes

Complete your booking:
https://yourdomain.com/booking/${data.bookingNumber}/manage

QUESTIONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Call: (506) 643-1575
Email: info@udigit.ca

Thank you!
U-Dig It Rentals
Saint John, NB
  `;

  return { subject, html, text };
}

























