// Script to create VOXERA app icons with microphone design
// Requires: npm install sharp (or use built-in canvas if available)

const fs = require('fs');
const path = require('path');

// Check if sharp is available (better quality)
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('sharp not found. Install it with: npm install sharp');
  console.warn('Falling back to basic icon generation...');
}

// SVG template for microphone icon
const microphoneSVG = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#grad1)"/>
  
  <!-- Microphone body -->
  <rect x="200" y="120" width="112" height="180" rx="56" fill="white" opacity="0.95"/>
  
  <!-- Microphone grille lines -->
  <line x1="220" y1="160" x2="292" y2="160" stroke="#3b82f6" stroke-width="3" opacity="0.3"/>
  <line x1="220" y1="190" x2="292" y2="190" stroke="#3b82f6" stroke-width="3" opacity="0.3"/>
  <line x1="220" y1="220" x2="292" y2="220" stroke="#3b82f6" stroke-width="3" opacity="0.3"/>
  <line x1="220" y1="250" x2="292" y2="250" stroke="#3b82f6" stroke-width="3" opacity="0.3"/>
  
  <!-- Microphone stand -->
  <rect x="246" y="300" width="20" height="60" rx="10" fill="white" opacity="0.95"/>
  
  <!-- Base -->
  <rect x="196" y="360" width="120" height="20" rx="10" fill="white" opacity="0.95"/>
  
  <!-- Sound waves (optional decorative element) -->
  <path d="M 320 200 Q 360 200, 380 220 Q 400 240, 380 260 Q 360 280, 320 280" 
        stroke="white" stroke-width="8" fill="none" opacity="0.4" stroke-linecap="round"/>
  <path d="M 320 180 Q 370 180, 400 220 Q 430 260, 400 300 Q 370 340, 320 340" 
        stroke="white" stroke-width="6" fill="none" opacity="0.3" stroke-linecap="round"/>
</svg>
`;

async function createIconWithSharp(size, outputPath) {
  try {
    await sharp(Buffer.from(microphoneSVG))
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✅ Created ${outputPath} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create ${outputPath}:`, error.message);
    return false;
  }
}

function createBasicPNG(size, outputPath) {
  // Create a simple gradient PNG using a minimal approach
  // This is a fallback if sharp is not available
  const canvas = require('canvas');
  if (!canvas) {
    console.warn('Canvas not available. Please install: npm install canvas');
    return false;
  }
  
  const { createCanvas } = canvas;
  const canvasEl = createCanvas(size, size);
  const ctx = canvasEl.getContext('2d');
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#3b82f6');
  gradient.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Simple microphone shape
  const micSize = size * 0.4;
  const micX = (size - micSize) / 2;
  const micY = size * 0.25;
  
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.roundRect(micX, micY, micSize, micSize * 0.6, micSize * 0.2);
  ctx.fill();
  
  // Save
  const buffer = canvasEl.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Created ${outputPath} (${size}x${size})`);
  return true;
}

async function createIcons() {
  console.log('🎨 Creating VOXERA app icons...\n');
  
  const iconsDir = __dirname;
  const icons = [
    { size: 32, file: '32x32.png' },
    { size: 128, file: '128x128.png' },
    { size: 256, file: '128x128@2x.png' },
  ];
  
  let success = true;
  
  if (sharp) {
    // Use sharp for high-quality icons
    for (const icon of icons) {
      const result = await createIconWithSharp(icon.size, path.join(iconsDir, icon.file));
      if (!result) success = false;
    }
    
    // Create .icns and .ico (these are platform-specific formats)
    // For now, we'll create high-res PNGs and note that proper conversion is needed
    await createIconWithSharp(512, path.join(iconsDir, 'icon_base.png'));
    console.log('⚠️  Note: icon.icns and icon.ico need to be created separately');
    console.log('   Use online converters or tools like iconutil (macOS) for .icns');
    console.log('   Use ImageMagick or online converters for .ico');
  } else {
    // Fallback to basic method
    console.log('Using basic icon generation (install sharp for better quality)');
    for (const icon of icons) {
      if (!createBasicPNG(icon.size, path.join(iconsDir, icon.file))) {
        success = false;
      }
    }
  }
  
  if (success) {
    console.log('\n✅ Icon generation complete!');
    console.log('📝 Note: For .icns (macOS) and .ico (Windows) files:');
    console.log('   - macOS: Use "iconutil -c icns icon.iconset" after creating iconset');
    console.log('   - Windows: Use ImageMagick or online converter for .ico');
  } else {
    console.log('\n⚠️  Some icons failed to generate. Install dependencies:');
    console.log('   npm install sharp');
  }
}

// Run if called directly
if (require.main === module) {
  createIcons().catch(console.error);
}

module.exports = { createIcons };
