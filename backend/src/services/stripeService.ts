/**
 * Stripe billing service — subscriptions, bounty escrow, mentorship payouts.
 *
 * Install:
 *   npm i stripe
 *
 * Env:
 *   STRIPE_SECRET_KEY=sk_live_...
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 *   STRIPE_PRICE_PRO_MONTHLY=price_xxx
 *   STRIPE_PRICE_PRO_YEARLY=price_xxx
 *   STRIPE_PRICE_INVESTOR_MONTHLY=price_xxx
 *   STRIPE_PRICE_INVESTOR_YEARLY=price_xxx
 *   STRIPE_CONNECT_RETURN_URL=https://synapse.app/settings/payouts
 *   APP_URL=https://synapse.app
 */

import Stripe from 'stripe';
import { query } from '../db/database';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)   // use SDK's pinned API version
  : null;

if (!stripe) console.warn('⚠ STRIPE_SECRET_KEY not set — billing disabled');

const PRICE_MAP: Record<string, string | undefined> = {
  'pro-monthly':      process.env.STRIPE_PRICE_PRO_MONTHLY,
  'pro-yearly':       process.env.STRIPE_PRICE_PRO_YEARLY,
  'investor-monthly': process.env.STRIPE_PRICE_INVESTOR_MONTHLY,
  'investor-yearly':  process.env.STRIPE_PRICE_INVESTOR_YEARLY,
};

// ─── SUBSCRIPTIONS ──────────────────────────────────────────────────────────

export async function createCheckoutSession(opts: {
  userId: string;
  email: string;
  planKey: keyof typeof PRICE_MAP;
  promoCode?: string;
}): Promise<{ url: string }> {
  if (!stripe) throw new Error('Stripe not configured');

  const price = PRICE_MAP[opts.planKey];
  if (!price) throw new Error(`Unknown plan: ${opts.planKey}`);

  // Reuse customer if we have one
  let { rows } = await query(
    `SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1`,
    [opts.userId]
  );
  let customerId = rows[0]?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: opts.email,
      metadata: { userId: opts.userId },
    });
    customerId = customer.id;
    await query(
      `INSERT INTO subscriptions (user_id, stripe_customer_id, plan, status)
       VALUES ($1, $2, 'free', 'pending')
       ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id`,
      [opts.userId, customerId]
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    success_url: `${process.env.APP_URL}/?upgrade=success&plan=${opts.planKey}`,
    cancel_url:  `${process.env.APP_URL}/premium`,
    allow_promotion_codes: true,
    discounts: opts.promoCode ? [{ promotion_code: opts.promoCode }] : undefined,
    billing_address_collection: 'auto',
    automatic_tax: { enabled: true },
  });

  return { url: session.url! };
}

export async function createBillingPortalSession(userId: string): Promise<{ url: string }> {
  if (!stripe) throw new Error('Stripe not configured');
  const { rows } = await query(
    `SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1`,
    [userId]
  );
  if (!rows[0]?.stripe_customer_id) throw new Error('No customer record');
  const portal = await stripe.billingPortal.sessions.create({
    customer: rows[0].stripe_customer_id,
    return_url: `${process.env.APP_URL}/settings`,
  });
  return { url: portal.url };
}

// ─── BOUNTY ESCROW ──────────────────────────────────────────────────────────

export async function createBountyEscrow(opts: {
  bountyId: string;
  posterId: string;
  amountCents: number;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!stripe) throw new Error('Stripe not configured');
  const intent = await stripe.paymentIntents.create({
    amount: opts.amountCents,
    currency: 'usd',
    capture_method: 'manual',                 // hold funds until release
    metadata: { bountyId: opts.bountyId, posterId: opts.posterId, type: 'bounty_escrow' },
    description: `Synapse bounty escrow — ${opts.bountyId}`,
  });
  await query(
    `UPDATE bounties SET stripe_payment_intent_id = $1, escrow_held = TRUE WHERE id = $2`,
    [intent.id, opts.bountyId]
  );
  return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
}

