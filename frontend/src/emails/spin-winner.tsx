/**
 * Spin Wheel Winner Email Template
 * 
 * Sent immediately when user wins on 3rd spin.
 * Contains: Coupon code, expiry countdown, booking CTA with auto-apply link.
 */

import * as React from 'react';

interface SpinWinnerEmailProps {
  firstName?: string;
  email: string;
  couponCode: string;
  discountPercent: number;
  expiresAt: string;
  bookingUrl: string; // URL with auto-apply token
}

export default function SpinWinnerEmail({
  firstName,
  email,
  couponCode,
  discountPercent,
  expiresAt,
  bookingUrl,
}: SpinWinnerEmailProps) {
  const expiryDate = new Date(expiresAt);
  const hoursLeft = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60));

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>You Won {discountPercent}% Off! 🎉</title>
      </head>
      <body style={{ backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f3f4f6', padding: '40px 0' }}>
          <tr>
            <td align="center">
              {/* Main Container */}
              <table width="600" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                
                {/* Header with Gradient */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', padding: '40px 30px', textAlign: 'center' }}>
                    <h1 style={{ color: '#ffffff', fontSize: '36px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                      🎉 Congratulations!
                    </h1>
                    <p style={{ color: '#e0e7ff', fontSize: '18px', margin: 0 }}>
                      You won {discountPercent}% off your equipment rental!
                    </p>
                  </td>
                </tr>

                {/* Main Content */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '24px', margin: '0 0 20px 0' }}>
                      Hi {firstName || 'there'} 👋
                    </p>
                    
                    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '24px', margin: '0 0 30px 0' }}>
                      Great news! Your spin landed on <strong>{discountPercent}% off</strong>, and we've already applied it to your booking.
                    </p>

                    {/* Coupon Code Box */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#10b981', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '30px', textAlign: 'center' }}>
                          <p style={{ color: '#ffffff', fontSize: '14px', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Your Discount Code
                          </p>
                          <p style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', fontFamily: 'Courier, monospace', margin: '0 0 10px 0', letterSpacing: '2px' }}>
                            {couponCode}
                          </p>
                          <p style={{ color: '#d1fae5', fontSize: '14px', margin: 0 }}>
                            ⏰ Expires in {hoursLeft} hours
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* CTA Button */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
                      <tr>
                        <td align="center">
                          <a
                            href={bookingUrl}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              textDecoration: 'none',
                              padding: '16px 48px',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            🎯 Book Now & Save {discountPercent}%
                          </a>
                        </td>
                      </tr>
                    </table>

                    {/* Details Box */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#eff6ff', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '20px' }}>
                          <h3 style={{ color: '#1e40af', fontSize: '16px', margin: '0 0 15px 0' }}>
                            📋 What's Included:
                          </h3>
                          <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e3a8a' }}>
                            <li style={{ marginBottom: '8px' }}><strong>{discountPercent}% discount</strong> on your rental</li>
                            <li style={{ marginBottom: '8px' }}>Valid for <strong>first-time bookings</strong> only</li>
                            <li style={{ marginBottom: '8px' }}>Applies to our Kubota SVL-75 equipment</li>
                            <li style={{ marginBottom: '8px' }}>No hidden fees — what you see is what you pay</li>
                            <li style={{ marginBottom: '0' }}>Coupon expires: <strong>{expiryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong></li>
                          </ul>
                        </td>
                      </tr>
                    </table>

                    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '20px', margin: '0 0 15px 0' }}>
                      <strong>⏰ Time is ticking!</strong> This offer expires in <strong>{hoursLeft} hours</strong>. Book now to lock in your discount.
                    </p>

                    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '20px', margin: '0' }}>
                      Questions? Reply to this email or call us at <a href="tel:+15066431575" style={{ color: '#3b82f6', textDecoration: 'none' }}>(506) 643-1575</a>.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '30px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 10px 0' }}>
                      U-Dig It Rentals | Professional Equipment Rental | Saint John, NB
                    </p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 15px 0' }}>
                      <a href="tel:+15066431575" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: '15px' }}>(506) 643-1575</a>
                      <a href="mailto:info@udigit.ca" style={{ color: '#3b82f6', textDecoration: 'none' }}>info@udigit.ca</a>
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0' }}>
                      <a href="https://udigit.ca/terms" style={{ color: '#6b7280', textDecoration: 'underline', marginRight: '10px' }}>Terms</a>
                      <a href="https://udigit.ca/privacy" style={{ color: '#6b7280', textDecoration: 'underline', marginRight: '10px' }}>Privacy</a>
                      <a href="https://udigit.ca/unsubscribe?email={email}" style={{ color: '#6b7280', textDecoration: 'underline' }}>Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>

              {/* Footer Note */}
              <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '20px' }}>
                This email was sent to {email} because you spun our wheel on udigit.ca
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

