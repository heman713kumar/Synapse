# 🚀 Synapse — Google Play Store Submission Kit

Everything you need to get Synapse on the Google Play Store. **Synapse is a PWA**, so the simplest path is wrapping it as a TWA (Trusted Web Activity).

---

## ⚡ Quick start (TL;DR)

```bash
# 1. Deploy the PWA to a public HTTPS domain (e.g. synapse.app)
# 2. Install Bubblewrap CLI
npm i -g @bubblewrap/cli

# 3. Initialize the TWA project (uses our prepared twa-manifest.json)
cd playstore
bubblewrap init --manifest=https://synapse.app/manifest.json

# 4. Build the Android App Bundle (.aab) for upload
bubblewrap build

# 5. Upload synapse.aab to Play Console → Internal testing track
```

Full step-by-step in **[`build-twa-guide.md`](./build-twa-guide.md)**.

---

## 📂 What's in this folder

```
playstore/
├── README.md                       ← you are here
├── build-twa-guide.md              ← step-by-step TWA build (recommended)
├── capacitor-alternative.md        ← if TWA isn't enough (full native APIs)
├── release-checklist.md            ← pre-launch sanity check
├── pricing-distribution.md         ← countries, age rating, pricing
├── twa-manifest.json               ← Bubblewrap config (drop into bubblewrap init)
├── well-known/
│   └── assetlinks.json             ← Digital Asset Links (host at /.well-known/assetlinks.json)
│
├── listing/
│   ├── short-description.txt       ← 80 char hook
│   ├── full-description.md         ← 4000 char store listing
│   ├── whats-new.txt               ← release notes per version
│   └── keywords.md                 ← ASO research + recommended keywords
│
├── legal/
│   ├── privacy-policy.md           ← required by Play Store
│   ├── terms-of-service.md
│   ├── content-rating.md           ← IARC questionnaire answers
│   └── data-safety.md              ← Data Safety form answers
│
├── icons/
│   ├── README.md                   ← icon spec, dimensions, paths
│   ├── source/                     ← editable SVG sources
│   │   ├── app-icon.svg            ← 512x512 master icon
│   │   ├── adaptive-foreground.svg ← 432x432 safe-zone icon
│   │   ├── adaptive-background.svg ← solid background layer
│   │   ├── feature-graphic.svg     ← 1024x500 store banner
│   │   ├── monochrome.svg          ← for themed icons (Android 13+)
│   │   └── splash.svg              ← 1242x2208 launch screen
│   ├── raster/                     ← (generated) PNG output
│   └── adaptive/                   ← (generated) Android adaptive icon set
│
├── screenshots/
│   ├── README.md                   ← screenshot spec + how to capture
│   ├── phone/                      ← 1080x1920 (or 9:16)
│   ├── tablet-7/                   ← 1200x1920
│   └── tablet-10/                  ← 1600x2560
│
└── scripts/
    ├── generate-icons.sh           ← rasterize SVG → all required PNG sizes
    ├── generate-icons.js           ← Node version (uses sharp)
    ├── take-screenshots.js         ← Playwright script to auto-capture screenshots
    └── verify-deploy.sh            ← pre-submission sanity checks
```

---

## 🛣️ Which path to take?

### Recommended: **TWA (Trusted Web Activity)** ⭐
**Best if:** Your app is mostly content + UI and works great in a browser.
- 1 codebase (web + Play Store)
- Updates push instantly (no Play Store review per update)
- Tiny APK (~1-3 MB; just a wrapper)
- Already 95% set up — your `manifest.json` + service worker are ready
- Uses Chrome under the hood — gets browser updates for free

**Constraints:**
- Needs HTTPS domain
- Limited native APIs (no Bluetooth, contacts, etc — but you get push, share, install)
- `assetlinks.json` must be hosted at your domain

### Alternative: **Capacitor**
**Best if:** You need camera, biometrics, deep contacts integration, or full native plugins.
- Wraps your web app with native shell
- Access to 100+ native plugins
- Bigger APK (~10-20 MB)
- Heavier release process (must rebuild + ship every update)

See [`capacitor-alternative.md`](./capacitor-alternative.md).

---

## ✅ Pre-submission checklist

Run through [`release-checklist.md`](./release-checklist.md) before each release. The big ones:

- [ ] App is hosted on HTTPS with a stable domain
- [ ] `manifest.json` has correct `start_url`, icons (192 + 512), `theme_color`, `background_color`
- [ ] `assetlinks.json` deployed at `https://yourdomain.com/.well-known/assetlinks.json`
- [ ] Privacy policy URL is **publicly accessible** (Play Store will reject if 404)
- [ ] At least 2 screenshots (we provide a script)
- [ ] Feature graphic 1024×500 (we provide source)
- [ ] App icon 512×512 (we provide source)
- [ ] Content rating questionnaire completed (answers in [`legal/content-rating.md`](./legal/content-rating.md))
- [ ] Data safety form completed ([`legal/data-safety.md`](./legal/data-safety.md))
- [ ] Target audience selected (we recommend 13+)
- [ ] Pricing & countries set ([`pricing-distribution.md`](./pricing-distribution.md))

---

## 🎯 Submission timeline

| Step | Time |
|------|------|
| Generate icons + screenshots | 30 min |
| Build & test TWA locally | 1 hour |
| Submit to Internal testing track | 15 min |
| Google review (Internal) | ~1 hour |
| Promote to Production | instant |
| First-time review (Production) | 1–7 days |

After first launch, updates go live in **hours**, not days.

---

## 🆘 Got blocked?

| Error | Fix |
|-------|-----|
| "App not installed" / "Conflict" | Sign with same key as previous version |
| Address bar showing in TWA | `assetlinks.json` not matching SHA-256 — verify with [Google's tester](https://developers.google.com/digital-asset-links/tools/generator) |
| Splash screen wrong | Set `splash_color` + `splash_image_url` in `twa-manifest.json` |
| Privacy policy rejected | Must be public URL, not Google Doc — host on your domain |
| Data safety mismatch | All collected data must be declared — see [`legal/data-safety.md`](./legal/data-safety.md) |
