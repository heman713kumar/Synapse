#!/usr/bin/env bash
# Rasterize all SVG sources → PNG using ImageMagick (cross-platform alternative to the Node script).
# Requires: `brew install imagemagick` (Mac) or `apt-get install imagemagick` (Linux)
# Prefer scripts/generate-icons.js if you have Node — it's faster + cross-platform.

set -e
cd "$(dirname "$0")/.."

SRC="icons/source"
OUT="icons"

mkdir -p "$OUT/raster" \
  "$OUT/adaptive/mipmap-mdpi" \
  "$OUT/adaptive/mipmap-hdpi" \
  "$OUT/adaptive/mipmap-xhdpi" \
  "$OUT/adaptive/mipmap-xxhdpi" \
  "$OUT/adaptive/mipmap-xxxhdpi"

echo "🎨 Rasterizing app icon…"
for size in 16 32 48 72 96 128 192 256 384 512 1024; do
  magick -background none -density 384 "$SRC/app-icon.svg" -resize ${size}x${size} \
    "$OUT/raster/icon-${size}.png"
  echo "  ✓ icon-${size}.png"
done

magick -background none -density 384 "$SRC/app-icon.svg" -resize 192x192 "$OUT/raster/icon-192-maskable.png"
magick -background none -density 384 "$SRC/app-icon.svg" -resize 512x512 "$OUT/raster/icon-512-maskable.png"
magick -background none -density 384 "$SRC/app-icon.svg" -resize 180x180 "$OUT/raster/apple-touch-icon.png"

echo "🎨 Adaptive icon layers (5 densities × 3 layers)…"
declare -A densities=( [mdpi]=108 [hdpi]=162 [xhdpi]=216 [xxhdpi]=324 [xxxhdpi]=432 )
for layer in foreground background monochrome; do
  src="$SRC/adaptive-${layer}.svg"
  [ "$layer" = "monochrome" ] && src="$SRC/monochrome.svg"
  for density in "${!densities[@]}"; do
    size=${densities[$density]}
    magick -background none -density 384 "$src" -resize ${size}x${size} \
      "$OUT/adaptive/mipmap-${density}/ic_launcher_${layer}.png"
  done
  echo "  ✓ ${layer} layer (all 5 densities)"
done

echo "🎨 Feature graphic + splash…"
magick -background "#0A0A0F" -density 192 "$SRC/feature-graphic.svg" -resize 1024x500 \
  "$OUT/raster/feature-graphic-1024x500.png"

for entry in "320x480 mdpi" "480x800 hdpi" "720x1280 xhdpi" "960x1600 xxhdpi" "1242x2208 xxxhdpi"; do
  size=$(echo $entry | cut -d' ' -f1)
  name=$(echo $entry | cut -d' ' -f2)
  magick -background "#0A0A0F" -density 192 "$SRC/splash.svg" -resize $size \
    "$OUT/raster/splash-${name}.png"
done

echo ""
echo "✅ All assets generated in: $OUT/"
echo "   - PNG icons: $OUT/raster/"
echo "   - Adaptive icons: $OUT/adaptive/"
echo "   - Feature graphic: $OUT/raster/feature-graphic-1024x500.png"
