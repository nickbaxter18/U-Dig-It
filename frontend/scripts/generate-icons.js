const fs = require('fs');
const path = require('path');

// Create simple SVG icons for PWA
const createIcon = (size, filename) => {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#A90F0F"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold">U-D</text>
  </svg>`;
  
  fs.writeFileSync(path.join(__dirname, '../public/icons', filename), svg);
};

// Generate all required icon sizes
const sizes = [
  { size: 16, filename: 'icon-16x16.png' },
  { size: 32, filename: 'icon-32x32.png' },
  { size: 72, filename: 'icon-72x72.png' },
  { size: 96, filename: 'icon-96x96.png' },
  { size: 128, filename: 'icon-128x128.png' },
  { size: 144, filename: 'icon-144x144.png' },
  { size: 152, filename: 'icon-152x152.png' },
  { size: 192, filename: 'icon-192x192.png' },
  { size: 384, filename: 'icon-384x384.png' },
  { size: 512, filename: 'icon-512x512.png' }
];

sizes.forEach(({ size, filename }) => {
  createIcon(size, filename);
  console.log(`Created ${filename}`);
});

console.log('All PWA icons generated successfully!');



