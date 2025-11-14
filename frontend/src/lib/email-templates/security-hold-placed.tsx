/**
 * Email Template: Security Hold Placed (T-48)
 *
 * Sent 48 hours before pickup when $500 hold is placed on card.
 */

interface SecurityHoldPlacedEmailProps {
  customerName: string;
  bookingNumber: string;
  equipmentName: string;
  startDate: string;
  endDate: string;
  cardLast4: string;
  holdAmount: number; // Usually 500
}

export function generateSecurityHoldPlacedEmail(data: SecurityHoldPlacedEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Security Hold Placed - ${data.bookingNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Hold Placed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🔒 Security Hold Active</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">Your pickup is coming up!</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">Hi ${data.customerName},</p>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                As scheduled, we've placed a <strong style="color: #A90F0F;">$${data.holdAmount} security hold</strong> on your card ending in <strong>${data.cardLast4}</strong>.
              </p>

              <!-- Important Notice Box -->
              <table role="presentation" style="width: 100%; background: #FEF3C7; border: 2px solid #FCD34D; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400E;">
                      ⚠️ Important: This is NOT a charge
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #78350F; line-height: 1.5;">
                      This is a temporary hold on your card. It will automatically release within 24 hours
                      after you return the equipment in good condition. You will NOT be charged unless
                      there is damage beyond normal wear and tear.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Booking Summary -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">📅 Your Upcoming Rental</h3>
                <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.6;">
                  <strong>Equipment:</strong> ${data.equipmentName}<br>
                  <strong>Pickup:</strong> ${data.startDate}<br>
                  <strong>Return:</strong> ${data.endDate}<br>
                  <strong>Booking #:</strong> ${data.bookingNumber}
                </p>
              </div>

              <!-- What Happens Next -->
              <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #065F46;">
                  ✅ What Happens Next
                </h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #047857; line-height: 1.6;">
                  <li>We'll deliver the equipment on ${data.startDate}</li>
                  <li>You use it for your project</li>
                  <li>We pick it up on ${data.endDate}</li>
                  <li>We inspect for damage (normal wear is fine!)</li>
                  <li>Hold releases within 24 hours if everything looks good</li>
                </ul>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://yourdomain.com/booking/${data.bookingNumber}/manage"
                       style="display: inline-block; padding: 14px 32px; background: #A90F0F; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      View Booking Details →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Contact -->
              <div style="text-align: center; padding-top: 16px; border-top: 1px solid #E5E7EB;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">Need help or have questions?</p>
                <p style="margin: 0; font-size: 16px;">
                  <a href="tel:+15066431575" style="color: #A90F0F; text-decoration: none; font-weight: 600;">📞 (506) 643-1575</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F9FAFB; padding: 24px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">
                U-Dig It Rentals Inc. | Saint John, NB
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
Security Hold Placed - ${data.bookingNumber}

Hi ${data.customerName},

A $${data.holdAmount} security hold has been placed on your card ending in ${data.cardLast4}.

⚠️ IMPORTANT: This is NOT a charge

This is a temporary hold on your card. It will automatically release within 24 hours
after you return the equipment in good condition.

YOUR UPCOMING RENTAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Equipment: ${data.equipmentName}
Pickup: ${data.startDate}
Return: ${data.endDate}
Booking #: ${data.bookingNumber}

WHAT HAPPENS NEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• We deliver the equipment on ${data.startDate}
• You use it for your project
• We pick it up on ${data.endDate}
• We inspect for damage (normal wear is fine!)
• Hold releases within 24h if everything looks good

View booking details:
https://yourdomain.com/booking/${data.bookingNumber}/manage

QUESTIONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Call: (506) 643-1575
Email: info@udigit.ca

See you soon!
U-Dig It Rentals
  `;

  return { subject, html, text };
}

























