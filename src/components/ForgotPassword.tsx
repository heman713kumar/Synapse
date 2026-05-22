import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, MailCheck, Sparkles } from 'lucide-react';
import api from '../services/backendApiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { toast } from './ui/Toaster';
import { Page } from '../types';

interface ForgotPasswordProps {
  setPage: (page: Page, id?: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ setPage }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'form' | 'loading' | 'sent'>('form');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email'); return; }
    setStatus('loading');
    try {
      await api.forgotPassword(email);
      setStatus('sent');
      toast.success('Reset link sent — check your inbox');
    } catch (err: any) {
      setStatus('form');
      const msg = err.message || 'Failed to send reset email';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthPageShell>
      <AnimatePresence mode="wait">
        {status === 'sent' ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-glow mb-4">
              <MailCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-space-grotesk">Check your email</h1>
            <p className="mt-2 text-muted-foreground">
              We sent a password reset link to<br />
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">The link expires in 1 hour.</p>
            <div className="mt-6 space-y-2">
              <Button variant="gradient" fullWidth onClick={() => setPage('login')}>
                Back to sign in
              </Button>
              <Button variant="ghost" fullWidth onClick={() => { setStatus('form'); setEmail(''); setError(''); }}>
                Try another email
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-glow-sm mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-space-grotesk">Forgot password?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No worries — enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  error={error || undefined}
                />
                {error && <p className="text-xs text-destructive mt-1">{error}</p>}
              </div>

              <Button
                type="submit"
                variant="gradient"
                fullWidth
                size="lg"
                loading={status === 'loading'}
                disabled={!email}
                rightIcon={status !== 'loading' ? <ArrowRight className="h-4 w-4" /> : undefined}
              >
                Send reset link
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => setPage('login')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to sign in
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
};

/* Reusable shell for all auth pages */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
      <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1s' }} />
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="surface p-8 shadow-2xl shadow-primary/10">{children}</div>
      </div>
    </div>
  );
}
