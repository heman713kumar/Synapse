# Data Safety Form Answers

The Data Safety form is **required** for every app on Play Store since July 2022. Lying = takedown + ban.

This file maps every Synapse feature to a Data Safety category. Use it when filling out the form in Play Console → Policy → App content → Data safety.

---

## 1. Does your app collect or share any of the required user data types?

> **Yes** (we collect personal info + app activity)

---

## 2. Is all of the user data collected by your app encrypted in transit?

> **Yes** — TLS 1.3 for every API call

---

## 3. Do you provide a way for users to request that their data is deleted?

> **Yes** — in-app at Settings → Danger zone → Delete account, AND via email **[EMAIL]**

---

## 4. Data types — what we collect

### Personal info
| Type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Name | ✅ Yes | No | Account management, displayed to other users | Required |
| Email address | ✅ Yes | No | Account management, transactional email | Required |
| User ID | ✅ Yes | No | Account management | Required |
| Address | No | No | — | — |
| Phone number | No | No | — | — |
| Race/ethnicity | No | No | — | — |
| Political/religious | No | No | — | — |
| Sexual orientation | No | No | — | — |
| Other personal info | ✅ Yes (bio, headline) | No | Displayed on your public profile | Optional |

### Financial info
| Type | Collected | Shared | Purpose |
|---|---|---|---|
| User payment info | ✅ Yes (processed by Stripe) | Yes (Stripe only) | Pro subscription, bounty payments |
| Purchase history | ✅ Yes | No | Account management, receipts |
| Credit score | No | No | — |
| Other financial info | No | No | — |

### Health and fitness
- **None of these collected**

### Messages
| Type | Collected | Shared | Purpose |
|---|---|---|---|
| Emails | No (we send, not receive into the app) | No | — |
| SMS or MMS | No | No | — |
| Other in-app messages | ✅ Yes (your DMs, comments, forum posts) | No (unless you make them public) | App functionality |

### Photos and videos
| Type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Photos | ✅ Yes (avatar, idea cover) | No | App functionality | Optional |
| Videos | No | No | — | — |

### Audio files
| Type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Voice or sound recordings | No (voice input is processed on-device via Web Speech API) | No | — | — |
| Music files | No | No | — | — |
| Other audio | No | No | — | — |

### Files and docs
- **None collected** (no file uploads beyond images)

### Calendar
- **None collected**

### Contacts
- **None collected** (we never read your contact list)

### App activity
| Type | Collected | Shared | Purpose |
|---|---|---|---|
| App interactions | ✅ Yes | No | Analytics, app functionality |
| In-app search history | ✅ Yes (saved searches feature) | No | App functionality |
| Installed apps | No | No | — |
| Other user-generated content | ✅ Yes (your ideas, comments) | Yes (public when you choose) | Core feature |
| Other actions | ✅ Yes (votes, reactions, achievements) | No | App functionality, gamification |

### Web browsing
- **None collected**

### App info and performance
| Type | Collected | Shared | Purpose |
|---|---|---|---|
| Crash logs | ✅ Yes | Yes (Sentry) | App functionality, fixing bugs |
| Diagnostics | ✅ Yes | Yes (Sentry) | Analytics, fixing bugs |
| Other app performance data | ✅ Yes | No | Analytics |

### Device or other IDs
| Type | Collected | Shared | Purpose |
|---|---|---|---|
| Device or other IDs | ✅ Yes (IP + device fingerprint) | No | Fraud prevention, security |

---

## 5. Security practices

- ✅ **Data is encrypted in transit** (TLS 1.3)
- ✅ **Data is encrypted at rest** (AES-256)
- ✅ **You can request data deletion** (Settings → Danger zone → Delete account)
- ✅ **Independent security review** — yes (annual pen-test)
- ✅ **Committed to Play Families Policy** — N/A (target audience 13+)

---

## 6. Data sharing — who we share with

| Recipient | Data shared | Why |
|---|---|---|
| **Stripe** | Payment info, name, email | Payment processing |
| **Google Cloud (Gemini)** | Idea text when you use AI Coach | AI inference (not used to train models) |
| **Sentry** | Crash logs (PII scrubbed) | Bug tracking |
| **Sendgrid / Mailgun** | Email, name | Transactional email |
| **Supabase** | All app data | Database hosting |
| **Cloudinary** (when wired) | Uploaded images | Image storage + CDN |

We do **not** share data with advertising networks, data brokers, or for any cross-app tracking.

---

## 7. Data collection vs sharing definitions

- **Collect** = transmitted off device for any reason except crash recovery
- **Share** = transferred to a third-party (sub-processors don't count as "share" for this form, but list them anyway for transparency)

Per Play Store rules: **all collection must be disclosed**, even if it's also disclosed in your privacy policy.

---

## 8. After form submission

Google may **manually review** the form. If they think you're under-disclosing:
- You'll get a warning + 14 days to fix
- Repeated issues = removal from store
- Some lies result in immediate ban

If a third-party SDK starts collecting more data, you have **60 days** to update the form.

---

## 9. Quick-reference checklist

- [ ] Privacy policy URL submitted (`https://[DOMAIN]/privacy`)
- [ ] Encryption in transit: Yes
- [ ] Encryption at rest: Yes
- [ ] Delete data path: Settings → Danger zone OR email
- [ ] Target audience: 13+
- [ ] User-generated content: Yes (with moderation)
- [ ] Payment: Stripe (declared)
- [ ] AI features: Google Gemini (declared)
- [ ] No tracking SDKs (no Facebook SDK, no AppLovin, no AdMob)
