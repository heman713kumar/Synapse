import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, Search, BookOpen, MessageCircle, Mail, Lightbulb, Users, Shield, CreditCard, PlayCircle } from 'lucide-react';
import { Page } from '../types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { cn } from '../utils/cn';
import { toast } from './ui/Toaster';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

/**
 * Help Center — accordion FAQ + topic chips + contact card.
 *
 * Pure static content — no backend dependency. Every question is one users
 * have actually asked us through Intercom/email since launch, so this is the
 * highest-ROI page we can ship without an article CMS.
 */
const TOPICS = [
  { id: 'getting-started', label: 'Getting started', icon: Lightbulb },
  { id: 'ideas',           label: 'Ideas & posting', icon: BookOpen },
  { id: 'collab',          label: 'Collaboration',   icon: Users },
  { id: 'account',         label: 'Account & login', icon: Shield },
  { id: 'billing',         label: 'Billing & Premium', icon: CreditCard },
] as const;

interface FAQ {
  topic: typeof TOPICS[number]['id'];
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  // GETTING STARTED
  { topic: 'getting-started', q: 'What is Synapse?',
    a: 'Synapse is a community where people share early-stage ideas and find collaborators with the right skills to actually build them. Think of it as half social network, half pitch board, half kanban.' },
  { topic: 'getting-started', q: 'How do I create my first idea?',
    a: 'Click the + button in the header (or "New idea" on the feed). You will write a one-liner, a short summary, pick a sector, and optionally list skills you need help with. You can keep iterating — autosave is on by default.' },
  { topic: 'getting-started', q: 'Is Synapse free?',
    a: 'Yes. Posting ideas, joining discussions, and connecting with collaborators is free forever. Premium adds investor mode, bulk messaging, and advanced analytics.' },

  // IDEAS
  { topic: 'ideas', q: 'Will someone steal my idea?',
    a: 'Ideas are cheap; execution is everything. That said, every idea you post is stamped with a public timestamp, and you can mark sensitive details as private. Synapse cares about attribution — if someone forks your idea, you stay credited.' },
  { topic: 'ideas', q: 'What is "progress stage"?',
    a: 'It reflects where the idea is in its life: Idea (just thinking), MVP (building), Beta (testing), Launched (live), Funded (raised money). Update it as you make progress to attract the right collaborators.' },
  { topic: 'ideas', q: 'Can I edit an idea after posting?',
    a: 'Yes, anytime. Every edit is saved as a new version so you can see how the idea evolved (Versions tab on the idea page).' },
  { topic: 'ideas', q: 'How does the "For you" sort work?',
    a: 'We score each idea against your skills (15 points per match), interests (5 per match), and sector preference (10). Higher scores surface first. Sign in and complete your profile for personalized ranking.' },

  // COLLABORATION
  { topic: 'collab', q: 'How do I join an idea?',
    a: 'Open the idea, click "Request to collaborate", and write a short note about what you would bring. The owner gets a notification and can accept or decline.' },
  { topic: 'collab', q: 'What is a Bounty vs a Job?',
    a: 'Bounty = small, scoped task with a fixed reward (e.g. "Design our landing page for $500"). Job = ongoing role for a founding team member (full-time or part-time). Bounties are pay-on-delivery; jobs go through Stripe payroll.' },
  { topic: 'collab', q: 'How does mentorship work?',
    a: 'Mentors set a rate per 30 minutes. Book a slot, pay through Synapse, and we send a Zoom link. Cancel up to 24h before for a full refund. Synapse takes a 12% platform fee.' },

  // ACCOUNT
  { topic: 'account', q: 'I did not get my verification email.',
    a: 'Check spam first. If still missing, sign in and use "Resend verification" — links expire after 24 hours. SMTP issues can delay delivery; refresh after a minute or two.' },
  { topic: 'account', q: 'I forgot my password.',
    a: 'Click "Forgot?" on the login page. We email a reset link that is valid for 1 hour. If you do not receive it, the address may not match an account.' },
  { topic: 'account', q: 'How do I delete my account?',
    a: 'Settings → Privacy → "Delete account". This permanently removes your profile, ideas, comments, and connections. We honor GDPR right-to-be-forgotten in full.' },
  { topic: 'account', q: 'Can I have two accounts?',
    a: 'One person, one account — please. We rate-limit aggressively per IP and per email, and duplicate accounts get suspended together.' },

  // BILLING
  { topic: 'billing', q: 'What is included in Premium?',
    a: 'Investor mode (deal pipeline kanban), bulk messaging, advanced analytics, exportable reports, and priority support. $19/mo billed annually.' },
  { topic: 'billing', q: 'How do I cancel Premium?',
    a: 'Settings → Billing → "Cancel subscription". You keep Premium until the end of the current billing period. No questions, no retention emails.' },
  { topic: 'billing', q: 'Do you offer refunds?',
    a: 'Yes — within 14 days of purchase, no questions asked. Email billing@synapse.app from the address on the account.' },
];

export const Help: React.FC<Props> = ({ setPage }) => {
  const [topic, setTopic] = useState<typeof TOPICS[number]['id'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (topic !== 'all' && f.topic !== topic) return false;
      if (q && !f.q.toLowerCase().includes(q) && !f.a.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topic, query]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-3xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="h-5 w-5" />
          </span>
          Help Center
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Answers to common questions. Can't find what you're looking for? <a href="mailto:support@synapse.app" className="text-primary hover:underline">Email us</a>.
        </p>
      </header>

      {/* Search */}
      <Input
        placeholder="Search the help center…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
        className="mb-4"
      />

      {/* Topic chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin mb-6">
        <button
          onClick={() => setTopic('all')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
            topic === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
          )}
        >
          All
        </button>
        {TOPICS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTopic(id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1.5',
              topic === id ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-semibold">No matches</p>
            <p className="text-sm text-muted-foreground mt-1">Try different keywords or <a href="mailto:support@synapse.app" className="text-primary hover:underline">email support</a>.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 mb-8">
          {filtered.map((f, i) => {
            const isOpen = openId === i;
            return (
              <Card key={i}>
                <button
                  onClick={() => setOpenId(isOpen ? null : i)}
                  className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-secondary/30 transition-colors rounded-lg"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="ghost" size="sm" className="capitalize shrink-0">{f.topic.replace('-', ' ')}</Badge>
                    <span className="font-medium text-sm truncate">{f.q}</span>
                  </div>
                  <span className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-180')}>▾</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 -mt-1 text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Replay tour card */}
      <Card className="mb-3">
        <CardContent className="p-5 flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <PlayCircle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h3 className="font-semibold">Take the tour</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Walk through the main parts of Synapse — 30 seconds, dismissable anytime.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlayCircle className="h-4 w-4" />}
            onClick={() => {
              try { localStorage.setItem('synapse-tour-done', JSON.stringify(false)); } catch {/* noop */}
              toast.success('Tour reset — heading to the feed.');
              setPage('feed');
            }}
          >
            Start
          </Button>
        </CardContent>
      </Card>

      {/* Contact card */}
      <Card className="border-dashed">
        <CardContent className="p-5 flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h3 className="font-semibold">Still stuck?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">We answer most emails within a few hours during business days.</p>
          </div>
          <a href="mailto:support@synapse.app">
            <Button variant="outline" size="sm" leftIcon={<Mail className="h-4 w-4" />}>Email</Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
};
