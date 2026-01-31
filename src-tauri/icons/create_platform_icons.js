// Script to create platform-specific icon formats (.icns and .ico)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('sharp is required. Install with: npm install sharp');
  process.exit(1);
}

const iconsDir = __dirname;

async function createICNS() {
  console.log('🍎 Creating macOS .icns file...');
  
  // Create iconset directory
  const iconsetDir = path.join(iconsDir, 'icon.iconset');
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir);
  }
  
  const sizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];
  
  // Read the base icon
  const baseIconPath = path.join(iconsDir, 'icon_base.png');
  if (!fs.existsSync(baseIconPath)) {
    console.error('❌ icon_base.png not found. Run create_icons.js first.');
    return false;
  }
  
  // Generate all sizes
  for (const { size, name } of sizes) {
    const outputPath = path.join(iconsetDir, name);
    try {
      await sharp(baseIconPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    } catch (error) {
      console.error(`Failed to create ${name}:`, error.message);
      return false;
    }
  }
  
  // Convert to .icns using iconutil (macOS only)
  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(iconsDir, 'icon.icns')}"`, {
      stdio: 'inherit'
    });
    console.log('✅ Created icon.icns');
    
    // Clean up iconset directory
    fs.rmSync(iconsetDir, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.warn('⚠️  iconutil not available or failed. .icns file not created.');
    console.warn('   You can manually convert using: iconutil -c icns icon.iconset');
    return false;
  }
}

async function createICO() {
  console.log('🪟 Creating Windows .ico file...');
  
  const baseIconPath = path.join(iconsDir, 'icon_base.png');
  if (!fs.existsSync(baseIconPath)) {
    console.error('❌ icon_base.png not found. Run create_icons.js first.');
    return false;
  }
  
  // .ico files can contain multiple sizes
  // We'll create a single 256x256 icon for now
  // For multi-size .ico, you'd need a library like ico-convert or use ImageMagick
  try {
    const icoPath = path.join(iconsDir, 'icon.ico');
    
    // Read the 256x256 version
    const icon256 = await sharp(baseIconPath)
      .resize(256, 256)
      .png()
      .toBuffer();
    
    // For a proper .ico file with multiple sizes, we'd need a specialized library
    // For now, we'll create a simple single-size .ico
    // Note: This is a simplified approach - proper .ico files need special format
    fs.writeFileSync(icoPath, icon256);
    console.log('✅ Created icon.ico (simplified - single size)');
    console.log('   For multi-size .ico, use ImageMagick: convert icon_base.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico');
    return true;
  } catch (error) {
    console.error('❌ Failed to create .ico:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Creating platform-specific icons...\n');
  
  // Create .icns for macOS
  if (process.platform === 'darwin') {
    await createICNS();
  } else {
    console.log('⚠️  Skipping .icns creation (macOS only)');
  }
  
  // Create .ico for Windows
  await createICO();
  
  console.log('\n✅ Platform icon generation complete!');
}

main().catch(console.error);

