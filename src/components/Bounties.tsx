import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Clock, CheckCircle2, Plus, Sparkles, Target, Trophy } from 'lucide-react';
import { Page } from '../types';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { toast } from './ui/Toaster';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;        // USD
  currency: 'USD';
  deadline: string;      // ISO
  ideaTitle: string;
  poster: { name: string; avatar?: string };
  tags: string[];
  applicants: number;
  status: 'open' | 'in_progress' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

const SEED: Bounty[] = [
  { id: 'b1', title: 'Build a landing page in 48 hours', description: 'Need a polished landing page for our climate-tracking app. Tailwind + React. Mobile-first.', reward: 500, currency: 'USD', deadline: nextDays(5), ideaTitle: 'CarbonPulse', poster: { name: 'Maya Chen' }, tags: ['react', 'tailwind', 'landing'], applicants: 12, status: 'open', difficulty: 'easy', createdAt: hoursAgo(6) },
  { id: 'b2', title: 'Design a mascot character', description: 'A friendly AI-themed mascot. PNG + SVG. Must work in both light + dark mode.', reward: 800, currency: 'USD', deadline: nextDays(7), ideaTitle: 'BrainBot', poster: { name: 'Yusuf O.' }, tags: ['design', 'illustration'], applicants: 8, status: 'open', difficulty: 'medium', createdAt: hoursAgo(20) },
  { id: 'b3', title: 'Write a 3-min explainer video script', description: 'Punchy, friendly tone. ~400 words. Reference deck + sample video provided.', reward: 250, currency: 'USD', deadline: nextDays(3), ideaTitle: 'NotionDB', poster: { name: 'Priya R.' }, tags: ['writing', 'copy'], applicants: 21, status: 'open', difficulty: 'easy', createdAt: hoursAgo(2) },
  { id: 'b4', title: 'Ship our Stripe → Postgres webhook pipeline', description: 'Reliable webhook handler with retries + idempotency + Slack alerts.', reward: 2400, currency: 'USD', deadline: nextDays(14), ideaTitle: 'Stipendly', poster: { name: 'Alex Y.' }, tags: ['backend', 'stripe', 'postgres'], applicants: 5, status: 'open', difficulty: 'hard', createdAt: hoursAgo(48) },
  { id: 'b5', title: 'iOS Shortcut for capturing voice notes', description: 'Voice → Whisper → POST to our API. Open source preferred.', reward: 600, currency: 'USD', deadline: nextDays(10), ideaTitle: 'Sparknotes', poster: { name: 'Lena J.' }, tags: ['ios', 'shortcuts', 'whisper'], applicants: 3, status: 'in_progress', difficulty: 'medium', createdAt: hoursAgo(72) },
  { id: 'b6', title: 'Translate our docs to Spanish', description: '~3000 words. Native-speaker preferred. Will pay $0.10/word for a quality translation.', reward: 300, currency: 'USD', deadline: nextDays(8), ideaTitle: 'OpenForms', poster: { name: 'Sam K.' }, tags: ['translation', 'docs'], applicants: 9, status: 'completed', difficulty: 'easy', createdAt: hoursAgo(120) },
];

function nextDays(d: number) { return new Date(Date.now() + d * 86400_000).toISOString(); }
function hoursAgo(h: number) { return new Date(Date.now() - h * 3600_000).toISOString(); }

const DIFF_COLOR: Record<Bounty['difficulty'], string> = {
  easy: 'from-emerald-500 to-teal-500',
  medium: 'from-amber-500 to-orange-500',
  hard: 'from-rose-500 to-red-500',
};

