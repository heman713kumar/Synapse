import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckSquare, MessageSquare, Wand2, Users, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Spinner } from './ui/Spinner';
import api from '../services/backendApiService';
import { toast } from './ui/Toaster';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Text of all messages concatenated */
  threadText: string;
  messageCount: number;
}

interface Summary {
  tldr: string;
  actionItems: string[];
  decisions: string[];
  openQuestions: string[];
}

export const ThreadSummaryModal: React.FC<Props> = ({ open, onOpenChange, threadText, messageCount }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const generate = async () => {
    setLoading(true);
    setSummary(null);
    try {
      // Use refineSummary as a generic AI call; in production hit a dedicated /api/ai/summarize-thread endpoint
      const prompt = `Summarize this discussion thread in JSON with this exact shape:
{ "tldr": "...", "actionItems": ["..."], "decisions": ["..."], "openQuestions": ["..."] }

Thread:
${threadText.slice(0, 4000)}`;
      const res = await api.refineSummary({ summary: prompt });
      let parsed: Summary | null = null;
      try {
        const m = (res.refinedSummary || '').match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]) as Summary;
      } catch {/* fall through */}
      if (!parsed) {
        // Heuristic fallback when AI returns prose
        parsed = {
          tldr: res.refinedSummary?.slice(0, 280) || 'Discussion covers various topics.',
          actionItems: [],
          decisions: [],
          openQuestions: [],
        };
      }
      setSummary(parsed);
    } catch (e: any) {
      toast.error(e?.message ?? 'Summary failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate when opened
  useEffect(() => {
    if (open && !summary && !loading) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Thread summary</DialogTitle>
              <DialogDescription>AI-generated TL;DR of {messageCount} messages</DialogDescription>
            </div>
            <Badge variant="gradient" size="sm" className="ml-auto">Beta</Badge>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground mt-3">Reading the conversation…</p>
            </motion.div>
          )}

          {summary && !loading && (
            <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <Section
                icon={MessageSquare}
                title="TL;DR"
                color="from-indigo-500 to-violet-500"
              >
                <p className="text-sm leading-relaxed">{summary.tldr}</p>
              </Section>

              {summary.actionItems.length > 0 && (
                <Section icon={CheckSquare} title="Action items" color="from-amber-500 to-orange-500">
                  <ul className="space-y-1.5">
                    {summary.actionItems.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {summary.decisions.length > 0 && (
                <Section icon={Users} title="Decisions made" color="from-emerald-500 to-teal-500">
                  <ul className="space-y-1.5">
                    {summary.decisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {summary.openQuestions.length > 0 && (
                <Section icon={ArrowRight} title="Open questions" color="from-rose-500 to-pink-500">
                  <ul className="space-y-1.5">
                    {summary.openQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <div className="flex justify-between items-center pt-2">
                <p className="text-[10px] text-muted-foreground">AI summaries can miss nuance. Always verify before acting.</p>
                <Button variant="ghost" size="sm" leftIcon={<Wand2 className="h-3.5 w-3.5" />} onClick={generate}>
                  Regenerate
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

function Section({ icon: Icon, title, color, children }: { icon: React.ElementType; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-6 w-6 rounded-md bg-gradient-to-br ${color} text-white flex items-center justify-center`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
