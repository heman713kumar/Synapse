import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ArrowRight, Check, Wand2, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Badge } from './ui/Badge';
import { toast } from './ui/Toaster';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: { headline?: string; bio?: string; skills?: string[]; location?: string }) => void;
}

type Step = 'input' | 'fetching' | 'review';

interface Preview {
  headline: string;
  bio: string;
  location: string;
  skills: string[];
}

/**
 * UI-ready LinkedIn import. To enable real data later:
 *   - LinkedIn requires OAuth via their "Sign in with LinkedIn" + scope `r_basicprofile`
 *   - Add `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` env vars
 *   - This modal can stay as fallback for users without OAuth
 */
export const LinkedInImportModal: React.FC<Props> = ({ open, onOpenChange, onApply }) => {
  const [step, setStep] = useState<Step>('input');
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);

  const handleFetch = async () => {
    if (!/^https?:\/\/(www\.)?linkedin\.com\//i.test(url.trim())) {
      toast.error('Please paste a valid LinkedIn URL');
      return;
    }
    setStep('fetching');
    // Mock fetch — real impl would call backend /api/profile/import/linkedin?url=...
    await new Promise((r) => setTimeout(r, 1400));
    const slug = url.trim().split('/').filter(Boolean).pop() ?? 'you';
    const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    setPreview({
      headline: `${name} · Builder · Bringing ideas to life`,
      bio: `Imported from LinkedIn (${slug}). I love turning hard problems into shipped products and building with others who care about quality.`,
      location: 'San Francisco, CA',
      skills: ['Product Management', 'Strategy', 'Public Speaking', 'Mentoring'],
    });
    setStep('review');
  };

  const handleApply = () => {
    if (!preview) return;
    onApply({
      headline: preview.headline,
      bio: preview.bio,
      location: preview.location,
      skills: preview.skills,
    });
    toast.success('Profile imported ✨');
    reset();
    onOpenChange(false);
  };

  const reset = () => {
    setStep('input');
    setUrl('');
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTimeout(reset, 250); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center mb-1">
            <Briefcase className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">Import from LinkedIn</DialogTitle>
          <DialogDescription className="text-center">Paste your public LinkedIn URL — we'll pre-fill your bio, headline, and skills.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="li-url">LinkedIn profile URL</Label>
                <Input
                  id="li-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/your-handle"
                  leftIcon={<Link2 className="h-4 w-4" />}
                />
                <p className="text-[10px] text-muted-foreground">Only public info is imported. We never store your password.</p>
              </div>
              <Button variant="gradient" fullWidth onClick={handleFetch} disabled={!url.trim()} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Fetch profile
              </Button>
            </motion.div>
          )}

          {step === 'fetching' && (
            <motion.div key="fetching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
              <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary/15 border-t-primary animate-spin mb-3" />
              <p className="text-sm font-semibold">Importing your profile…</p>
              <p className="text-xs text-muted-foreground mt-1">This usually takes 1–2 seconds.</p>
            </motion.div>
          )}

          {step === 'review' && preview && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <Field label="Headline" value={preview.headline} onChange={(v) => setPreview({ ...preview, headline: v })} />
                <Field label="Location" value={preview.location} onChange={(v) => setPreview({ ...preview, location: v })} />
                <TextField label="Bio" value={preview.bio} onChange={(v) => setPreview({ ...preview, bio: v })} />
                <div className="space-y-1.5">
                  <Label>Skills detected ({preview.skills.length})</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.skills.map((s) => (
                      <Badge key={s} variant="soft" size="sm">
                        {s}
                        <button
                          onClick={() => setPreview({ ...preview, skills: preview.skills.filter((x) => x !== s) })}
                          className="ml-1 hover:text-destructive text-[10px]"
                        >✕</button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep('input')}>Back</Button>
                <Button variant="gradient" fullWidth onClick={handleApply} leftIcon={<Check className="h-4 w-4" />}>
                  Apply to my profile
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-ring" />
      <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><Wand2 className="h-2.5 w-2.5" /> AI can refine this further after import</p>
    </div>
  );
}
