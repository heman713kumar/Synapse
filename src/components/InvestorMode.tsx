import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowLeft, Search, Filter, DollarSign, Briefcase, Clock, Star, MessageSquare } from 'lucide-react';
import { Page, Idea, User } from '../types';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { userName, compactNumber, timeAgo, truncate } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

type Stage = 'watch' | 'interested' | 'meeting' | 'passed' | 'invested';

interface DealEntry {
  ideaId: string;
  stage: Stage;
  notes?: string;
  addedAt: string;
}

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: 'watch', label: 'Watching', color: 'from-sky-500 to-blue-500' },
  { id: 'interested', label: 'Interested', color: 'from-amber-500 to-orange-500' },
  { id: 'meeting', label: 'Meeting', color: 'from-violet-500 to-fuchsia-500' },
  { id: 'invested', label: 'Invested', color: 'from-emerald-500 to-teal-500' },
  { id: 'passed', label: 'Passed', color: 'from-slate-500 to-zinc-600' },
];

export const InvestorMode: React.FC<Props> = ({ setPage }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [owners, setOwners] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [pipeline, setPipeline] = useLocalStorage<Record<string, DealEntry>>('synapse-deal-flow', {});

  useEffect(() => {
    let mounted = true;
    api.getAllIdeas()
      .then(async (data) => {
        if (!mounted) return;
        setIdeas(data || []);
        const ownerIds = Array.from(new Set((data || []).map((i) => i.ownerId).filter(Boolean)));
        const users = await Promise.all(ownerIds.map((id) => api.getUserById(id).catch(() => null)));
        const map: Record<string, User> = {};
        users.forEach((u) => { if (u) map[u.userId] = u; });
        if (mounted) setOwners(map);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = ideas.filter((i) => !query || i.title.toLowerCase().includes(query.toLowerCase()) || i.summary?.toLowerCase().includes(query.toLowerCase()));

  const setStage = (ideaId: string, stage: Stage | null) => {
    setPipeline((prev) => {
      if (!stage) {
        const next = { ...prev };
        delete next[ideaId];
        return next;
      }
      return { ...prev, [ideaId]: { ideaId, stage, addedAt: new Date().toISOString() } };
    });
  };

  const byStage = STAGES.reduce<Record<Stage, DealEntry[]>>((acc, s) => {
    acc[s.id] = Object.values(pipeline).filter((p) => p.stage === s.id);
    return acc;
  }, { watch: [], interested: [], meeting: [], passed: [], invested: [] });

  const portfolioSize = byStage.invested.length;
  const pipelineSize = byStage.watch.length + byStage.interested.length + byStage.meeting.length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-6xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">
          Back
        </Button>

        <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-6 w-6 text-emerald-500" />
              <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Investor Mode</h1>
              <Badge variant="gradient" size="sm">Pro</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Track your deal flow privately. Notes never leave your browser.</p>
          </div>
          <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />} onClick={() => setPage('search')}>
            Advanced filters
          </Button>
        </header>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard icon={Briefcase} label="In pipeline" value={pipelineSize} color="from-indigo-500 to-violet-500" />
          <KpiCard icon={Star} label="Portfolio" value={portfolioSize} color="from-amber-500 to-orange-500" />
          <KpiCard icon={Clock} label="Avg. days in stage" value={7} color="from-sky-500 to-blue-500" />
          <KpiCard icon={TrendingUp} label="This week" value={Object.values(pipeline).filter((p) => Date.now() - new Date(p.addedAt).getTime() < 7 * 86400000).length} color="from-emerald-500 to-teal-500" />
        </div>

        <Tabs defaultValue="discover">
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="discover">Discover</TabsTrigger>
            <TabsTrigger variant="pills" value="pipeline">My pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4 mt-0">
            <Input
              placeholder="Search ideas, founders, sectors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            {loading ? (
              <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <EmptyState title="No matches" />
            ) : (
              <ul className="space-y-3">
                {filtered.slice(0, 30).map((idea) => {
                  const owner = owners[idea.ownerId];
                  const entry = pipeline[idea.ideaId];
                  return (
                    <Card key={idea.ideaId} interactive>
                      <CardContent className="p-4 flex items-start gap-3">
                        <Avatar src={owner?.avatarUrl} name={userName(owner)} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <button onClick={() => setPage('ideaDetail', idea.ideaId)} className="font-semibold truncate hover:text-primary transition-colors">
                              {idea.title}
                            </button>
                            {idea.sector && <Badge variant="ghost" size="sm">{idea.sector}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{truncate(idea.summary ?? '', 140)}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span>{userName(owner)}</span>
                            <span>·</span>
                            <span>{timeAgo(idea.createdAt)}</span>
                            <span>·</span>
                            <span>{compactNumber(idea.likesCount ?? 0)} likes</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <select
                            value={entry?.stage ?? ''}
                            onChange={(e) => setStage(idea.ideaId, e.target.value as Stage || null)}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-ring"
                          >
                            <option value="">Add to deal flow…</option>
                            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                          <Button size="sm" variant="ghost" leftIcon={<MessageSquare className="h-3 w-3" />} onClick={() => owner && api.startConversation(owner.userId).then((c) => setPage('chat', c.conversationId)).catch(() => {})}>
                            Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="pipeline" className="mt-0">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto">
              {STAGES.map((s) => {
                const entries = byStage[s.id];
                return (
                  <Card key={s.id} className="min-w-[220px]">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider">{s.label}</p>
                        <Badge variant="ghost" size="sm">{entries.length}</Badge>
                      </div>
                      <ul className="space-y-2">
                        {entries.length === 0 && <li className="text-xs text-muted-foreground italic">Empty</li>}
                        {entries.map((entry) => {
                          const idea = ideas.find((i) => i.ideaId === entry.ideaId);
                          if (!idea) return null;
                          const owner = owners[idea.ownerId];
                          return (
                            <li key={entry.ideaId} className="rounded-lg border border-border p-2.5 bg-secondary/30 hover:bg-secondary/50 cursor-pointer" onClick={() => setPage('ideaDetail', entry.ideaId)}>
                              <p className="text-xs font-semibold truncate">{idea.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{userName(owner)}</p>
                              <div className={cn('mt-2 h-1 rounded-full bg-gradient-to-r', s.color)} />
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center', color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
