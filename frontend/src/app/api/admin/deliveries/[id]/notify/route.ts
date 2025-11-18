import { createInAppNotification } from '@/lib/notification-service';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/requireAdmin';
import { sendAdminEmail } from '@/lib/sendgrid';
import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'NickBaxter@udigit.ca';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'U-Dig It Rentals';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin(request);

    if (adminResult.error) return adminResult.error;

    const supabase = adminResult.supabase;

    

    if (!supabase) {

      return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 });

    }

    const { id } = params;
    const body = await request.json();
    const { status, message } = body;

    // Fetch booking with customer details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        bookingNumber,
        startDate,
        endDate,
        deliveryAddress,
        deliveryCity,
        deliveryProvince,
        deliveryPostalCode,
        status,
        customer:customerId (
          id,
          email,
          firstName,
          lastName,
          phone
        ),
        equipment:equipmentId (
          make,
          model
        )
      `)
      .eq('id', id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const customer = (booking as any).customer;
    if (!customer || !customer.email) {
      return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
    }

    // Get status-specific email content
    const getEmailContent = () => {
      const equipmentName = `${(booking as any).equipment?.make || 'Kubota'} ${(booking as any).equipment?.model || 'SVL-75'}`;
      const fullAddress = `${(booking as any).deliveryAddress || ''}, ${(booking as any).deliveryCity || ''}, ${(booking as any).deliveryProvince || 'NB'} ${(booking as any).deliveryPostalCode || ''}`.trim();
      const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email;

      switch (status) {
        case 'in_transit':
          return {
            subject: `Your Equipment is on the Way - ${(booking as any).bookingNumber}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
                  .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🚚 Equipment On The Way!</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${customerName},</p>
                    <p>Great news! Your equipment is now on the way to your location.</p>

                    <div class="info-box">
                      <h3 style="margin-top: 0;">Delivery Details</h3>
                      <p><strong>Booking Number:</strong> ${(booking as any).bookingNumber}</p>
                      <p><strong>Equipment:</strong> ${equipmentName}</p>
                      <p><strong>Delivery Address:</strong> ${fullAddress}</p>
                      <p><strong>Expected Arrival:</strong> Today</p>
                    </div>

                    <p>Please ensure someone is available at the delivery address to receive the equipment.</p>
                    <p>If you have any questions, please contact us at (506) 555-0199.</p>
                  </div>
                  <div class="footer">
                    <p>U-Dig It Rentals Inc.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          };

        case 'delivered':
          return {
            subject: `Equipment Delivered - ${(booking as any).bookingNumber}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
                  .info-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✅ Equipment Delivered!</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${customerName},</p>
                    <p>Your equipment has been successfully delivered to your location.</p>

                    <div class="info-box">
                      <h3 style="margin-top: 0;">Delivery Confirmed</h3>
                      <p><strong>Booking Number:</strong> ${(booking as any).bookingNumber}</p>
                      <p><strong>Equipment:</strong> ${equipmentName}</p>
                      <p><strong>Delivery Address:</strong> ${fullAddress}</p>
                      <p><strong>Rental Period:</strong> ${new Date((booking as any).startDate).toLocaleDateString()} - ${new Date((booking as any).endDate).toLocaleDateString()}</p>
                    </div>

                    <p>Please inspect the equipment upon receipt. If you notice any issues, contact us immediately at (506) 555-0199.</p>
                    <p>We hope you have a successful project!</p>
                  </div>
                  <div class="footer">
                    <p>U-Dig It Rentals Inc.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          };

        case 'completed':
          return {
            subject: `Rental Completed - ${(booking as any).bookingNumber}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
                  .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🎉 Rental Completed!</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${customerName},</p>
                    <p>Thank you for renting with us! Your rental period has been completed.</p>

                    <div class="info-box">
                      <h3 style="margin-top: 0;">Rental Summary</h3>
                      <p><strong>Booking Number:</strong> ${(booking as any).bookingNumber}</p>
                      <p><strong>Equipment:</strong> ${equipmentName}</p>
                      <p><strong>Rental Period:</strong> ${new Date((booking as any).startDate).toLocaleDateString()} - ${new Date((booking as any).endDate).toLocaleDateString()}</p>
                    </div>

                    <p>We hope you had a great experience. If you have any feedback, please don't hesitate to reach out.</p>
                    <p>We look forward to serving you again in the future!</p>
                  </div>
                  <div class="footer">
                    <p>U-Dig It Rentals Inc.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          };

        default:
          return {
            subject: `Delivery Update - ${(booking as any).bookingNumber}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="content">
                    <p>Hi ${customerName},</p>
                    <p>${message || 'Your delivery status has been updated.'}</p>
                    <p><strong>Booking Number:</strong> ${(booking as any).bookingNumber}</p>
                  </div>
                </div>
              </body>
              </html>
            `
          };
      }
    };

    const emailContent = getEmailContent();

    // Send email via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      try {
        await sgMail.send({
          to: customer.email,
          from: {
            email: FROM_EMAIL,
            name: FROM_NAME
          },
          subject: emailContent.subject,
          html: emailContent.html
        });

        logger.info('Delivery notification email sent', {
          component: 'delivery-notify-api',
          action: 'send_notification',
          metadata: {
            bookingId: id,
            status,
            customerEmail: customer.email
          }
        });
      } catch (emailError: any) {
        logger.error('Failed to send delivery notification email', {
          component: 'delivery-notify-api',
          action: 'send_email_error',
          metadata: {
            bookingId: id,
            error: emailError.message
          }
        }, emailError);
        // Don't fail the request if email fails
      }
    }

    await createInAppNotification({
      supabase,
      userId: customer.id,
      category: 'booking',
      priority: status === 'delivered' ? 'high' : 'medium',
      title: emailContent.subject,
      message: message || `Your delivery status has been updated to ${status}.`,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/bookings/${id}`,
      ctaLabel: 'View booking',
      templateId: 'delivery_status_update',
      templateData: {
        bookingNumber: (booking as any).bookingNumber,
        status,
        equipmentName: `${(booking as any).equipment?.make || 'Kubota'} ${(booking as any).equipment?.model || 'SVL-75'}`,
      },
      metadata: {
        deliveryStatus: status,
        bookingId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error: any) {
    logger.error('Failed to send delivery notification', {
      component: 'delivery-notify-api',
      action: 'notify_error',
      metadata: { error: error.message }
    }, error);

    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}


