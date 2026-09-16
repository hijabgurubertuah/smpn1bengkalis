import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating PWA icons from SVG...');

  // 1. 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
  console.log('Generated public/pwa-192x192.png');

  // 2. 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
  console.log('Generated public/pwa-512x512.png');

  // 3. Apple touch icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated public/apple-touch-icon.png');

  // 4. 512x512 maskable icon with safe zone padding (central 80% circle, 10% padding on each side)
  const innerSize = Math.round(512 * 0.8);
  const padding = Math.round((512 - innerSize) / 2);

  const innerIcon = await sharp(svgBuffer)
    .resize(innerSize, innerSize)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }, // slate-900 background matching theme
    },
  })
    .composite([
      {
        input: innerIcon,
        top: padding,
        left: padding,
      },
    ])
    .png()
    .toFile('public/pwa-maskable-512x512.png');
  console.log('Generated public/pwa-maskable-512x512.png');

  // 5. Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
  console.log('Generated public/favicon.ico');

  console.log('All icons generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
