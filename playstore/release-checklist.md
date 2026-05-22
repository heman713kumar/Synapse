# ✅ Release Checklist

Tick every box before clicking "Roll out". Skipping one of these is the #1 reason apps get rejected or break for users.

---

## 🌐 Web side (your PWA)

- [ ] App deployed to **HTTPS** (no mixed content warnings)
- [ ] `manifest.json` includes:
  - [ ] `name`, `short_name`, `description`
  - [ ] Icons: 192×192 + 512×512 minimum, with `purpose: "any"` and `purpose: "maskable"`
  - [ ] `start_url`, `scope`, `display: "standalone"`
  - [ ] `theme_color` matching Play Store theme color
  - [ ] `background_color`
- [ ] Service worker registers without errors (check DevTools → Application → Service Workers)
- [ ] App works offline for cached pages
- [ ] Lighthouse PWA score ≥ 90
- [ ] `https://yourdomain.com/.well-known/assetlinks.json` returns valid JSON with your SHA-256
- [ ] Privacy policy URL is **publicly accessible** (test in incognito)
- [ ] Terms of Service URL is **publicly accessible**

```bash
# Quick validation:
./playstore/scripts/verify-deploy.sh https://synapse.app
```

---

## 📦 Assets

- [ ] App icon **512×512** PNG (`icons/raster/icon-512.png`)
- [ ] Feature graphic **1024×500** PNG (`icons/raster/feature-graphic-1024x500.png`)
- [ ] **2-8 phone screenshots** (`screenshots/phone/`)
- [ ] **2-8 tablet screenshots** (`screenshots/tablet-7/`, `screenshots/tablet-10/`) — optional but recommended
- [ ] Promo video (optional, but +10-20% install rate)
- [ ] Splash screen renders correctly on the device

---

## 📝 Store listing

- [ ] App title (≤ 30 chars): `Synapse: Ideas + Collaboration`
- [ ] Short description (≤ 80 chars) from `listing/short-description.txt`
- [ ] Full description (≤ 4000 chars) from `listing/full-description.md`
- [ ] Release notes from `listing/whats-new.txt` (≤ 500 chars per locale)
- [ ] Contact email (support@yourdomain)
- [ ] Privacy policy URL
- [ ] Category: **Social** or **Productivity** (pick one)
- [ ] Tags: 5 tags chosen
- [ ] **App access**: declare any login walls or demo creds for the reviewer
- [ ] Localizations: add at least Spanish + Hindi for global reach

---

## 🛡️ Compliance

- [ ] **Content rating** questionnaire submitted (use `legal/content-rating.md`)
- [ ] **Data safety** form complete (use `legal/data-safety.md`)
- [ ] **Target audience** set (we recommend 13+)
- [ ] **Ads declaration**: "Contains ads" toggle correct
- [ ] **News app?** No
- [ ] **Government app?** No
- [ ] **COVID-19?** No
- [ ] **Financial features?** Yes (if you charge for Pro/Bounties via Stripe)
- [ ] **Health features?** No
- [ ] **Children's app?** No
- [ ] **Google Play Families policy compliance?** N/A (target 13+)

---

## 🔐 Security & signing

- [ ] Generated `android.keystore` with strong password
- [ ] Keystore backed up to password manager (1Password / Bitwarden / Vault)
- [ ] Enrolled in **Play App Signing** (recommended — Google manages the production key)
- [ ] SHA-256 fingerprint added to `assetlinks.json`
- [ ] `assetlinks.json` deployed and tested
- [ ] No API keys or secrets baked into the AAB (use env vars in your backend)
- [ ] `release` build is minified (default for Vite production)

---

## 🚦 Release tracks (use them!)

Use Play Console's progressive rollout:

1. **Internal testing** (you + 5-10 trusted people) — 1 hour review
2. **Closed testing** (alpha — invite-only via email or Google Group) — 1-2 days
3. **Open testing** (beta — anyone can opt-in) — optional
4. **Production** at 5% → 20% → 50% → 100% over 1-2 weeks

This catches crashes before everyone gets the broken version.

---

## 📊 Pre-launch metrics setup

- [ ] **Sentry** (or equivalent) wired for crash reporting
- [ ] **Firebase / GA4** for install + retention tracking
- [ ] **Play Console** crash & ANR alerts: enabled (Settings → Alerts)
- [ ] **Play Console** ratings alerts: enabled
- [ ] A **status page** ready in case something breaks

---

## 🚨 Day-1 monitoring

For the first 48 hours after launch:

- [ ] Watch crash rate hourly (target < 1%)
- [ ] Watch ANR rate hourly (target < 0.5%)
- [ ] Read every 1-2 star review and respond
- [ ] Have a rollback plan: keep previous version's AAB ready
- [ ] Be in the same time zone as your largest user base
- [ ] Tweet / email / blog about launch

---

## 🎉 Day-1 launch checklist

- [ ] Listing live? Check from a friend's phone
- [ ] Search "Synapse" in Play Store — does it show up?
- [ ] Install from store, sign up fresh — does the flow work?
- [ ] PWA install still works on web (don't break that to push Android)
- [ ] Social media posts queued (Twitter, LinkedIn, HN, Reddit)
- [ ] Press kit ready at `synapse.app/press`
- [ ] Email list announcement queued
- [ ] Discord / Slack community post

---

## 🔁 Per-update checklist (after launch)

For every subsequent release:

- [ ] Bump `appVersionCode` in `twa-manifest.json` (e.g. 1 → 2)
- [ ] Bump `appVersionName` to match semver
- [ ] Update `listing/whats-new.txt` with release highlights
- [ ] Run `bubblewrap update && bubblewrap build`
- [ ] Test the new AAB on at least 2 different devices
- [ ] Upload to **Internal testing** first → roll out to Production
- [ ] Monitor for 24h before declaring "stable"
