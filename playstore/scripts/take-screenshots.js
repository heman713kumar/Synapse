#!/usr/bin/env node
/**
 * Auto-capture Play Store screenshots with Playwright.
 *
 * Usage:
 *   1. Make sure your app is running locally (e.g. `npx vite` → http://localhost:5173/Synapse/)
 *   2. npm i -D playwright && npx playwright install chromium
 *   3. node playstore/scripts/take-screenshots.js
 *
 * Output: playstore/screenshots/{phone,tablet-7,tablet-10}/*.png
 */
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.SYNAPSE_URL || 'http://localhost:5173/Synapse/';
const OUT_DIR = path.resolve(__dirname, '..', 'screenshots');

// Pages to capture — these match Synapse's route names
const PAGES = [
  { id: '01-feed',         path: '/',                  desc: 'Personalized feed' },
  { id: '02-explore',      path: '/?nav=explore',      desc: 'Explore ideas' },
  { id: '03-idea-detail',  path: '/?nav=idea-demo',    desc: 'Idea with collaborators' },
  { id: '04-new-idea',     path: '/?nav=new-idea',     desc: 'New idea + AI coach' },
  { id: '05-forum',        path: '/?nav=forum-demo',   desc: 'Discussion forum' },
  { id: '06-chat',         path: '/?nav=chat-demo',    desc: 'Real-time chat' },
  { id: '07-profile',      path: '/?nav=profile',      desc: 'Your profile' },
  { id: '08-bounties',     path: '/?nav=bounties',     desc: 'Bounties + cash rewards' },
  { id: '09-trending',     path: '/?nav=trendingTags', desc: 'Trending tags' },
  { id: '10-leaderboard',  path: '/?nav=leaderboard',  desc: 'Leaderboard' },
];

const DEVICES = [
  { name: 'phone',     dir: 'phone',     viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 },
  { name: 'tablet-7',  dir: 'tablet-7',  viewport: { width: 1200, height: 1920 }, deviceScaleFactor: 1 },
  { name: 'tablet-10', dir: 'tablet-10', viewport: { width: 1600, height: 2560 }, deviceScaleFactor: 1 },
];

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function captureForDevice(browser, deviceCfg) {
  const outDir = path.join(OUT_DIR, deviceCfg.dir);
  await ensureDir(outDir);

  const context = await browser.newContext({
    viewport: deviceCfg.viewport,
    deviceScaleFactor: deviceCfg.deviceScaleFactor,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36',
    colorScheme: 'dark',
  });

  // Skip the cookie banner + onboarding tour by pre-seeding localStorage
  await context.addInitScript(() => {
    localStorage.setItem('synapse-cookie-consent', JSON.stringify({
      decidedAt: new Date().toISOString(),
      essential: true, functional: true, analytics: false, marketing: false,
    }));
    localStorage.setItem('synapse-tour-done', 'true');
    localStorage.setItem('synapse-pwa-dismissed', String(Date.now()));
  });

  const page = await context.newPage();

  for (const p of PAGES) {
    const url = new URL(p.path, BASE_URL).toString();
    console.log(`📸 [${deviceCfg.name}] ${p.id}  ${url}`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      // Let Framer Motion animations settle
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(outDir, `${p.id}.png`),
        fullPage: false,
        omitBackground: false,
      });
    } catch (e) {
      console.warn(`  ⚠ ${p.id} failed: ${e.message}`);
    }
  }

  await context.close();
}

async function main() {
  console.log(`📦 Synapse screenshot capture\n  Base URL: ${BASE_URL}\n  Out: ${OUT_DIR}\n`);
  const browser = await chromium.launch();
  for (const d of DEVICES) {
    console.log(`\n=== ${d.name} (${d.viewport.width}×${d.viewport.height}) ===`);
    await captureForDevice(browser, d);
  }
  await browser.close();
  console.log('\n✅ Done. Review files in playstore/screenshots/');
  console.log('   Then drop your favorites into Play Console → Store presence → Main store listing.');
}

main().catch((e) => { console.error(e); process.exit(1); });
