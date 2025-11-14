/**
 * Generate Signed Contract PDF Edge Function
 * Generates professional PDF with signature using Deno
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

    const { contract_id } = await req.json();

    if (!contract_id) {
      return new Response(
        JSON.stringify({ error: 'Contract ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get contract with all details
    const { data: contract, error: contractError } = await supabaseClient
      .from('contracts')
      .select(`
        *,
        booking:bookingId (
          *,
          equipment:equipmentId (*),
          customer:customerId (*)
        )
      `)
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error('Contract not found');
    }

    // Check if signed
    if (contract.status !== 'signed' || !contract.signatures?.customer) {
      throw new Error('Contract must be signed first');
    }

    const booking = contract.booking;
    const equipment = booking.equipment;
    const customer = booking.customer;
    const signature = contract.signatures.customer;

    // Generate comprehensive PDF HTML
    const pdfHtml = generateEquipmentRiderHTML({
      contract,
      booking,
      equipment,
      customer,
      signature
    });

    // Set filename
    const fileName = `${booking.customerId}/${contract_id}-signed-${Date.now()}.pdf`;

    // For now, save as HTML (convertible to PDF with print-to-PDF)
    // In production, you'd use a service like Gotenberg or Puppeteer
    const htmlBlob = new Blob([pdfHtml], { type: 'text/html' });

    // Upload to Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('signed-contracts')
      .upload(fileName.replace('.pdf', '.html'), htmlBlob, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload contract');
    }

    const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24 hours
    const { data: signedData, error: signedError } = await supabaseClient.storage
      .from('signed-contracts')
      .createSignedUrl(fileName.replace('.pdf', '.html'), SIGNED_URL_TTL_SECONDS);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      throw new Error('Failed to generate signed URL for contract');
    }

    // Update contract with URL
    await supabaseClient
      .from('contracts')
      .update({
        signedDocumentUrl: signedData?.signedUrl ?? null,
        signedDocumentPath: fileName.replace('.pdf', '.html')
      })
      .eq('id', contract_id);

    return new Response(
      JSON.stringify({
        success: true,
        url: signedData?.signedUrl ?? null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateEquipmentRiderHTML(params: any): string {
  const { contract, booking, equipment, customer, signature } = params;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Signed Equipment Rider - ${booking.bookingNumber}</title>
  <style>
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 0; padding: 40px; }
    .signed-banner { background: #4CAF50; color: white; text-align: center; padding: 15px; margin: -40px -40px 20px -40px; font-size: 16pt; font-weight: bold; }
    .header { text-align: center; border-bottom: 3px solid #E1BC56; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #A90F0F; margin: 0; font-size: 18pt; }
    .section { margin: 15px 0; page-break-inside: avoid; }
    .section-title { font-size: 12pt; font-weight: bold; color: #A90F0F; border-bottom: 2px solid #E1BC56; padding-bottom: 5px; margin: 15px 0 10px 0; }
    .filled { background: #ffffcc; padding: 2px 6px; font-weight: bold; border-radius: 3px; }
    .signature-section { background: #f0f8ff; border: 3px solid #4CAF50; padding: 20px; margin-top: 30px; }
    .sig-image { max-width: 300px; border: 2px solid #000; padding: 10px; background: white; display: block; margin: 15px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 8px; border: 1px solid #ccc; }
    ul { margin: 5px 0 5px 25px; }
  </style>
</head>
<body>
  <div class="signed-banner">✓ SIGNED & EXECUTED - LEGALLY BINDING CONTRACT</div>

  <div class="header">
    <h1>EQUIPMENT-SPECIFIC RIDER</h1>
    <h2 style="color: #E1BC56; margin: 5px 0;">2025 Kubota SVL75-3 Compact Track Loader</h2>
    <p>Document ID: UDIR-SVL75-3-RIDER-SIGNED | Version: 1.0</p>
  </div>

  <p style="background: #f5f5f5; padding: 12px; border-left: 4px solid #E1BC56;">
    This Rider is incorporated into and made part of the U-Dig It Rentals Inc. Rental Agreement.
    If there is any conflict, the stricter term (greater safety/financial protection) applies.
  </p>

  <div class="section">
    <div class="section-title">1) Unit Details</div>
    <table>
      <tr><td width="50%"><strong>Equipment:</strong></td><td><span class="filled">Kubota SVL75-3 (Compact Track Loader)</span></td></tr>
      <tr><td><strong>Serial/Unit ID:</strong></td><td><span class="filled">${equipment.unitId || 'SVL75-001'}</span></td></tr>
      <tr><td><strong>Hours at Release:</strong></td><td><span class="filled">${equipment.totalEngineHours || 0} h</span></td></tr>
      <tr><td><strong>Replacement Value:</strong></td><td><span class="filled">$120,000 CAD</span></td></tr>
      <tr><td><strong>Rental Start:</strong></td><td><span class="filled">${new Date(booking.startDate).toLocaleString()}</span></td></tr>
      <tr><td><strong>Rental End:</strong></td><td><span class="filled">${new Date(booking.endDate).toLocaleString()}</span></td></tr>
      <tr><td><strong>Total Amount:</strong></td><td><span class="filled">$${booking.totalAmount} CAD</span></td></tr>
      <tr><td><strong>Security Deposit:</strong></td><td><span class="filled">$${booking.securityDeposit || '500'}</span></td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2) Insurance (Required — "No COI, No Release")</div>
    <p style="background: #FEF3C7; padding: 10px; border-left: 4px solid #FBBF24; font-weight: bold;">
      ⚠️ MANDATORY: Proof of insurance required BEFORE equipment release
    </p>
    <ul>
      <li><strong>CGL:</strong> ≥ $2,000,000 per occurrence, U-Dig It Rentals Inc. as Additional Insured</li>
      <li><strong>Equipment Coverage:</strong> Full replacement value ($120,000), U-Dig It Rentals Inc. as Loss Payee</li>
      <li><strong>Auto Liability:</strong> ≥ $1,000,000 if transporting on public roads</li>
    </ul>
    <p><strong>Renter Initials:</strong> <span class="filled">✓ Acknowledged</span></p>
  </div>

  <div class="section">
    <div class="section-title">3) Transport & Tie-Down</div>
    <ul>
      <li>Professional loading/unloading only; <strong>no one in cab</strong> during load/unload</li>
      <li><strong>Minimum 4-point tie-down</strong> on machine; secure attachments separately</li>
      <li>Verify overhead/bridge/width/weight limits; obtain permits where required</li>
    </ul>
    <p><strong>Renter Initials:</strong> <span class="filled">✓ Acknowledged</span></p>
  </div>

  <div class="section">
    <div class="section-title">4) Operating Limits & Safety</div>
    <ul>
      <li><strong>Max slope: ≤ 25°</strong> - Travel straight up/down only, avoid side-hilling</li>
      <li><strong>PPE Required:</strong> CSA boots, hi-viz, eye/ear protection, hard hat where needed</li>
      <li><strong>Utility locates:</strong> Completed and on-site BEFORE ground disturbance</li>
      <li><strong>Operators:</strong> 21+ years old only, no impairment (alcohol/drugs)</li>
      <li><strong>No riders;</strong> never lift/carry people</li>
    </ul>
    <p><strong>Renter Initials:</strong> <span class="filled">✓ Acknowledged</span></p>
  </div>

  <div class="section">
    <div class="section-title">5) Prohibited Uses</div>
    <ul>
      <li>Demolition beyond rated capability; impact/ramming</li>
      <li>Hazmat/contamination (fuel spills, sewage, chemicals)</li>
      <li>Saltwater, deep mud beyond track height, fire areas (without written approval)</li>
      <li>Alterations, disabling safety devices, removing GPS/telematics</li>
    </ul>
    <p><strong>Renter Initials:</strong> <span class="filled">✓ Acknowledged</span></p>
  </div>

  <div class="section">
    <div class="section-title">6) Care & Maintenance</div>
    <ul>
      <li>Daily pre-start inspection; check fluids, tracks, safety devices</li>
      <li>Grease per manual; report defects immediately</li>
      <li>Renter responsible for fuel and basic cleaning</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">7) Damage, Loss, Theft & Environmental</div>
    <p><strong>Renter is responsible for ALL damage, loss, theft, vandalism, contamination, and recovery costs.</strong></p>
    <ul>
      <li>Tracks, edges, teeth, glass, hoses, lights billable if beyond normal wear</li>
      <li><strong>Theft/vandalism:</strong> Notify police AND Owner immediately</li>
      <li><strong>Spills:</strong> Immediate containment/cleanup at Renter's expense</li>
    </ul>
    <p><strong>Renter Initials:</strong> <span class="filled">✓ Acknowledged</span></p>
  </div>

  <div class="section">
    <div class="section-title">8) Financial Terms</div>
    <table>
      <tr><td><strong>Fuel (if not full):</strong></td><td>$100 flat refuel charge</td></tr>
      <tr><td><strong>Cleaning (excessive):</strong></td><td>$100 flat rate</td></tr>
      <tr><td><strong>Over-hour rate:</strong></td><td>$65/hr beyond 8 hrs/day or 40 hrs/week</td></tr>
      <tr><td><strong>Late return:</strong></td><td>Automatically billed at current rates</td></tr>
    </table>
    <p><strong>Renter Initials:</strong> <span class="filled">✓ Acknowledged</span></p>
  </div>

  <div class="section">
    <div class="section-title">9-13) Additional Terms</div>
    <ul>
      <li><strong>Telematics:</strong> GPS/engine-hour tracking for diagnostics and recovery</li>
      <li><strong>Site Access:</strong> Renter provides safe, level access for delivery/pickup</li>
      <li><strong>Return Condition:</strong> Park level, bucket down, clean, all attachments returned</li>
      <li><strong>Remedies:</strong> Owner may repossess immediately upon breach</li>
      <li><strong>Governing Law:</strong> Province of New Brunswick, Canada</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">14) Acceptance & Authority to Charge</div>
    <p><strong>By signing, Renter acknowledges and agrees to:</strong></p>
    <ol>
      <li>Equipment received in good condition</li>
      <li>This Rider forms part of the Rental Agreement</li>
      <li>Understanding of Insurance requirement ("No COI, No Release")</li>
      <li>Responsibility for damage, loss, theft, and downtime</li>
      <li>$${booking.securityDeposit || '500'} deposit is <strong>NOT a liability cap</strong></li>
      <li>Authorization to charge card on file for all amounts due</li>
    </ol>
  </div>

  <div class="signature-section">
    <h2 style="color: #4CAF50; margin: 0 0 20px 0;">ELECTRONICALLY SIGNED</h2>

    <table>
      <tr>
        <td><strong>Renter Name:</strong></td>
        <td><span class="filled">${customer.firstName} ${customer.lastName}</span></td>
      </tr>
      <tr>
        <td><strong>Date Signed:</strong></td>
        <td><span class="filled">${new Date(signature.date).toLocaleString()}</span></td>
      </tr>
      <tr>
        <td><strong>Phone:</strong></td>
        <td><span class="filled">${customer.phone || 'N/A'}</span></td>
      </tr>
      <tr>
        <td><strong>Company:</strong></td>
        <td><span class="filled">${customer.companyName || 'Individual'}</span></td>
      </tr>
    </table>

    <div style="margin: 20px 0;">
      <p><strong>Electronic Signature:</strong></p>
      <img src="${signature.signature}" alt="Customer Signature" class="sig-image" />
      <p style="font-size: 9pt; color: #666; font-style: italic;">
        This electronic signature has the same legal force as a handwritten signature.
        Signed via authenticated access to U-Dig It Rentals platform.
        <br/><strong style="color: #4CAF50;">✓ Legally Binding under PIPEDA & UECA (Canadian Law)</strong>
      </p>
    </div>

    <table style="margin-top: 20px; border-top: 2px solid #ccc; padding-top: 15px;">
      <tr>
        <td><strong>Owner:</strong></td>
        <td>U-Dig It Rentals Inc.</td>
      </tr>
      <tr>
        <td><strong>Date:</strong></td>
        <td>${new Date(contract.createdAt).toLocaleDateString()}</td>
      </tr>
      <tr>
        <td><strong>Representative:</strong></td>
        <td>U-Dig It Rentals Team</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 15px; text-align: center; font-size: 9pt; color: #666;">
    <p><strong>Contract ID:</strong> ${contract.id} | <strong>Booking #:</strong> ${booking.bookingNumber}</p>
    <p>Generated: ${new Date().toLocaleString()} | Governed by laws of New Brunswick, Canada</p>
    <p style="margin-top: 10px;"><strong>This is a legally binding contract. Keep a copy for your records.</strong></p>
  </div>
</body>
</html>`;
}














































