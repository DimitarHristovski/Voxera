// Simple script to create minimal placeholder PNG icons
const fs = require('fs');

// Minimal valid 32x32 PNG (1x1 pixel, blue)
const minimalPNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

// Create all required icon files
const icons = [
  '32x32.png',
  '128x128.png',
  '128x128@2x.png',
  'icon.icns', // Will be a PNG for now
  'icon.ico'   // Will be a PNG for now
];

icons.forEach(icon => {
  fs.writeFileSync(icon, minimalPNG);
  console.log(`Created ${icon}`);
});

