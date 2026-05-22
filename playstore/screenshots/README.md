# 📸 Screenshots — Spec & Generation

Play Store requires **at least 2 phone screenshots**. They allow up to 8 per device type. Conversion rates correlate strongly with screenshot quality — invest 1-2 hours here.

---

## Spec

| Device | Dimensions | Aspect | Required? |
|---|---|---|---|
| Phone | 1080×1920 (or 9:16) | 9:16 | **YES** — minimum 2 |
| 7" tablet | 1200×1920 | 5:8 | recommended |
| 10" tablet | 1600×2560 | 5:8 | recommended |
| Wear OS | 384×384 | 1:1 | only if you have Wear support |
| Android TV | 1920×1080 | 16:9 | only if TV-targeted |

Format: **PNG** or **JPEG**, no alpha for JPEG.

---

## Recommended order (which screens to show)

The first **3 screenshots** drive 95% of the install decision. Show the *outcome*, not the *interface*.

1. **Hero shot** — Feed with the gradient hero "Welcome back, [name]" + 2 idea cards. Add a caption: "Where ideas meet the people who build them."
2. **AI in action** — NewIdeaForm with the AI Idea Coach panel expanded showing a result. Caption: "AI helps you refine, analyze, and pitch."
3. **Discovery** — Explore page or Trending tags with the colorful tag cloud. Caption: "Discover what builders are building."
4. **Collaboration** — DiscussionForum with a few messages + member sidebar. Caption: "Real-time forums on every idea."
5. **Mobile-native** — Chat screen with bubbles + reply UI. Caption: "Made for mobile."
6. **Bounties** — Bounties page hero. Caption: "Get paid to ship."
7. **Mentorship** — Mentor cards. Caption: "Office hours with verified founders."
8. **Achievements** — Profile with streak + achievement wall. Caption: "Earn XP, level up, build."

---

## How to capture

### Option A — Browser DevTools (5 min)

Best for quick iterations.

1. Open Chrome → DevTools → Toggle device toolbar (⌘⇧M)
2. Set device: **Pixel 7** (1080×2400, density 3)
3. Visit each page
4. Use `Cmd+Shift+P` → "Capture full size screenshot"
5. Crop to 1080×1920 in any image editor

### Option B — Playwright auto-capture (recommended)

Reproducible, scriptable, works in CI.

```bash
# Install
npm i -D playwright
npx playwright install chromium

# Run our script
node playstore/scripts/take-screenshots.js
```

This visits each defined page, waits for animations to settle, then saves PNGs to `playstore/screenshots/phone/`.

### Option C — Real device (best quality)

1. Install your TWA APK on a Pixel
2. Press **Power + Volume Down** to screenshot
3. Pull files: `adb pull /sdcard/Pictures/Screenshots ./screenshots/phone`

---

## Add marketing overlays

Bare app screenshots convert ~30% worse than ones with overlay text. Use:

- **Figma** with the [Play Store screenshot template](https://www.figma.com/community/file/1167199473267283878)
- **Canva** has free Play Store templates
- **AppLaunchpad** or **Mockuphone** for device frames

Template recipe:
```
┌────────────────────────────┐
│  [BIG CATCHY HEADLINE]     │  ← 20% top
│  [Optional subhead]        │
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │   APP SCREENSHOT     │  │  ← 70% middle
│  │   IN DEVICE FRAME    │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  [Optional CTA]            │  ← 10% bottom
└────────────────────────────┘
```

Keep headlines under 5 words. Use brand gradient (`#6366F1 → #EC4899`).

---

## A/B testing

Once live:
1. Play Console → Grow → Store presence → **Store listing experiments**
2. Create experiment: "Hero screenshot order"
3. Test 2 variants (e.g. screenshot 1 = Feed vs. AI Coach)
4. Run min 7 days, min 5k impressions
5. Pick winner, apply

Typical lift: **5-15% on install rate**.
