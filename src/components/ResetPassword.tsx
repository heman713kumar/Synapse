import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../services/backendApiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { toast } from './ui/Toaster';
import { AuthPageShell } from './ForgotPassword';
import { Page } from '../types';
import { cn } from '../utils/cn';

interface ResetPasswordProps {
  setPage: (page: Page, id?: string) => void;
}

type Strength = 'weak' | 'medium' | 'strong';

export const ResetPassword: React.FC<ResetPasswordProps> = ({ setPage }) => {
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [strength, setStrength] = useState<Strength>('weak');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) {
      setStatus('error');
      setError('Invalid or missing reset token');
    }
    setToken(t || '');
  }, []);

  const computeStrength = (pwd: string): Strength => {
    if (pwd.length < 12) return 'weak';
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    const typeCount = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;
    return typeCount >= 3 ? 'strong' : 'medium';
  };

  const checks = [
    { label: 'At least 12 characters', ok: password.length >= 12 },
    { label: 'Mix of upper & lower case', ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'At least one number', ok: /\d/.test(password) },
    { label: 'At least one special character', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setStrength(computeStrength(pwd));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 12) { setError('Password must be at least 12 characters'); return; }

    setStatus('loading');
    try {
      await api.resetPassword(token, password);
      setStatus('success');
      toast.success('Password reset successfully');
      setTimeout(() => setPage('login'), 2000);
    } catch (err: any) {
      setStatus('form');
      const msg = err.message || 'Failed to reset password';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <AuthPageShell>
      <AnimatePresence mode="wait">
        {status === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-glow-sm mb-4">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-space-grotesk">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Make it strong — at least 12 characters with a mix of letters, numbers, and symbols.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="pwd">New password</Label>
                <Input
                  id="pwd"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                />
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          strength === 'weak' && 'w-1/3 bg-destructive',
                          strength === 'medium' && 'w-2/3 bg-warning',
                          strength === 'strong' && 'w-full bg-success'
                        )}
                      />
                    </div>
                    <ul className="grid grid-cols-2 gap-1 text-xs">
                      {checks.map((c) => (
                        <li key={c.label} className={cn('flex items-center gap-1.5', c.ok ? 'text-success' : 'text-muted-foreground')}>
                          {c.ok ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-current" />}
                          {c.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
                />
              </div>

              <Button type="submit" variant="gradient" fullWidth size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Reset password
              </Button>
            </form>
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div key="loading" className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto h-12 w-12 rounded-full border-4 border-secondary border-t-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Resetting your password…</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div key="success" className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-glow mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-space-grotesk text-success">Password reset!</h2>
            <p className="mt-2 text-muted-foreground">Your password has been updated. Redirecting you to sign in…</p>
            <Button variant="gradient" fullWidth className="mt-6" onClick={() => setPage('login')}>Sign in now</Button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div key="error" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white shadow-glow mb-4">
              <XCircle className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-space-grotesk text-destructive">Link expired</h2>
            <p className="mt-2 text-muted-foreground">{error || 'This password reset link has expired or is invalid.'}</p>
            <Button variant="gradient" fullWidth className="mt-6" onClick={() => setPage('forgot-password')}>Request a new link</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
};
