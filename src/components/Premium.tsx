import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowLeft, Zap, Palette, Shield, BarChart3, Crown } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';
import { cn } from '../utils/cn';
import { CheckoutModal } from './CheckoutModal';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface CheckoutPlan { id: string; name: string; price: number; interval: 'mo' | 'yr'; features: string[] }

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'For curious builders',
    monthly: 0,
    yearly: 0,
    features: ['Unlimited public ideas', 'Basic AI coach', 'Up to 3 spaces joined', 'Standard search', 'Community support'],
    cta: 'Current plan',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For serious builders',
    monthly: 9,
    yearly: 84,
    features: [
      'Everything in Free',
      'Unlimited AI coach + Pitch Generator',
      'Unlimited spaces',
      'Advanced analytics on your ideas',
      'Private ideas + draft autosave',
      'Custom profile theme & vanity URL',
      'No ads',
      '"Pro" badge',
    ],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    id: 'investor',
    name: 'Investor',
    tagline: 'For VCs and angels',
    monthly: 49,
    yearly: 490,
    features: [
      'Everything in Pro',
      'Deal-flow dashboard with pipeline tracker',
      'Due-diligence note templates',
      'Saved searches with email alerts',
      'Bulk-message founders by skill',
      'Verified Investor badge',
      'Priority support',
    ],
    cta: 'Talk to sales',
    highlight: false,
  },
];

const PERKS = [
  { icon: Zap, label: 'AI Coach unlimited', desc: 'Refine, analyze, pitch — no caps on Gemini calls.' },
  { icon: BarChart3, label: 'Deep analytics', desc: 'Views by source, region, skill demographics, cohort retention.' },
  { icon: Palette, label: 'Custom themes', desc: 'Accent colors, fonts, profile cover designs.' },
  { icon: Shield, label: 'Privacy controls', desc: 'Private ideas, NDA mode, anonymous posts, expiring links.' },
];

export const Premium: React.FC<Props> = ({ setPage }) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">
          Back
        </Button>

        {/* Hero */}
        <header className="text-center mb-10">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-glow mb-4">
            <Crown className="h-7 w-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-space-grotesk">
            Upgrade to <span className="text-gradient">Synapse Pro</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlimited AI, deep analytics, private ideas, custom themes. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex bg-secondary/50 p-1 rounded-lg mt-6 gap-1">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-semibold transition-all capitalize',
                  billing === b ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                {b}
                {b === 'yearly' && <span className="ml-2 text-[10px] uppercase font-bold text-success">Save 22%</span>}
              </button>
            ))}
          </div>
        </header>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {PLANS.map((plan) => {
            const price = billing === 'monthly' ? plan.monthly : plan.yearly / 12;
            return (
              <motion.div key={plan.id} whileHover={{ y: -4 }}>
                <Card className={cn('relative h-full', plan.highlight && 'border-primary shadow-glow')}>
                  {plan.highlight && (
                    <Badge variant="gradient" className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-glow-sm">Most popular</Badge>
                  )}
                  <CardContent className="p-6 flex flex-col h-full">
                    <h3 className="text-xl font-bold tracking-tight font-space-grotesk">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{plan.tagline}</p>
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tabular-nums">${price.toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground">/{billing === 'monthly' ? 'mo' : 'mo, billed yearly'}</span>
                    </div>
                    {billing === 'yearly' && plan.yearly > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">${plan.yearly}/year</p>
                    )}
                    <ul className="space-y-2 mt-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className={cn('h-4 w-4 mt-0.5 shrink-0', plan.highlight ? 'text-primary' : 'text-success')} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.highlight ? 'gradient' : 'outline'}
                      fullWidth
                      size="lg"
                      className="mt-6"
                      onClick={() => {
                        if (plan.id === 'free') { toast("You're on the Free plan", { icon: '✅' }); return; }
                        setCheckoutPlan({
                          id: plan.id,
                          name: plan.name,
                          price: billing === 'monthly' ? plan.monthly : plan.yearly,
                          interval: billing === 'monthly' ? 'mo' : 'yr',
                          features: plan.features,
                        });
                      }}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Perks showcase */}
        <h2 className="text-2xl font-bold tracking-tight font-space-grotesk text-center mb-6">What's included with Pro</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {PERKS.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.label}>
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{p.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <h2 className="text-2xl font-bold tracking-tight font-space-grotesk text-center mb-6">FAQ</h2>
        <div className="space-y-3">
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Pro is monthly or yearly, no contracts. Cancel from Settings → Billing.' },
            { q: 'Is there a student discount?', a: 'Yes — 50% off with a .edu email. Apply via Settings → Billing → "Get student discount."' },
            { q: 'What happens to my private ideas if I downgrade?', a: 'Private ideas stay private but become read-only. You can re-publish or export anytime.' },
            { q: 'Do you offer a free trial?', a: '14 days free on Pro. No card required up front.' },
            { q: 'How does Investor verification work?', a: 'We review LinkedIn + a public investment record (Crunchbase, AngelList, etc.). Usually <48h.' },
          ].map((f) => (
            <details key={f.q} className="group rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
              <summary className="cursor-pointer font-semibold text-sm list-none flex items-center justify-between">
                {f.q}
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-12">
          <Sparkles className="inline h-3 w-3 mr-1" />
          Have questions? Email <a href="mailto:billing@synapse.app" className="text-primary hover:underline">billing@synapse.app</a>
        </p>
      </div>

      {checkoutPlan && (
        <CheckoutModal
          open={!!checkoutPlan}
          onOpenChange={(o) => !o && setCheckoutPlan(null)}
          plan={checkoutPlan}
        />
      )}
    </motion.div>
  );
};
