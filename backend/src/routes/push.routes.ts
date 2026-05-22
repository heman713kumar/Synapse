/** Web Push subscription management. */
import { Router } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import * as push from '../services/pushService';

const router = Router();

router.get('/public-key', (_req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? null });
});

router.post('/subscribe', authMiddleware, async (req: any, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Bad subscription' });
    await push.saveSubscription(req.user.userId, subscription, req.headers['user-agent'] as string);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/unsubscribe', authMiddleware, async (req: any, res) => {
  await push.deleteSubscription(req.body.endpoint);
  res.json({ ok: true });
});

router.post('/test', authMiddleware, async (req: any, res) => {
  const r = await push.sendToUser(req.user.userId, {
    title: '🎉 Push works!',
    body: 'Your device is set up to receive Synapse notifications.',
    url: '/?nav=notifications',
    tag: 'test',
  });
  res.json(r);
});

export default router;
