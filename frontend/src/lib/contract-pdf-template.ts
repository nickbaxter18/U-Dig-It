/**
 * Signed Contract PDF HTML Template Generator
 * Creates professional HTML for Puppeteer PDF generation
 * Includes Master Agreement + Equipment Rider with signature
 */

interface ContractData {
  // Contract Info
  contractNumber: string;
  bookingNumber: string;
  createdAt: string;
  signedAt: string;

  // Customer Info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;

  // Equipment Info
  equipmentModel: string;
  equipmentSerial: string;
  equipmentHours: number;
  attachments: string[];
  equipmentWeight?: string;
  equipmentCapacity?: string;

  // Rental Details
  startDate: string;
  endDate: string;
  rentalDays: number;
  deliveryAddress: string;
  deliveryTime?: string;
  specialInstructions?: string;

  // Financial
  dailyRate: number;
  totalAmount: number;
  securityDeposit: number;
  deliveryFee: number;

  // Insurance (if uploaded)
  insuranceCompany?: string;
  insurancePolicyNumber?: string;
  insuranceCoverage?: string;

  // Timeline
  bookingCreatedAt?: string;
  bookingConfirmedAt?: string;

  // Signature
  signatureImage: string;
  signerTypedName: string;  // Name typed/entered during signing
  signedDate: string;
  signedTime: string;
}

