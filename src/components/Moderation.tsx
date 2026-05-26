import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, AlertTriangle, RefreshCw, X, Trash2, Ban, MessageSquare,
  CheckCircle2, Clock, Filter,
} from 'lucide-react';
import { Page, User, Report } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageLoader } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { toast } from './ui/Toaster';
import api from '../services/backendApiService';
import { NotFound } from './NotFound';
import { cn } from '../utils/cn';
import { REPORT_REASONS } from '../constants';

interface Props {
  setPage: (page: Page, id?: string) => void;
  currentUser: User | null;
}

type StatusFilter = 'pending' | 'reviewed' | 'all';

/**
 * Moderation queue — admin-only view of reported content.
 *
 * Authorization is enforced client-side (userType check) AND must be enforced
 * server-side in the route. The page handles 401/403 gracefully so a
 * non-admin sneaking in still sees NotFound rather than a stack trace.
 */
export const Moderation: React.FC<Props> = ({ setPage, currentUser }) => {
  const isAdmin = currentUser?.userType === 'admin';
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setReports(null);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await api.getReports(status);
      setReports(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load reports.');
      setReports([]);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  const counts = useMemo(() => {
    if (!reports) return { pending: 0, reviewed: 0, total: 0 };
    return {
      pending: reports.filter((r) => r.status === 'pending').length,
      reviewed: reports.filter((r) => r.status === 'reviewed').length,
      total: reports.length,
    };
  }, [reports]);

  if (!isAdmin) {
    return <NotFound setPage={setPage} message="You need admin access to view this page." />;
  }

  const resolve = async (reportId: string, action: 'dismiss' | 'remove_content' | 'warn_user' | 'ban_user') => {
    setBusyId(reportId);
    try {
      await api.resolveReport(reportId, action);
      toast.success(action === 'dismiss' ? 'Dismissed' : 'Action recorded');
      // Optimistically remove from current view if we were on pending
      setReports((prev) => prev ? prev.filter((r) => r.reportId !== reportId) : prev);
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not resolve report');
    } finally {
      setBusyId(null);
    }
  };

  const openContent = (r: Report) => {
    if (r.contentType === 'idea')    setPage('ideaDetail', r.contentId);
    if (r.contentType === 'user')    setPage('profile', r.contentId);
    // No standalone comment route — opens the parent idea via the report metadata if available
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-4xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <Shield className="h-5 w-5" />
            </span>
            Moderation queue
            <Badge variant="destructive" size="sm">Admin</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Review and resolve user-submitted reports.</p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={load}>Refresh</Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard icon={<Clock className="h-4 w-4" />}        label="Pending"  value={counts.pending}  tone="warning" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Reviewed" value={counts.reviewed} tone="success" />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Total"   value={counts.total}    tone="default" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 mb-5">
        {(['pending', 'reviewed', 'all'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all',
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
            )}
          >
            <Filter className="h-3 w-3" />
            {f}
          </button>
        ))}
      </div>

      {/* Body */}
      {reports === null ? (
        <PageLoader label="Loading queue…" />
      ) : error ? (
        <EmptyState
          icon={<AlertTriangle className="h-10 w-10" />}
          title="Could not load reports"
          description={error}
          action={{ label: 'Try again', onClick: load, icon: <RefreshCw className="h-4 w-4" /> }}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-10 w-10" />}
          title={filter === 'pending' ? 'Inbox zero' : 'No reports'}
          description={filter === 'pending' ? 'No pending reports right now. Nice work.' : 'Nothing matches this filter.'}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.reportId}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={r.contentType === 'user' ? 'warning' : 'soft'} size="sm" className="capitalize shrink-0">
                      {r.contentType}
                    </Badge>
                    <Badge variant="ghost" size="sm" className="shrink-0">{REPORT_REASONS[r.reason] ?? r.reason}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Badge variant={r.status === 'pending' ? 'warning' : 'success'} size="sm" className="capitalize shrink-0">
                    {r.status}
                  </Badge>
                </div>
                {r.details && (
                  <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-border/60 pl-3 my-2 italic">
                    "{r.details}"
                  </p>
                )}
                <div className="text-xs text-muted-foreground mb-3">
                  Reporter:&nbsp;
                  <button onClick={() => setPage('profile', r.reporterId)} className="text-primary hover:underline">{r.reporterId.slice(0, 8)}…</button>
                  &nbsp;·&nbsp;Content ID:&nbsp;
                  <code className="text-foreground/80">{r.contentId.slice(0, 8)}…</code>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => openContent(r)}>Open content</Button>
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />} disabled={busyId === r.reportId} onClick={() => resolve(r.reportId, 'dismiss')}>Dismiss</Button>
                      <Button size="sm" variant="outline" leftIcon={<MessageSquare className="h-3.5 w-3.5" />} disabled={busyId === r.reportId} onClick={() => resolve(r.reportId, 'warn_user')}>Warn user</Button>
                      <Button size="sm" variant="outline" leftIcon={<Trash2 className="h-3.5 w-3.5" />} disabled={busyId === r.reportId} onClick={() => resolve(r.reportId, 'remove_content')}>Remove</Button>
                      <Button size="sm" variant="destructive" leftIcon={<Ban className="h-3.5 w-3.5" />} disabled={busyId === r.reportId} onClick={() => { if (confirm('Ban this user? This is reversible from the user profile.')) resolve(r.reportId, 'ban_user'); }}>Ban user</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; tone: 'warning' | 'success' | 'default' }> = ({ icon, label, value, tone }) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-2">
      <span className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
        tone === 'warning' && 'bg-warning/15 text-warning',
        tone === 'success' && 'bg-success/15 text-success',
        tone === 'default' && 'bg-secondary text-foreground/80',
      )}>{icon}</span>
      <div>
        <div className="text-lg font-bold leading-tight tabular-nums">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);
