import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Clock, Heart, Frown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';
import { User } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onConfirm: () => void;
}

type Step = 'warning' | 'reason' | 'confirm' | 'scheduled';

const REASONS = [
  'I don\'t use it anymore',
  'I have privacy concerns',
  'I have a duplicate account',
  'I\'m taking a break',
  'I had a bad experience',
  'Something else',
];

export const AccountDeletionFlow: React.FC<Props> = ({ open, onOpenChange, user, onConfirm }) => {
  const [step, setStep] = useState<Step>('warning');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  const reset = () => {
    setStep('warning');
    setReason('');
    setFeedback('');
    setConfirmEmail('');
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleSchedule = () => {
    setStep('scheduled');
    toast.success('Deletion scheduled in 30 days');
    setTimeout(() => onConfirm(), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <AnimatePresence mode="wait">
          {step === 'warning' && (
            <motion.div key="warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center text-destructive">Delete your account?</DialogTitle>
                <DialogDescription className="text-center">This will remove all your data after a 30-day grace period.</DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 my-2">
                <p className="text-sm font-semibold text-destructive mb-2">You'll lose:</p>
                <ul className="space-y-1 text-sm">
                  <li>• All your ideas and drafts</li>
                  <li>• All comments and forum messages</li>
                  <li>• Your connections, achievements, and XP</li>
                  <li>• Direct messages (yours only — recipients keep theirs)</li>
                  <li>• Any active subscriptions (cancellation only)</li>
                </ul>
              </div>
              <div className="rounded-lg border border-info/30 bg-info/5 p-3 my-2 flex items-start gap-2 text-xs text-info">
                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                <span><strong>30-day grace period:</strong> Log in any time before then to cancel deletion. After that, all data is permanently erased.</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" fullWidth onClick={close}>Never mind</Button>
                <Button variant="destructive" fullWidth onClick={() => setStep('reason')}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 'reason' && (
            <motion.div key="reason" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
                  <Frown className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center">Help us understand</DialogTitle>
                <DialogDescription className="text-center">Why are you leaving? (optional)</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 my-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left rounded-lg border-2 p-2.5 text-sm transition-colors ${reason === r ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {reason && (
                <Textarea
                  rows={3}
                  placeholder="Anything else you'd like to tell us? (optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="mt-2"
                />
              )}
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" onClick={() => setStep('warning')}>Back</Button>
                <Button variant="destructive" fullWidth onClick={() => setStep('confirm')}>Continue</Button>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <div className="mx-auto h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
                  <Trash2 className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center">Last chance</DialogTitle>
                <DialogDescription className="text-center">Type your email to confirm.</DialogDescription>
              </DialogHeader>
              <div className="my-2 space-y-2">
                <Label htmlFor="confirm-email" className="text-xs">Type <code className="font-mono text-foreground">{user.email}</code></Label>
                <Input id="confirm-email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={user.email} />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" onClick={() => setStep('reason')}>Back</Button>
                <Button
                  variant="destructive"
                  fullWidth
                  disabled={confirmEmail !== user.email}
                  onClick={handleSchedule}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Schedule deletion
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'scheduled' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center mb-2 shadow-glow">
                <Clock className="h-7 w-7" />
              </div>
              <p className="font-bold text-lg">Deletion scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">Your account will be deleted on {new Date(Date.now() + 30 * 86400000).toLocaleDateString()}.</p>
              <Badge variant="warning" className="mt-3"><Heart className="h-3 w-3" /> Log in anytime to cancel</Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
