# 📦 Building & Submitting the TWA — Step by Step

End-to-end guide from "PWA on the web" to "live on Play Store". Plan ~3 hours for the first submission; ~15 minutes for updates after that.

---

## Prerequisites

- ✅ The PWA is deployed on **HTTPS** with a stable domain (e.g. `synapse.app`)
- ✅ The PWA's `manifest.json` has correct icons, `start_url`, `theme_color`, `display: standalone`
- ✅ A working **service worker** (we have `sw.js` registered in `main.tsx`)
- ✅ You have a **Google Play Developer account** ($25 one-time fee) — sign up at https://play.google.com/console
- ✅ **Node 18+** and **JDK 17** installed
- ✅ Optional: **Android Studio** for testing on device

---

## Step 1 · Install Bubblewrap

```bash
npm i -g @bubblewrap/cli

# verify
bubblewrap --version
```

The first run installs **JDK + Android command-line tools** (~600 MB). Let it.

---

## Step 2 · Generate a signing keystore

This is the cryptographic identity of your app. **Lose it → you can never push another update.** Back it up to 1Password / Bitwarden.

```bash
cd playstore

keytool -genkey -v \
  -keystore android.keystore \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STRONG_PASSWORD \
  -keypass YOUR_STRONG_PASSWORD \
  -dname "CN=Synapse, OU=Mobile, O=Your Company, L=YourCity, ST=YourState, C=US"

# Verify
keytool -list -keystore android.keystore
```

⚠️ **Recommended:** also enroll in **Play App Signing** when submitting. Google manages the signing key for you; you only upload the build. This makes key rotation painless.

---

## Step 3 · Initialize the TWA project

```bash
# Inside playstore/
bubblewrap init --manifest=https://synapse.app/manifest.json
```

Bubblewrap will:
1. Fetch your manifest
2. Ask a few questions (most you can leave default)
3. Generate an Android Studio project + Gradle config

Or use the prepared config:
```bash
cp twa-manifest.json /tmp/twa-manifest.json
bubblewrap init --manifest=/tmp/twa-manifest.json
```

