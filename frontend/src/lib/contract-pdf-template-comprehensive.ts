/**
 * Comprehensive Signed Contract PDF HTML Template Generator
 * Creates professional multi-page PDF with complete Equipment-Specific Rider
 * Includes Master Agreement + Full SVL75-3 Rider with all legal terms
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
  customerLicense?: string;

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
  signerInitials: string;   // Initials for all critical sections
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
  <title>Equipment Rental Agreement - ${data.bookingNumber}</title>
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
      line-height: 1.5;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      position: relative;
    }

    /* Watermark on every page */
    body::before {
      content: '';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      height: 500px;
      background-image: url('/images/udigit-logo.png');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.04;
      z-index: -1;
      pointer-events: none;
    }

    .page-break {
      page-break-after: always;
      page-break-inside: avoid;
    }

    /* Prevent awkward breaks */
    .section {
      margin: 20px 0;
      page-break-inside: avoid;
    }

    table {
      page-break-inside: avoid;
    }

    .warning-box, .requirement-box, .initials-box {
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
      margin-bottom: 8px;
      letter-spacing: -0.5px;
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
      font-size: 16pt;
      font-weight: bold;
      color: #1a1a1a;
      margin: 20px 0 10px 0;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .subtitle {
      font-size: 11pt;
      font-weight: 600;
      color: #A90F0F;
      text-align: center;
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1a1a1a;
      background: #f5f5f5;
      padding: 8px 12px;
      border-left: 4px solid #E1BC56;
      margin-bottom: 10px;
      page-break-after: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .info-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 12px 0;
    }

    .info-item {
      flex: 1 1 calc(50% - 5px);
      min-width: 200px;
      padding: 8px;
      background: #f9f9f9;
      border-radius: 3px;
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
      letter-spacing: 0.3px;
      display: block;
      margin-bottom: 3px;
    }

    .info-value {
      color: #1a1a1a;
      font-size: 10pt;
    }

    .warning-box {
      background: #FFF3CD;
      border: 2px solid #FFC107;
      border-radius: 5px;
      padding: 12px;
      margin: 12px 0;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .warning-title {
      font-weight: bold;
      color: #856404;
      margin-bottom: 6px;
      font-size: 10pt;
      page-break-after: avoid;
    }

    .requirement-box {
      background: #E8F5E9;
      border: 2px solid #4CAF50;
      border-radius: 5px;
      padding: 12px;
      margin: 12px 0;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .terms-list {
      margin: 8px 0 8px 20px;
      padding-left: 10px;
    }

    .terms-list li {
      margin: 6px 0;
      line-height: 1.4;
    }

    .signature-section {
      margin-top: 30px;
      padding: 15px;
      background: #f9f9f9;
      border: 2px solid #E1BC56;
      border-radius: 6px;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .signature-field {
      margin-bottom: 15px;
    }

    .signature-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;
      display: block;
      font-weight: 600;
    }

    .signature-line {
      border-bottom: 1px solid #333;
      min-height: 40px;
      padding: 5px 0;
      display: flex;
      align-items: flex-end;
    }

    .signature-image {
      max-width: 200px;
      max-height: 60px;
      object-fit: contain;
    }

    .initials-box {
      background: #fff9e6;
      border: 2px solid #E1BC56;
      border-radius: 5px;
      padding: 10px;
      margin: 10px 0;
      display: flex;
      align-items: center;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .initials-label {
      font-weight: 600;
      color: #1a1a1a;
      font-size: 9pt;
      flex: 1;
    }

    .initials-field {
      width: 80px;
      height: 30px;
      border: 1px solid #666;
      border-radius: 3px;
      background: white;
      display: inline-block;
      margin-left: 10px;
    }

    .fill-in-field {
      display: inline-block;
      border-bottom: 1px solid #333;
      min-width: 150px;
      padding: 0 5px 2px 5px;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 8pt;
    }

    .page-number {
      text-align: center;
      font-size: 8pt;
      color: #999;
      margin-top: 20px;
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
      margin: 12px 0;
      page-break-inside: avoid;
    }

    th, td {
      padding: 8px;
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
      font-size: 9pt;
    }

    tr {
      page-break-inside: avoid;
    }

    .checkbox {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1px solid #333;
      margin-right: 5px;
      vertical-align: middle;
    }

    .underline {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <!-- ===== PAGE 1: COVER & CONTRACT INFORMATION ===== -->
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

  <div class="title">Equipment Rental Agreement</div>
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
      ${data.customerLicense ? `
      <div class="info-item">
        <span class="info-label">Driver's License</span>
        <span class="info-value">${data.customerLicense}</span>
      </div>
      ` : ''}
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
        <span class="info-label">Serial/Unit ID</span>
        <span class="info-value">${data.equipmentSerial}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Engine Hours at Release</span>
        <span class="info-value">${data.equipmentHours} hours</span>
      </div>
      <div class="info-item">
        <span class="info-label">Replacement Value</span>
        <span class="info-value">$120,000 CAD</span>
      </div>
      <div class="info-item">
        <span class="info-label">Included Attachments</span>
        <span class="info-value">${data.attachments.join(', ')}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Rental Period & Pricing</div>
    <table>
      <tr>
        <th style="width: 60%;">Description</th>
        <th style="text-align: right;">Amount</th>
      </tr>
      <tr>
        <td><strong>Rental Period:</strong> ${data.startDate} to ${data.endDate} (${data.rentalDays} day${data.rentalDays > 1 ? 's' : ''})</td>
        <td style="text-align: right;">$${(data.dailyRate * data.rentalDays).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Daily Rate</td>
        <td style="text-align: right;">$${data.dailyRate.toFixed(2)}/day</td>
      </tr>
      <tr>
        <td>Included Hour Allowance</td>
        <td style="text-align: right;">8 engine-hours/day (40/week)</td>
      </tr>
      <tr>
        <td>Excess Hour Rate</td>
        <td style="text-align: right;">$65/hour</td>
      </tr>
      <tr>
        <td>Delivery & Setup Fee</td>
        <td style="text-align: right;">$${data.deliveryFee.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Delivery Address</td>
        <td style="text-align: right;">${data.deliveryAddress}</td>
      </tr>
      ${data.deliveryTime ? `
      <tr>
        <td>Preferred Delivery Time</td>
        <td style="text-align: right;">${data.deliveryTime}</td>
      </tr>
      ` : ''}
      <tr style="background: #f5f5f5; font-weight: bold;">
        <td><strong>Total Amount</strong></td>
        <td style="text-align: right;"><strong>$${data.totalAmount.toFixed(2)} CAD</strong></td>
      </tr>
      <tr>
        <td>Security Deposit (refundable)</td>
        <td style="text-align: right;">$${data.securityDeposit.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  ${data.specialInstructions ? `
  <div class="section">
    <div class="section-title">Special Instructions</div>
    <div class="requirement-box" style="background: #fff9e6; border-color: #E1BC56;">
      <p style="margin: 0; white-space: pre-wrap;">${data.specialInstructions}</p>
    </div>
  </div>
  ` : ''}

  <div class="page-number">Page 1 of 8</div>
  <div class="page-break"></div>

  <!-- ===== PAGE 2: EQUIPMENT-SPECIFIC RIDER INTRODUCTION ===== -->
  <div class="title">Equipment-Specific Rider — 2025 Kubota SVL75-3</div>
  <p style="text-align: center; margin-bottom: 20px; font-size: 9pt; color: #666;">
    This Rider is incorporated into and made part of the U-Dig It Rentals Inc. Rental Agreement.<br>
    If there is any conflict, the stricter term (greater safety/financial protection) applies unless otherwise agreed in writing by U-Dig It Rentals Inc. ("Owner").
  </p>

  <div class="section">
    <div class="section-title">1) Unit Details</div>
    <p><strong>Equipment:</strong> 2025 Kubota SVL75-3 (Compact Track Loader)</p>
    <p style="margin-top: 8px;"><strong>Serial/Unit ID:</strong> <span class="fill-in-field">${data.equipmentSerial}</span> <strong style="margin-left: 20px;">Hours at Release:</strong> <span class="fill-in-field">${data.equipmentHours} h</span></p>
    <p style="margin-top: 8px;"><strong>Replacement Value:</strong> $120,000 CAD (base unit w/ bucket; update if attachments are included)</p>

    <table style="margin-top: 12px;">
      <tr>
        <th>Specification</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Operating Weight</td>
        <td>9,190 lb (4,169 kg) open cab / 9,420 lb (4,273 kg) closed cab</td>
      </tr>
      <tr>
        <td>Length (no bucket)</td>
        <td>112 in (2,844 mm)</td>
      </tr>
      <tr>
        <td>Length (bucket on ground)</td>
        <td>142.1 in (3,609 mm)</td>
      </tr>
      <tr>
        <td>Height (top of cab)</td>
        <td>81.8 in (2,078 mm)</td>
      </tr>
      <tr>
        <td>Vehicle Width</td>
        <td>65.9 in (1,675 mm) standard / 69.1 in (1,755 mm) wide</td>
      </tr>
      <tr>
        <td>Width with Bucket</td>
        <td>68 in (1,727 mm)</td>
      </tr>
    </table>

    <p style="margin-top: 12px;"><strong>Included Attachments:</strong> <span class="fill-in-field">${data.attachments.join(', ')}</span></p>

    <table style="margin-top: 12px;">
      <tr>
        <th>Rental Period</th>
        <th>Details</th>
      </tr>
      <tr>
        <td><strong>Start Date & Time:</strong></td>
        <td>${data.startDate} ${data.deliveryTime ? `at ${data.deliveryTime}` : ''}</td>
      </tr>
      <tr>
        <td><strong>End Date & Time:</strong></td>
        <td>${data.endDate} by 6:00 PM Atlantic Time</td>
      </tr>
      <tr>
        <td><strong>Included Hour Allowance:</strong></td>
        <td>8 engine-hours/day, 40/week; excess billed at $65/hr</td>
      </tr>
      <tr>
        <td><strong>Delivery by Owner:</strong></td>
        <td>Yes (to ${data.deliveryAddress})</td>
      </tr>
      <tr>
        <td><strong>Float/Delivery Fee:</strong></td>
        <td>$${data.deliveryFee.toFixed(2)} each way (total $${(data.deliveryFee * 2).toFixed(2)})</td>
      </tr>
    </table>
  </div>

  <div class="page-number">Page 2 of 8</div>
  <div class="page-break"></div>

  <!-- ===== PAGE 3: INSURANCE & TRANSPORT ===== -->
  <div class="title">Insurance & Transport Requirements</div>

  <div class="section">
    <div class="section-title">2) Insurance (Required — "No COI, No Release")</div>
    <p class="bold" style="color: #A90F0F; margin-bottom: 8px;">Renter must maintain, at Renter's expense, and provide evidence (COI + endorsements) approved by Owner before release and continuous through the Rental Period:</p>

    <ul class="terms-list">
      <li><strong>CGL:</strong> ≥ $2,000,000 per occurrence, U-Dig It Rentals Inc. as Additional Insured, primary & non-contributory, waiver of subrogation.</li>
      <li><strong>Rented/Leased Equipment/Property:</strong> limit ≥ full replacement value above; U-Dig It Rentals Inc. as Loss Payee.</li>
      <li><strong>Automobile Liability:</strong> ≥ $1,000,000 if Renter transports on public roads.</li>
      <li><strong>Notice of Cancellation:</strong> insurer notice to Owner where available (e.g., 10–30 days).</li>
    </ul>

    <div class="warning-box">
      <p class="warning-title">⚠️ CRITICAL NOTICE</p>
      <p><strong>Failure to maintain coverage is a material breach; Owner may refuse release or repossess at Renter's expense.</strong></p>
      <p style="margin-top: 8px;">Need coverage? Getting Insurance: <strong>https://udigit.ca/getting-insurance/</strong></p>
    </div>

    ${data.insuranceCompany ? `
    <div class="requirement-box">
      <p class="bold" style="margin-bottom: 6px;">✓ Insurance Provided:</p>
      <p><strong>Company:</strong> ${data.insuranceCompany}</p>
      ${data.insurancePolicyNumber ? `<p><strong>Policy Number:</strong> ${data.insurancePolicyNumber}</p>` : ''}
      ${data.insuranceCoverage ? `<p><strong>Coverage:</strong> ${data.insuranceCoverage}</p>` : ''}
    </div>
    ` : ''}

    <div class="initials-box">
      <span class="initials-label">Renter Initials (Section 2 — Insurance):</span>
      <span class="initials-field" style="display: flex; align-items: center; justify-content: center; font-size: 14pt; font-weight: bold; color: #1a1a1a;">${data.signerInitials}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3) Transport & Tie-Down</div>
    <ul class="terms-list">
      <li><strong>Professional loading/unloading only;</strong> no one in cab during load/unload.</li>
      <li><strong>Trailer, hitch, tow vehicle, chains/binders & straps</strong> must be properly rated; minimum 4-point tie-down on the machine; secure attachments separately.</li>
      <li><strong>Verify overhead/bridge/width/weight limits;</strong> obtain permits where required.</li>
      <li><strong>No public-road operation</strong> of the machine unless legally permitted.</li>
    </ul>

    <div class="initials-box">
      <span class="initials-label">Renter Initials (Section 3 — Transport & Tie-Down):</span>
      <span class="initials-field" style="display: flex; align-items: center; justify-content: center; font-size: 14pt; font-weight: bold; color: #1a1a1a;">${data.signerInitials}</span>
    </div>
  </div>

  <div class="page-number">Page 3 of 8</div>
  <div class="page-break"></div>

  <!-- ===== PAGE 4: OPERATING LIMITS & SAFETY ===== -->
  <div class="title">Operating Limits & Safety Requirements</div>

  <div class="section">
    <div class="section-title">4) Operating Limits & Safety</div>
    <ul class="terms-list">
      <li><strong>Max grade/slope:</strong> ≤ 25°. Travel straight up/down; <span class="underline">avoid side-hilling</span>.</li>
      <li><strong>No riders;</strong> never lift/carry people; use manufacturer arm support/lock for work under raised arms.</li>
      <li><strong>PPE:</strong> CSA boots, hi-viz vest, eye/ear protection; hard hat where overhead hazards exist.</li>
      <li><strong>Utility locates</strong> completed and on site before ground disturbance; maintain clearance from buried/overhead utilities.</li>
      <li><strong>Follow Operator's Manual,</strong> decals, and site rules; stop if unsafe and contact Owner.</li>
      <li><strong>No impairment</strong> (alcohol/cannabis/drugs); competent adult operators (21+) only.</li>
      <li><strong>No sub-rental or lending</strong> without Owner's written consent.</li>
    </ul>

    <div class="warning-box">
      <p class="warning-title">🛡️ CRITICAL SAFETY REQUIREMENTS</p>
      <ul class="terms-list" style="margin-top: 6px;">
        <li>CSA-approved steel-toe boots, high-visibility vest, eye protection, ear protection</li>
        <li>All operators must be 21 years or older</li>
        <li>Call for utility locates before digging (811 or local utility locate service)</li>
        <li><strong>Renter 100% liable for all damage to underground utilities</strong></li>
      </ul>
    </div>

    <div class="initials-box">
      <span class="initials-label">Renter Initials (Section 4 — Operating Limits & Safety):</span>
      <span class="initials-field" style="display: flex; align-items: center; justify-content: center; font-size: 14pt; font-weight: bold; color: #1a1a1a;">${data.signerInitials}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">5) Prohibited Uses</div>
    <ul class="terms-list">
      <li>❌ Demolition beyond rated capability; impact/ramming; lifting people or non-approved man-baskets.</li>
      <li>❌ Hazmat/contamination (fuel spills, sewage, creosote, asbestos, etc.).</li>
      <li>❌ Operation in saltwater/surf, deep mud beyond track height, or fire areas without written approval.</li>
      <li>❌ Alterations, disabling safety devices, or removing telematics/GPS.</li>
    </ul>

    <div class="initials-box">
      <span class="initials-label">Renter Initials (Section 5 — Prohibited Uses):</span>
      <span class="initials-field" style="display: flex; align-items: center; justify-content: center; font-size: 14pt; font-weight: bold; color: #1a1a1a;">${data.signerInitials}</span>
    </div>
  </div>

  <div class="page-number">Page 4 of 8</div>
  <div class="page-break"></div>

  <!-- ===== PAGE 5: CARE & MAINTENANCE, DAMAGE & LOSS ===== -->
  <div class="title">Care, Maintenance & Liability</div>

  <div class="section">
    <div class="section-title">6) Care & Maintenance</div>
    <ul class="terms-list">
      <li><strong>Keep loads/attachments low</strong> and within rated capacity.</li>
      <li><strong>Daily pre-start inspection;</strong> grease per manual; check fluids, tracks, safety devices.</li>
      <li><strong>Report defects immediately;</strong> tag-out unsafe equipment—do not continue use.</li>
      <li><strong>Renter responsible</strong> for fuel and basic cleaning.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">7) Damage, Loss, Theft & Environmental</div>
    <p class="bold" style="color: #A90F0F; margin-bottom: 8px;">Renter is responsible for all damage, loss, theft, vandalism, contamination, recovery/winch-out, and down-time per the Rental Agreement.</p>

    <ul class="terms-list">
      <li><strong>Billable components:</strong> Tracks, cutting edges, teeth, glass, hoses, lights, hydraulic couplers and cab interior (if beyond normal wear).</li>
      <li><strong>Theft/vandalism:</strong> notify police and Owner <span class="underline">immediately</span> & provide report number.</li>
      <li><strong>Spills/contamination:</strong> immediate containment and cleanup at Renter's expense.</li>
      <li><strong>Full Replacement Cost:</strong> Renter liable for full $120,000 CAD if equipment is stolen, destroyed, or deemed total loss.</li>
      <li><strong>Downtime:</strong> Renter liable for lost revenue during repair period (daily rental rate × repair days).</li>
    </ul>

    <div class="warning-box">
      <p class="warning-title">⚠️ LIABILITY NOTICE</p>
      <p><strong>Equipment insurance does NOT waive renter liability</strong> - renter remains financially responsible for all damage, loss, and theft.</p>
    </div>

    <div class="initials-box">
      <span class="initials-label">Renter Initials (Section 7 — Damage/Loss/Theft & Environmental):</span>
      <span class="initials-field" style="display: flex; align-items: center; justify-content: center; font-size: 14pt; font-weight: bold; color: #1a1a1a;">${data.signerInitials}</span>
    </div>
  </div>

  <div class="page-number">Page 5 of 8</div>
  <div class="page-break"></div>

  <!-- ===== PAGE 6: FINANCIAL TERMS ===== -->
  <div class="title">Financial Terms & Obligations</div>

  <div class="section">
    <div class="section-title">8) Financial Terms</div>
    <table>
      <tr>
        <th>Item</th>
        <th style="text-align: right;">Amount</th>
      </tr>
      <tr>
        <td><strong>Deposit / Pre-Authorization (Security Hold):</strong> Taken at booking/release; applied to fuel/cleaning/minor damage/consumables/overages</td>
        <td style="text-align: right;">$${data.securityDeposit.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Fuel Charge (if not returned full)</td>
        <td style="text-align: right;">$100 flat rate (or actual fuel + service, whichever is greater)</td>
      </tr>
      <tr>
        <td>Cleaning Charge (excessive mud/debris)</td>
        <td style="text-align: right;">$100 flat rate</td>
      </tr>
      <tr>
        <td>Delivery/Recovery Fee</td>
        <td style="text-align: right;">$${data.deliveryFee.toFixed(2)} each way</td>
      </tr>
      <tr>
        <td>Late Return/Holdover</td>
        <td style="text-align: right;">Additional day(s) at current rates until returned</td>
      </tr>
      <tr>
        <td>Excess Hours (over allowance)</td>
        <td style="text-align: right;">$65/hour</td>
      </tr>
    </table>

    <div class="warning-box">
      <p class="bold" style="margin-bottom: 6px;">⚠️ IMPORTANT: Security Deposit Limitations</p>
      <p>The $${data.securityDeposit.toFixed(2)} deposit is <strong>not a liability cap</strong>. Renter remains responsible for all charges beyond the deposit amount, including but not limited to: major damage, loss, theft, downtime, recovery costs, and environmental cleanup.</p>
    </div>

    <div class="initials-box">
      <span class="initials-label">Renter Initials (Section 8 — Financial Terms):</span>
      <span class="initials-field" style="display: flex; align-items: center; justify-content: center; font-size: 14pt; font-weight: bold; color: #1a1a1a;">${data.signerInitials}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">9) Telematics, Photos & Privacy</div>
    <ul class="terms-list">
      <li><strong>GPS/Telematics:</strong> Owner may use GPS/telematics/engine-hour data for location, hour tracking, diagnostics, and recovery.</li>
      <li><strong>Condition Documentation:</strong> Renter consents to pre- and post-rental photos/video for condition documentation.</li>
      <li><strong>Media Permission (Optional):</strong> <span class="checkbox"></span> Opt-in to marketing use <span class="checkbox"></span> Decline</li>
    </ul>
  </div>

  <div class="page-number">Page 6 of 8</div>
  <div class="page-break"></div>

  <!-- ===== PAGE 7: SITE, RETURN & LEGAL ===== -->
  <div class="title">Site Access, Return & Legal Terms</div>

  <div class="section">
    <div class="section-title">10) Site & Access</div>
    <ul class="terms-list">
      <li><strong>Safe, level access</strong> for delivery, operation, and pickup provided by Renter.</li>
      <li><strong>Snow/ice/mud management</strong> is Renter's responsibility unless purchased as a service.</li>
      <li><strong>Surface protection:</strong> Do not operate on newly poured asphalt/concrete without protection; surface damage is billable.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">11) Return Condition</div>
    <ul class="terms-list">
      <li><strong>Parking:</strong> Park level, bucket/attachment down, brake set; record hour meter.</li>
      <li><strong>Cleaning:</strong> Clean radiator/engine bay of debris; remove mud from tracks/undercarriage.</li>
      <li><strong>Accessories:</strong> Return all attachments, keys, manuals, and accessories.</li>
      <li><strong>Fuel:</strong> Return with FULL fuel tank or pay $100 refueling fee.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">12) Remedies & Repossession</div>
    <ul class="terms-list">
      <li><strong>Breach or unsafe use:</strong> Owner may suspend operation and repossess immediately without notice.</li>
      <li><strong>Limitation of Liability:</strong> Owner is not liable for consequential or incidental damages; total liability shall not exceed amounts received for the specific rental, except for damage caused by Owner's gross negligence or willful misconduct.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">13) Governing Law</div>
    <p>This Rider and the Rental Agreement are governed by the laws of the <strong>Province of New Brunswick, Canada</strong>.</p>
    <ul class="terms-list" style="margin-top: 8px;">
      <li><strong>Electronic Signatures:</strong> Legally binding under the Uniform Electronic Commerce Act (UECA).</li>
      <li><strong>Jurisdiction:</strong> Disputes subject to exclusive jurisdiction of courts in Saint John, New Brunswick.</li>
      <li><strong>Severability:</strong> If any provision is unenforceable, remaining provisions remain in full effect.</li>
    </ul>
  </div>

  <div class="page-number">Page 7 of 8</div>
  <div class="page-break"></div>

  <!-- ===== PAGE 8: ACCEPTANCE & SIGNATURES ===== -->
  <div class="title">Acceptance & Authority to Charge</div>

  <div class="warning-box">
    <p class="warning-title">📜 SECTION 14: ACCEPTANCE & AUTHORITY</p>
    <p class="bold" style="margin-bottom: 8px;">By signing below, Renter acknowledges and agrees that:</p>
    <ul class="terms-list">
      <li><strong>(i)</strong> the equipment has been received in good condition (unless noted in Pre-Rental Condition Notes);</li>
      <li><strong>(ii)</strong> this Rider forms part of the Rental Agreement;</li>
      <li><strong>(iii)</strong> Renter has read this Rider and the Rental Agreement in full;</li>
      <li><strong>(iv)</strong> Renter understands the <span class="underline">Insurance requirement</span> ("No COI, No Release"), the <span class="underline">Operating Limits & Safety rules</span> (including max 25° slope and utility locates), and the <span class="underline">Prohibited Uses</span>;</li>
      <li><strong>(v)</strong> Renter is responsible for damage, loss, theft, contamination, and downtime as stated;</li>
      <li><strong>(vi)</strong> the $${data.securityDeposit.toFixed(2)} deposit is a pre-authorization and <span class="underline">is not a cap on liability</span>;</li>
      <li><strong>(vii)</strong> Renter authorizes U-Dig It Rentals Inc. to charge the card on file for fuel ($100 if not full), cleaning, over-hours, recovery, and any other amounts due under this Rider and the Rental Agreement; and</li>
      <li><strong>(viii)</strong> any optional LDW is not liability insurance and has exclusions.</li>
    </ul>
  </div>

  <div class="section">
    <div class="section-title">Pre-Rental Condition Notes</div>
    <p style="margin-bottom: 8px; font-size: 9pt; color: #666;">Photos attached and available in booking portal</p>
    <div style="border: 1px solid #ddd; padding: 10px; min-height: 60px; background: white;">
      ${data.specialInstructions ? data.specialInstructions : 'No special condition notes recorded at time of rental.'}
    </div>
  </div>

  <div class="signature-section">
    <div class="section-title" style="margin-bottom: 15px;">RENTER SIGNATURE</div>

    <div class="signature-field">
      <span class="signature-label">Typed Full Legal Name (as entered during signing)</span>
      <div class="signature-line">
        <span class="bold" style="font-size: 14pt; color: #1a1a1a;">${data.signerTypedName}</span>
      </div>
    </div>

    <div class="signature-field">
      <span class="signature-label">Electronic Signature</span>
      <div class="signature-line">
        <img src="${data.signatureImage}" alt="Customer Signature" class="signature-image" />
      </div>
      <p style="font-size: 7pt; color: #666; margin-top: 4px; font-style: italic;">
        Electronic signature captured ${data.signedDate} at ${data.signedTime} Atlantic Time
      </p>
    </div>

    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px;">
      <div class="signature-field" style="flex: 1 1 calc(50% - 8px); min-width: 200px;">
        <span class="signature-label">Date</span>
        <div class="signature-line">
          <span>${data.signedDate}</span>
        </div>
      </div>

      <div class="signature-field" style="flex: 1 1 calc(50% - 8px); min-width: 200px;">
        <span class="signature-label">Phone</span>
        <div class="signature-line">
          <span>${data.customerPhone}</span>
        </div>
      </div>
    </div>

    <div style="display: flex; flex-wrap: wrap; gap: 15px;">
      <div class="signature-field" style="flex: 1 1 calc(50% - 8px); min-width: 200px;">
        <span class="signature-label">Driver's License/ID</span>
        <div class="signature-line">
          <span>${data.customerLicense || 'N/A'}</span>
        </div>
      </div>

      <div class="signature-field" style="flex: 1 1 calc(50% - 8px); min-width: 200px;">
        <span class="signature-label">Company (if any)</span>
        <div class="signature-line">
          <span>${data.customerCompany || 'Individual'}</span>
        </div>
      </div>
    </div>

    <div class="signature-field" style="margin-top: 20px;">
      <span class="signature-label">Email Address</span>
      <div class="signature-line">
        <span>${data.customerEmail}</span>
      </div>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E1BC56;">
      <div class="signature-field">
        <span class="signature-label">Owner: U-Dig It Rentals Inc.</span>
        <div class="signature-line">
          <span class="bold">U-Dig It Rentals Team</span>
        </div>
      </div>

      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px;">
        <div class="signature-field" style="flex: 1 1 calc(50% - 8px); min-width: 200px;">
          <span class="signature-label">Representative</span>
          <div class="signature-line">
            <span>See Above</span>
          </div>
        </div>

        <div class="signature-field" style="flex: 1 1 calc(50% - 8px); min-width: 200px;">
          <span class="signature-label">Date</span>
          <div class="signature-line">
            <span>${today}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer" style="margin-top: 30px;">
    ${data.bookingCreatedAt || data.bookingConfirmedAt ? `
    <p class="bold">📅 BOOKING TIMELINE</p>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; font-size: 8pt;">
      ${data.bookingCreatedAt ? `
      <div style="flex: 1 1 45%;">
        <strong>Booking Created:</strong> ${data.bookingCreatedAt}
      </div>
      ` : ''}
      ${data.bookingConfirmedAt ? `
      <div style="flex: 1 1 45%;">
        <strong>Booking Confirmed:</strong> ${data.bookingConfirmedAt}
      </div>
      ` : ''}
      <div style="flex: 1 1 45%;">
        <strong>Contract Signed:</strong> ${data.signedDate} at ${data.signedTime}
      </div>
    </div>
    ` : ''}

    <p class="bold" style="margin-top: 15px;">🔒 SECURITY & PRIVACY NOTICE</p>
    <p style="font-size: 8pt;">This document and all associated data are encrypted using 256-bit SSL encryption and stored securely in compliance with PIPEDA (Personal Information Protection and Electronic Documents Act).</p>
    <p style="margin-top: 8px; font-size: 8pt;">Electronic signatures are legally binding under the Uniform Electronic Commerce Act (UECA) and have the same legal effect as handwritten signatures in New Brunswick, Canada.</p>
    <p style="margin-top: 8px; font-size: 8pt;"><strong>Document ID:</strong> ${data.contractNumber} | <strong>Signed:</strong> ${data.signedDate} at ${data.signedTime} Atlantic Time</p>
  </div>

  <div class="page-number">Page 8 of 8</div>
</body>
</html>`;
}

