const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Read the HTML file
  const htmlPath = path.join(__dirname, '../public/downloads/equipment-rental-checklist.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  // Set the HTML content
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  // Generate PDF
  const pdfPath = path.join(__dirname, '../public/downloads/equipment-rental-checklist.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });
  
  await browser.close();
  console.log('PDF generated successfully:', pdfPath);
}

generatePDF().catch(console.error);





