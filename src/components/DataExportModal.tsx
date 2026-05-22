import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Database, Check, Mail, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';
import { User } from '../types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

type Step = 'choose' | 'generating' | 'ready';

const SECTIONS: { id: string; label: string; desc: string; size: string }[] = [
  { id: 'profile', label: 'Profile & account', desc: 'Name, email, bio, settings, achievements', size: '~5 KB' },
  { id: 'ideas', label: 'Your ideas', desc: 'All ideas you posted, including drafts', size: 'varies' },
  { id: 'comments', label: 'Comments & forum messages', desc: 'Everything you wrote on others\' content', size: 'varies' },
  { id: 'connections', label: 'Connections', desc: 'Your network graph', size: '~2 KB' },
  { id: 'messages', label: 'Direct messages', desc: 'All your DM history', size: 'varies' },
  { id: 'analytics', label: 'Your analytics', desc: 'Views, likes, comments on your ideas', size: '~10 KB' },
];

export const DataExportModal: React.FC<Props> = ({ open, onOpenChange, user }) => {
  const [step, setStep] = useState<Step>('choose');
  const [selected, setSelected] = useState<Set<string>>(new Set(SECTIONS.map((s) => s.id)));
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  const toggle = (id: string) => {
    setSelected((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = async () => {
    setStep('generating');
    // Build a JSON snapshot client-side. Real impl: server collates and emails a signed URL.
    await new Promise((r) => setTimeout(r, 1200));

    const data: Record<string, any> = {
      _metadata: {
        exportedAt: new Date().toISOString(),
        user: { userId: user.userId, email: user.email },
        format,
        sections: Array.from(selected),
      },
    };
    if (selected.has('profile')) data.profile = { ...user };
    if (selected.has('ideas')) data.ideas = [];          // populate from API
    if (selected.has('comments')) data.comments = [];
    if (selected.has('connections')) data.connections = user.connections;
    if (selected.has('messages')) data.messages = [];
    if (selected.has('analytics')) data.analytics = {};

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `synapse-export-${user.username || user.userId}-${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'csv'}`;
    document.body.appendChild(a); a.click(); a.remove();

    setStep('ready');
    toast.success('Your data has been exported');
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(() => setStep('choose'), 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center mb-1">
            <Database className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">Export your data</DialogTitle>
          <DialogDescription className="text-center">GDPR-friendly. Download everything we have about you.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div>
                <Label className="mb-2 block">What to include</Label>
                <ul className="space-y-2">
                  {SECTIONS.map((s) => (
                    <li key={s.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/40">
                      <Checkbox id={s.id} checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={s.id} className="cursor-pointer text-sm">{s.label}</Label>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                      <Badge variant="ghost" size="sm">{s.size}</Badge>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Label className="mb-2 block">Format</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['json', 'csv'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`rounded-lg border-2 p-3 transition-colors ${format === f ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                    >
                      <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-semibold uppercase">{f}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-xs text-info flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Your data is generated client-side. Nothing leaves your browser until you choose to share it.</span>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={close}>Cancel</Button>
                <Button variant="gradient" fullWidth onClick={handleExport} disabled={selected.size === 0} leftIcon={<Download className="h-4 w-4" />}>
                  Export {selected.size} {selected.size === 1 ? 'section' : 'sections'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary/15 border-t-primary animate-spin mb-3" />
              <p className="font-semibold">Packaging your data…</p>
              <p className="text-xs text-muted-foreground mt-1">Usually takes 1–3 seconds.</p>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center mb-2 shadow-glow">
                <Check className="h-7 w-7" />
              </div>
              <p className="font-bold text-lg">Export complete</p>
              <p className="text-sm text-muted-foreground mt-1">Check your downloads folder. We also emailed a copy to {user.email}.</p>
              <div className="rounded-lg border border-border bg-secondary/40 p-3 mt-4 text-left">
                <p className="text-xs font-semibold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Reminder</p>
                <p className="text-xs text-muted-foreground mt-1">Your data export contains personal info. Don't share it publicly.</p>
              </div>
              <Button variant="gradient" fullWidth className="mt-4" onClick={close}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
