/**
 * Spin Wheel 4-Hour FINAL Reminder Email
 * 
 * Sent 4 hours before expiry if coupon still not used.
 * Maximum urgency messaging to drive final conversions.
 */

import * as React from 'react';

interface SpinReminder4hProps {
  firstName?: string;
  email: string;
  couponCode: string;
  discountPercent: number;
  expiresAt: string;
  bookingUrl: string;
}

export default function SpinReminder4h({
  firstName,
  email,
  couponCode,
  discountPercent,
  expiresAt,
  bookingUrl,
}: SpinReminder4hProps) {
  const expiryDate = new Date(expiresAt);
  const hoursLeft = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60));

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>⚡ FINAL HOURS - Your {discountPercent}% Discount Expires Soon!</title>
      </head>
      <body style={{ backgroundColor: '#fee2e2', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fee2e2', padding: '40px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', border: '3px solid #ef4444' }}>
                
                {/* Urgent Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', padding: '40px 30px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚡</div>
                    <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      FINAL HOURS!
                    </h1>
                    <p style={{ color: '#fecaca', fontSize: '20px', margin: 0 }}>
                      Your {discountPercent}% discount expires in {hoursLeft} hours
                    </p>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '24px', margin: '0 0 20px 0' }}>
                      {firstName || 'Hi there'},
                    </p>
                    
                    <p style={{ fontSize: '18px', color: '#dc2626', fontWeight: 'bold', lineHeight: '26px', margin: '0 0 20px 0', textAlign: 'center' }}>
                      ⚠️ Your {discountPercent}% discount is about to expire!
                    </p>

                    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '24px', margin: '0 0 30px 0' }}>
                      You have <strong>less than {minutesLeft} minutes</strong> to use your spin-to-win discount. After that, this offer disappears forever.
                    </p>

                    {/* Countdown Box */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fee2e2', border: '2px dashed #ef4444', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '30px', textAlign: 'center' }}>
                          <p style={{ color: '#dc2626', fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
                            🕐 Time Remaining
                          </p>
                          <p style={{ color: '#991b1b', fontSize: '36px', fontWeight: 'bold', margin: '0', fontFamily: 'Courier, monospace' }}>
                            {hoursLeft}h {Math.floor((minutesLeft % 60))}m
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* Coupon Code */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#10b981', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '24px', textAlign: 'center' }}>
                          <p style={{ color: '#ffffff', fontSize: '14px', margin: '0 0 8px 0' }}>
                            YOUR CODE (Use it now!)
                          </p>
                          <p style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', fontFamily: 'Courier, monospace', margin: '0', letterSpacing: '2px' }}>
                            {couponCode}
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* Urgent CTA */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
                      <tr>
                        <td align="center">
                          <a
                            href={bookingUrl}
                            style={{
                              display: 'inline-block',
                              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              color: '#ffffff',
                              fontSize: '20px',
                              fontWeight: 'bold',
                              textDecoration: 'none',
                              padding: '18px 56px',
                              borderRadius: '12px',
                              boxShadow: '0 8px 16px rgba(239, 68, 68, 0.4)',
                              textTransform: 'uppercase',
                            }}
                          >
                            ⚡ Book Right Now →
                          </a>
                        </td>
                      </tr>
                    </table>

                    {/* What You're Saving */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#ecfdf5', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '24px' }}>
                          <h3 style={{ color: '#065f46', fontSize: '16px', margin: '0 0 15px 0' }}>
                            💰 What {discountPercent}% Off Means:
                          </h3>
                          <table width="100%" cellPadding="0" cellSpacing="0">
                            <tr>
                              <td style={{ padding: '8px 0', color: '#047857', fontSize: '14px' }}>1-day rental ($450)</td>
                              <td align="right" style={{ padding: '8px 0', color: '#065f46', fontSize: '14px', fontWeight: 'bold' }}>
                                Save ${(450 * discountPercent / 100).toFixed(2)}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '8px 0', color: '#047857', fontSize: '14px' }}>1-week rental ($2,500)</td>
                              <td align="right" style={{ padding: '8px 0', color: '#065f46', fontSize: '14px', fontWeight: 'bold' }}>
                                Save ${(2500 * discountPercent / 100).toFixed(2)}
                              </td>
                            </tr>
                            <tr style={{ borderTop: '2px solid #6ee7b7' }}>
                              <td style={{ padding: '12px 0', color: '#065f46', fontSize: '16px', fontWeight: 'bold' }}>1-month rental ($8,000)</td>
                              <td align="right" style={{ padding: '12px 0', color: '#047857', fontSize: '18px', fontWeight: 'bold' }}>
                                Save ${(8000 * discountPercent / 100).toFixed(2)}! 🎉
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', textAlign: 'center', margin: '0 0 20px 0' }}>
                      ⏰ This is your final reminder — don't let this discount slip away!
                    </p>

                    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '20px', textAlign: 'center', margin: 0 }}>
                      Need help? Call <a href="tel:+15066431575" style={{ color: '#3b82f6', textDecoration: 'none' }}>(506) 643-1575</a>
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '30px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 10px 0' }}>
                      U-Dig It Rentals | Professional Equipment Rental | Saint John, NB
                    </p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                      <a href="https://udigit.ca/terms" style={{ color: '#6b7280', textDecoration: 'underline', marginRight: '10px' }}>Terms</a>
                      <a href="https://udigit.ca/privacy" style={{ color: '#6b7280', textDecoration: 'underline', marginRight: '10px' }}>Privacy</a>
                      <a href={`https://udigit.ca/unsubscribe?email=${email}`} style={{ color: '#6b7280', textDecoration: 'underline' }}>Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

