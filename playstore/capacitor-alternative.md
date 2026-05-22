# Capacitor — when TWA isn't enough

Use this path if you need any of:
- 📷 Camera (live preview, not just file picker)
- 👆 Biometrics (fingerprint / face)
- 📍 Background location
- 📲 Native share sheet beyond `navigator.share`
- 📇 Contacts / Calendar
- 🔵 Bluetooth / NFC
- 🔔 More control over push (FCM vs. Web Push)
- 💳 Google Pay (instead of Stripe Elements)

Otherwise, **stick with TWA** — it's simpler, smaller, and updates instantly.

---

## Setup

```bash
# Inside your project root (NOT inside playstore/)
npm i -D @capacitor/cli @capacitor/core @capacitor/android
npx cap init "Synapse" "app.synapse.android" --web-dir=dist

# Add Android platform
npx cap add android

# After each web build:
npm run build
npx cap copy android
npx cap open android   # opens Android Studio
```

---

## capacitor.config.ts

Create at project root:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.synapse.android',
  appName: 'Synapse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For dev hot-reload:
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,
  },
  android: {
    backgroundColor: '#0A0A0F',
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0F',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#6366F1',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

---

## Useful plugins for Synapse

```bash
npm i @capacitor/splash-screen
npm i @capacitor/status-bar
npm i @capacitor/push-notifications
npm i @capacitor/share
npm i @capacitor/camera
npm i @capacitor/preferences
npm i @capacitor/network
npm i @capacitor/haptics
```

Example: native share sheet
```ts
import { Share } from '@capacitor/share';

await Share.share({
  title: idea.title,
  text: idea.summary,
  url: `https://synapse.app/i/${idea.id}`,
  dialogTitle: 'Share idea',
});
```

Example: take photo for profile
```ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const image = await Camera.getPhoto({
  quality: 90,
  allowEditing: true,
  source: CameraSource.Prompt, // user picks camera or gallery
  resultType: CameraResultType.Uri,
});
// image.webPath → use in <img src=...>
```

---

## Detect Capacitor at runtime

Wrap web-only fallbacks:

```ts
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Use Capacitor APIs
} else {
  // Use web APIs (navigator.share, etc)
}
```

---

## Build → AAB

```bash
# From project root
npm run build
npx cap copy android
npx cap open android

# In Android Studio: Build → Generate Signed Bundle → AAB
# Use the same keystore from playstore/android.keystore
```

The resulting `.aab` uploads to Play Console exactly like the TWA AAB.

---

## TWA vs. Capacitor comparison

| | TWA | Capacitor |
|---|---|---|
| Setup time | 30 min | 2 hours |
| APK size | 1-3 MB | 8-20 MB |
| Updates | Instant (web deploy) | Must rebuild + ship |
| Native APIs | Limited (Web APIs only) | 100+ plugins |
| Performance | = browser | = browser |
| Offline | Service Worker | Service Worker + plugins |
| Push notifications | Web Push (limited iOS) | FCM (full) |
| App Store review per update | No | Yes |

**My recommendation:** start with TWA. Switch to Capacitor only when you hit a hard wall.

---

## Don't ship both

You'd have to maintain two Play Store listings (different package IDs) with confused users. Pick one and stick with it.
