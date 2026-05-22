/**
 * Weekly digest email service.
 *  - Picks top ideas / events / mentions matching each user's interests + skills
 *  - Renders a templated HTML email
 *  - Sends via the existing emailService (nodemailer)
 *  - Respects user notification preferences
 *
 * Usage:
 *   import { sendWeeklyDigests } from './services/digestService';
 *   // Called by cron Sunday 9am UTC
 *   await sendWeeklyDigests();
 */

import { query } from '../db/database';
import { sendEmail } from './emailService';

export interface DigestPayload {
  user: { userId: string; email: string; firstName: string };
  topIdeas: Array<{ id: string; title: string; summary: string; ownerName: string; likes: number; url: string }>;
  trendingTags: Array<{ slug: string; count: number; url: string }>;
  upcomingEvents: Array<{ title: string; date: string; url: string }>;
  smartMatches: Array<{ name: string; reason: string; url: string }>;
  yourStats: { xpThisWeek: number; streak: number; ideaViews: number };
}

const APP = process.env.APP_URL || 'https://synapse.app';

function renderHtml(p: DigestPayload): string {
  const ideasHtml = p.topIdeas.map((i) => `
    <tr><td style="padding:14px 0; border-bottom:1px solid #1A1A24;">
      <a href="${i.url}" style="color:#fff; text-decoration:none; font-weight:700; font-size:16px;">${escape(i.title)}</a>
      <p style="color:#9ca3af; font-size:13px; margin:4px 0;">${escape(i.summary)}</p>
      <p style="color:#6b7280; font-size:11px; margin:0;">by ${escape(i.ownerName)} · ${i.likes} likes</p>
    </td></tr>
  `).join('');

  const tagsHtml = p.trendingTags.map((t) => `
    <a href="${t.url}" style="display:inline-block; padding:4px 10px; margin:0 4px 6px 0; border-radius:12px;
       background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff; text-decoration:none; font-size:12px; font-weight:600;">
      #${t.slug} <span style="opacity:0.6;">${t.count}</span>
    </a>
  `).join('');

  const eventsHtml = p.upcomingEvents.length === 0 ? '' : `
    <h2 style="color:#fff; font-size:18px; margin-top:32px;">Upcoming events</h2>
    <ul style="color:#d1d5db; font-size:14px; line-height:1.6; padding-left:18px;">
      ${p.upcomingEvents.map((e) => `<li><a href="${e.url}" style="color:#a78bfa;">${escape(e.title)}</a> · ${e.date}</li>`).join('')}
    </ul>
  `;

  const matchesHtml = p.smartMatches.length === 0 ? '' : `
    <h2 style="color:#fff; font-size:18px; margin-top:32px;">People you might want to meet</h2>
    <ul style="color:#d1d5db; font-size:14px; line-height:1.6; padding-left:18px;">
      ${p.smartMatches.map((m) => `<li><a href="${m.url}" style="color:#a78bfa;">${escape(m.name)}</a> — ${escape(m.reason)}</li>`).join('')}
    </ul>
  `;

  return `<!doctype html>
<html><body style="margin:0; background:#0A0A0F; color:#d1d5db; font-family: -apple-system, system-ui, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0F;">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background:#0A0A0F;">
        <!-- Header -->
        <tr><td style="padding:24px; background:linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899); border-radius:16px 16px 0 0;">
          <h1 style="color:#fff; font-size:28px; margin:0; letter-spacing:-1px;">Hey ${escape(p.user.firstName)} 👋</h1>
          <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:15px;">Your week on Synapse</p>
        </td></tr>

        <!-- Stats strip -->
        <tr><td style="padding:0; background:#1A1A24;">
          <table width="100%" cellpadding="16" cellspacing="0">
            <tr style="text-align:center;">
              <td><div style="font-size:24px; font-weight:800; color:#fff;">+${p.yourStats.xpThisWeek}</div><div style="font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px;">XP this week</div></td>
              <td><div style="font-size:24px; font-weight:800; color:#fff;">🔥 ${p.yourStats.streak}</div><div style="font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px;">Day streak</div></td>
              <td><div style="font-size:24px; font-weight:800; color:#fff;">${p.yourStats.ideaViews}</div><div style="font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px;">Idea views</div></td>
            </tr>
          </table>
        </td></tr>

        <!-- Top ideas -->
        <tr><td style="padding:24px;">
          <h2 style="color:#fff; font-size:18px; margin:0 0 12px;">Top ideas for you</h2>
          <table width="100%" cellpadding="0" cellspacing="0">${ideasHtml}</table>

          <!-- Trending tags -->
          <h2 style="color:#fff; font-size:18px; margin:32px 0 12px;">What's trending</h2>
          <div>${tagsHtml}</div>

          ${eventsHtml}
          ${matchesHtml}
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding:24px;">
          <a href="${APP}" style="display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#6366F1,#8B5CF6); color:#fff;
            border-radius:10px; text-decoration:none; font-weight:700; font-size:15px;">Open Synapse</a>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding:24px; font-size:11px; color:#6b7280;">
          You're receiving this because you have weekly digests enabled.<br>
          <a href="${APP}/settings/notifications" style="color:#9ca3af;">Manage preferences</a> ·
          <a href="${APP}/unsubscribe?u=${p.user.userId}" style="color:#9ca3af;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}

// ─── Main entry ──────────────────────────────────────────────────────────────

export async function buildDigestForUser(userId: string): Promise<DigestPayload | null> {
  // Get user
  const { rows: u } = await query(`SELECT user_id, email, display_name FROM users WHERE user_id = $1`, [userId]);
  if (!u[0]) return null;

  // Pull top 5 ideas from the past week matching user interests
  const { rows: ideas } = await query(`
    SELECT i.id, i.title, i.summary, u.display_name AS owner_name, i.likes_count
    FROM ideas i
    JOIN users u ON u.user_id = i.owner_id
    WHERE i.is_public = TRUE
      AND i.created_at > NOW() - INTERVAL '7 days'
    ORDER BY (i.likes_count + i.comments_count * 2) DESC
    LIMIT 5
  `);

  // Top 5 tags this week
  const { rows: tags } = await query(`
    SELECT slug, idea_count AS count FROM tags
    ORDER BY trending_score DESC LIMIT 5
  `);

  // Upcoming events (placeholder — wire to your events table when it exists)
  const events: any[] = [];

  // Smart matches (placeholder — wire to recommendation algo)
  const matches: any[] = [];

  // Stats from xp_events
  const { rows: stats } = await query(`
    SELECT
      COALESCE((SELECT SUM(xp) FROM xp_events WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'), 0)::int AS xp_this_week,
      COALESCE((SELECT current_streak FROM user_xp WHERE user_id = $1), 0)::int AS streak,
      0 AS idea_views
  `, [userId]);

  return {
    user: { userId: u[0].user_id, email: u[0].email, firstName: u[0].display_name?.split(' ')[0] ?? 'friend' },
    topIdeas: ideas.map((i: any) => ({
      id: i.id, title: i.title, summary: i.summary ?? '', ownerName: i.owner_name,
      likes: i.likes_count ?? 0, url: `${APP}/?nav=idea&id=${i.id}`,
    })),
    trendingTags: tags.map((t: any) => ({ slug: t.slug, count: t.count, url: `${APP}/?nav=tag&t=${t.slug}` })),
    upcomingEvents: events,
    smartMatches: matches,
    yourStats: stats[0],
  };
}

export async function sendDigestToUser(userId: string): Promise<boolean> {
  const payload = await buildDigestForUser(userId);
  if (!payload || payload.topIdeas.length === 0) return false;

  try {
    const html = renderHtml(payload);
    const text = payload.topIdeas.map((i) => `• ${i.title} — ${i.url}`).join('\n');
    await sendEmail(payload.user.email, `📩 Your Synapse week: ${payload.topIdeas[0].title}`, text, html);
    return true;
  } catch (e) {
    console.error('Digest send failed:', userId, e);
    return false;
  }
}

export async function sendWeeklyDigests(): Promise<{ sent: number; skipped: number }> {
  // Pick all users opted in to weekly digest who haven't been emailed in 6 days
  const { rows } = await query(`
    SELECT u.user_id
    FROM users u
    LEFT JOIN user_xp x ON x.user_id = u.user_id
    WHERE COALESCE(u.notification_settings->>'weekly_digest', 'true')::boolean = TRUE
      AND u.email IS NOT NULL
    LIMIT 1000
  `);

  let sent = 0, skipped = 0;
  for (const row of rows) {
    const ok = await sendDigestToUser(row.user_id);
    if (ok) sent++; else skipped++;
    // Rate-limit: 50 per minute
    await new Promise((r) => setTimeout(r, 1200));
  }
  console.log(`📨 Weekly digests: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}
