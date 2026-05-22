import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck, XCircle, Mail, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/backendApiService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { toast } from './ui/Toaster';
import { AuthPageShell } from './ForgotPassword';
import { Page } from '../types';

interface VerifyEmailProps {
  setPage: (page: Page, id?: string) => void;
  setCurrentUser: (user: any) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ setPage, setCurrentUser: _setCurrentUser }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link. No token provided.');
          return;
        }
        const response = await api.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Your email has been verified.');
        setTimeout(() => setPage('feed'), 2200);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. Link may be expired.');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResendEmail = async () => {
    if (!email) { toast.error('Please enter your email'); return; }
    setResendLoading(true);
    try {
      await api.resendVerificationEmail(email);
      toast.success('Verification email sent — check your inbox');
      setEmail('');
    } catch {
      toast.error('Failed to resend email. Try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <AnimatePresence mode="wait">
        {status === 'verifying' && (
          <motion.div key="verifying" className="text-center py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-space-grotesk">Verifying your email…</h2>
            <p className="mt-2 text-muted-foreground">Hang tight, this only takes a moment.</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div key="success" className="text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-glow mb-4">
              <MailCheck className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-space-grotesk text-success">Email verified!</h2>
            <p className="mt-2 text-muted-foreground">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">Redirecting you in a moment…</p>
            <Button variant="gradient" fullWidth className="mt-6" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => setPage('feed')}>
              Go to Synapse
            </Button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center text-white shadow-glow mb-4">
                <XCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight font-space-grotesk text-destructive">Verification failed</h2>
              <p className="mt-2 text-muted-foreground">{message}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Enter your email to get a new link</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                variant="gradient"
                fullWidth
                onClick={handleResendEmail}
                loading={resendLoading}
                disabled={!email}
              >
                Resend verification email
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setPage('login')}>
                Back to sign in
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
};
