import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface Props { setPage: (page: Page) => void; }

type Health = 'operational' | 'degraded' | 'partial' | 'major' | 'maintenance';

const SERVICES: { name: string; status: Health; uptime: number; latencyMs: number }[] = [
  { name: 'Web app',          status: 'operational', uptime: 99.99, latencyMs: 48 },
  { name: 'API',              status: 'operational', uptime: 99.97, latencyMs: 82 },
  { name: 'Real-time chat',   status: 'operational', uptime: 99.96, latencyMs: 110 },
  { name: 'Notifications',    status: 'operational', uptime: 99.92, latencyMs: 156 },
  { name: 'AI / Gemini',      status: 'degraded',    uptime: 98.41, latencyMs: 1820 },
  { name: 'File uploads',     status: 'operational', uptime: 99.95, latencyMs: 230 },
  { name: 'Email delivery',   status: 'operational', uptime: 99.88, latencyMs: 400 },
  { name: 'Payments (Stripe)',status: 'operational', uptime: 99.99, latencyMs: 95 },
];

const INCIDENTS = [
  { id: 'i1', date: hoursAgo(4),  title: 'Increased AI response time', status: 'investigating', body: 'Gemini API latency is elevated. We\'re monitoring upstream.' },
  { id: 'i2', date: daysAgo(2),   title: 'Brief notification delivery delay', status: 'resolved',     body: 'Resolved within 18 minutes. Queue drained automatically.' },
  { id: 'i3', date: daysAgo(8),   title: 'Scheduled maintenance complete',   status: 'completed',    body: 'Database failover drill performed during low-traffic window.' },
];

function hoursAgo(h: number) { return new Date(Date.now() - h * 3600_000).toISOString(); }
function daysAgo(d: number) { return new Date(Date.now() - d * 86400_000).toISOString(); }

const STATUS_META: Record<Health, { color: string; bg: string; label: string; icon: React.ElementType }> = {
  operational: { color: 'text-success',      bg: 'bg-success/15 border-success/30',      label: 'Operational', icon: CheckCircle2 },
  degraded:    { color: 'text-warning',      bg: 'bg-warning/15 border-warning/30',      label: 'Degraded',    icon: AlertTriangle },
  partial:     { color: 'text-amber-500',    bg: 'bg-amber-500/15 border-amber-500/30',  label: 'Partial outage', icon: AlertTriangle },
  major:       { color: 'text-destructive',  bg: 'bg-destructive/15 border-destructive/30', label: 'Major outage', icon: XCircle },
  maintenance: { color: 'text-info',         bg: 'bg-info/15 border-info/30',            label: 'Maintenance', icon: Clock },
};

export const StatusPage: React.FC<Props> = ({ setPage }) => {
  const overall: Health = SERVICES.some((s) => s.status === 'major') ? 'major'
    : SERVICES.some((s) => s.status === 'partial') ? 'partial'
    : SERVICES.some((s) => s.status === 'degraded') ? 'degraded'
    : 'operational';
  const OverallIcon = STATUS_META[overall].icon;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-3xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">System status</h1>
          </div>
          <p className="text-sm text-muted-foreground">Live uptime and incidents for Synapse services.</p>
        </header>

        {/* Overall */}
        <Card className={cn('mb-6 border-2', STATUS_META[overall].bg)}>
          <CardContent className="p-5 flex items-center gap-3">
            <OverallIcon className={cn('h-7 w-7', STATUS_META[overall].color)} />
            <div className="flex-1">
              <p className="font-bold text-lg">All systems mostly operational</p>
              <p className="text-xs text-muted-foreground">Last checked just now · Updates every 60s</p>
            </div>
            <Badge variant={overall === 'operational' ? 'success' : overall === 'degraded' ? 'warning' : 'destructive'}>
              {STATUS_META[overall].label}
            </Badge>
          </CardContent>
        </Card>

        {/* Services grid */}
        <Card className="mb-6">
          <CardContent className="p-0 divide-y divide-border">
            {SERVICES.map((s) => {
              const meta = STATUS_META[s.status];
              const Icon = meta.icon;
              return (
                <div key={s.name} className="p-4 flex items-center gap-3">
                  <Icon className={cn('h-5 w-5 shrink-0', meta.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.uptime.toFixed(2)}% uptime (90d) · {s.latencyMs}ms p95</p>
                  </div>
                  {/* 60-day bar */}
                  <div className="hidden sm:flex gap-px h-6 items-end">
                    {Array.from({ length: 60 }).map((_, i) => {
                      // Mostly green, occasional yellow/red based on uptime
                      const isOff = Math.random() < (100 - s.uptime) / 100;
                      const color = isOff && i > 50 ? 'bg-warning' : isOff ? 'bg-destructive/50' : 'bg-success';
                      return <div key={i} className={cn('w-1 h-full rounded-sm', color)} />;
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Incidents */}
        <h2 className="font-semibold mb-3">Recent incidents</h2>
        <ul className="space-y-3">
          {INCIDENTS.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{i.title}</p>
                  <Badge variant={i.status === 'resolved' || i.status === 'completed' ? 'success' : 'warning'} size="sm" className="capitalize">{i.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{i.body}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{timeAgo(i.date)}</p>
              </CardContent>
            </Card>
          ))}
        </ul>

        <p className="text-xs text-center text-muted-foreground mt-8">
          Subscribe to status updates: <a href="#" className="text-primary hover:underline">RSS</a> · <a href="#" className="text-primary hover:underline">Email</a> · <a href="#" className="text-primary hover:underline">Slack</a>
        </p>
      </div>
    </motion.div>
  );
};
