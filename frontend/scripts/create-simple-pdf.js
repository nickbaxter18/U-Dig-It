const fs = require('fs');
const path = require('path');

// Create a simple PDF content
const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 2000
>>
stream
BT
/F1 16 Tf
50 750 Td
(Equipment Rental Checklist) Tj
0 -30 Td
/F1 12 Tf
(U-Dig It Rentals Inc.) Tj
0 -20 Td
(Professional Equipment Rental) Tj
0 -40 Td
/F1 14 Tf
(PRE-RENTAL CHECKLIST) Tj
0 -20 Td
/F1 10 Tf
(□ Site access requirements confirmed) Tj
0 -15 Td
(□ Ground conditions assessed) Tj
0 -15 Td
(□ Clear path for equipment delivery) Tj
0 -15 Td
(□ Underground utilities marked) Tj
0 -15 Td
(□ Overhead clearance verified) Tj
0 -15 Td
(□ Weather forecast checked) Tj
0 -15 Td
(□ Required permits obtained) Tj
0 -15 Td
(□ Insurance coverage confirmed) Tj
0 -30 Td
/F1 14 Tf
(SAFETY REQUIREMENTS) Tj
0 -20 Td
/F1 10 Tf
(□ Operator certification verified) Tj
0 -15 Td
(□ Safety briefing scheduled) Tj
0 -15 Td
(□ Personal protective equipment ready) Tj
0 -15 Td
(□ Emergency contact numbers posted) Tj
0 -15 Td
(□ First aid kit available) Tj
0 -15 Td
(□ Fire extinguisher accessible) Tj
0 -15 Td
(□ Site safety plan reviewed) Tj
0 -30 Td
/F1 14 Tf
(COST PLANNING) Tj
0 -20 Td
/F1 10 Tf
(□ Daily rental rate confirmed) Tj
0 -15 Td
(□ Delivery and pickup fees calculated) Tj
0 -15 Td
(□ Fuel costs estimated) Tj
0 -15 Td
(□ Taxes and fees included) Tj
0 -15 Td
(□ Damage waiver options reviewed) Tj
0 -15 Td
(□ Late return penalties understood) Tj
0 -15 Td
(□ Cleaning fees clarified) Tj
0 -15 Td
(□ Attachment costs considered) Tj
0 -30 Td
/F1 14 Tf
(EMERGENCY CONTACTS) Tj
0 -20 Td
/F1 10 Tf
(U-Dig It Rentals - 24/7 Support) Tj
0 -15 Td
(Main Line: (506) 643-1575) Tj
0 -15 Td
(Email: nickbaxter@udigit.ca) Tj
0 -15 Td
(Address: 945 Golden Grove Road, Saint John, NB) Tj
0 -15 Td
(Business Hours: Mon-Fri 7AM-6PM, Sat 8AM-4PM) Tj
0 -15 Td
(Emergency Service: Available 24/7 during rentals) Tj
0 -30 Td
/F1 14 Tf
(DOCUMENTATION CHECKLIST) Tj
0 -20 Td
/F1 10 Tf
(□ Rental agreement signed) Tj
0 -15 Td
(□ Insurance certificate provided) Tj
0 -15 Td
(□ Operator license copy on file) Tj
0 -15 Td
(□ Delivery confirmation received) Tj
0 -15 Td
(□ Equipment inspection report completed) Tj
0 -15 Td
(□ Return date and time confirmed) Tj
0 -15 Td
(□ Payment method verified) Tj
0 -30 Td
/F1 12 Tf
(Ready to Rent? Call (506) 643-1575) Tj
0 -15 Td
(Licensed and insured for your peace of mind) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000002334 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
2394
%%EOF`;

// Write the PDF file
const pdfPath = path.join(__dirname, '../public/downloads/equipment-rental-checklist.pdf');
fs.writeFileSync(pdfPath, pdfContent);

console.log('Simple PDF created successfully:', pdfPath);





