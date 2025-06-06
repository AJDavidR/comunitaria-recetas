import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const sizes = [32, 72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = 'assets/logo.png'; // Asegúrate de tener este archivo
const outputDir = 'assets/icons';

async function generateIcons() {
  try {
    // Crear directorio si no existe
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generar cada tamaño
    for (const size of sizes) {
      await sharp(sourceIcon)
        .resize(size, size)
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      
      console.log(`✅ Generado icon-${size}x${size}.png`);
    }
    
    // Generar favicon
    await sharp(sourceIcon)
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon.ico'));
    
    console.log('✅ Generado favicon.ico');
    
    // Generar icono maskable
    await sharp(sourceIcon)
      .resize(512, 512)
      .extend({
        top: 64,
        bottom: 64,
        left: 64,
        right: 64,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(512, 512)
      .toFile(path.join(outputDir, 'maskable-icon.png'));
    
    console.log('✅ Generado maskable-icon.png');
    
  } catch (error) {
    console.error('Error generando iconos:', error);
    process.exit(1);
  }
}

generateIcons(); 