# 💰 Pricing & Distribution

How to configure pricing, countries, in-app purchases, and rollout strategy.

---

## App pricing model

Synapse uses **Freemium**:
- **Free** — full read + post + chat
- **Pro** ($9/mo or $84/yr) — unlimited AI, private ideas, custom themes
- **Investor** ($49/mo or $490/yr) — deal-flow dashboard

In Play Console:
- App listing price: **Free**
- In-app products / subscriptions: configured separately

---

## In-app purchases (when ready)

> ⚠️ Google requires **Google Play Billing** for digital goods sold inside an Android app, with limited carve-outs.

### Option A — Use Google Play Billing

- Required for subscriptions you sell *inside* the Android app
- Google takes 15% (year 1) / 30% (year 2+) of consumer subs
- Setup: Play Console → Monetize → Products → Subscriptions
- SDK: `com.android.billingclient:billing` (already available via Capacitor or in TWA via Trusted Web Activity Billing API)

### Option B — Sell outside the app (Stripe)

If you direct users to your **website** for upgrades, Stripe charges 2.9% + 30¢ (~6x cheaper).
- ✅ Allowed if the link goes to your website outside the app
- ❌ Disallowed if the upgrade flow runs inside the app
- Many apps (Netflix, Spotify) do this

> For Synapse, **start with Stripe-on-web** to maximize margins, then add Play Billing later for friction reduction.

---

## Countries & languages

### Country availability
Play Console → Production → Countries / regions

Recommendations:
- **Start with English-speaking** countries: US, UK, Canada, AU, NZ, IE, IN, SG, ZA
- **Add Europe** after 30 days (need GDPR processes proven)
- **Hold off on China** (Play Store doesn't operate there; alternative: APKPure, Huawei AppGallery)
- **Skip embargoed countries** automatically (Crimea, Cuba, Iran, North Korea, Syria)

### Localizations
Even without translating the app, you can localize **the listing**:

| Language | Lift in installs |
|---|---|
| Spanish (LatAm) | +20-40% |
| Hindi (India) | +30% |
| Portuguese (Brazil) | +15% |
| German | +10% |
| Japanese | +5-10% (low Play Store share but high-spend users) |

Use **DeepL** for the first pass. Hire a native speaker proofreader for the top 3 languages.

---

## Pricing strategy

### Free tier should be generous

- Goal: viral loops. Users invite collaborators because the free tier works.
- Don't gate core features behind paywalls early on
- Show "Upgrade to Pro" tasteful prompts at moments of high value (e.g. after the 10th AI call)

### Pro pricing benchmark

| Competitor | Free | Pro |
|---|---|---|
| Notion | Generous | $10/mo |
| Linear | 250 issues | $8/user/mo |
| Figma | Free | $12/mo |
| Bear Notes | Limited | $3/mo |
| Synapse (us) | Generous | **$9/mo** ← right in the middle |

### Annual discount

20% off annual is standard. Synapse: $9/mo or $7/mo billed annually ($84). Conversion to annual: typically 30-50% of paid users.

---

## Promo strategies

### Promo codes (Play Console)
- Generate up to **500/year** for free
- Path: Play Console → Monetize → Promo codes
- Use for press, beta testers, contests

### Founder discount
Code `FOUNDER50` for 50% off first year, distributed via:
- Email signup confirmation
- Reddit / IndieHackers launch posts
- Product Hunt launch

### Free trial
- **14 days, no card** — high signal of intent, low friction
- Or **30 days with card** — better conversion, higher friction
- Default to no-card for indie/SaaS apps

---

## Rollout strategy

### Staged production rollout

Don't release to 100% on day 1. Catches crashes before they hit everyone:

| Day | % of users | Action if crash rate > 1% |
|---|---|---|
| Day 0 | 5% | Pause rollout, investigate |
| Day 2 | 20% | Pause if crash rate spiked |
| Day 5 | 50% | Pause if reviews crater |
| Day 7 | 100% | 🎉 |

### Halt rollout
If something breaks, Play Console lets you **halt the rollout** with one click. The previous version stays installed for existing users until they accept the update.

---

## Refunds & subscriptions

### Refund policy
- Play Store users can request refunds within **48 hours** automatically (no questions asked)
- After 48h, Google sends the request to you — you decide
- Recommended: **always refund** unless clear abuse (cost is < $0.50 on most subs)

### Subscription cancellation
- Users cancel from their Google Play account (not your app)
- They keep access until end of period
- You're notified via webhook (set up at `playstore/subscriptions/webhook-url`)

### Voluntary churn metrics
- < 5% monthly = healthy
- 5-10% = acceptable
- &gt; 10% = something is wrong with the product

---

## Tax & legal setup

Before you can charge:
- [ ] Play Console → Setup → Payment settings → enter bank account
- [ ] Tax info: W-9 (US) or W-8BEN (international)
- [ ] Set up tax rates per country (EU VAT is complex — Stripe Tax can help)
- [ ] Add a registered business entity (LLC or similar) — required in most countries

### Revenue split

| What | Google takes |
|---|---|
| First $1M/year on subs (Year 2+) | 15% |
| Subs revenue beyond $1M/year | 30% |
| One-time purchases | 30% (15% if part of Play Media Experience Program) |

---

## Hold-back countries

Manually exclude before launch if:

- You can't comply with local data residency laws (e.g. Russia, China)
- You don't have GDPR / CCPA / LGPD processes ready
- You can't fulfill tax obligations (e.g. India GST)

Add them back later as your processes mature.