When asked:
- **Package ID**: `app.synapse.twa` (or your own reverse-DNS — **you can't change this**)
- **App name**: `Synapse`
- **Display mode**: `standalone`
- **Theme color**: `#6366F1`
- **Background**: `#0A0A0F`
- **Min SDK**: `24` (Android 7+ = 96% of phones)

---

## Step 4 · Generate the Digital Asset Links file

This proves you own both the website AND the app, which removes the browser URL bar from the TWA.

```bash
# Get your signing key SHA-256 fingerprint
keytool -list -v -keystore android.keystore -alias android | grep SHA256

# Output looks like:
# SHA256: 9E:F2:74:73:5C:11:08:51:5F:CA:B7:8C:1E:84:E9:84:...
```

Open `playstore/well-known/assetlinks.json`, replace `REPLACE_WITH_YOUR_SHA256_FROM_PLAY_CONSOLE` with that fingerprint (keep the colons).

**Deploy it** at:
```
https://synapse.app/.well-known/assetlinks.json
```

→ Must return HTTP 200 + `Content-Type: application/json`
→ Must NOT redirect
→ Must NOT be behind auth

Verify:
```bash
curl -i https://synapse.app/.well-known/assetlinks.json
# or use Google's tool:
# https://developers.google.com/digital-asset-links/tools/generator
```

> 💡 If you use Play App Signing, you'll get a **second** SHA-256 after upload — add it to the array too.

---

## Step 5 · Build the AAB

```bash
bubblewrap build

# This produces:
#   app-release-bundle.aab    ← upload this to Play Store
#   app-release-signed.apk    ← for sideload testing
```

First build takes 3-5 min. Subsequent builds ~30s.

---

## Step 6 · Test the APK locally

```bash
adb install app-release-signed.apk
# Open on phone → should launch fullscreen with no URL bar
# If you see a URL bar → assetlinks.json isn't matching. Re-check Step 4.
```

Or open in Android Studio emulator:
```bash
emulator -list-avds
emulator -avd Pixel_6_API_34
adb install app-release-signed.apk
```

---

## Step 7 · Set up Play Console

1. Go to https://play.google.com/console → **Create app**
2. Fill in:
   - App name: `Synapse`
   - Default language: `English (United States)`
   - App or game: **App**
   - Free or paid: **Free** (you can add IAP later)
3. Accept the declarations

### Required content checklist
Play Console shows a sidebar with all required tasks:

- [ ] **Privacy policy URL** — paste `https://synapse.app/privacy`
- [ ] **App access** — "All functionality is available without special access" (or describe demo creds)
- [ ] **Ads** — "No, my app does not contain ads"
- [ ] **Content rating** — fill IARC questionnaire (use [`legal/content-rating.md`](./legal/content-rating.md))
- [ ] **Target audience** — 13 and up
- [ ] **News app?** — No
- [ ] **COVID-19 contact tracing?** — No
- [ ] **Data safety** — fill form (use [`legal/data-safety.md`](./legal/data-safety.md))
- [ ] **Government app?** — No
- [ ] **Financial features?** — Yes if you have Bounties/Premium (declare Stripe)

### Store listing
Path: Play Console → Grow → Store presence → Main store listing

- App name: `Synapse: Ideas + Collaboration` (max 30)
- Short description: paste from `listing/short-description.txt`
- Full description: paste from `listing/full-description.md`
- App icon: `icons/raster/icon-512.png` (generated by `scripts/generate-icons.sh`)
- Feature graphic: rasterize `icons/source/feature-graphic.svg` to PNG 1024×500
- Phone screenshots: 2-8 from `screenshots/phone/`
- Tablet screenshots (optional but rec): from `screenshots/tablet-7/` and `screenshots/tablet-10/`
- Category: `Social` (or `Productivity`)
- Email: `support@synapse.app`
- Website: `https://synapse.app`

---

## Step 8 · Upload + release

1. Path: Play Console → Release → Testing → **Internal testing**
2. **Create new release**
3. Upload `app-release-bundle.aab`
4. Release notes: paste from `listing/whats-new.txt`
5. Roll out → Save → Review release → **Start rollout**

### After Internal testing
- Add yourself as a tester: Release → Internal testing → Testers → Add email
- Wait ~15 min for the email link to work
- Install via the link, test thoroughly

### Promote to Production
Once everything works:
1. Play Console → Release → Production
2. Create new release → copy from Internal
3. Roll out at 5% → wait a few days → 20% → 50% → 100%

First production review: **1–7 days**. Subsequent updates: **~hours**.

---

## Step 9 · Updates (the easy part)

After the first release, updating is fast:

```bash
# Bump version in twa-manifest.json:
#   "appVersionCode": 2     ← MUST be > previous
#   "appVersionName": "1.0.1"

bubblewrap update         # regenerate Android project
bubblewrap build          # produces new .aab

# Upload to Play Console → Production → Create release
```

> 💡 For TWAs, you usually don't need to ship a new APK for content/UI changes — those update instantly from your web deploy. You only need a new APK when you change:
> - Package version (e.g. for new Play Console features)
> - Native config (theme color, splash, etc)
> - Manifest URL or origin

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| **URL bar shows in app** | `assetlinks.json` mismatch. Recheck SHA-256, redeploy, wait 5min, force-stop app, reopen. |
| **"App not installed: package conflicts"** | Different signing key from previous version. Use the same keystore OR change packageId (not recommended). |
| **Splash flickers / wrong color** | Set `backgroundColor` in `twa-manifest.json` to match your hero gradient base. |
| **"Your app uses a permission that needs declaration"** | Play Console wants you to explain why. Notifications + Internet usually fine; declare anything else. |
| **Stuck on white screen** | Service worker bug. Test PWA in Chrome incognito first — if it breaks, fix the SW. |
| **"Your data safety form is incomplete"** | Some collected data type isn't declared. Cross-check with `legal/data-safety.md`. |
| **Review rejected for content** | Read the rejection carefully. Usually: missing privacy policy URL, mature content, or misleading screenshots. Resubmit after fixing. |

---

## ✅ You're done

Your PWA is now on the Play Store. Updates push in minutes. Reviews trickle in. Welcome to mobile! 🎉

Next steps:
- Set up **Play Console alerts** for crashes & ANRs
- Wire **GA4 / Firebase** for install/uninstall tracking
- Add a **review prompt** in-app after 5+ sessions
- Plan your **iOS launch** — same PWA can be wrapped with [PWABuilder](https://www.pwabuilder.com) for iOS too
