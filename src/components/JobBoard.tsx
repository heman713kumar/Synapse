import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Search, Filter, Building2, Heart, Plus, Globe } from 'lucide-react';
import { Page } from '../types';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

type Commitment = 'full-time' | 'part-time' | 'contract' | 'volunteer' | 'equity-only';
type Remote = 'remote' | 'hybrid' | 'onsite';

interface Job {
  id: string;
  title: string;
  company: string;
  commitment: Commitment;
  remote: Remote;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  equity?: string;
  skills: string[];
  description: string;
  ideaTitle: string;
  posted: string;
  applicants: number;
  founder: { name: string; avatar?: string; verified?: boolean };
  emoji: string;
}

const SEED: Job[] = [
  { id: 'j1', title: 'Founding engineer', company: 'CarbonPulse', commitment: 'full-time', remote: 'remote', location: 'Anywhere', salaryMin: 120, salaryMax: 160, equity: '1–2%', skills: ['TypeScript', 'PostgreSQL', 'React'], description: 'Build core platform from zero. You will own architecture decisions and ship to 10k+ users in your first month.', ideaTitle: 'CarbonPulse', posted: hoursAgo(6), applicants: 47, founder: { name: 'Maya Chen', verified: true }, emoji: '🌱' },
  { id: 'j2', title: 'Product designer (lead)', company: 'NotionDB', commitment: 'full-time', remote: 'hybrid', location: 'San Francisco, CA', salaryMin: 140, salaryMax: 180, equity: '0.5–1%', skills: ['Figma', 'Design Systems', 'UX Research'], description: 'Shape the visual identity and product experience for a developer tool used by 200+ teams.', ideaTitle: 'NotionDB', posted: hoursAgo(20), applicants: 32, founder: { name: 'Priya R.' }, emoji: '🎨' },
  { id: 'j3', title: 'GTM lead (B2B SaaS)', company: 'Stipendly', commitment: 'contract', remote: 'remote', location: 'US time zone', salaryMin: 80, salaryMax: 120, skills: ['Sales', 'B2B SaaS', 'Outbound'], description: '3-month engagement to hit our first $1M ARR. Performance-based bonus.', ideaTitle: 'Stipendly', posted: hoursAgo(48), applicants: 18, founder: { name: 'Alex Y.', verified: true }, emoji: '📈' },
  { id: 'j4', title: 'iOS engineer', company: 'Sparknotes', commitment: 'part-time', remote: 'remote', location: 'Anywhere', skills: ['Swift', 'SwiftUI', 'Combine'], description: '20h/week to ship voice-note iOS app. Equity-friendly.', ideaTitle: 'Sparknotes', posted: hoursAgo(72), applicants: 12, founder: { name: 'Lena J.' }, emoji: '📱', equity: '0.5%' },
  { id: 'j5', title: 'Community manager (volunteer)', company: 'OpenForms', commitment: 'volunteer', remote: 'remote', location: 'Anywhere', skills: ['Community', 'Discord', 'Content'], description: 'Help us grow an open-source project. Excellent recommendation letter + future paid role.', ideaTitle: 'OpenForms', posted: hoursAgo(120), applicants: 8, founder: { name: 'Sam K.' }, emoji: '🤝' },
  { id: 'j6', title: 'AI research engineer', company: 'BrainBot', commitment: 'full-time', remote: 'remote', location: 'Anywhere', salaryMin: 180, salaryMax: 250, equity: '1–3%', skills: ['Python', 'PyTorch', 'LLMs'], description: 'Ship agentic workflows that compose models. Paper-publishing encouraged.', ideaTitle: 'BrainBot', posted: hoursAgo(4), applicants: 91, founder: { name: 'Yusuf O.', verified: true }, emoji: '🤖' },
];

function hoursAgo(h: number) { return new Date(Date.now() - h * 3600_000).toISOString(); }

const COMMITMENT_LABEL: Record<Commitment, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  volunteer: 'Volunteer',
  'equity-only': 'Equity only',
};

const REMOTE_LABEL: Record<Remote, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

export const JobBoard: React.FC<Props> = ({ setPage }) => {
  const [query, setQuery] = useState('');
  const [commitment, setCommitment] = useState<'all' | Commitment>('all');
  const [saved, setSaved] = useLocalStorage<string[]>('synapse-saved-jobs', []);
  const [applied, setApplied] = useLocalStorage<string[]>('synapse-applied-jobs', []);

  const filtered = useMemo(() => {
    return SEED.filter((j) => {
      if (commitment !== 'all' && j.commitment !== commitment) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q) && !j.skills.some((s) => s.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [query, commitment]);

  const toggleSave = (id: string) => {
    setSaved((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Jobs at Synapse ideas</h1>
              <Badge variant="gradient" size="sm">New</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Join an idea as a co-founder or hire. Curated, no spam.</p>
          </div>
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => toast('Post a job from your idea\'s page → "Hiring" tab', { icon: '💼' })}>
            Post a job
          </Button>
        </header>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search role, company, or skill"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
            Filters
          </Button>
        </div>

        <Tabs value={commitment} onValueChange={(v) => setCommitment(v as any)}>
          <TabsList variant="pills" className="mb-5 overflow-x-auto">
            <TabsTrigger variant="pills" value="all">All ({SEED.length})</TabsTrigger>
            {(['full-time', 'part-time', 'contract', 'volunteer', 'equity-only'] as Commitment[]).map((c) => (
              <TabsTrigger key={c} variant="pills" value={c}>{COMMITMENT_LABEL[c]}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={commitment} className="space-y-3 mt-0">
            {filtered.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No jobs match your filters.</CardContent></Card>
            ) : filtered.map((j) => {
              const isSaved = saved.includes(j.id);
              const isApplied = applied.includes(j.id);
              return (
                <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <Card interactive>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 flex items-center justify-center text-2xl shrink-0">{j.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="font-semibold leading-snug">{j.title}</h3>
                            <span className="text-sm text-muted-foreground">at <span className="font-medium text-foreground">{j.company}</span></span>
                            {j.founder.verified && <Badge variant="soft" size="sm">✓ Verified</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {COMMITMENT_LABEL[j.commitment]}</span>
                            <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {REMOTE_LABEL[j.remote]}</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.location}</span>
                            {(j.salaryMin || j.salaryMax) && (
                              <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${j.salaryMin}–${j.salaryMax}k</span>
                            )}
                            {j.equity && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {j.equity} equity</span>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{j.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {j.skills.map((s) => <Badge key={s} variant="soft" size="sm">{s}</Badge>)}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              <Avatar src={j.founder.avatar} name={j.founder.name} size="xs" />
                              <span className="text-xs text-muted-foreground">{j.founder.name}</span>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {timeAgo(j.posted)} · {j.applicants} applicants</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon-sm" aria-label={isSaved ? 'Unsave' : 'Save'} onClick={() => toggleSave(j.id)}>
                                <Heart className={cn('h-4 w-4', isSaved && 'fill-current text-rose-500')} />
                              </Button>
                              <Button
                                size="sm"
                                variant={isApplied ? 'outline' : 'gradient'}
                                onClick={() => {
                                  setApplied((p) => p.includes(j.id) ? p : [...p, j.id]);
                                  toast.success(`Applied to ${j.title} at ${j.company}`);
                                }}
                              >
                                {isApplied ? 'Applied' : 'Apply'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
