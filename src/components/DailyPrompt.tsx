import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

const PROMPTS = [
  'What problem would you solve if you couldn\'t fail?',
  'Describe an idea that\'s been stuck in your head for over a year.',
  'What\'s a workflow you wish was 10x faster?',
  'Pitch your idea in exactly 6 words.',
  'What\'s an industry ripe for disruption — and why now?',
  'What tool do you wish existed for your daily job?',
  'If you had $10k and 30 days, what would you build?',
  'What\'s a non-obvious second-order effect of AI you\'re excited about?',
  'Name an underserved community and an idea to help them.',
  'What\'s the dumbest idea you have that just might work?',
  'Describe your ideal Sunday product to use.',
  'What did you try this week that surprised you?',
  'What\'s a startup you wish existed in your country?',
  'What\'s a habit you\'d like to systemize into a product?',
];

const dayKey = () => new Date().toISOString().slice(0, 10);

export const DailyPrompt: React.FC<Props> = ({ setPage }) => {
  const [dismissedDate, setDismissedDate] = useLocalStorage<string | null>('synapse-prompt-dismissed', null);

  const todaysPrompt = useMemo(() => {
    const day = new Date();
    const startOfYear = new Date(day.getFullYear(), 0, 0);
    const diff = (day.getTime() - startOfYear.getTime()) / 86400_000;
    return PROMPTS[Math.floor(diff) % PROMPTS.length];
  }, []);

  if (dismissedDate === dayKey()) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-fuchsia-500/5 p-5"
    >
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <button
        onClick={() => setDismissedDate(dayKey())}
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="relative flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-glow-sm shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gradient" size="sm">Today's prompt</Badge>
            <span className="text-[10px] text-muted-foreground font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <p className="text-base font-semibold tracking-tight leading-snug">{todaysPrompt}</p>
          <Button
            variant="gradient"
            size="sm"
            className="mt-3"
            rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            onClick={() => {
              try {
                localStorage.setItem('synapse-draft-new-idea', JSON.stringify({
                  title: '',
                  summary: '',
                  description: `Prompted by today's question: "${todaysPrompt}"\n\n`,
                  sector: '', region: '', tags: ['daily-prompt'], requiredSkills: [],
                }));
              } catch {}
              setPage('newIdea');
            }}
          >
            Write a response
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