export function generateSignedContractHTML(data: ContractData): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signed Rental Agreement - ${data.bookingNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: letter;
      margin: 0.75in;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-break {
      page-break-after: always;
      page-break-inside: avoid;
    }

    /* Prevent awkward breaks */
    .section {
      page-break-inside: avoid;
    }

    table {
      page-break-inside: avoid;
    }

    .warning-box, .requirement-box {
      page-break-inside: avoid;
    }

    h1, h2, h3, h4, .title, .subtitle, .section-title {
      page-break-after: avoid;
      orphans: 3;
      widows: 3;
    }

    ul, ol {
      page-break-inside: avoid;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #E1BC56;
      padding-bottom: 20px;
      margin-bottom: 30px;
      page-break-after: avoid;
    }

    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }

    .company-info {
      font-size: 9pt;
      color: #666;
      line-height: 1.4;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 20px;
      background: #4CAF50;
      color: white;
      border-radius: 20px;
      font-weight: bold;
      margin: 15px 0;
      font-size: 11pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .title {
      font-size: 18pt;
      font-weight: bold;
      color: #1a1a1a;
      margin: 20px 0 10px 0;
      text-align: center;
    }

    .subtitle {
      font-size: 14pt;
      font-weight: 600;
      color: #A90F0F;
      text-align: center;
      margin-bottom: 20px;
    }

    .section {
      margin: 25px 0;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1a1a1a;
      background: #f5f5f5;
      padding: 8px 12px;
      border-left: 4px solid #E1BC56;
      margin-bottom: 12px;
      page-break-after: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .info-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 15px 0;
    }

    .info-item {
      flex: 1 1 calc(50% - 6px);
      min-width: 200px;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;
      border-left: 2px solid #E1BC56;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .info-label {
      font-weight: 600;
      color: #555;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 4px;
    }

    .info-value {
      color: #1a1a1a;
      font-size: 11pt;
    }

    .warning-box {
      background: #FFF3CD;
      border: 2px solid #FFC107;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .warning-title {
      font-weight: bold;
      color: #856404;
      margin-bottom: 8px;
      font-size: 11pt;
      page-break-after: avoid;
    }

    .requirement-box {
      background: #E8F5E9;
      border: 2px solid #4CAF50;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .terms-list {
      margin: 12px 0 12px 25px;
    }

    .terms-list li {
      margin: 8px 0;
      line-height: 1.5;
    }

    .signature-section {
      margin-top: 40px;
      padding: 20px;
      background: #f9f9f9;
      border: 2px solid #E1BC56;
      border-radius: 8px;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .signature-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-top: 15px;
    }

    .signature-grid .signature-field {
      flex: 1 1 calc(50% - 10px);
      min-width: 200px;
    }

    .signature-field {
      margin-bottom: 20px;
    }

    .signature-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: block;
    }

    .signature-line {
      border-bottom: 1px solid #333;
      min-height: 50px;
      padding: 5px 0;
      display: flex;
      align-items: flex-end;
    }

    .signature-image {
      max-width: 200px;
      max-height: 60px;
      object-fit: contain;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 8pt;
    }

    .page-number {
      text-align: center;
      font-size: 8pt;
      color: #999;
      margin-top: 30px;
    }

    .bold {
      font-weight: 600;
    }

    .italic {
      font-style: italic;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    th, td {
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
      page-break-inside: avoid;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
      font-size: 9pt;
      page-break-after: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    td {
      font-size: 10pt;
    }

    tr {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <!-- Page 1: Cover & Contract Information -->
  <div class="header">
    <div class="logo">U-DIG IT RENTALS INC.</div>
    <div class="company-info">
      Professional Equipment Rental Services<br>
      Saint John, New Brunswick, Canada<br>
      Phone: (506) 643-1575 | Email: info@udigit.ca<br>
      Business License: NB-2024-RENTAL-001
    </div>
    <div class="status-badge">✓ SIGNED & LEGALLY BINDING</div>
  </div>

  <div class="title">EQUIPMENT RENTAL AGREEMENT</div>
  <div class="subtitle">Master Agreement + Equipment-Specific Rider</div>

  <div class="section">
    <div class="section-title">Contract Information</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Contract Number</span>
        <span class="info-value">${data.contractNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Booking Number</span>
        <span class="info-value">${data.bookingNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contract Date</span>
        <span class="info-value">${new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Signed Date</span>
        <span class="info-value">${data.signedDate} at ${data.signedTime}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Name</span>
        <span class="info-value">${data.customerName}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email</span>
        <span class="info-value">${data.customerEmail}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Phone</span>
        <span class="info-value">${data.customerPhone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Company</span>
        <span class="info-value">${data.customerCompany || 'Individual'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Equipment Details</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Equipment</span>
        <span class="info-value">${data.equipmentModel}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Serial Number</span>
        <span class="info-value">${data.equipmentSerial}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Engine Hours at Release</span>
        <span class="info-value">${data.equipmentHours} hours</span>
      </div>
      <div class="info-item">
        <span class="info-label">Attachments</span>
        <span class="info-value">${data.attachments.join(', ')}</span>
      </div>
      ${
        data.equipmentWeight
          ? `
      <div class="info-item">
        <span class="info-label">Operating Weight</span>
        <span class="info-value">${data.equipmentWeight}</span>
      </div>
      `
          : ''
      }
      ${
        data.equipmentCapacity
          ? `
      <div class="info-item">
        <span class="info-label">Bucket Capacity</span>
        <span class="info-value">${data.equipmentCapacity}</span>
      </div>
      `
          : ''
      }
    </div>
  </div>

  <div class="section">
    <div class="section-title">Rental Period & Pricing</div>
    <table>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount</th>
      </tr>
      <tr>
        <td>Rental Period: ${data.startDate} to ${data.endDate} (${data.rentalDays} day${data.rentalDays > 1 ? 's' : ''})</td>
        <td style="text-align: right;">$${(data.dailyRate * data.rentalDays).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Daily Rate</td>
        <td style="text-align: right;">$${data.dailyRate.toFixed(2)}/day</td>
      </tr>
      <tr>
        <td>Delivery & Setup Fee</td>
        <td style="text-align: right;">$${data.deliveryFee.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Delivery Address</td>
        <td style="text-align: right;">${data.deliveryAddress}</td>
      </tr>
      ${
        data.deliveryTime
          ? `
      <tr>
        <td>Preferred Delivery Time</td>
        <td style="text-align: right;">${data.deliveryTime}</td>
      </tr>
      `
          : ''
      }
      <tr style="background: #f5f5f5; font-weight: bold;">
        <td>Total Amount</td>
        <td style="text-align: right;">$${data.totalAmount.toFixed(2)} CAD</td>
      </tr>
      <tr>
        <td>Security Deposit (refundable)</td>
        <td style="text-align: right;">$${data.securityDeposit.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  ${
    data.specialInstructions
      ? `
  <div class="section">
    <div class="section-title">Special Instructions</div>
    <div class="requirement-box" style="background: #fff9e6; border-left: 4px solid #E1BC56;">
      <p style="margin: 0; white-space: pre-wrap;">${data.specialInstructions}</p>
    </div>
  </div>
  `
      : ''
  }

  ${
    data.insuranceCompany
      ? `
  <div class="section">
    <div class="section-title">Insurance Information</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Insurance Company</span>
        <span class="info-value">${data.insuranceCompany}</span>
      </div>
      ${
        data.insurancePolicyNumber
          ? `
      <div class="info-item">
        <span class="info-label">Policy Number</span>
        <span class="info-value">${data.insurancePolicyNumber}</span>
      </div>
      `
          : ''
      }
      ${
        data.insuranceCoverage
          ? `
      <div class="info-item">
        <span class="info-label">Coverage Amount</span>
        <span class="info-value">${data.insuranceCoverage}</span>
      </div>
      `
          : ''
      }
    </div>
  </div>
  `
      : ''
  }

  <div class="page-number">Page 1 of 4</div>
  <div class="page-break"></div>

  <!-- Page 2: Terms & Conditions -->
  <div class="title">MASTER RENTAL AGREEMENT</div>
  <div class="subtitle">Terms & Conditions</div>

  <div class="requirement-box">
    <div class="warning-title">🛡️ INSURANCE REQUIREMENT - "NO COI, NO RELEASE"</div>
    <p><strong>MANDATORY:</strong> Valid Certificate of Insurance required before equipment release. No exceptions.</p>
    <ul class="terms-list">
      <li><strong>Commercial General Liability:</strong> Minimum $2,000,000 CAD</li>
      <li><strong>Equipment Coverage:</strong> Full replacement value of rented equipment</li>
      <li><strong>Auto Liability:</strong> Minimum $1,000,000 CAD (if transporting)</li>
      <li><strong>Additional Insured:</strong> U-Dig It Rentals Inc. must be named</li>
      <li><strong>Loss Payee:</strong> U-Dig It Rentals Inc. must be named</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">1. RENTAL TERMS</div>
    <ul class="terms-list">
      <li><strong>Rental Period:</strong> Equipment must be returned by ${data.endDate} at 6:00 PM Atlantic Time.</li>
      <li><strong>Late Returns:</strong> Late returns incur fees up to $700/day plus additional daily rental rate.</li>
      <li><strong>Hours of Operation:</strong> Pickup/return available Monday-Saturday 7:00 AM - 6:00 PM.</li>
      <li><strong>Delivery:</strong> Equipment will be delivered to ${data.deliveryAddress}.</li>
      <li><strong>Fuel Policy:</strong> Equipment delivered with full fuel. Return with full fuel or pay $150 refueling fee.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">2. CUSTOMER RESPONSIBILITIES</div>
    <ul class="terms-list">
      <li>Renter is responsible for ALL damage, loss, theft, or destruction of equipment during rental period.</li>
      <li>Renter must maintain required insurance coverage for entire rental duration.</li>
      <li>Renter must operate equipment in accordance with manufacturer specifications and safety guidelines.</li>
      <li>Renter must perform daily inspections and report any issues immediately.</li>
      <li>Renter is responsible for securing equipment when not in use.</li>
      <li>Renter must not modify, alter, or remove any equipment components without written permission.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">3. PROHIBITED USES</div>
    <ul class="terms-list">
      <li>❌ Operating equipment under the influence of drugs or alcohol</li>
      <li>❌ Allowing untrained or unauthorized operators to use equipment</li>
      <li>❌ Exceeding manufacturer's specified load or operating limits</li>
      <li>❌ Operating on slopes exceeding 25° (see equipment rider for details)</li>
      <li>❌ Lifting people with equipment or attachments</li>
      <li>❌ Using equipment for demolition work without prior authorization</li>
      <li>❌ Subleasing, lending, or transferring equipment to third parties</li>
    </ul>
  </div>

  <div class="page-number">Page 2 of 4</div>
  <div class="page-break"></div>

  <!-- Page 3: Financial Terms & Equipment Rider -->
  <div class="title">FINANCIAL TERMS & LIABILITY</div>

  <div class="section">
    <div class="section-title">4. PAYMENT TERMS</div>
    <ul class="terms-list">
      <li><strong>Security Deposit:</strong> $${data.securityDeposit.toFixed(2)} CAD due before equipment release.</li>
      <li><strong>Rental Payment:</strong> Full payment of $${data.totalAmount.toFixed(2)} CAD due within 7 days of rental start.</li>
      <li><strong>Late Payment:</strong> 2% monthly interest on overdue amounts (26.82% APR).</li>
      <li><strong>Damage Assessment:</strong> Repair costs deducted from security deposit. Additional charges billed separately.</li>
      <li><strong>Collection Costs:</strong> Renter pays all collection costs including legal fees if account sent to collections.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">5. DAMAGE & LOSS LIABILITY</div>
    <ul class="terms-list">
      <li><strong>Full Replacement Cost:</strong> Renter liable for full replacement value if equipment is stolen, destroyed, or deemed total loss.</li>
      <li><strong>Repair Costs:</strong> Renter pays actual repair costs for any damage beyond normal wear and tear.</li>
      <li><strong>Downtime:</strong> Renter liable for lost revenue during repair period (daily rental rate × repair days).</li>
      <li><strong>No Waiver:</strong> Equipment insurance does NOT waive renter liability - renter remains financially responsible.</li>
    </ul>
  </div>

  <div class="warning-box">
    <div class="warning-title">⚠️ CRITICAL SAFETY REQUIREMENTS</div>
    <ul class="terms-list">
      <li><strong>PPE Required:</strong> CSA-approved steel-toe boots, high-visibility vest, eye protection, ear protection</li>
      <li><strong>Operator Age:</strong> All operators must be 21 years or older</li>
      <li><strong>Training:</strong> Operators must be trained and competent in equipment operation</li>
      <li><strong>Utility Locates:</strong> Renter MUST call for utility locates before digging (call 811 or local utility locate service)</li>
      <li><strong>Underground Damage:</strong> Renter 100% liable for all damage to underground utilities, infrastructure, or installations</li>
    </ul>
  </div>

  <div class="title">SVL75-3 EQUIPMENT-SPECIFIC RIDER</div>
  <div class="subtitle">Kubota SVL75-3 Compact Track Loader</div>

  <div class="section">
    <div class="section-title">6. EQUIPMENT SPECIFICATIONS & LIMITS</div>
    <table>
      <tr>
        <th>Specification</th>
        <th>Value/Limit</th>
      </tr>
      <tr>
        <td>Operating Weight</td>
        <td>9,420 lbs (4,273 kg)</td>
      </tr>
      <tr>
        <td>Engine Power</td>
        <td>74.3 HP @ 2,700 RPM</td>
      </tr>
      <tr>
        <td>Maximum Operating Slope</td>
        <td><strong>25° MAXIMUM</strong> (straight up/down only, NO side-hill)</td>
      </tr>
      <tr>
        <td>Rated Operating Capacity</td>
        <td>3,157 lbs (1,432 kg)</td>
      </tr>
      <tr>
        <td>Maximum Bucket Capacity</td>
        <td>Do not exceed rated capacity</td>
      </tr>
      <tr>
        <td>Travel Speed</td>
        <td>High: 7.2 mph | Low: 4.5 mph</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">7. OPERATING REQUIREMENTS</div>
    <ul class="terms-list">
      <li><strong>Daily Inspections:</strong> Perform visual inspection before each use (tracks, hydraulics, fluids, guards).</li>
      <li><strong>Hydraulic Attachments:</strong> Verify proper connection and function before use.</li>
      <li><strong>Tracks:</strong> Inspect for damage, wear, proper tension. Report any issues immediately.</li>
      <li><strong>Slope Operations:</strong> Maximum 25° slope, straight up/down only. NO side-hill operation.</li>
      <li><strong>Load Management:</strong> Never exceed rated operating capacity. Distribute loads evenly.</li>
      <li><strong>Weather Conditions:</strong> Do not operate in severe weather, lightning, or when visibility is impaired.</li>
    </ul>
  </div>

  <div class="page-number">Page 3 of 4</div>
  <div class="page-break"></div>

  <!-- Page 4: Additional Terms & Signatures -->
  <div class="title">ADDITIONAL TERMS & SIGNATURES</div>

  <div class="section">
    <div class="section-title">8. MAINTENANCE & CARE</div>
    <ul class="terms-list">
      <li><strong>Included:</strong> All routine maintenance, fuel, and minor repairs covered by U-Dig It Rentals.</li>
      <li><strong>Renter's Duty:</strong> Report any issues, leaks, or unusual operation immediately.</li>
      <li><strong>Cleaning:</strong> Return equipment reasonably clean. Excessive cleaning fee: $150.</li>
      <li><strong>Prohibited Modifications:</strong> No alterations or modifications without written consent.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">9. LEGAL & JURISDICTION</div>
    <ul class="terms-list">
      <li><strong>Governing Law:</strong> This agreement is governed by the laws of the Province of New Brunswick, Canada.</li>
      <li><strong>Electronic Signatures:</strong> Electronic signatures are legally binding under the Uniform Electronic Commerce Act (UECA).</li>
      <li><strong>Jurisdiction:</strong> Disputes subject to exclusive jurisdiction of courts in Saint John, New Brunswick.</li>
      <li><strong>Severability:</strong> If any provision is unenforceable, remaining provisions remain in full effect.</li>
      <li><strong>Entire Agreement:</strong> This document constitutes the entire agreement between parties.</li>
    </ul>
  </div>

  <div class="warning-box">
    <div class="warning-title">📜 LEGAL ACKNOWLEDGMENT</div>
    <p class="bold">By signing below, Renter acknowledges and agrees to:</p>
    <ul class="terms-list">
      <li>Having read, understood, and agreed to ALL terms of this agreement</li>
      <li>Electronic signature has same legal effect as handwritten signature under UECA and PIPEDA</li>
      <li>Full financial responsibility for all damage, loss, and theft of equipment</li>
      <li>Insurance requirement ("No COI, No Release") and all related obligations</li>
      <li>Equipment-specific rider terms including slope limits, PPE, and safety requirements</li>
      <li>Late return fees, payment terms, and collection procedures</li>
    </ul>
  </div>

  <div class="signature-section">
    <div class="section-title" style="margin-bottom: 20px;">SIGNATURES</div>

    <div class="signature-field">
      <span class="signature-label">Typed Full Legal Name</span>
      <div class="signature-line">
        <span class="bold" style="font-size: 14pt; color: #1a1a1a;">${data.signerTypedName}</span>
      </div>
      <p style="font-size: 8pt; color: #666; margin-top: 4px; font-style: italic;">
        As typed by signer during electronic signature process
      </p>
    </div>

    <div class="signature-field">
      <span class="signature-label">Electronic Signature</span>
      <div class="signature-line">
        <img src="${data.signatureImage}" alt="Customer Signature" class="signature-image" />
      </div>
    </div>

    <div class="signature-grid">
      <div class="signature-field">
        <span class="signature-label">Signature Date & Time</span>
        <div class="signature-line">
          <span>${data.signedDate} at ${data.signedTime}</span>
        </div>
      </div>

      <div class="signature-field">
        <span class="signature-label">Account Holder</span>
        <div class="signature-line">
          <span>${data.customerName}</span>
        </div>
      </div>
    </div>

    <div class="signature-grid">
      <div class="signature-field">
        <span class="signature-label">Phone</span>
        <div class="signature-line">
          <span>${data.customerPhone}</span>
        </div>
      </div>

      <div class="signature-field">
        <span class="signature-label">Email</span>
        <div class="signature-line">
          <span>${data.customerEmail}</span>
        </div>
      </div>
    </div>

    <div class="signature-field" style="margin-top: 40px;">
      <span class="signature-label">U-Dig It Rentals Inc. (Owner)</span>
      <div class="signature-line">
        <span class="bold">U-Dig It Rentals Team</span>
      </div>
    </div>

    <div class="signature-grid">
      <div class="signature-field">
        <span class="signature-label">Owner Representative</span>
        <div class="signature-line">
          <span>See Above</span>
        </div>
      </div>

      <div class="signature-field">
        <span class="signature-label">Date</span>
        <div class="signature-line">
          <span>${today}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    ${
      data.bookingCreatedAt || data.bookingConfirmedAt
        ? `
    <p class="bold">📅 BOOKING TIMELINE</p>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; font-size: 9pt;">
      ${
        data.bookingCreatedAt
          ? `
      <div style="flex: 1 1 45%;">
        <strong>Booking Created:</strong> ${data.bookingCreatedAt}
      </div>
      `
          : ''
      }
      ${
        data.bookingConfirmedAt
          ? `
      <div style="flex: 1 1 45%;">
        <strong>Booking Confirmed:</strong> ${data.bookingConfirmedAt}
      </div>
      `
          : ''
      }
      <div style="flex: 1 1 45%;">
        <strong>Contract Signed:</strong> ${data.signedDate} at ${data.signedTime}
      </div>
    </div>
    `
        : ''
    }

    <p class="bold" style="margin-top: 15px;">🔒 SECURITY & PRIVACY NOTICE</p>
    <p>This document and all associated data are encrypted using 256-bit SSL encryption and stored securely in compliance with PIPEDA (Personal Information Protection and Electronic Documents Act).</p>
    <p style="margin-top: 10px;">Electronic signatures are legally binding under the Uniform Electronic Commerce Act (UECA) and have the same legal effect as handwritten signatures in New Brunswick, Canada.</p>
    <p style="margin-top: 10px;">Document ID: ${data.contractNumber} | Signed: ${data.signedDate} at ${data.signedTime} Atlantic Time</p>
  </div>

  <div class="page-number">Page 4 of 4</div>
</body>
</html>`;
}
