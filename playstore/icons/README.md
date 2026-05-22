# 🎨 Synapse Icons — Spec & Generation

All sources live in [`source/`](./source) as editable SVG. Run [`../scripts/generate-icons.sh`](../scripts/generate-icons.sh) to rasterize them into every PNG size Play Store + Android needs.

---

## Master icon

**File:** [`source/app-icon.svg`](./source/app-icon.svg)
**Dimensions:** 512×512 viewBox (vector — scales infinitely)
**Use:** Play Store listing icon, web favicon, social shares

The mark is a stylized **synapse / spark** ("S" inside a rounded square) with a gradient `#6366F1 → #8B5CF6 → #EC4899`. This matches the in-app gradient.

### Required raster outputs (auto-generated)
| Size | Path | Used by |
|------|------|---------|
| 16×16 | `raster/icon-16.png` | Browser favicon |
| 32×32 | `raster/icon-32.png` | Browser favicon |
| 48×48 | `raster/icon-48.png` | Browser tab |
| 192×192 | `raster/icon-192.png` | PWA manifest |
| 512×512 | `raster/icon-512.png` | PWA + Play Store |
| 1024×1024 | `raster/icon-1024.png` | Apple Touch Icon |

---

## Adaptive icon (Android 8+)

Android 8+ wants two layers so the OS can crop/animate them. **Both must be 432×432.**

| Layer | File | Notes |
|-------|------|-------|
| Foreground | [`source/adaptive-foreground.svg`](./source/adaptive-foreground.svg) | The "S" mark only. Keep all art inside center 264×264 "safe zone" (108dp at xhdpi) — anything outside might be cropped. |
| Background | [`source/adaptive-background.svg`](./source/adaptive-background.svg) | Solid gradient. Edges may show or not depending on launcher (circle, squircle, square…). |
| Monochrome | [`source/monochrome.svg`](./source/monochrome.svg) | Android 13+ "themed icons" — must be flat single-color. |

### Required raster outputs
| Density | Size | Path |
|---------|------|------|
| mdpi    | 108×108 | `adaptive/mipmap-mdpi/ic_launcher_foreground.png` |
| hdpi    | 162×162 | `adaptive/mipmap-hdpi/ic_launcher_foreground.png` |
| xhdpi   | 216×216 | `adaptive/mipmap-xhdpi/ic_launcher_foreground.png` |
| xxhdpi  | 324×324 | `adaptive/mipmap-xxhdpi/ic_launcher_foreground.png` |
| xxxhdpi | 432×432 | `adaptive/mipmap-xxxhdpi/ic_launcher_foreground.png` |

(Same for `ic_launcher_background.png` and `ic_launcher_monochrome.png`)

---

## Feature graphic

**File:** [`source/feature-graphic.svg`](./source/feature-graphic.svg)
**Dimensions:** 1024×500
**Use:** Big banner at top of Play Store listing
**Required by:** Play Store (will reject submission without it)

Shows the gradient brand background + tagline "Where ideas meet builders".

---

## Splash screen

**File:** [`source/splash.svg`](./source/splash.svg)
**Dimensions:** 1242×2208 (9:16 aspect, fills most phones)
**Use:** Shown for ~500ms while TWA loads

Render at multiple densities — Bubblewrap will do this automatically when you set `splash_image_url` in `twa-manifest.json`.

---

## How to regenerate

```bash
# Requires: bash + ImageMagick OR Node + sharp
cd playstore
./scripts/generate-icons.sh         # bash + imagemagick
# OR
node scripts/generate-icons.js      # node + sharp (cross-platform)
```

Output goes to `raster/` and `adaptive/`.

---

## ⚠️ Replace with real art before launch

The SVGs here are **production-ready brand placeholders** — clean gradient + monogram. For a polished real-world brand, hire an illustrator or commission a designer for:

1. A custom mark (not just an "S")
2. The feature graphic with brand photography
3. App store screenshots with marketing copy overlays (e.g. Figma → Play Asset Studio)

But you can ship to Play Store with these as-is and they'll look professional.
