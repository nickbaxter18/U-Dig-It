import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingNotificationRequest {
  bookingId: string
  type: 'created' | 'confirmed' | 'cancelled' | 'completed'
  adminEmails?: string[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { bookingId, type, adminEmails }: BookingNotificationRequest = await req.json()

    if (!bookingId || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bookingId, type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        equipment:equipmentId (
          id,
          unitId,
          make,
          model,
          year
        ),
        customer:customerId (
          id,
          email,
          firstName,
          lastName,
          phone
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get admin emails if not provided
    let emailsToNotify = adminEmails || []
    if (emailsToNotify.length === 0) {
      const { data: admins } = await supabaseClient
        .from('users')
        .select('email')
        .in('role', ['admin', 'super_admin'])

      emailsToNotify = admins?.map(admin => admin.email) || []
    }

    // Generate notification content based on type
    const getNotificationContent = (type: string) => {
      switch (type) {
        case 'created':
          return {
            subject: `New Booking Request - ${booking.bookingNumber}`,
            html: `
              <h2>New Booking Request</h2>
              <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
              <p><strong>Equipment:</strong> ${booking.equipment?.make} ${booking.equipment?.model} (${booking.equipment?.unitId})</p>
              <p><strong>Customer:</strong> ${booking.customer?.firstName} ${booking.customer?.lastName} (${booking.customer?.email})</p>
              <p><strong>Dates:</strong> ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</p>
              <p><strong>Total:</strong> $${booking.totalAmount}</p>
              <p><strong>Status:</strong> ${booking.status}</p>
              <p>Please review and confirm this booking.</p>
            `
          }
        case 'confirmed':
          return {
            subject: `Booking Confirmed - ${booking.bookingNumber}`,
            html: `
              <h2>Booking Confirmed</h2>
              <p>Great news! Your booking has been confirmed.</p>
              <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
              <p><strong>Equipment:</strong> ${booking.equipment?.make} ${booking.equipment?.model} (${booking.equipment?.unitId})</p>
              <p><strong>Dates:</strong> ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</p>
              <p><strong>Total:</strong> $${booking.totalAmount}</p>
            `
          }
        case 'cancelled':
          return {
            subject: `Booking Cancelled - ${booking.bookingNumber}`,
            html: `
              <h2>Booking Cancelled</h2>
              <p>Your booking has been cancelled.</p>
              <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
              <p><strong>Equipment:</strong> ${booking.equipment?.make} ${booking.equipment?.model}</p>
              <p>If you have any questions, please contact us.</p>
            `
          }
        default:
          return {
            subject: `Booking Update - ${booking.bookingNumber}`,
            html: `<p>Your booking ${booking.bookingNumber} has been updated.</p>`
          }
      }
    }

    const content = getNotificationContent(type)

    // Send notifications to admins (log for now)
    for (const email of emailsToNotify) {
      console.log(`📧 Admin notification for ${type}:`, {
        to: email,
        subject: content.subject,
        bookingNumber: booking.bookingNumber,
      })
    }

    // Send notification to customer if it's a customer-facing event
    if (['confirmed', 'cancelled'].includes(type) && booking.customer?.email) {
      console.log(`📧 Customer notification for ${type}:`, {
        to: booking.customer.email,
        subject: content.subject,
        bookingNumber: booking.bookingNumber,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent for ${type} event`,
        bookingNumber: booking.bookingNumber,
        notifiedEmails: emailsToNotify.length + (booking.customer?.email ? 1 : 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Booking notification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})























































































