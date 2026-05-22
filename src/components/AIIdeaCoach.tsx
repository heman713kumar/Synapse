import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, ListChecks, Target, Lightbulb, Loader2, X, ChevronDown } from 'lucide-react';
import api from '../services/backendApiService';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Textarea } from './ui/Textarea';
import { toast } from './ui/Toaster';
import { cn } from '../utils/cn';

interface AIIdeaCoachProps {
  /** Current draft to coach on */
  title: string;
  description: string;
  category?: string;
  /** Receives improvements from the coach */
  onApplySummary?: (refined: string) => void;
  onApplyTags?: (tags: string[]) => void;
  /** Optional default collapse state */
  defaultOpen?: boolean;
}

type ActionId = 'refine' | 'analyze' | 'tags' | 'pitch';

const ACTIONS: { id: ActionId; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { id: 'refine', label: 'Refine my summary', description: 'Tighten the language and clarify your value prop', icon: Wand2, color: 'from-indigo-500 to-violet-500' },
  { id: 'analyze', label: 'Analyze my idea', description: 'Strengths, risks, and what to validate first', icon: Target, color: 'from-rose-500 to-pink-500' },
  { id: 'tags', label: 'Suggest tags', description: 'Hashtags to help the right people discover it', icon: ListChecks, color: 'from-emerald-500 to-teal-500' },
  { id: 'pitch', label: 'Draft a pitch', description: 'A 60-second elevator pitch in plain English', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
];

export const AIIdeaCoach: React.FC<AIIdeaCoachProps> = ({
  title, description, category, onApplySummary, onApplyTags, defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [busyAction, setBusyAction] = useState<ActionId | null>(null);
  const [result, setResult] = useState<{ action: ActionId; payload: any } | null>(null);

  const runAction = async (action: ActionId) => {
    if (!title.trim() && !description.trim()) {
      toast.error('Add a title or description first');
      return;
    }
    setBusyAction(action);
    setResult(null);
    try {
      if (action === 'refine') {
        const res = await api.refineSummary({ summary: description.trim() || title.trim() });
        setResult({ action, payload: res.refinedSummary });
      } else if (action === 'analyze') {
        const res = await api.analyzeIdea({ title, description, category });
        setResult({ action, payload: res.analysis });
      } else if (action === 'tags') {
        // Use suggestions endpoint; fallback to deterministic suggestions
        try {
          const res = await api.getIdeaSuggestions();
          setResult({ action, payload: res.suggestions });
        } catch {
          const fallback = generateLocalTags(title + ' ' + description);
          setResult({ action, payload: fallback });
        }
      } else if (action === 'pitch') {
        // Reuse refineSummary endpoint as a pitch generator
        const res = await api.refineSummary({
          summary: `Write a 60-second elevator pitch for: ${title}. Context: ${description}`,
        });
        setResult({ action, payload: res.refinedSummary });
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'AI request failed');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-glow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm">AI Idea Coach</p>
                <Badge variant="gradient" size="sm">Beta</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Refine, analyze, and pitch your idea with Gemini</p>
            </div>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 space-y-3">
                <div className="grid sm:grid-cols-2 gap-2">
                  {ACTIONS.map((a) => {
                    const Icon = a.icon;
                    const isBusy = busyAction === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => runAction(a.id)}
                        disabled={isBusy || !!busyAction}
                        className={cn(
                          'group flex items-start gap-3 p-3 rounded-xl border border-border text-left transition-all',
                          'hover:border-primary/30 hover:shadow-card-hover hover:-translate-y-0.5',
                          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                        )}
                      >
                        <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-br text-white flex items-center justify-center shrink-0', a.color)}>
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{a.label}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{a.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-primary/20 bg-background/50 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                          {ACTIONS.find((a) => a.id === result.action)?.label}
                        </p>
                        <button onClick={() => setResult(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {result.action === 'refine' || result.action === 'pitch' ? (
                        <>
                          <Textarea
                            value={result.payload as string}
                            onChange={() => {}}
                            rows={4}
                            readOnly
                            className="bg-background"
                          />
                          {result.action === 'refine' && onApplySummary && (
                            <div className="flex justify-end">
                              <Button size="sm" variant="gradient" onClick={() => { onApplySummary(result.payload); toast.success('Summary applied'); }}>
                                Apply to summary
                              </Button>
                            </div>
                          )}
                        </>
                      ) : result.action === 'tags' ? (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {(result.payload as string[]).map((t) => (
                              <Badge key={t} variant="soft" size="default">#{t}</Badge>
                            ))}
                          </div>
                          {onApplyTags && (
                            <div className="flex justify-end">
                              <Button size="sm" variant="gradient" onClick={() => { onApplyTags(result.payload); toast.success('Tags applied'); }}>
                                Apply all
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <pre className="text-xs whitespace-pre-wrap text-foreground/85 font-sans leading-relaxed">
                          {typeof result.payload === 'string'
                            ? result.payload
                            : JSON.stringify(result.payload, null, 2)}
                        </pre>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

function generateLocalTags(text: string): string[] {
  // Simple keyword-based fallback if the AI endpoint isn't available
  const lower = text.toLowerCase();
  const candidates = [
    ['ai', 'artificial intelligence', 'ml', 'machine learning', 'gpt'],
    ['web3', 'blockchain', 'crypto', 'nft', 'defi'],
    ['saas', 'b2b', 'enterprise'],
    ['mobile', 'ios', 'android', 'app'],
    ['startup', 'mvp', 'pitch'],
    ['climate', 'sustainability', 'green'],
    ['health', 'healthcare', 'wellness'],
    ['education', 'edtech', 'learning'],
    ['fintech', 'finance', 'banking'],
    ['design', 'ux', 'figma'],
    ['developer', 'dev', 'open-source'],
    ['community', 'social', 'network'],
  ];
  const hits = new Set<string>();
  candidates.forEach((group) => {
    if (group.some((g) => lower.includes(g))) hits.add(group[0]);
  });
  if (hits.size === 0) {
    // generic suggestions
    ['innovation', 'launch', 'collaboration'].forEach((t) => hits.add(t));
  }
  return Array.from(hits).slice(0, 6);
}