export const Bounties: React.FC<Props> = ({ setPage }) => {
  const [filter, setFilter] = useState<'all' | Bounty['status']>('all');
  const [applied, setApplied] = useLocalStorage<string[]>('synapse-bounty-applied', []);
  const [showPost, setShowPost] = useState(false);

  const totalOpen = useMemo(() => SEED.filter((b) => b.status === 'open').reduce((s, b) => s + b.reward, 0), []);

  const filtered = useMemo(
    () => filter === 'all' ? SEED : SEED.filter((b) => b.status === filter),
    [filter]
  );

  const apply = (id: string, title: string) => {
    setApplied((p) => p.includes(id) ? p : [...p, id]);
    toast.success(`Applied to "${title}"`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-5xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-6 w-6 text-emerald-500" />
              <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Bounties</h1>
              <Badge variant="gradient" size="sm">New</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Get paid to help ship someone else's idea. Money held in escrow until delivered.</p>
          </div>
          <Button variant="gradient" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowPost(true)}>
            Post a bounty
          </Button>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <KpiCard icon={Target} label="Open bounties" value={SEED.filter((b) => b.status === 'open').length.toString()} color="from-indigo-500 to-violet-500" />
          <KpiCard icon={DollarSign} label="Total available" value={`$${compactNumber(totalOpen)}`} color="from-emerald-500 to-teal-500" />
          <KpiCard icon={Trophy} label="Paid out (lifetime)" value="$48k" color="from-amber-500 to-orange-500" />
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="all">All</TabsTrigger>
            <TabsTrigger variant="pills" value="open" className="gap-1">Open <Badge variant="ghost" size="sm">{SEED.filter((b) => b.status === 'open').length}</Badge></TabsTrigger>
            <TabsTrigger variant="pills" value="in_progress">In progress</TabsTrigger>
            <TabsTrigger variant="pills" value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-3 mt-0">
            {filtered.map((b) => {
              const isApplied = applied.includes(b.id);
              const daysLeft = Math.max(0, Math.ceil((new Date(b.deadline).getTime() - Date.now()) / 86400_000));
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card interactive>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br shadow-md', DIFF_COLOR[b.difficulty])}>
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="font-semibold leading-snug">{b.title}</h3>
                            <Badge variant="ghost" size="sm" className="capitalize">{b.difficulty}</Badge>
                            {b.status !== 'open' && <Badge variant={b.status === 'completed' ? 'success' : 'soft'} size="sm" className="capitalize">{b.status.replace('_', ' ')}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {b.tags.map((t) => <Badge key={t} variant="soft" size="sm">#{t}</Badge>)}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Avatar src={b.poster.avatar} name={b.poster.name} size="xs" /> {b.poster.name}</span>
                            <span>·</span>
                            <span>For: <button className="text-foreground font-medium hover:underline">{b.ideaTitle}</button></span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {daysLeft}d left</span>
                            <span>·</span>
                            <span>{b.applicants} applicants</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold tabular-nums">${compactNumber(b.reward)}</p>
                          <Button size="sm" variant={isApplied ? 'outline' : 'gradient'} className="mt-2" onClick={() => apply(b.id, b.title)} disabled={b.status !== 'open' || isApplied}>
                            {isApplied ? <><CheckCircle2 className="h-3.5 w-3.5" /> Applied</> : b.status === 'open' ? 'Apply' : 'Closed'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* How it works */}
        <Card className="mt-8 border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">How bounties work</h3>
            </div>
            <ol className="grid sm:grid-cols-4 gap-4 text-sm">
              {[
                ['Post', 'Owner posts a task and locks reward in escrow.'],
                ['Apply', 'Collaborators apply with a short proposal.'],
                ['Build', 'Owner picks a builder. Work happens in the forum.'],
                ['Get paid', 'Owner approves → Stripe pays builder, Synapse takes 8%.'],
              ].map(([title, desc], i) => (
                <li key={title} className="flex flex-col gap-1">
                  <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Post bounty modal */}
      <Dialog open={showPost} onOpenChange={setShowPost}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post a bounty</DialogTitle>
            <DialogDescription>Hire someone to ship part of your idea.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input placeholder="What needs to be done?" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={4} placeholder="Be specific about deliverables, format, and acceptance criteria." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Reward (USD)</Label><Input type="number" min="50" defaultValue={250} leftIcon={<DollarSign className="h-4 w-4" />} /></div>
              <div className="space-y-1.5"><Label>Deadline (days)</Label><Input type="number" min="1" defaultValue={7} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPost(false)}>Cancel</Button>
            <Button variant="gradient" onClick={() => { toast.success('Bounty posted!'); setShowPost(false); }}>Post & escrow $250</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center', color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">{label}</p>
            <p className="text-xl font-bold tabular-nums">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
