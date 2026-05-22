/**
 * Stripe billing routes.
 *  GET  /api/billing/me                  - current subscription
 *  POST /api/billing/checkout            - create Stripe Checkout session
 *  POST /api/billing/portal              - billing portal session (manage card / cancel)
 *  POST /api/billing/webhook             - Stripe webhook (raw body!)
 *  POST /api/billing/connect/onboarding  - Stripe Connect for mentors / bounty earners
 */

import { Router, Request, Response, raw } from 'express';
import { authenticateToken as authMiddleware } from '../middleware/auth.middleware';
import { query } from '../db/database';
import * as stripeService from '../services/stripeService';

const router = Router();

router.get('/me', authMiddleware, async (req: any, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT plan, status, current_period_end, cancel_at_period_end, trial_end
       FROM subscriptions WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json(rows[0] ?? { plan: 'free', status: 'active' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/checkout', authMiddleware, async (req: any, res: Response) => {
  try {
    const { planKey, promoCode } = req.body;
    const session = await stripeService.createCheckoutSession({
      userId: req.user.userId,
      email: req.user.email,
      planKey,
      promoCode,
    });
    res.json(session);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/portal', authMiddleware, async (req: any, res: Response) => {
  try {
    const session = await stripeService.createBillingPortalSession(req.user.userId);
    res.json(session);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/connect/onboarding', authMiddleware, async (req: any, res: Response) => {
  try {
    const link = await stripeService.createConnectOnboarding(req.user.userId, req.user.email);
    res.json(link);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Webhook MUST receive the raw body for signature verification.
// Mount this BEFORE express.json() in index.ts:
//   app.post('/api/billing/webhook', raw({ type: 'application/json' }), billingWebhookHandler);
export async function billingWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  try {
    await stripeService.handleWebhook(req.body, sig);
    res.json({ received: true });
  } catch (e: any) {
    console.error('Stripe webhook error:', e.message);
    res.status(400).json({ error: e.message });
  }
}

export default router;
