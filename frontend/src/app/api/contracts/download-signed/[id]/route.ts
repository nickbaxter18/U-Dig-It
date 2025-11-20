/**
 * Download Signed Contract API Route
 * Generates signed contract HTML on-the-fly from database
 */
import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id: contractId } = await params;

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get contract with all details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        booking:bookingId (
          *,
          equipment:equipmentId (*),
          customer:customerId (*)
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return new NextResponse('Contract not found', { status: 404 });
    }

    // Verify ownership
    const isAdmin =
      user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin';
    if (contract.booking.customerId !== user.id && !isAdmin) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // Check if signed
    if (contract.status !== 'signed' || !contract.signatures?.customer) {
      return new NextResponse('Contract not signed', { status: 400 });
    }

    // Generate HTML
    const html = generateSignedContractHTML(contract);

    // Return as downloadable file
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="Contract-${contract.booking.bookingNumber}-Signed.html"`,
      },
    });
  } catch (error: unknown) {
    logger.error(
      'Download error',
      {
        component: 'api-[id]',
        action: 'error',
        metadata: { error: error instanceof Error ? error.message : String(error) },
      },
      error instanceof Error ? error : undefined
    );
    return new NextResponse('Failed to generate contract', { status: 500 });
  }
}

function generateSignedContractHTML(contract: unknown): string {
  const booking = contract.booking;
  const customer = booking.customer;
  const equipment = booking.equipment;
  const signature = contract.signatures?.customer;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Signed Rental Agreement - ${booking.bookingNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
    .header { text-align: center; border-bottom: 3px solid #E1BC56; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1a1a1a; margin: 0; }
    .status-badge { display: inline-block; padding: 8px 16px; background: #4CAF50; color: white; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .section { margin: 30px 0; }
    .section h2 { color: #A90F0F; border-bottom: 2px solid #E1BC56; padding-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
    .info-item strong { color: #333; display: block; margin-bottom: 5px; }
    .signature-section { margin-top: 40px; padding: 20px; background: #f9f9f9; border: 2px solid #E1BC56; border-radius: 8px; }
    .signature-image { max-width: 400px; border: 1px solid #ccc; padding: 10px; background: white; margin: 10px 0; }
    .terms { background: #fff9e6; padding: 20px; border-left: 4px solid #E1BC56; margin: 20px 0; }
    .terms ul { margin: 10px 0; padding-left: 20px; }
    .terms li { margin: 8px 0; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>EQUIPMENT RENTAL AGREEMENT</h1>
    <p><strong>U-Dig It Rentals Inc.</strong></p>
    <p>Saint John, New Brunswick, Canada</p>
    <p>Phone: (506) 643-1575 | Email: info@udigit.ca</p>
    <div class="status-badge">✓ SIGNED & EXECUTED</div>
  </div>

  <div class="section">
    <h2>Contract Information</h2>
    <div class="info-grid">
      <div class="info-item"><strong>Booking Number:</strong> ${booking.bookingNumber}</div>
      <div class="info-item"><strong>Contract Date:</strong> ${new Date(contract.createdAt).toLocaleDateString()}</div>
      <div class="info-item"><strong>Signed Date:</strong> ${new Date(contract.signedAt).toLocaleString()}</div>
      <div class="info-item"><strong>Contract ID:</strong> ${contract.id}</div>
    </div>
  </div>

  <div class="section">
    <h2>Equipment Details</h2>
    <div class="info-grid">
      <div class="info-item"><strong>Equipment:</strong> ${equipment.make} ${equipment.model}</div>
      <div class="info-item"><strong>Unit ID:</strong> ${equipment.unitId}</div>
      <div class="info-item"><strong>Serial Number:</strong> ${equipment.serialNumber || 'N/A'}</div>
      <div class="info-item"><strong>Replacement Value:</strong> $120,000 CAD</div>
    </div>
  </div>

  <div class="section">
    <h2>Rental Period</h2>
    <div class="info-grid">
      <div class="info-item"><strong>Start Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</div>
      <div class="info-item"><strong>End Date:</strong> ${new Date(booking.endDate).toLocaleDateString()}</div>
      <div class="info-item"><strong>Duration:</strong> ${Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</div>
      <div class="info-item"><strong>Delivery:</strong> ${booking.deliveryAddress || 'Pickup'}</div>
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
    <h2>Financial Terms</h2>
    <div class="info-grid">
      <div class="info-item"><strong>Total Amount:</strong> $${booking.totalAmount} CAD</div>
      <div class="info-item"><strong>Security Deposit:</strong> $${booking.securityDeposit || '500.00'}</div>
      <div class="info-item"><strong>Daily Rate:</strong> $${booking.dailyRate?.toFixed(2) || '0.00'}</div>
      <div class="info-item"><strong>Payment Status:</strong> ${booking.paymentStatus || 'Pending'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Equipment-Specific Rider Acknowledgment</h2>
    <div class="terms">
      <p><strong>The customer acknowledges receipt and understanding of the ${equipment.model} Equipment Rider including:</strong></p>
      <ul>
        <li><strong>Insurance Requirements:</strong> CGL ≥ $2,000,000, Equipment Coverage (full replacement value), Auto Liability ≥ $1,000,000</li>
        <li><strong>"No COI, No Release" Policy:</strong> Equipment will not be released without proof of insurance</li>
        <li><strong>Operating Limits:</strong> Maximum slope 25° (straight up/down only), no side-hilling</li>
        <li><strong>Safety Requirements:</strong> PPE required (CSA boots, hi-viz, eye/ear protection), utility locates before digging, operators 21+ only</li>
        <li><strong>Prohibited Uses:</strong> No riders, no people lifting, no demolition beyond rated capability, no hazmat operations</li>
        <li><strong>Financial Responsibility:</strong> $500 security deposit (not a liability cap), fuel charge $100 if not full, cleaning charge $100, overage rate $65/hr</li>
        <li><strong>Damage Responsibility:</strong> Customer responsible for all damage, loss, theft, vandalism, contamination, and recovery costs</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>Terms and Conditions</h2>
    <div class="terms">
      <p><strong>By signing this agreement, the customer agrees to:</strong></p>
      <ul>
        <li>All terms and conditions of this rental agreement</li>
        <li>Responsibility for damage, loss, and theft of equipment</li>
        <li>Insurance coverage requirements ("No COI, No Release")</li>
        <li>Operating limits and safety requirements</li>
        <li>Financial obligations including security deposit, overage charges, fuel, and cleaning</li>
        <li>Equipment return conditions (clean, fueled, all attachments returned)</li>
        <li>Governing law: Province of New Brunswick, Canada</li>
      </ul>
    </div>
  </div>

  <div class="signature-section">
    <h2>Customer Signature</h2>
    <p><strong>Signed By:</strong> ${signature.name}</p>
    <p><strong>Date:</strong> ${new Date(signature.date).toLocaleString()}</p>
    <p><strong>Electronic Signature:</strong></p>
    <img src="${signature.signature}" alt="Customer Signature" class="signature-image" />
    <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
      <strong>Legal Notice:</strong> This electronic signature is legally binding under the
      Personal Information Protection and Electronic Documents Act (PIPEDA) and the
      Uniform Electronic Commerce Act (UECA). The signer's identity was verified through
      authenticated access to the U-Dig It Rentals platform.
    </p>
  </div>

  <div class="footer">
    <p><strong>U-Dig It Rentals Inc.</strong></p>
    <p>Saint John, New Brunswick, Canada</p>
    <p>Phone: (506) 643-1575 | Email: info@udigit.ca</p>
    <p style="margin-top: 10px; font-size: 0.85em;">This is a legally binding contract. Keep a copy for your records.</p>
    <p style="margin-top: 5px; font-size: 0.85em;">Document ID: ${contract.id} | Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}
