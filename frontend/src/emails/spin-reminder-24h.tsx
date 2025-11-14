/**
 * Spin Wheel 24-Hour Reminder Email
 * 
 * Sent 24 hours after win if coupon not used.
 * Creates urgency with "only 24 hours left" messaging.
 */

import * as React from 'react';

interface SpinReminder24hProps {
  firstName?: string;
  email: string;
  couponCode: string;
  discountPercent: number;
  expiresAt: string;
  bookingUrl: string;
}

export default function SpinReminder24h({
  firstName,
  email,
  couponCode,
  discountPercent,
  expiresAt,
  bookingUrl,
}: SpinReminder24hProps) {
  const expiryDate = new Date(expiresAt);
  const hoursLeft = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60));

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>24 Hours Left - {discountPercent}% Off Expires Soon!</title>
      </head>
      <body style={{ backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f3f4f6', padding: '40px 0' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                
                {/* Header */}
                <tr>
                  <td style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', padding: '40px 30px', textAlign: 'center' }}>
                    <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                      ⏰ Only {hoursLeft} Hours Left!
                    </h1>
                    <p style={{ color: '#fef3c7', fontSize: '18px', margin: 0 }}>
                      Your {discountPercent}% discount expires soon
                    </p>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '24px', margin: '0 0 20px 0' }}>
                      Hi {firstName || 'there'},
                    </p>
                    
                    <p style={{ fontSize: '16px', color: '#374151', lineHeight: '24px', margin: '0 0 30px 0' }}>
                      Just a friendly reminder — your <strong>{discountPercent}% discount</strong> from our spin wheel is waiting for you, but it expires in about <strong>{hoursLeft} hours</strong>!
                    </p>

                    {/* Urgency Box */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '24px', textAlign: 'center' }}>
                          <p style={{ color: '#92400e', fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                            ⚡ Time is Running Out!
                          </p>
                          <p style={{ color: '#78350f', fontSize: '14px', margin: '0' }}>
                            Don't miss out on ${discountPercent}% savings on your rental. Book before {expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* Coupon Code */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#10b981', borderRadius: '12px', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ padding: '24px', textAlign: 'center' }}>
                          <p style={{ color: '#ffffff', fontSize: '14px', margin: '0 0 8px 0', letterSpacing: '1px' }}>
                            YOUR CODE
                          </p>
                          <p style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold', fontFamily: 'Courier, monospace', margin: '0', letterSpacing: '2px' }}>
                            {couponCode}
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* CTA */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '30px' }}>
                      <tr>
                        <td align="center">
                          <a
                            href={bookingUrl}
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#ef4444',
                              color: '#ffffff',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              textDecoration: 'none',
                              padding: '16px 48px',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            ⚡ Book Now - {discountPercent}% Off Applied
                          </a>
                        </td>
                      </tr>
                    </table>

                    {/* Benefits */}
                    <h3 style={{ color: '#111827', fontSize: '18px', margin: '0 0 15px 0' }}>
                      Why rent from U-Dig It?
                    </h3>
                    <ul style={{ margin: '0 0 30px 0', paddingLeft: '20px', color: '#4b5563', fontSize: '14px', lineHeight: '22px' }}>
                      <li style={{ marginBottom: '8px' }}>✅ Professional Kubota SVL-75 equipment</li>
                      <li style={{ marginBottom: '8px' }}>✅ Fully maintained & inspected</li>
                      <li style={{ marginBottom: '8px' }}>✅ $120K insurance coverage included</li>
                      <li style={{ marginBottom: '8px' }}>✅ 24/7 emergency support</li>
                      <li style={{ marginBottom: '0' }}>✅ Delivery available across Greater Saint John</li>
                    </ul>

                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                      Questions? Call us: <a href="tel:+15066431575" style={{ color: '#3b82f6', textDecoration: 'none' }}>(506) 643-1575</a> or reply to this email.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ backgroundColor: '#f9fafb', padding: '30px', textAlign: 'center', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 10px 0' }}>
                      U-Dig It Rentals | Saint John, NB | (506) 643-1575
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

