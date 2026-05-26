import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Clock, CheckCircle2, Plus, Sparkles, Target, Trophy } from 'lucide-react';
import { Page } from '../types';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { EmptyState } from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { toast } from './ui/Toaster';
import { compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

/**
 * Backend shape (from backend/src/routes/bounties.routes.ts):
 *   { id, idea_id, poster_id, title, description, reward_cents,
 *     deadline, difficulty, tags, status, created_at, applicant_count?,
 *     poster_name?, poster_avatar?, idea_title? }
 *
 * We coerce defensively because some endpoints return camelCase aliases.
 */
interface BountyDTO {
  id: string;
  title: string;
  description: string;
  reward_cents?: number;       rewardCents?: number;
  deadline?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;         createdAt?: string;
  applicant_count?: number;    applicantCount?: number;
  poster_name?: string;        posterName?: string;
  poster_avatar?: string;      posterAvatar?: string;
  idea_title?: string;         ideaTitle?: string;
  applied_by_me?: boolean;     appliedByMe?: boolean;
}

const DIFF_COLOR: Record<NonNullable<BountyDTO['difficulty']>, string> = {
  easy: 'from-emerald-500 to-teal-500',
  medium: 'from-amber-500 to-orange-500',
  hard: 'from-rose-500 to-red-500',
};

const pickReward    = (b: BountyDTO) => (b.reward_cents ?? b.rewardCents ?? 0) / 100;
const pickApplicants= (b: BountyDTO) => b.applicant_count ?? b.applicantCount ?? 0;
const pickPoster    = (b: BountyDTO) => ({
  name: b.poster_name ?? b.posterName ?? 'Synapse user',
  avatar: b.poster_avatar ?? b.posterAvatar,
});
const pickIdeaTitle = (b: BountyDTO) => b.idea_title ?? b.ideaTitle ?? '';

export const Bounties: React.FC<Props> = ({ setPage }) => {
  const [bounties, setBounties] = useState<BountyDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');

  // Track local optimistic "applied" state — the backend stamps applied_by_me
  // when authenticated, but for snappy UX we mark applied immediately on click.
  const [locallyApplied, setLocallyApplied] = useState<Set<string>>(new Set());

  // Post-bounty modal form state
  const [showPost, setShowPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postReward, setPostReward] = useState<number>(250);
  const [postDays, setPostDays] = useState<number>(7);
  const [posting, setPosting] = useState(false);

  // Load list on mount.
  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setError(null);
    api.getBounties()
      .then((data) => { if (alive) setBounties(Array.isArray(data) ? data : []); })
      .catch((err) => {
        if (!alive) return;
        // Don't show an error toast — backend not being ready is a normal
        // state during dev. Just show empty state with a helper.
        setError(err?.message || 'Could not reach bounties API.');
        setBounties([]);
      })
      .finally(() => { if (alive) setIsLoading(false); });
    return () => { alive = false; };
  }, []);

  const totalOpenReward = useMemo(
    () => bounties.filter((b) => (b.status ?? 'open') === 'open').reduce((s, b) => s + pickReward(b), 0),
    [bounties],
  );
  const openCount = useMemo(() => bounties.filter((b) => (b.status ?? 'open') === 'open').length, [bounties]);

  const filtered = useMemo(
    () => filter === 'all' ? bounties : bounties.filter((b) => (b.status ?? 'open') === filter),
    [bounties, filter],
  );

  const handleApply = async (b: BountyDTO) => {
    // Optimistic mark — UI flips even if the network call is slow.
    setLocallyApplied((prev) => new Set(prev).add(b.id));
    try {
      await api.applyToBounty(b.id, 'I would like to take this on.');
      toast.success(`Applied to "${b.title}"`);
    } catch (err: any) {
      // Roll back the optimistic mark on failure so the button is clickable again.
      setLocallyApplied((prev) => {
        const next = new Set(prev);
        next.delete(b.id);
        return next;
      });
      toast.error(err?.message || 'Could not submit application. Please try again.');
    }
  };

  const handlePost = async () => {
    if (!postTitle.trim() || !postDesc.trim() || postReward <= 0) {
      toast.error('Title, description, and reward are required.');
      return;
    }
    setPosting(true);
    try {
      const deadline = new Date(Date.now() + postDays * 86400_000).toISOString();
      const created = await api.createBounty({
        title: postTitle.trim(),
        description: postDesc.trim(),
        rewardCents: Math.round(postReward * 100),
        deadline,
        difficulty: 'medium',
        tags: [],
      });
      // Prepend the newly-created bounty so the user sees it immediately.
      setBounties((prev) => [created, ...prev]);
      toast.success('Bounty posted!');
      setShowPost(false);
      setPostTitle(''); setPostDesc(''); setPostReward(250); setPostDays(7);
    } catch (err: any) {
      toast.error(err?.message || 'Could not post bounty.');
    } finally {
      setPosting(false);
    }
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
            </div>
            <p className="text-sm text-muted-foreground">Get paid to help ship someone else's idea. Money held in escrow until delivered.</p>
          </div>
          <Button variant="gradient" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowPost(true)}>
            Post a bounty
          </Button>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <KpiCard icon={Target}     label="Open bounties"        value={openCount.toString()}                       color="from-indigo-500 to-violet-500" />
          <KpiCard icon={DollarSign} label="Total available"      value={`$${compactNumber(totalOpenReward)}`}        color="from-emerald-500 to-teal-500" />
          <KpiCard icon={Trophy}     label="Posted by community"  value={bounties.length.toString()}                  color="from-amber-500 to-orange-500" />
        </div>

        {isLoading ? (
          <PageLoader label="Loading bounties…" minHeight="40vh" />
        ) : bounties.length === 0 ? (
          <EmptyState
            icon={<DollarSign className="h-8 w-8" />}
            title={error ? 'Bounties unavailable' : 'No bounties yet'}
            description={
              error
                ? 'The bounty service isn\'t reachable. Once the backend + database are running, posted bounties will appear here.'
                : 'Be the first — post a task and lock a reward in escrow.'
            }
            action={!error ? { label: 'Post a bounty', onClick: () => setShowPost(true) } : undefined}
          />
        ) : (
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList variant="pills" className="mb-5">
              <TabsTrigger variant="pills" value="all">All</TabsTrigger>
              <TabsTrigger variant="pills" value="open" className="gap-1">
                Open <Badge variant="ghost" size="sm">{openCount}</Badge>
              </TabsTrigger>
              <TabsTrigger variant="pills" value="in_progress">In progress</TabsTrigger>
              <TabsTrigger variant="pills" value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-3 mt-0">
              {filtered.map((b) => {
                const isApplied = locallyApplied.has(b.id) || !!b.applied_by_me || !!b.appliedByMe;
                const daysLeft = b.deadline
                  ? Math.max(0, Math.ceil((new Date(b.deadline).getTime() - Date.now()) / 86400_000))
                  : null;
                const status = b.status ?? 'open';
                const poster = pickPoster(b);
                const diffColor = DIFF_COLOR[b.difficulty ?? 'medium'];
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Card interactive>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br shadow-md', diffColor)}>
                            <DollarSign className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <h3 className="font-semibold leading-snug">{b.title}</h3>
                              {b.difficulty && <Badge variant="ghost" size="sm" className="capitalize">{b.difficulty}</Badge>}
                              {status !== 'open' && (
                                <Badge
                                  variant={status === 'completed' ? 'success' : 'soft'}
                                  size="sm"
                                  className="capitalize"
                                >
                                  {status.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.description}</p>
                            {(b.tags && b.tags.length > 0) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {b.tags.map((t) => <Badge key={t} variant="soft" size="sm">#{t}</Badge>)}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Avatar src={poster.avatar} name={poster.name} size="xs" /> {poster.name}
                              </span>
                              {pickIdeaTitle(b) && (
                                <>
                                  <span>·</span>
                                  <span>For: <span className="text-foreground font-medium">{pickIdeaTitle(b)}</span></span>
                                </>
                              )}
                              {daysLeft !== null && (
                                <>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {daysLeft}d left</span>
                                </>
                              )}
                              <span>·</span>
                              <span>{pickApplicants(b)} applicants</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-bold tabular-nums">${compactNumber(pickReward(b))}</p>
                            <Button
                              size="sm"
                              variant={isApplied ? 'outline' : 'gradient'}
                              className="mt-2"
                              onClick={() => handleApply(b)}
                              disabled={status !== 'open' || isApplied}
                            >
                              {isApplied ? <><CheckCircle2 className="h-3.5 w-3.5" /> Applied</> : status === 'open' ? 'Apply' : 'Closed'}
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
        )}

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
      <Dialog open={showPost} onOpenChange={(o) => !posting && setShowPost(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post a bounty</DialogTitle>
            <DialogDescription>Hire someone to ship part of your idea.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="What needs to be done?" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={4} placeholder="Be specific about deliverables, format, and acceptance criteria."
                value={postDesc} onChange={(e) => setPostDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reward (USD)</Label>
                <Input type="number" min="50"
                  value={postReward}
                  onChange={(e) => setPostReward(Number(e.target.value) || 0)}
                  leftIcon={<DollarSign className="h-4 w-4" />} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline (days)</Label>
                <Input type="number" min="1"
                  value={postDays}
                  onChange={(e) => setPostDays(Number(e.target.value) || 1)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPost(false)} disabled={posting}>Cancel</Button>
            <Button variant="gradient" onClick={handlePost} loading={posting}>
              Post & escrow ${postReward.toFixed(0)}
            </Button>
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
