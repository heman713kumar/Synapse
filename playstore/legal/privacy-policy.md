# Privacy Policy

**Last updated:** [LAUNCH DATE]
**Effective:** [LAUNCH DATE]

> ⚠️ **Action required before publishing:** Replace `[DOMAIN]`, `[EMAIL]`, `[COMPANY LEGAL NAME]`, and `[COUNTRY]` placeholders, then host this at `https://[DOMAIN]/privacy` (URL must be publicly accessible). Play Store will reject the listing if the link is broken or behind a login.

---

## 1. Who we are

[COMPANY LEGAL NAME] (the "Company", "we", "us") operates the Synapse mobile and web application (the "Service"). We are based in [COUNTRY] and you can reach our data protection officer at **[EMAIL]**.

## 2. What we collect

We collect the **minimum** data needed to operate the Service:

### 2.1 You give us directly
- **Account info:** name, email, password (hashed with bcrypt — we never store plain text), profile photo, bio, social URLs
- **Content you create:** ideas, comments, forum messages, direct messages, achievements, bookmarks
- **Settings & preferences:** theme, notification preferences, accessibility settings, language
- **Payment info:** processed by **Stripe** — we store only the last 4 digits and card brand for receipts

### 2.2 Collected automatically
- **Device info:** OS version, app version, screen size, language, time zone
- **Usage analytics:** which screens you visit, click events (no PII)
- **Crash logs:** stack traces (no message contents or personal data)
- **IP address:** stored for 30 days for security/abuse prevention, then truncated

### 2.3 From third parties (only if you opt in)
- **LinkedIn** (if you use Import from LinkedIn): public profile fields only
- **Google / GitHub OAuth** (if you sign in that way): name, email, avatar

### 2.4 What we do NOT collect
- ❌ Location data
- ❌ Contacts / address book
- ❌ Photos / files outside what you explicitly upload
- ❌ Microphone unless you press the voice-note button
- ❌ Health / financial / biometric / sensitive personal information

## 3. How we use it

| Use case | Lawful basis (GDPR Art. 6) |
|---|---|
| Run the Service (auth, profile, content) | Performance of contract |
| Improve the product (analytics) | Legitimate interests, opt-in for marketing analytics |
| Detect abuse / fraud / spam | Legitimate interests, legal obligation |
| Send transactional emails (signup, password reset) | Performance of contract |
| Send weekly digest / marketing | Consent (you can unsubscribe anytime) |
| AI features (idea coach, summaries) | Performance of contract |

## 4. Who we share with

We **never sell** your personal data. We share only with:

- **Stripe** — payment processing ([privacy](https://stripe.com/privacy))
- **Google Cloud (Gemini API)** — AI inference; your idea text is sent for processing but not used to train Google's models
- **Sendgrid / Mailgun** — transactional email
- **Supabase** — database hosting
- **Sentry** — error tracking (PII-scrubbed)
- **Authorities** — only when legally compelled by valid court order, with notice to you where allowed

All sub-processors are GDPR-compliant. Full list at [DOMAIN]/subprocessors.

## 5. How long we keep it

| Data type | Retention |
|---|---|
| Account + content | Until you delete your account (then 30-day grace period) |
| IP address | 30 days |
| Crash logs | 90 days |
| Email server logs | 14 days |
| Stripe transaction records | 7 years (legal requirement) |
| Marketing email opt-outs | Indefinite (so we don't re-email you) |

## 6. Your rights

Regardless of where you live, you can:

- **Access** all your data — Settings → Privacy → Download my data (JSON or CSV)
- **Correct** anything wrong — Settings → Profile
- **Delete** your account — Settings → Danger zone → Delete account (30-day grace)
- **Opt out** of marketing — Settings → Notifications

### Extra rights for EU/UK (GDPR), California (CCPA), Brazil (LGPD)

- Right to data portability
- Right to restrict processing
- Right to object to processing
- Right to lodge a complaint with your supervisory authority
- No discrimination for exercising your rights

Email **[EMAIL]** to exercise these. We respond within 30 days.

## 7. Children

Synapse is **not directed to children under 13** (or 16 in the EU). We do not knowingly collect data from children. If you believe we have, email **[EMAIL]** and we'll delete it within 14 days.

## 8. Cookies and similar

We use the bare minimum:
- **Essential cookies** — keeping you logged in
- **Functional cookies** — remembering theme, saving drafts (only with consent)
- **Analytics cookies** — opt-in
- **Marketing cookies** — opt-in

Manage via the in-app cookie banner or Settings → Privacy.

## 9. International transfers

Data may be processed in countries other than where you live. We use **Standard Contractual Clauses** (SCCs) and Google Cloud regions matching your geography where possible.

## 10. Security

- All data in transit: **TLS 1.3**
- All data at rest: **AES-256**
- Passwords: **bcrypt** with cost factor 12
- Optional **2FA** (TOTP) for your account
- Regular penetration testing
- Bug bounty program at [DOMAIN]/security

In the unlikely event of a breach affecting your data, we'll notify you within **72 hours** as required by GDPR Art. 33.

## 11. Changes

We'll post material changes here and email registered users at least 30 days before they take effect.

## 12. Contact

- General: **[EMAIL]**
- Data Protection Officer: **dpo@[DOMAIN]**
- Postal address: [COMPANY LEGAL NAME], [STREET], [CITY], [COUNTRY]

EU/UK users: our Article 27 representative is [REPRESENTATIVE NAME + ADDRESS].
