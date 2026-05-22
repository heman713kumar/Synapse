import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, Check, ArrowRight, ShieldCheck, Crown, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { Separator } from './ui/Separator';
import { toast } from './ui/Toaster';
import { celebrate, playSound } from '../utils/effects';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: { id: string; name: string; price: number; interval: 'mo' | 'yr'; features: string[] };
}

type Step = 'plan' | 'payment' | 'processing' | 'success';

/**
 * Frontend checkout flow ready for Stripe Elements integration.
 * To enable real payments later:
 *   1. npm i @stripe/stripe-js @stripe/react-stripe-js
 *   2. Wrap with <Elements stripe={loadStripe(VITE_STRIPE_PUBLIC_KEY)}>
 *   3. Replace mock fields with <PaymentElement /> + <stripe.confirmPayment()>
 *   4. Add a `POST /api/billing/checkout` endpoint that returns a clientSecret
 */
export const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onOpenChange, plan }) => {
  const [step, setStep] = useState<Step>('plan');
  const [email, setEmail] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [promo, setPromo] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const baseTotal = plan.price;
  const discount = promoApplied ? Math.round(baseTotal * 0.2 * 100) / 100 : 0;
  const total = Math.max(0, baseTotal - discount);

  const reset = () => {
    setStep('plan');
    setEmail(''); setCardName(''); setCardNumber(''); setExp(''); setCvc('');
    setPromo(''); setPromoApplied(false);
  };

  const handleApplyPromo = () => {
    if (!promo.trim()) return;
    if (promo.trim().toUpperCase() === 'SYNAPSE20') {
      setPromoApplied(true);
      toast.success('20% off applied 🎉');
    } else {
      toast.error('Invalid promo code');
    }
  };

  const handlePay = async () => {
    setStep('processing');
    // Mock: a real impl would call backend → Stripe → confirm
    await new Promise((r) => setTimeout(r, 1600));
    setStep('success');
    celebrate('large');
    playSound('unlock');
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md" hideClose>
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-md p-1 opacity-70 hover:opacity-100 focus-ring z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait">
          {step === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-glow mb-2">
                  <Crown className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center">Upgrade to {plan.name}</DialogTitle>
                <DialogDescription className="text-center">Cancel anytime · Secure checkout via Stripe</DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{plan.name}</p>
                  <p className="font-bold tabular-nums">${plan.price.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span></p>
                </div>
                <ul className="space-y-1 text-sm">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2"><Check className="h-3.5 w-3.5 mt-1 text-success shrink-0" /> {f}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="promo">Promo code</Label>
                <div className="flex gap-2">
                  <Input id="promo" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="SYNAPSE20" disabled={promoApplied} />
                  <Button variant={promoApplied ? 'success' : 'outline'} onClick={handleApplyPromo} disabled={!promo.trim() || promoApplied}>
                    {promoApplied ? <Check className="h-4 w-4" /> : 'Apply'}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Try <code className="font-mono">SYNAPSE20</code> for 20% off your first {plan.interval === 'mo' ? 'month' : 'year'}.</p>
              </div>

              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <p className="text-sm">Total today</p>
                <div className="text-right">
                  {discount > 0 && <p className="text-xs text-muted-foreground line-through">${baseTotal.toFixed(2)}</p>}
                  <p className="text-2xl font-bold tabular-nums">${total.toFixed(2)}</p>
                </div>
              </div>

              <Button fullWidth variant="gradient" size="lg" className="mt-4" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => setStep('payment')}>
                Continue to payment
              </Button>
              <p className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Secured by Stripe · PCI compliant
              </p>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <DialogHeader>
                <DialogTitle>Payment details</DialogTitle>
                <DialogDescription>Charging ${total.toFixed(2)} now, then ${plan.price.toFixed(2)}/{plan.interval}.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email" required>Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name" required>Name on card</Label>
                  <Input id="name" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ada Lovelace" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card" required>Card number</Label>
                  <Input
                    id="card"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="exp" required>Expiry</Label>
                    <Input id="exp" inputMode="numeric" placeholder="MM / YY" value={exp} onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setExp(v.length > 2 ? `${v.slice(0, 2)} / ${v.slice(2)}` : v);
                    }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvc" required>CVC</Label>
                    <Input id="cvc" inputMode="numeric" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} leftIcon={<Lock className="h-4 w-4" />} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-info/30 bg-info/5 p-3 mt-4 text-xs text-info flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                <span>This is a UI preview — wire <code className="font-mono">VITE_STRIPE_PUBLIC_KEY</code> + Stripe Elements to charge real cards.</span>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="ghost" onClick={() => setStep('plan')}>Back</Button>
                <Button variant="gradient" fullWidth onClick={handlePay} disabled={!email || !cardName || cardNumber.replace(/\s/g, '').length < 13 || !exp || !cvc} leftIcon={<Lock className="h-4 w-4" />}>
                  Pay ${total.toFixed(2)}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
              <div className="mx-auto h-14 w-14 rounded-full border-4 border-primary/15 border-t-primary animate-spin mb-4" />
              <p className="font-semibold">Processing payment…</p>
              <p className="text-xs text-muted-foreground mt-1">Don't close this window.</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-glow mb-3">
                <Check className="h-8 w-8" />
              </div>
              <DialogTitle className="text-success">Welcome to {plan.name}!</DialogTitle>
              <DialogDescription className="mt-2">Your features are unlocked. We sent a receipt to {email || 'your email'}.</DialogDescription>
              <Badge variant="gradient" className="mt-3">Now active</Badge>
              <Button variant="gradient" fullWidth size="lg" className="mt-5" onClick={close}>Start using {plan.name}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
