/**
 * Public unauthenticated endpoints — stats, status, hashtags, OG/SSR proxy.
 */
import { Router } from 'express';
import { query } from '../db/database';

const router = Router();

// ─── PUBLIC STATS ────────────────────────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  try {
    const [ideas, users, comments, msgs] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM ideas WHERE is_public = TRUE`),
      query(`SELECT COUNT(*)::int AS c FROM users WHERE created_at > NOW() - INTERVAL '30 days'`),
      query(`SELECT COUNT(*)::int AS c FROM comments`),
      query(`SELECT COUNT(*)::int AS c FROM messages`).catch(() => ({ rows: [{ c: 0 }] })),
    ]);
    res.json({
      ideas_total: ideas.rows[0].c,
      active_members: users.rows[0].c,
      comments_total: comments.rows[0].c,
      messages_total: msgs.rows[0].c,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── STATUS ──────────────────────────────────────────────────────────────────

router.get('/status', async (_req, res) => {
  const checks: Record<string, { ok: boolean; ms: number }> = {};
  const start = Date.now();
  try {
    await query(`SELECT 1`);
    checks.database = { ok: true, ms: Date.now() - start };
  } catch {
    checks.database = { ok: false, ms: Date.now() - start };
  }
  res.json({
    overall: Object.values(checks).every((c) => c.ok) ? 'operational' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ─── HASHTAGS ────────────────────────────────────────────────────────────────

router.get('/tags/trending', async (_req, res) => {
  const { rows } = await query(`SELECT slug, display, idea_count, trending_score FROM v_top_tags`);
  res.json(rows);
});

router.get('/tags/:slug', async (req, res) => {
  const { rows: tag } = await query(`SELECT * FROM tags WHERE slug = $1`, [req.params.slug]);
  if (!tag[0]) return res.status(404).json({ error: 'Not found' });
  const { rows: ideas } = await query(
    `SELECT i.* FROM ideas i JOIN idea_tags it ON it.idea_id = i.id
     WHERE it.tag_slug = $1 AND i.is_public = TRUE
     ORDER BY i.created_at DESC LIMIT 50`,
    [req.params.slug]
  );
  res.json({ tag: tag[0], ideas });
});

// ─── ROADMAP (public voting) ─────────────────────────────────────────────────

router.get('/roadmap', async (_req, res) => {
  const { rows } = await query(`SELECT * FROM roadmap_items ORDER BY upvotes DESC, created_at DESC LIMIT 100`);
  res.json(rows);
});

router.post('/roadmap', async (req, res) => {
  const { title, description, category, submitterId } = req.body;
  const { rows } = await query(
    `INSERT INTO roadmap_items (title, description, category, submitted_by) VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, description, category, submitterId]
  );
  res.json(rows[0]);
});

router.post('/roadmap/:id/vote', async (req: any, res) => {
  if (!req.user?.userId) return res.status(401).json({ error: 'Login required' });
  try {
    const { rowCount } = await query(
      `INSERT INTO roadmap_votes (user_id, item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.userId, req.params.id]
    );
    if (rowCount) {
      await query(`UPDATE roadmap_items SET upvotes = upvotes + 1 WHERE id = $1`, [req.params.id]);
    }
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── PUBLIC IDEA PAGE (OG/SSR proxy) ─────────────────────────────────────────
// Use as: <link rel="alternate" href="/api/public/og/idea/:id" /> in your client
// or as a server-rendered fallback for social-media crawlers.

router.get('/og/idea/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT i.id, i.title, i.summary, i.description, u.display_name AS owner_name,
            i.likes_count, i.comments_count, i.created_at
     FROM ideas i JOIN users u ON u.user_id = i.owner_id
     WHERE i.id = $1 AND i.is_public = TRUE`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).send('Idea not found');
  const idea = rows[0];
  const url = `${process.env.APP_URL}/?nav=idea&id=${idea.id}`;

  // Render minimal HTML with proper OG/Twitter meta — crawlers see this; humans get the SPA
  res.set('Content-Type', 'text/html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escape(idea.title)} · Synapse</title>
  <meta name="description" content="${escape(idea.summary ?? '')}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escape(idea.title)}" />
  <meta property="og:description" content="${escape(idea.summary ?? '')}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${process.env.APP_URL}/api/public/og/image/${idea.id}.png" />
  <meta property="og:site_name" content="Synapse" />
  <meta property="article:author" content="${escape(idea.owner_name)}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escape(idea.title)}" />
  <meta name="twitter:description" content="${escape(idea.summary ?? '')}" />
  <meta name="twitter:image" content="${process.env.APP_URL}/api/public/og/image/${idea.id}.png" />

  <!-- Structured data for Google -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": ${JSON.stringify(idea.title)},
    "description": ${JSON.stringify(idea.summary ?? '')},
    "author": {"@type": "Person", "name": ${JSON.stringify(idea.owner_name)}},
    "datePublished": ${JSON.stringify(idea.created_at)},
    "interactionStatistic": [
      {"@type":"InteractionCounter","interactionType":"https://schema.org/LikeAction","userInteractionCount":${idea.likes_count}},
      {"@type":"InteractionCounter","interactionType":"https://schema.org/CommentAction","userInteractionCount":${idea.comments_count}}
    ]
  }
  </script>

  <meta http-equiv="refresh" content="0; url=${url}" />
  <link rel="canonical" href="${url}" />
</head>
<body>
  <h1>${escape(idea.title)}</h1>
  <p>${escape(idea.summary ?? '')}</p>
  <p>by <strong>${escape(idea.owner_name)}</strong></p>
  <p><a href="${url}">Open in Synapse</a></p>
</body>
</html>`);
});

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
}

export default router;
