import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Copy, Check, QrCode, ArrowRight, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';
import { celebrate, playSound } from '../utils/effects';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { email: string; displayName?: string; username?: string };
}

type Step = 'intro' | 'scan' | 'verify' | 'recovery' | 'done';

/**
 * UI-ready 2FA enrollment. To wire real TOTP later:
 *   - npm i speakeasy qrcode (server-side)
 *   - Add /api/2fa/generate-secret + /api/2fa/verify endpoints
 *   - Replace mockSecret with response from generate-secret
 */
function generateMockSecret(): string {
  // Base32 alphabet
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let s = '';
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function generateRecoveryCodes(): string[] {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 2 }, () => Math.random().toString(36).slice(2, 7)).join('-').toUpperCase()
  );
}

/** Simple visual QR pattern derived from text. Real impl: use `qrcode` lib. */
function qrPattern(text: string, size = 25): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  let n = Math.abs(hash);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    grid[y][x] = (n & 1) === 1;
  }
  const marker = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const edge = x === 0 || x === 6 || y === 0 || y === 6;
      const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      grid[oy + y][ox + x] = edge || inner;
    }
  };
  marker(0, 0); marker(size - 7, 0); marker(0, size - 7);
  return grid;
}

export const TwoFactorSetup: React.FC<Props> = ({ open, onOpenChange, user }) => {
  const [step, setStep] = useState<Step>('intro');
  const [code, setCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [recoveryDownloaded, setRecoveryDownloaded] = useState(false);

  const secret = useMemo(() => generateMockSecret(), []);
  const recovery = useMemo(() => generateRecoveryCodes(), []);
  const issuer = 'Synapse';
  const account = user.email;
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  const pattern = useMemo(() => qrPattern(otpauthUrl, 29), [otpauthUrl]);

  const handleVerify = () => {
    if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    // Mock: accept any code in dev
    setStep('recovery');
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    toast.success('Secret copied');
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const downloadRecovery = () => {
    const blob = new Blob([`Synapse recovery codes for ${user.email}\n\n` + recovery.join('\n') + `\n\nStore these somewhere safe — each code works once.`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'synapse-recovery-codes.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setRecoveryDownloaded(true);
    toast.success('Recovery codes downloaded');
  };

  const finish = () => {
    setStep('done');
    celebrate('medium');
    playSound('unlock');
    setTimeout(() => onOpenChange(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-1">
            <Shield className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">Two-factor authentication</DialogTitle>
          <DialogDescription className="text-center">Add an extra layer of security with a code from your phone.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <ol className="space-y-3 text-sm">
                {[
                  ['Install an authenticator app', 'Google Authenticator, Authy, 1Password, etc.'],
                  ['Scan the QR code', 'Or enter the setup key manually.'],
                  ['Enter the 6-digit code', "Confirm we're in sync."],
                  ['Save recovery codes', 'In case you ever lose your device.'],
                ].map(([title, desc], i) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button variant="gradient" fullWidth size="lg" onClick={() => setStep('scan')} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get started
              </Button>
            </motion.div>
          )}

          {step === 'scan' && (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="mx-auto bg-white rounded-2xl p-3 shadow-sm w-fit">
                <svg viewBox={`0 0 ${pattern.length} ${pattern.length}`} className="w-44 h-44" shapeRendering="crispEdges">
                  <rect width="100%" height="100%" fill="white" />
                  {pattern.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0A0A0F" /> : null))}
                </svg>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Or enter setup key</p>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-xs" onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <Button variant={copiedSecret ? 'success' : 'outline'} size="icon" onClick={handleCopySecret}>
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Issuer: {issuer} · Account: {account}</p>
              </div>
              <Button variant="gradient" fullWidth onClick={() => setStep('verify')} rightIcon={<ArrowRight className="h-4 w-4" />}>
                I've added it
              </Button>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-sm text-center">Enter the 6-digit code shown in your authenticator app.</p>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                className="text-center text-2xl font-mono tracking-[0.5em] h-14"
                leftIcon={<KeyRound className="h-4 w-4" />}
              />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep('scan')}>Back</Button>
                <Button variant="gradient" fullWidth onClick={handleVerify} disabled={code.length !== 6}>Verify</Button>
              </div>
            </motion.div>
          )}

          {step === 'recovery' && (
            <motion.div key="recovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                <strong>Save these recovery codes.</strong> Each one works once if you lose access to your authenticator.
              </div>
              <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs">
                {recovery.map((c) => (
                  <span key={c} className="rounded bg-secondary px-2 py-1.5 select-all">{c}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" fullWidth onClick={downloadRecovery} leftIcon={recoveryDownloaded ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                  {recoveryDownloaded ? 'Downloaded' : 'Download .txt'}
                </Button>
                <Button variant="gradient" fullWidth onClick={finish} disabled={!recoveryDownloaded}>I've saved them</Button>
              </div>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-2 shadow-glow">
                <Check className="h-7 w-7" />
              </div>
              <p className="font-bold text-lg">2FA is on</p>
              <p className="text-sm text-muted-foreground mt-1">Your account is now more secure.</p>
              <Badge variant="success" className="mt-3"><QrCode className="h-3 w-3" /> Active</Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
