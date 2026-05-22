#!/usr/bin/env node
/**
 * Rasterize all SVG sources → every PNG size Play Store + Android needs.
 *
 * Usage:
 *   npm i -D sharp
 *   node playstore/scripts/generate-icons.js
 *
 * Cross-platform (works on Win/Mac/Linux). No ImageMagick needed.
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC = path.resolve(__dirname, '..', 'icons', 'source');
const OUT = path.resolve(__dirname, '..', 'icons');

// What to generate from each source SVG
const JOBS = [
  // Master icon at every common size
  { src: 'app-icon.svg',          out: 'raster/icon-16.png',         size: 16 },
  { src: 'app-icon.svg',          out: 'raster/icon-32.png',         size: 32 },
  { src: 'app-icon.svg',          out: 'raster/icon-48.png',         size: 48 },
  { src: 'app-icon.svg',          out: 'raster/icon-72.png',         size: 72 },
  { src: 'app-icon.svg',          out: 'raster/icon-96.png',         size: 96 },
  { src: 'app-icon.svg',          out: 'raster/icon-128.png',        size: 128 },
  { src: 'app-icon.svg',          out: 'raster/icon-192.png',        size: 192 },
  { src: 'app-icon.svg',          out: 'raster/icon-256.png',        size: 256 },
  { src: 'app-icon.svg',          out: 'raster/icon-384.png',        size: 384 },
  { src: 'app-icon.svg',          out: 'raster/icon-512.png',        size: 512 },
  { src: 'app-icon.svg',          out: 'raster/icon-1024.png',       size: 1024 },

  // Maskable variant for PWA manifest (Play Store likes this too)
  { src: 'app-icon.svg',          out: 'raster/icon-192-maskable.png', size: 192 },
  { src: 'app-icon.svg',          out: 'raster/icon-512-maskable.png', size: 512 },

  // Apple touch icon (for iOS PWA wrap later)
  { src: 'app-icon.svg',          out: 'raster/apple-touch-icon.png', size: 180 },

  // Adaptive icon FOREGROUND (one per density)
  { src: 'adaptive-foreground.svg', out: 'adaptive/mipmap-mdpi/ic_launcher_foreground.png',    size: 108 },
  { src: 'adaptive-foreground.svg', out: 'adaptive/mipmap-hdpi/ic_launcher_foreground.png',    size: 162 },
  { src: 'adaptive-foreground.svg', out: 'adaptive/mipmap-xhdpi/ic_launcher_foreground.png',   size: 216 },
  { src: 'adaptive-foreground.svg', out: 'adaptive/mipmap-xxhdpi/ic_launcher_foreground.png',  size: 324 },
  { src: 'adaptive-foreground.svg', out: 'adaptive/mipmap-xxxhdpi/ic_launcher_foreground.png', size: 432 },

  // Adaptive icon BACKGROUND
  { src: 'adaptive-background.svg', out: 'adaptive/mipmap-mdpi/ic_launcher_background.png',    size: 108 },
  { src: 'adaptive-background.svg', out: 'adaptive/mipmap-hdpi/ic_launcher_background.png',    size: 162 },
  { src: 'adaptive-background.svg', out: 'adaptive/mipmap-xhdpi/ic_launcher_background.png',   size: 216 },
  { src: 'adaptive-background.svg', out: 'adaptive/mipmap-xxhdpi/ic_launcher_background.png',  size: 324 },
  { src: 'adaptive-background.svg', out: 'adaptive/mipmap-xxxhdpi/ic_launcher_background.png', size: 432 },

  // Monochrome (Android 13+ themed icons)
  { src: 'monochrome.svg',          out: 'adaptive/mipmap-mdpi/ic_launcher_monochrome.png',    size: 108 },
  { src: 'monochrome.svg',          out: 'adaptive/mipmap-hdpi/ic_launcher_monochrome.png',    size: 162 },
  { src: 'monochrome.svg',          out: 'adaptive/mipmap-xhdpi/ic_launcher_monochrome.png',   size: 216 },
  { src: 'monochrome.svg',          out: 'adaptive/mipmap-xxhdpi/ic_launcher_monochrome.png',  size: 324 },
  { src: 'monochrome.svg',          out: 'adaptive/mipmap-xxxhdpi/ic_launcher_monochrome.png', size: 432 },

  // Feature graphic for Play Store listing
  { src: 'feature-graphic.svg', out: 'raster/feature-graphic-1024x500.png', width: 1024, height: 500 },

  // Splash screen at multiple densities
  { src: 'splash.svg', out: 'raster/splash-mdpi.png',    width: 320,  height: 480  },
  { src: 'splash.svg', out: 'raster/splash-hdpi.png',    width: 480,  height: 800  },
  { src: 'splash.svg', out: 'raster/splash-xhdpi.png',   width: 720,  height: 1280 },
  { src: 'splash.svg', out: 'raster/splash-xxhdpi.png',  width: 960,  height: 1600 },
  { src: 'splash.svg', out: 'raster/splash-xxxhdpi.png', width: 1242, height: 2208 },
];

async function run() {
  console.log(`🎨 Generating ${JOBS.length} assets…\n`);
  let ok = 0, fail = 0;

  for (const job of JOBS) {
    const srcPath = path.join(SRC, job.src);
    const outPath = path.join(OUT, job.out);
    await fs.promises.mkdir(path.dirname(outPath), { recursive: true });

    try {
      const w = job.width ?? job.size;
      const h = job.height ?? job.size;
      await sharp(srcPath)
        .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ quality: 95, compressionLevel: 9 })
        .toFile(outPath);
      console.log(`  ✓ ${job.out.padEnd(60)} ${w}×${h}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${job.out}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n✅ ${ok} generated, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

run();
