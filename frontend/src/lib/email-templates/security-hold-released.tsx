/**
 * Email Template: Security Hold Released
 *
 * Sent when $500 hold is released after clean return.
 */

interface SecurityHoldReleasedEmailProps {
  customerName: string;
  bookingNumber: string;
  equipmentName: string;
  returnDate: string;
  holdAmount: number; // Usually 500
}

export function generateSecurityHoldReleasedEmail(data: SecurityHoldReleasedEmailProps): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Security Hold Released - Thank You!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hold Released</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🎉 Hold Released!</h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px;">Thank you for renting with us</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">Hi ${data.customerName},</p>

              <p style="margin: 0 0 24px 0; font-size: 16px; color: #374151; line-height: 1.6;">
                Great news! Your <strong style="color: #10B981;">$${data.holdAmount} security hold has been released</strong>.
                The equipment was returned in excellent condition and we appreciate your care!
              </p>

              <!-- Success Box -->
              <table role="presentation" style="width: 100%; background: #F0FDF4; border: 2px solid #86EFAC; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                    <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #065F46;">
                      $${data.holdAmount}.00 Released
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #047857;">
                      The hold will disappear from your card within 1-2 business days
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Rental Summary -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">📦 Completed Rental</h3>
                <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.6;">
                  <strong>Equipment:</strong> ${data.equipmentName}<br>
                  <strong>Returned:</strong> ${data.returnDate}<br>
                  <strong>Booking #:</strong> ${data.bookingNumber}
                </p>
              </div>

              <!-- Loyalty Offer -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 2px solid #E1BC56; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #92400E; text-align: center;">
                      🎁 Special Thank You Offer!
                    </h3>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #78350F; text-align: center; line-height: 1.5;">
                      Rent again within 30 days and get <strong>10% OFF</strong> your next booking!
                    </p>
                    <div style="text-align: center; background: white; border-radius: 6px; padding: 12px; border: 2px dashed #E1BC56;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #78350F; font-weight: 600;">USE CODE:</p>
                      <p style="margin: 0; font-size: 24px; color: #A90F0F; font-weight: 700; letter-spacing: 2px;">RETURN10</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://yourdomain.com/book?code=RETURN10"
                       style="display: inline-block; padding: 14px 32px; background: #A90F0F; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Book Again & Save 10% →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Feedback Request -->
              <div style="background: #F9FAFB; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0 0 12px 0; font-size: 15px; color: #111827;">
                  How was your experience?
                </p>
                <div style="font-size: 32px;">
                  <a href="https://yourdomain.com/feedback/${data.bookingNumber}?rating=5" style="text-decoration: none; margin: 0 4px;">⭐</a>
                  <a href="https://yourdomain.com/feedback/${data.bookingNumber}?rating=4" style="text-decoration: none; margin: 0 4px;">⭐</a>
                  <a href="https://yourdomain.com/feedback/${data.bookingNumber}?rating=3" style="text-decoration: none; margin: 0 4px;">⭐</a>
                  <a href="https://yourdomain.com/feedback/${data.bookingNumber}?rating=2" style="text-decoration: none; margin: 0 4px;">⭐</a>
                  <a href="https://yourdomain.com/feedback/${data.bookingNumber}?rating=1" style="text-decoration: none; margin: 0 4px;">⭐</a>
                </div>
                <p style="margin: 12px 0 0 0; font-size: 12px; color: #6B7280;">
                  Click the stars above to rate your experience
                </p>
              </div>

              <!-- Contact -->
              <div style="text-align: center;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">Questions or concerns?</p>
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
                We appreciate your business! 🚜
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
Security Hold Released - Thank You!

Hi ${data.customerName},

Great news! Your $${data.holdAmount} security hold has been released.

The equipment was returned in excellent condition and we appreciate your care!

COMPLETED RENTAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Equipment: ${data.equipmentName}
Returned: ${data.returnDate}
Booking #: ${data.bookingNumber}

🎁 SPECIAL THANK YOU OFFER:

Rent again within 30 days and get 10% OFF!

Use code: RETURN10

Book now: https://yourdomain.com/book?code=RETURN10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW WAS YOUR EXPERIENCE?

Rate us: https://yourdomain.com/feedback/${data.bookingNumber}

Your feedback helps us improve!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTIONS?
Call: (506) 643-1575
Email: info@udigit.ca

Thank you for choosing U-Dig It Rentals!
  `;

  return { subject, html, text };
}

























