# 🛠 Backend Expansion — what was added

This document covers the backend infrastructure added on top of the original Synapse API to support every feature you've built in the frontend.

---

## What's new

### 📦 Database (migration `002_full_feature_expansion.sql`)
26 new tables organized into 13 feature groups:

| Group | Tables |
|---|---|
| Reactions | `idea_reactions`, `comment_reactions` |
| Hashtags | `tags`, `idea_tags`, `tag_followers` |
| Bounties | `bounties`, `bounty_applications` |
| Jobs | `jobs`, `job_applications` |
| Mentorship | `mentors`, `mentorship_bookings` |
| Polls | `polls`, `poll_options`, `poll_votes` |
| Gamification | `user_xp`, `xp_events`, `quest_progress` |
| Developer | `api_keys`, `webhooks`, `webhook_deliveries` |
| Push | `push_subscriptions` |
| Realtime | `user_presence`, `yjs_documents` |
| GDPR | `pending_deletions`, `data_export_jobs`, `cookie_consent_log`, `audit_log` |
| Discovery | `follows`, `saved_searches`, `daily_prompts`, `roadmap_items`, `roadmap_votes` |
| Investor | `deal_flow` |
| Billing | `subscriptions` |

Run:
```bash
psql $DATABASE_URL -f migrations/002_full_feature_expansion.sql
```

---

### 🔌 New routes (13 files)

| Route | Mounts at | Purpose |
|---|---|---|
| `billing.routes.ts` | `/api/billing` | Stripe checkout, portal, webhook, Connect |
| `bounties.routes.ts` | `/api/bounties` | Bounty CRUD + escrow + apply/accept/complete |
| `jobs.routes.ts` | `/api/jobs` | Job board CRUD + applications |
| `mentorship.routes.ts` | `/api/mentorship` | Mentor profiles + bookings + reviews |
| `polls.routes.ts` | `/api/polls` | Create polls + vote |
| `reactions.routes.ts` | `/api/reactions` | Emoji reactions on ideas + comments |
| `gamification.routes.ts` | `/api/gamification` | XP / quests / streaks / leaderboards |
| `developer.routes.ts` | `/api/developer` | API keys + webhooks |
| `push.routes.ts` | `/api/push` | Subscribe / unsubscribe / test push |
| `gdpr.routes.ts` | `/api/gdpr` | Data export, account deletion, consent log |
| `public.routes.ts` | `/api/public` | Public stats, status, hashtags, OG/SSR pages, roadmap |
| `ai-extended.routes.ts` | `/api/ai` | Thread summary, smart match, pitch (extends existing AI routes) |

All registered in `src/index.ts` automatically.

---

### ⚙ New services

| Service | What it does |
|---|---|
| `stripeService.ts` | Subscriptions, bounty escrow, Connect for payouts, webhook handling |
| `pushService.ts` | Web Push delivery + auto-cleanup of dead subscriptions |
| `digestService.ts` | Weekly digest email rendering + sending |
| `cronRunner.ts` | Scheduler for digests, account-deletion finalization, webhook retries, tag scoring |

---

### 🛰 Realtime expansion (`sockets/realtime.ts`)

Plugs into your existing Socket.IO server. Adds:
- **Presence** (online / away / busy) with auto-cleanup on disconnect
- **Room membership** for forums, idea boards, ideas, chats
- **Typing indicators** scoped to a room
- **Live cursors** (Figma-style) for collaborative boards
- **Yjs CRDT hub** for real-time document editing (idea boards, kanban, docs)

Wired in `index.ts`:
```ts
const io = setupSocketIO(server);
attachRealtime(io);
startCron();
```

---

### 🌍 Internationalization

Frontend hook `src/hooks/useI18n.ts` + locale files in `src/locales/`:
- `en.json` — English (default)
- `es.json` — Spanish
- `hi.json` — Hindi

Auto-detects from browser `navigator.language`, stores override in `localStorage`. Use:
```ts
const { t, locale, setLocale } = useI18n();
t('feed.greeting_morning', { name: 'Alex' });
```

---

## How to deploy

1. **Database migrations**
   ```bash
   psql $DATABASE_URL -f migrations/001_add_2fa_rbac_audit.sql
   psql $DATABASE_URL -f migrations/002_full_feature_expansion.sql
   ```

2. **Install new dependencies**
   ```bash
   cd backend
   npm install stripe web-push node-cron yjs y-leveldb
   npm install -D @types/web-push @types/node-cron
   ```

3. **Set up `.env`** — copy `.env.example` and fill keys. The minimum to launch:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `APP_URL`
   - `CORS_ORIGIN`

   Everything else is optional and degrades gracefully:
   - No `STRIPE_*` → billing routes return errors but app works
   - No `VAPID_*` → push routes return null
   - No `SENDGRID_API_KEY` → digests log but don't send

4. **Run**
   ```bash
   npm run dev    # development with auto-reload
   npm run build  # compile TypeScript
   npm start      # production
   ```

5. **Stripe webhook setup** (once Stripe keys are added):
   ```bash
   stripe listen --forward-to localhost:3001/api/billing/webhook
   # Copy the whsec_... it prints into STRIPE_WEBHOOK_SECRET
   ```

---

## ✅ What's now possible (feature → backend ready)