export async function releaseBountyEscrow(bountyId: string, builderId: string) {
  if (!stripe) throw new Error('Stripe not configured');
  const { rows } = await query(
    `SELECT stripe_payment_intent_id, reward_cents FROM bounties WHERE id = $1`,
    [bountyId]
  );
  if (!rows[0]) throw new Error('Bounty not found');
  const intentId = rows[0].stripe_payment_intent_id;

  // Capture the held funds
  await stripe.paymentIntents.capture(intentId);

  // Look up the builder's Connect account for transfer
  const { rows: m } = await query(
    `SELECT stripe_connect_id FROM mentors WHERE user_id = $1`,
    [builderId]
  );
  if (m[0]?.stripe_connect_id) {
    const platformFeeCents = Math.round(rows[0].reward_cents * 0.08);
    await stripe.transfers.create({
      amount: rows[0].reward_cents - platformFeeCents,
      currency: 'usd',
      destination: m[0].stripe_connect_id,
      metadata: { bountyId, type: 'bounty_payout' },
    });
  }

  await query(
    `UPDATE bounties SET status = 'completed', escrow_held = FALSE WHERE id = $1`,
    [bountyId]
  );
}

export async function refundBountyEscrow(bountyId: string) {
  if (!stripe) throw new Error('Stripe not configured');
  const { rows } = await query(
    `SELECT stripe_payment_intent_id FROM bounties WHERE id = $1`,
    [bountyId]
  );
  if (rows[0]?.stripe_payment_intent_id) {
    await stripe.paymentIntents.cancel(rows[0].stripe_payment_intent_id);
  }
  await query(`UPDATE bounties SET status = 'cancelled', escrow_held = FALSE WHERE id = $1`, [bountyId]);
}

// ─── STRIPE CONNECT (for mentor/builder payouts) ────────────────────────────

export async function createConnectOnboarding(userId: string, email: string): Promise<{ url: string }> {
  if (!stripe) throw new Error('Stripe not configured');
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: { transfers: { requested: true } },
    metadata: { userId },
  });
  await query(
    `INSERT INTO mentors (user_id, stripe_connect_id) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET stripe_connect_id = EXCLUDED.stripe_connect_id`,
    [userId, account.id]
  );
  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: process.env.STRIPE_CONNECT_RETURN_URL!,
    return_url: process.env.STRIPE_CONNECT_RETURN_URL!,
    type: 'account_onboarding',
  });
  return { url: link.url };
}

// ─── WEBHOOK HANDLER ────────────────────────────────────────────────────────

export async function handleWebhook(rawBody: Buffer, signature: string) {
  if (!stripe) throw new Error('Stripe not configured');
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session: any = event.data.object;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const sub: any = await stripe.subscriptions.retrieve(session.subscription as string);
        const plan = inferPlanFromPriceId((sub.items?.data?.[0]?.price?.id) ?? '');
        const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
        await query(
          `UPDATE subscriptions SET stripe_subscription_id = $1, plan = $2, status = $3,
             current_period_end = to_timestamp($4)
           WHERE user_id = $5`,
          [sub.id, plan, sub.status, periodEnd, userId]
        );
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub: any = event.data.object;
      const plan = sub.status === 'canceled' ? 'free' : inferPlanFromPriceId((sub.items?.data?.[0]?.price?.id) ?? '');
      const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end;
      await query(
        `UPDATE subscriptions SET plan = $1, status = $2,
           current_period_end = to_timestamp($3),
           cancel_at_period_end = $4
         WHERE stripe_subscription_id = $5`,
        [plan, sub.status, periodEnd, sub.cancel_at_period_end, sub.id]
      );
      break;
    }
    case 'invoice.payment_failed': {
      // Could send an email here
      break;
    }
    case 'payment_intent.succeeded': {
      // Bounty escrow paid in — already updated client-side via webhook
      break;
    }
  }
}

function inferPlanFromPriceId(priceId: string): 'free' | 'pro' | 'investor' {
  if (priceId === process.env.STRIPE_PRICE_INVESTOR_MONTHLY) return 'investor';
  if (priceId === process.env.STRIPE_PRICE_INVESTOR_YEARLY)  return 'investor';
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY)      return 'pro';
  if (priceId === process.env.STRIPE_PRICE_PRO_YEARLY)       return 'pro';
  return 'free';
}
