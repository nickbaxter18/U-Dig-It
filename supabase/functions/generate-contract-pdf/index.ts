/**
 * Generate Contract PDF Edge Function
 * Creates a contract PDF and stores it in Supabase Storage
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'Booking ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get booking with all details
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        equipment:equipmentId (*),
        customer:customerId (*)
      `)
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Generate HTML contract (simple version for now)
    const contractHtml = generateContractHTML(booking);

    // For now, return the signing URL
    // In production, you'd convert HTML to PDF and upload to storage
    const signingUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/booking/${booking_id}/sign-simple`;

    // Update contract
    const { data: contract } = await supabaseClient
      .from('contracts')
      .select('*')
      .eq('bookingId', booking_id)
      .single();

    if (contract) {
      await supabaseClient
        .from('contracts')
        .update({
          documentContent: contractHtml,
          documentUrl: signingUrl,
          status: 'sent_for_signature',
          sentForSignatureAt: new Date().toISOString()
        })
        .eq('id', contract.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        contract_id: contract?.id,
        signing_url: signingUrl,
        embed_url: signingUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Generate contract error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateContractHTML(booking: any): string {
  const customer = booking.customer;
  const equipment = booking.equipment;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Equipment Rental Agreement</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1a1a1a; border-bottom: 3px solid #E1BC56; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
        strong { color: #333; }
      </style>
    </head>
    <body>
      <h1>EQUIPMENT RENTAL AGREEMENT</h1>

      <div class="section">
        <h2>Booking Information</h2>
        <div class="info-grid">
          <div class="info-item"><strong>Booking #:</strong> ${booking.bookingNumber}</div>
          <div class="info-item"><strong>Equipment:</strong> ${equipment.make} ${equipment.model}</div>
          <div class="info-item"><strong>Unit ID:</strong> ${equipment.unitId}</div>
          <div class="info-item"><strong>Total Amount:</strong> $${booking.totalAmount}</div>
        </div>
      </div>

      <div class="section">
        <h2>Customer Information</h2>
        <div class="info-grid">
          <div class="info-item"><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</div>
          <div class="info-item"><strong>Email:</strong> ${customer.email}</div>
          <div class="info-item"><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
          <div class="info-item"><strong>Company:</strong> ${customer.companyName || 'Individual'}</div>
        </div>
      </div>

      <div class="section">
        <h2>Terms & Conditions</h2>
        <p>By signing this agreement, you agree to all terms and conditions of the rental agreement, including insurance requirements, operating limits, and financial obligations.</p>
      </div>
    </body>
    </html>
  `;
}




























































