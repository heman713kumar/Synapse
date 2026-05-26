import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { toast } from './ui/Toaster';
import api from '../services/backendApiService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Change-password flow. Calls POST /api/auth/change-password. Backend may not
 * have the route yet — the catch surfaces the network error as a toast so the
 * UI never silently no-ops.
 */
export const ChangePasswordModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent(''); setNewPwd(''); setConfirm('');
    setShowCurrent(false); setShowNew(false); setBusy(false);
  };

  const strength = (() => {
    if (newPassword.length === 0) return null;
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s; // 0-4
  })();

  const canSubmit =
    currentPassword.length >= 1 &&
    newPassword.length >= 8 &&
    newPassword === confirm &&
    newPassword !== currentPassword &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast.success('Password changed');
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not change password. Try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change password
          </DialogTitle>
          <DialogDescription>You'll be signed out of other devices after changing.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="cpwd">Current password</Label>
            <div className="relative">
              <Input
                id="cpwd"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="npwd">New password</Label>
            <div className="relative">
              <Input
                id="npwd"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {strength !== null && (
              <div className="flex gap-1 mt-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={
                      'h-1 flex-1 rounded-full ' +
                      (i < strength
                        ? strength === 1 ? 'bg-destructive'
                        : strength === 2 ? 'bg-warning'
                        : strength === 3 ? 'bg-info'
                        : 'bg-success'
                        : 'bg-secondary')
                    }
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              At least 8 characters. Mix uppercase, numbers, and symbols for a stronger password.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpwd2">Confirm new password</Label>
            <Input
              id="cpwd2"
              type={showNew ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              error={confirm.length > 0 && confirm !== newPassword ? 'Does not match' : undefined}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit} loading={busy}>Change password</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
