import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Idea, User, Page, IdeaAnalytics } from '../types';
import api from '../services/backendApiService';
import { Eye, TrendingUp, Users, Target, MapPin, ArrowLeft, BarChart3 } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Spinner } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { toast } from './ui/Toaster';
import { compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface AnalyticsDashboardProps {
  ideaId: string;
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}

const StatCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string | number;
  trend?: { value: number; positive: boolean };
  color: string;
}> = ({ icon: Icon, title, value, trend, color }) => (
  <Card interactive className="overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-md', color)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <Badge variant={trend.positive ? 'success' : 'destructive'} size="sm">
            {trend.positive ? '+' : ''}{trend.value}%
          </Badge>
        )}
      </div>
      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{title}</p>
      <p className="text-3xl font-bold tracking-tight mt-1 tabular-nums">{value}</p>
    </CardContent>
  </Card>
);

const LineChart: React.FC<{ data: { date: string; views: number }[] }> = ({ data }) => {
  if (!data || data.length < 2) {
    return <p className="text-sm text-muted-foreground flex items-center justify-center h-full">Not enough data yet.</p>;
  }
  const maxValue = Math.max(...data.map((d) => d.views), 1);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.views / maxValue) * 95}`).join(' ');
  return (
    <div className="w-full h-full flex flex-col">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="flex-1">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#chartGradient)" points={`0,100 ${points} 100,100`} />
        <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" points={points} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
};

const BarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No data yet.</p>;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="w-full h-full flex items-end gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t-md transition-all hover:from-fuchsia-500 hover:to-pink-500"
              style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '4px' }}
              title={`${item.label}: ${item.value}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const DonutChart: React.FC<{ data: { skill: string; count: number }[] }> = ({ data }) => {
  const chartData = data || [];
  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground flex items-center justify-center h-full">No collaborator data yet.</p>;
  const colors = ['hsl(239 84% 67%)', 'hsl(263 70% 60%)', 'hsl(330 81% 60%)', 'hsl(199 89% 48%)', 'hsl(159 64% 52%)'];
  let cumulative = 0;
  return (
    <div className="w-full h-full grid grid-cols-2 gap-4 items-center">
      <div className="relative aspect-square">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {chartData.map((item, i) => {
            const pct = (item.count / total) * 100;
            const dashArray = `${pct} ${100 - pct}`;
            const offset = -cumulative;
            cumulative += pct;
            return (
              <circle key={i} cx="18" cy="18" r="15.91" fill="none" stroke={colors[i % colors.length]} strokeWidth="4" strokeDasharray={dashArray} strokeDashoffset={offset} pathLength="100" />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{total}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {chartData.slice(0, 5).map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="truncate flex-1">{item.skill}</span>
            <span className="text-muted-foreground tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ ideaId, currentUser, setPage }) => {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [analytics, setAnalytics] = useState<IdeaAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const ideaData = await api.getIdeaById(ideaId);
        if (!isMountedRef.current) return;
        if (ideaData.ownerId !== currentUser.userId) {
          toast.error('Only the idea owner can view analytics');
          setPage('ideaDetail', ideaId);
          return;
        }
        setIdea(ideaData);
        const data = await api.getAnalyticsForIdea(ideaId);
        if (isMountedRef.current) setAnalytics(data);
      } catch (e: any) {
        toast.error(e?.message ?? 'Failed to load analytics');
        setPage('ideaDetail', ideaId);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };
    fetch();
  }, [ideaId, currentUser, setPage]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!idea) return null;

  const empty = !analytics || (analytics.totalViews === 0 && analytics.uniqueVisitors === 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-strong border-b border-border sticky top-0 z-30">
        <div className="container max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon-sm" onClick={() => setPage('ideaDetail', ideaId)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Analytics</p>
              <h1 className="text-base font-semibold truncate">{idea.title}</h1>
            </div>
          </div>
          <Avatar src={currentUser.avatarUrl} name={currentUser.displayName} size="sm" />
        </div>
      </header>

      <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="container max-w-6xl py-6 px-4">
        {empty ? (
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="No analytics yet"
            description="As people view, comment, and engage with your idea, you'll see insights here."
          />
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard icon={Eye} title="Total views" value={compactNumber(analytics!.totalViews)} color="from-indigo-500 to-violet-500" trend={{ value: 12, positive: true }} />
              <StatCard icon={Users} title="Unique visitors" value={compactNumber(analytics!.uniqueVisitors)} color="from-emerald-500 to-teal-500" trend={{ value: 8, positive: true }} />
              <StatCard icon={TrendingUp} title="Engagement rate" value={`${analytics!.engagementRate}%`} color="from-amber-500 to-orange-500" />
              <StatCard icon={Target} title="Collab conversion" value={`${analytics!.collaborationConversionRate}%`} color="from-rose-500 to-pink-500" />
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Views over time</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <LineChart data={analytics!.viewsOverTime || []} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Top regions</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <BarChart data={(analytics!.geography || []).map((g) => ({ label: g.region, value: g.views }))} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Traffic sources</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <BarChart data={(analytics!.trafficSources || []).map((t) => ({ label: t.source, value: t.visits }))} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Collaborator skills</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <DonutChart data={analytics!.collaboratorSkillDemographics || []} />
                </CardContent>
              </Card>

              {/* Lifecycle funnel */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Lifecycle funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <LifecycleFunnel
                    totalViews={analytics!.totalViews}
                    uniqueVisitors={analytics!.uniqueVisitors}
                    likes={idea.likesCount ?? 0}
                    comments={idea.commentsCount ?? 0}
                    collabs={idea.collaborators?.length ?? 0}
                  />
                </CardContent>
              </Card>

              {/* Reactions breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Reactions breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReactionsChart />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.main>
    </div>
  );
};

function LifecycleFunnel({ totalViews, uniqueVisitors, likes, comments, collabs }: { totalViews: number; uniqueVisitors: number; likes: number; comments: number; collabs: number }) {
  const stages = [
    { label: 'Views', value: totalViews, color: 'from-indigo-500 to-violet-500' },
    { label: 'Unique visitors', value: uniqueVisitors, color: 'from-violet-500 to-fuchsia-500' },
    { label: 'Reactions / likes', value: likes, color: 'from-fuchsia-500 to-pink-500' },
    { label: 'Comments', value: comments, color: 'from-rose-500 to-orange-500' },
    { label: 'Collab requests', value: collabs, color: 'from-orange-500 to-amber-500' },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <ul className="space-y-2.5">
      {stages.map((s, i) => {
        const pct = Math.round((s.value / max) * 100);
        const prev = i > 0 ? stages[i - 1].value : null;
        const conv = prev && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{s.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {compactNumber(s.value)}
                {conv !== null && (
                  <span className="ml-2 text-[10px] text-success">{conv}% ↓</span>
                )}
              </span>
            </div>
            <div className="h-7 rounded-md bg-secondary overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${s.color} flex items-center px-2 text-[10px] font-bold text-white shadow-sm`} style={{ width: `${Math.max(pct, 3)}%` }}>
                {pct >= 8 && `${pct}%`}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ReactionsChart() {
  // Demo data; swap with `/api/ideas/:id/reactions/breakdown` when backend ready
  const reactions = [
    { emoji: '👍', count: 142, color: 'from-sky-500 to-blue-500' },
    { emoji: '❤️', count: 98, color: 'from-rose-500 to-pink-500' },
    { emoji: '🔥', count: 73, color: 'from-amber-500 to-orange-500' },
    { emoji: '💡', count: 52, color: 'from-yellow-500 to-amber-500' },
    { emoji: '🚀', count: 41, color: 'from-violet-500 to-fuchsia-500' },
    { emoji: '👀', count: 28, color: 'from-emerald-500 to-teal-500' },
    { emoji: '🎉', count: 19, color: 'from-fuchsia-500 to-pink-500' },
  ];
  const total = reactions.reduce((sum, r) => sum + r.count, 0);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {reactions.map((r) => {
        const pct = Math.round((r.count / total) * 100);
        return (
          <div key={r.emoji} className="rounded-xl border border-border bg-card p-3 text-center">
            <div className={`mx-auto h-10 w-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-2xl shadow-sm`}>
              {r.emoji}
            </div>
            <p className="mt-2 text-lg font-bold tabular-nums">{compactNumber(r.count)}</p>
            <p className="text-[10px] text-muted-foreground">{pct}% of total</p>
          </div>
        );
      })}
    </div>
  );
}