| Frontend feature | Backend endpoint | Status |
|---|---|---|
| Stripe checkout from Premium page | `POST /api/billing/checkout` | ✅ |
| Bounty escrow flow | `POST /api/bounties` → Stripe PI | ✅ |
| Job board apply | `POST /api/jobs/:id/apply` | ✅ |
| Book a mentor | `POST /api/mentorship/bookings` | ✅ |
| Emoji reactions on ideas | `POST /api/reactions/ideas/:id` | ✅ |
| Create + vote on polls | `POST /api/polls`, `/api/polls/:id/vote` | ✅ |
| XP + quests + streaks | `/api/gamification/*` | ✅ |
| API keys + webhooks | `/api/developer/*` | ✅ |
| Web Push notifications | `/api/push/*` + service worker | ✅ |
| Data export + 30-day delete | `/api/gdpr/*` | ✅ |
| Public stats, status, OG pages | `/api/public/*` | ✅ |
| AI thread summary | `POST /api/ai/summarize-thread` | ✅ |
| Smart collaborator match | `GET /api/ai/match/:ideaId` | ✅ |
| Real-time live cursors | Socket events `cursor:move` | ✅ |
| Real-time presence | Socket events `presence:*` | ✅ |
| Yjs collaborative editing | Socket events `yjs:*` | ✅ |
| Roadmap voting | `/api/public/roadmap` + `:id/vote` | ✅ |
| Weekly digest emails | `cronRunner` Sunday 09:00 UTC | ✅ |
| Trending tags | `/api/public/tags/trending` (nightly recompute) | ✅ |
| Account deletion grace | `cronRunner` daily 03:00 UTC | ✅ |
| Webhook retries | `cronRunner` every 5min | ✅ |

---

## 🟡 What still requires real infrastructure (not just code)

These are services to **provision + configure**, not write code for:

| What | Where to get it |
|---|---|
| **Stripe account** | https://dashboard.stripe.com → create products + Connect onboarding |
| **VAPID keys** | `npx web-push generate-vapid-keys` — one-time generation |
| **Email provider** | SendGrid, Mailgun, Postmark, or Resend account |
| **Cloudinary** (for image uploads) | https://cloudinary.com free tier |
| **OAuth apps** | Google Console, GitHub Developer Settings, LinkedIn Developer |
| **Sentry project** | https://sentry.io |
| **PostHog** (analytics) | https://posthog.com |
| **Algolia** (search — optional) | https://algolia.com |
| **Redis** (rate-limit / queues — optional) | Upstash, Redis Cloud, or self-host |
| **Daily.co / LiveKit** (video calls) | Need integration code in addition to API key |

---

## 🚧 What's still NOT built (genuinely needs work)

Things that need substantial implementation beyond just plugging in keys:

1. **Native iOS/Android apps** — TWA path is in `playstore/`; full native would be Capacitor (`playstore/capacitor-alternative.md`)
2. **Server-side rendering for SPA** — `public.routes.ts` provides OG-only HTML for crawlers, but for full SSR you'd need Next.js or Astro instead of Vite SPA
3. **Email inbound parsing** (reply-to-thread by email) — needs Mailgun Routes + handler service
4. **Real video calls** — code stub in mentorship; needs Daily.co/LiveKit room creation + JWT signing
5. **Live document collab UI on the client** — backend Yjs hub is ready; needs `y-websocket` client wiring in your IdeaBoard component
6. **Search indexing** — Postgres FTS works for early stage; Algolia indexer service for scale
7. **Mobile app store listings** — fill in placeholders in `playstore/legal/*`
8. **Real translations** — locale files have UI strings; need professional translation for marketing copy
9. **Push notification UI** — service is ready; needs client-side `permission` prompt + subscribe call
10. **Background workers** — `cronRunner` uses `node-cron` in-process; for scale, move to BullMQ + separate worker dyno

---

## 📊 Files added this session

```
backend/
├── migrations/002_full_feature_expansion.sql   (26 tables)
├── src/services/
│   ├── stripeService.ts                        (Stripe billing + escrow + Connect)
│   ├── pushService.ts                          (Web Push delivery)
│   ├── digestService.ts                        (Weekly digest emails)
│   └── cronRunner.ts                           (Scheduled jobs)
├── src/sockets/realtime.ts                     (Presence + cursors + Yjs hub)
└── src/routes/
    ├── billing.routes.ts                       (8 endpoints)
    ├── bounties.routes.ts                      (8 endpoints)
    ├── jobs.routes.ts                          (5 endpoints)
    ├── mentorship.routes.ts                    (7 endpoints)
    ├── polls.routes.ts                         (3 endpoints)
    ├── reactions.routes.ts                     (3 endpoints)
    ├── gamification.routes.ts                  (8 endpoints)
    ├── developer.routes.ts                     (8 endpoints)
    ├── push.routes.ts                          (4 endpoints)
    ├── gdpr.routes.ts                          (5 endpoints)
    ├── public.routes.ts                        (8 endpoints)
    └── ai-extended.routes.ts                   (3 endpoints)

src/
├── hooks/useI18n.ts                            (i18n hook)
└── locales/{en,es,hi}.json                     (translation files)
```

**Total:** ~3500 lines of backend code + 26 DB tables + 70+ new API endpoints + 3 locales.
